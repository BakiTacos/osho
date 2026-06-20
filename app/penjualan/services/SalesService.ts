// services/SalesService.ts
import { db } from "../../../lib/firebase";
import { 
  doc, collection, serverTimestamp, increment, writeBatch 
} from "firebase/firestore";
import { calculateMarketplaceFee } from "../../../lib/calculations";
import { REGION_MAP, LOGISTICS_RATES } from "../../../lib/constants/sales";

export class SalesService {
  constructor(
    private currentUser: any,
    private catalog: any[],
    private shopeeWarehouse: any[],
    private activeFees: any
  ) {}

  public calculateNetProfitEntry(totalRevenue: number, totalHpp: number, marketplace: string, logisticsFee: number = 0) {
    if (!this.activeFees) {
      return totalRevenue - totalHpp - (totalRevenue * 0.16) - 1250 - logisticsFee;
    }
    const feeKeys = Object.keys(this.activeFees);
    const matchedKey = feeKeys.find(key => key.toLowerCase() === marketplace.toLowerCase().trim());
    const mpSettings = matchedKey ? this.activeFees[matchedKey] : null;
    
    if (!mpSettings) {
      console.warn(`⚠️ Settings untuk marketplace '${marketplace}' tidak ditemukan!`);
      return totalRevenue - totalHpp - logisticsFee;
    }
    const adminFees = calculateMarketplaceFee(totalRevenue, mpSettings);
    return totalRevenue - totalHpp - adminFees - logisticsFee;
  }

  public calculateTikTokLogistics(type: string, province: string, weight: number): number {
    if (!province) return 0;
    const regionId = REGION_MAP[province.toUpperCase()] || province.toUpperCase();
    const serviceType = type.toUpperCase();
    
    try {
      const rateTable = LOGISTICS_RATES[serviceType];
      if (!rateTable || !rateTable[regionId]) return 0;

      const rates = rateTable[regionId];
      const itemWeight = Math.max(0.1, weight);

      if (itemWeight <= 0.5) return rates[0];
      if (itemWeight <= 1.0) return rates[1];
      
      const baseRate = rates[1];
      const extraWeight = Math.ceil(itemWeight - 1);
      const extraCharge = extraWeight * rates[2];
      
      return baseRate + extraCharge;
    } catch (error) {
      return 0;
    }
  }

