import { db } from "../firebase";
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { LOGISTICS_RATES } from "../../lib/constants/sales";

export class InventoryService {
  constructor(
    private currentUser: any, 
    private activeFees: any, 
    private catalog: any[] = [] 
  ) {}

  private calculateFee(revenue: number, settings: any): number {
    if (!settings) return 0;
    const baseCharge = revenue * (Number(settings.baseFee) / 100);
    const programCharge = settings.programs
      ? settings.programs.filter((p: any) => p.enabled).reduce((acc: number, p: any) => {
          const calculated = revenue * (Number(p.percent) / 100);
          const finalCharge = p.cap ? Math.min(calculated, Number(p.cap)) : calculated;
          return acc + finalCharge;
        }, 0)
      : 0;
    return baseCharge + programCharge + (Number(settings.fixedFee) || 0);
  }

  public getTikTokRegionBreakdown(product: any) {
    // 1. Validasi awal: pastikan activeFees ada
    if (!this.activeFees) return [];

    // 2. PERBAIKAN: Cari key TikTok secara Case-Insensitive (seperti di getMarketplaceEstimation)
    const feeKeys = Object.keys(this.activeFees);
    const matchedKey = feeKeys.find(key => key.toLowerCase() === "tiktok");
    const settings = matchedKey ? this.activeFees[matchedKey] : null;

    // Jika setting TikTok tidak ditemukan, jangan lanjut
    if (!settings) return [];

    // 3. Hitung HPP Sync (Sama seperti logika utama)
    let actualCost = Number(product.costPrice) || 0;
    if (product.isMapping && product.linkedSku) {
      const parent = this.catalog.find(p => p.sku === product.linkedSku.toUpperCase());
      if (parent) actualCost = Number(parent.costPrice) || 0;
    }
    const multiplier = product.isMapping ? (Number(product.multiplier) || 1) : 1;
    const totalCost = actualCost * multiplier;

    // 4. Tentukan Harga Jual (Marketplace Specific vs General)
    const sellingPrice = (product.useMarketplacePrices && product.priceTiktok) 
                         ? Number(product.priceTiktok) 
                         : Number(product.price);

    // 5. Iterasi Wilayah menggunakan LOGISTICS_RATES (Pastikan import benar)
    const regions = ["JAVA_JKT", "JAVA_NON_JKT", "SUMATRA", "KALIMANTAN", "SULAWESI", "BALI", "NUSA_TENGGARA", "PAPUA_MALUKU"];
    
    return regions.map(reg => {
      // Pastikan LOGISTICS_RATES sudah diimport di atas file
      const logisticsFee = LOGISTICS_RATES["STANDARD"][reg][0] || 0;
      const adminFee = this.calculateFee(sellingPrice, settings);
      
      const netProfit = sellingPrice - totalCost - adminFee - logisticsFee;
      const margin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

      return {
        regionName: reg.replace(/_/g, ' '),
        logisticsFee,
        netProfit,
        margin
      };
    });
  }

  public getMarketplaceEstimation(product: any) {
    if (!this.activeFees) return null;

    // 1. LOGIKA AUTOMATED HPP SYNC
    let actualCost = Number(product.costPrice) || 0;
    if (product.isMapping && product.linkedSku) {
      // Cari produk induk berdasarkan linkedSku
      const parent = this.catalog.find(p => p.sku === product.linkedSku.toUpperCase());
      if (parent) actualCost = Number(parent.costPrice) || 0;
    }

    const multiplier = product.isMapping ? (Number(product.multiplier) || 1) : 1;
    const totalCost = actualCost * multiplier;
    
    const results: any = {};
    const feeKeys = Object.keys(this.activeFees);

    ['shopee', 'tiktok', 'lazada'].forEach((mp) => {
      const matchedKey = feeKeys.find(key => key.toLowerCase() === mp);
      const settings = matchedKey ? this.activeFees[matchedKey] : null;

      if (settings) {
        // 2. LOGIKA MARKETPLACE-SPECIFIC PRICING (OPSIONAL)
        let sellingPrice = Number(product.price);
        
        // Cek jika fitur harga berbeda aktif dan fieldnya tersedia
        if (product.useMarketplacePrices) {
          const mpPriceKey = `price${mp.charAt(0).toUpperCase() + mp.slice(1)}`; // priceShopee, priceTiktok, dst
          if (product[mpPriceKey] && Number(product[mpPriceKey]) > 0) {
            sellingPrice = Number(product[mpPriceKey]);
          }
        }

        const adminFee = this.calculateFee(sellingPrice, settings);
        const netProfit = sellingPrice - totalCost - adminFee;
        const margin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
        
        results[mp] = { netProfit, margin, usedPrice: sellingPrice };
      }
    });

    return { results, actualCost, multiplier };
  }

  public async updateStock(id: string, newStock: number) {
    await updateDoc(doc(db, `users/${this.currentUser.uid}/products`, id), { stock: newStock });
  }

  public async deleteProduct(id: string) {
    await deleteDoc(doc(db, `users/${this.currentUser.uid}/products`, id));
  }

  public async deleteAllProducts(products: any[]) {
    const batch = writeBatch(db);
    products.forEach((p) => {
      batch.delete(doc(db, `users/${this.currentUser.uid}/products`, p.id));
    });
    await batch.commit();
  }

  public async processMassImport(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
          
          const rawRows = data.slice(1);
          const latestDataMap: Record<string, any> = {};

          rawRows.forEach((row) => {
            const rawSku = String(row[0] || "").trim().replace(/\s+/g, '').toUpperCase();
            if (!rawSku || rawSku === "UNDEFINED") return;
            const dateValue = row[4]; 
            const currentDate = dateValue ? new Date(dateValue) : new Date(0);

            if (!latestDataMap[rawSku] || currentDate > latestDataMap[rawSku].date) {
              latestDataMap[rawSku] = {
                sku: rawSku, name: String(row[1] || "Tanpa Nama").toUpperCase(),
                price: Number(String(row[2] || "0").replace(/[^0-9.-]+/g, "")),
                costPrice: Number(String(row[3] || "0").replace(/[^0-9.-]+/g, "")),
                date: currentDate
              };
            }
          });

          const uploadPromises = Object.values(latestDataMap).map((item) => {
            const docRef = doc(db, `users/${this.currentUser.uid}/products`, item.sku);
            return setDoc(docRef, {
              sku: item.sku, name: item.name, price: item.price, costPrice: item.costPrice,
              stock: 0, category: "Lainnya", imageUrl: "", isMapping: false, updatedAt: serverTimestamp()
            }, { merge: true });
          });

          await Promise.all(uploadPromises);
          resolve(Object.keys(latestDataMap).length);
        } catch (err) { reject(err); }
      };
      reader.readAsBinaryString(file);
    });
  }
}