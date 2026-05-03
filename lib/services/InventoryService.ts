import { db } from "../firebase";
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import * as XLSX from 'xlsx';

export class InventoryService {
  constructor(private currentUser: any, private activeFees: any) {}

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

  public getMarketplaceEstimation(price: number, cost: number, multiplier: number = 1) {
    if (!this.activeFees) return null;
    const totalCost = cost * multiplier;
    const results: any = {};
    const feeKeys = Object.keys(this.activeFees);

    ['shopee', 'tiktok', 'lazada'].forEach((mp) => {
      const matchedKey = feeKeys.find(key => key.toLowerCase() === mp);
      const settings = matchedKey ? this.activeFees[matchedKey] : null;

      if (settings) {
        const adminFee = this.calculateFee(price, settings);
        const netProfit = price - totalCost - adminFee;
        const margin = price > 0 ? (netProfit / price) * 100 : 0;
        results[mp] = { netProfit, margin };
      }
    });
    return results;
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