  // 🚀 OPTIMASI: Fungsi internal khusus untuk mendaftarkan mutasi stok ke dalam BATCH
  private injectStockMutationToBatch(batch: any, skuInput: string, change: number, identifierInput?: string) {
    const sku = skuInput.replace(/\s+/g, '').toUpperCase();
    const identifier = identifierInput?.trim() || "";
    const product = this.catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
    
    if (product) {
      let productId = product.id;
      let finalChange = change;

      if (product.isMapping && product.linkedSku) {
        const mainProd = this.catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === product.linkedSku.replace(/\s+/g, '').toUpperCase());
        if (mainProd) {
          productId = mainProd.id;
          finalChange = change * (product.multiplier || 1);
        }
      }

      // Jalur pengaman Shopee Warehouse (Hanya berlaku untuk transaksi otomatis hasil Impor Excel)
      if (identifier !== "") {
        const warehouseMatch = this.shopeeWarehouse.find(w => 
          (w.resi.trim() === identifier || w.orderId?.trim() === identifier) && 
          w.sku.replace(/\s+/g, '').toUpperCase() === sku && !w.isUsed
        );
        if (warehouseMatch) {
          const whRef = doc(db, `users/${this.currentUser.uid}/shopee_warehouse`, warehouseMatch.id);
          batch.update(whRef, { isUsed: true, usedAt: serverTimestamp() });
          return; // Mengunci data gudang shopee selesai
        }
      }
      
      // Jika bukan shopee warehouse, mutasi stok fisik rak berjalan normal
      const prodRef = doc(db, `users/${this.currentUser.uid}/products`, productId);
      batch.update(prodRef, { stock: increment(finalChange) });
    }
  }

  // 🚀 KUNCI PERBAIKAN UTAMA: PROSES MANUAL KINI MENGGUNAKAN ATOMIC BATCH (1 KETUKAN JARINGAN KILAT)
  public async processMultiProductManual(manualForm: any, useCatalogPrice: boolean) {
    const orderId = manualForm.orderId.trim() || `MAN-${Date.now()}`;
    const resi = manualForm.resi?.trim() || ""; 
    const marketplace = manualForm.source.toLowerCase();
    
    const batch = writeBatch(db);
    
    let totalLogisticsFee = 0;
    if (marketplace === 'tiktok') {
      totalLogisticsFee = this.calculateTikTokLogistics(
        manualForm.tiktokType || 'Standard', 
        manualForm.tiktokProvince || '', 
        Number(manualForm.tiktokWeight) || 1
      );
    }
    
    const itemsCount = manualForm.items.length;
    const logisticsFeePerItem = itemsCount > 0 ? totalLogisticsFee / itemsCount : 0;

    for (const item of manualForm.items) {
      const sku = item.sku.replace(/\s+/g, '').toUpperCase();
      const qty = Number(item.qty);
      const matched = this.catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
      
      let unitPrice = 0, unitCost = 0, multiplier = 1, productName = "Produk Luar Katalog";

      if (matched) {
        productName = matched.name;
        if (useCatalogPrice) {
          unitPrice = Number(matched.price);
          if (marketplace === 'tiktok' && matched.useMarketplacePrices) {
            unitPrice = (matched.priceTiktok && Number(matched.priceTiktok) > 0) ? Number(matched.priceTiktok) : Number(matched.price);
          }
        } else {
          unitPrice = Number(item.manualPrice);
        }

        if (matched.isMapping && matched.linkedSku) {
          const main = this.catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
          unitCost = main ? Number(main.costPrice) : Number(matched.costPrice);
          multiplier = Number(matched.multiplier) || 1;
        } else { 
          unitCost = Number(matched.costPrice) || 0; 
        }
      } else {
        unitPrice = Number(item.manualPrice) || 0;
        unitCost = Number(item.manualCost) || 0;
      }

      const totalRevenue = unitPrice * qty;
      const totalHpp = (unitCost * multiplier) * qty;
      const netProfit = this.calculateNetProfitEntry(totalRevenue, totalHpp, manualForm.source, logisticsFeePerItem);

      // Siapkan dokumen sales baru di dalam batch antrean
      const newSalesRef = doc(collection(db, `users/${this.currentUser.uid}/sales`));
      batch.set(newSalesRef, {
        orderId, 
        resi, 
        sku, 
        product: productName, 
        total: totalRevenue, 
        hpp: totalHpp,
        qty, 
        profit: netProfit, 
        logisticsFee: logisticsFeePerItem,
        marketplace: manualForm.source, 
        status: manualForm.status, 
        createdAt: serverTimestamp()
      });

      // 🚀 AMAN DARI BUG: Pemotongan stok manual di-inject langsung tanpa parameter identifier bayangan
      this.injectStockMutationToBatch(batch, sku, -qty, "");
    }

    // Tembak seluruh data sekaligus ke server Cloud Firebase secara instan!
    await batch.commit();
  }

  // 🚀 OPTIMASI PERFORMA: Penghapusan tunggal kini ikut memanfaatkan Batch System
  public async deleteTransaction(tx: any) {
    const batch = writeBatch(db);
    
    const salesDocRef = doc(db, `users/${this.currentUser.uid}/sales`, tx.id);
    batch.delete(salesDocRef);
    
    // Kembalikan jumlah stok fisik ke rak ruko
    this.injectStockMutationToBatch(batch, tx.sku, tx.qty, tx.orderId);
    
    await batch.commit();
  }

  public async bulkDeleteTransactions(transactions: any[], selectedIds: string[]) {
    const batch = writeBatch(db);
    for (const id of selectedIds) {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        this.injectStockMutationToBatch(batch, tx.sku, tx.qty, tx.orderId);
        batch.delete(doc(db, `users/${this.currentUser.uid}/sales`, id));
      }
    }
    await batch.commit();
  }
}