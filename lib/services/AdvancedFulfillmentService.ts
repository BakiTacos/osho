import { db } from "../firebase";
import { doc, updateDoc, increment, deleteDoc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import * as XLSX from 'xlsx';

export class AdvancedFulfillmentService {
  constructor(private currentUser: any, private products: any[]) {}

  public async addWarehouseItem(form: any, items: any[]) {
    const resiClean = form.resi.trim().toUpperCase();
    const skuClean = form.sku.replace(/\s+/g, '').toUpperCase();
    
    const isDuplicate = items.some(item => item.resi.toUpperCase() === resiClean && item.sku.toUpperCase() === skuClean);
    if (isDuplicate) throw new Error(`Gagal! Resi ${resiClean} dengan SKU ${skuClean} sudah terdaftar.`);

    const product = this.products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === skuClean);
    if (!product) throw new Error("SKU tidak ditemukan di katalog utama!");

    let targetSku = product.sku;
    let targetProductId = product.id;
    let targetProductName = product.name;
    let finalDeductionQty = form.qty;

    if (product.isMapping && product.linkedSku) {
      const mainProd = this.products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === product.linkedSku.replace(/\s+/g, '').toUpperCase());
      if (mainProd) {
        targetSku = mainProd.sku;
        targetProductId = mainProd.id;
        targetProductName = mainProd.name;
        finalDeductionQty = form.qty * (product.multiplier || 1);
      }
    }

    const compositeId = `${resiClean}_${targetSku}`;
    await setDoc(doc(db, `users/${this.currentUser.uid}/shopee_warehouse`, compositeId), {
      resi: resiClean, sku: targetSku, qty: form.qty, productName: targetProductName,
      note: form.note, isUsed: false, createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, `users/${this.currentUser.uid}/products`, targetProductId), {
      stock: increment(-finalDeductionQty)
    });
  }

  public async cleanupDuplicates(items: any[]) {
    const batch = writeBatch(db);
    const seen = new Set();
    let deleteCount = 0;
    let totalStockRestored = 0;

    const sortedItems = [...items].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    for (const item of sortedItems) {
      const identifier = `${item.resi.trim().toUpperCase()}_${item.sku.trim().toUpperCase()}`;
      
      if (seen.has(identifier)) {
        const docRef = doc(db, `users/${this.currentUser.uid}/shopee_warehouse`, item.id);
        const product = this.products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === item.sku.toUpperCase());

        if (product) {
          const productRef = doc(db, `users/${this.currentUser.uid}/products`, product.id);
          const restoreQty = Number(item.qty || 1) * (product.multiplier || 1);
          batch.update(productRef, { stock: increment(restoreQty) });
          totalStockRestored += restoreQty;
        }

        batch.delete(docRef);
        deleteCount++;
      } else {
        seen.add(identifier);
      }
    }

    if (deleteCount > 0) await batch.commit();
    return { deleteCount, totalStockRestored };
  }

  public async deleteWarehouseItem(item: any) {
    const product = this.products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === item.sku.toUpperCase());

    if (product) {
      const productRef = doc(db, `users/${this.currentUser.uid}/products`, product.id);
      const restoreQty = item.qty * (product.multiplier || 1); 
      await updateDoc(productRef, { stock: increment(restoreQty) });
    }
    await deleteDoc(doc(db, `users/${this.currentUser.uid}/shopee_warehouse`, item.id));
  }

  public async processMassImport(file: File, items: any[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const config = { dataStartRow: 1, cols: { orderId: 1, sku: 8, name: 7 } };

      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
          const rawRows = data.slice(config.dataStartRow);
          
          const existingKeys = new Set(items.map(i => `${i.resi.toUpperCase()}_${i.sku.toUpperCase()}`));
          let addedCount = 0;

          for (const row of rawRows) {
            const orderIdVal = String(row[config.cols.orderId] || "").trim().toUpperCase();
            const rawSku = String(row[config.cols.sku] || "").replace(/\s+/g, '').toUpperCase();
            
            if (!orderIdVal || !rawSku) continue;

            const currentKey = `${orderIdVal}_${rawSku}`;
            if (existingKeys.has(currentKey)) continue;

            const product = this.products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === rawSku);
            if (!product) continue;

            let targetSku = product.sku;
            let targetProductId = product.id;
            let targetProductName = product.name;
            let finalDeductionQty = 1;

            if (product.isMapping && product.linkedSku) {
              const mainProd = this.products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === product.linkedSku.replace(/\s+/g, '').toUpperCase());
              if (mainProd) {
                targetSku = mainProd.sku;
                targetProductId = mainProd.id;
                targetProductName = mainProd.name;
                finalDeductionQty = 1 * (product.multiplier || 1);
              }
            }

            await setDoc(doc(db, `users/${this.currentUser.uid}/shopee_warehouse`, `${orderIdVal}_${targetSku}`), {
              resi: orderIdVal, sku: targetSku, qty: 1, productName: targetProductName,
              note: "Impor Massal Shopee Kilat", isUsed: false, createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, `users/${this.currentUser.uid}/products`, targetProductId), {
              stock: increment(-finalDeductionQty)
            });

            existingKeys.add(currentKey);
            addedCount++;
          }
          resolve(addedCount);
        } catch (err) { reject(err); }
      };
      reader.readAsBinaryString(file);
    });
  }
}