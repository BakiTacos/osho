import { db } from "../firebase";
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, deleteDoc, writeBatch } from "firebase/firestore";
import { calculateMarketplaceFee } from "../calculations";
import { REGION_MAP, LOGISTICS_RATES } from "../constants/sales";

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
    
    // Profit dipotong HPP, Admin Fee, dan Biaya Logistik Baru
    return totalRevenue - totalHpp - adminFees - logisticsFee;
  }

  public calculateTikTokLogistics(type: string, province: string, weight: number): number {
    if (!province) return 0;

    // PERBAIKAN DI SINI:
    // Jika 'province' adalah "DKI JAKARTA" -> jadi "JAVA_JKT"
    // Jika 'province' sudah "JAVA_JKT" (dari dropdown) -> tetap "JAVA_JKT"
    const regionId = REGION_MAP[province.toUpperCase()] || province.toUpperCase();

    const serviceType = type.toUpperCase(); // STANDARD atau SAVER
    
    try {
      const rateTable = LOGISTICS_RATES[serviceType];
      if (!rateTable || !rateTable[regionId]) {
        console.warn(`Tarif tidak ditemukan untuk: ${serviceType} - ${regionId}`);
        return 0;
      }

      const rates = rateTable[regionId];
      const itemWeight = Math.max(0.1, weight);

      // Logika perhitungan berat (sama seperti sebelumnya)
      if (itemWeight <= 0.5) return rates[0];
      if (itemWeight <= 1.0) return rates[1];
      
      const baseRate = rates[1];
      const extraWeight = Math.ceil(itemWeight - 1);
      const extraCharge = extraWeight * rates[2];
      
      return baseRate + extraCharge;
    } catch (error) {
      console.error("Error calculating TikTok logistics:", error);
      return 0;
    }
  }

  public async updateProductStock(skuInput: string, change: number, resiInput?: string) {
    const sku = skuInput.replace(/\s+/g, '').toUpperCase();
    const resi = resiInput?.trim() || "";
    const product = this.catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
    
    if (product) {
      let targetSku = product.sku;
      let productId = product.id;
      let finalChange = change;

      if (product.isMapping && product.linkedSku) {
        const mainProd = this.catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === product.linkedSku.replace(/\s+/g, '').toUpperCase());
        if (mainProd) {
          targetSku = mainProd.sku;
          productId = mainProd.id;
          finalChange = change * (product.multiplier || 1);
        }
      }

      if (resi !== "") {
        const warehouseMatch = this.shopeeWarehouse.find(w => w.resi.trim() === resi && w.sku.replace(/\s+/g, '').toUpperCase() === targetSku.toUpperCase() && !w.isUsed);
        if (warehouseMatch) {
          await updateDoc(doc(db, `users/${this.currentUser.uid}/shopee_warehouse`, warehouseMatch.id), { isUsed: true, usedAt: serverTimestamp() });
          return; 
        }
      }
      await updateDoc(doc(db, `users/${this.currentUser.uid}/products`, productId), { stock: increment(finalChange) });
    }
  }

  public async processMultiProductManual(manualForm: any, useCatalogPrice: boolean) {
    const orderId = manualForm.orderId.trim() || `MAN-${Date.now()}`;
    const marketplace = manualForm.source.toLowerCase();
    
    // 1. Hitung total biaya logistik TikTok (seperti sebelumnya)
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
        
        // --- LOGIKA HARGA SPESIFIK MARKETPLACE ---
        if (useCatalogPrice) {
          // Ambil harga umum dulu
          unitPrice = Number(matched.price);
          
          // Jika marketplace adalah TikTok dan fitur harga khusus aktif
          if (marketplace === 'tiktok' && matched.useMarketplacePrices) {
            // Gunakan priceTiktok jika ada (lebih besar dari 0), jika tidak balik ke price umum
            unitPrice = (matched.priceTiktok && Number(matched.priceTiktok) > 0) 
                        ? Number(matched.priceTiktok) 
                        : Number(matched.price);
          }
        } else {
          unitPrice = Number(item.manualPrice);
        }
        // ------------------------------------------

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

      await addDoc(collection(db, `users/${this.currentUser.uid}/sales`), {
        orderId, sku, product: productName, total: totalRevenue, hpp: totalHpp,
        qty, profit: netProfit, logisticsFee: logisticsFeePerItem,
        marketplace: manualForm.source, status: manualForm.status, createdAt: serverTimestamp()
      });
      await this.updateProductStock(sku, -qty, orderId);
    }
  }

  public async deleteTransaction(tx: any) {
    await deleteDoc(doc(db, `users/${this.currentUser.uid}/sales`, tx.id));
    await this.updateProductStock(tx.sku, tx.qty);
  }

  public async bulkDeleteTransactions(transactions: any[], selectedIds: string[]) {
    const batch = writeBatch(db);
    for (const id of selectedIds) {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        await this.updateProductStock(tx.sku, tx.qty);
        batch.delete(doc(db, `users/${this.currentUser.uid}/sales`, id));
      }
    }
    await batch.commit();
  }
}