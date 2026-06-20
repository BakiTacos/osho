// services/AdvancedFulfillmentService.ts
import { db } from "../../../../lib/firebase";
import { doc, updateDoc, increment, deleteDoc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import * as XLSX from 'xlsx';

export class AdvancedFulfillmentService {
  constructor(private currentUser: any, private products: any[]) {}

  // 🚀 UPDATE MANUAL: Mengunci orderId dan resi secara tegas
  public async addWarehouseItem(form: any, items: any[]) {
    const resiClean = form.resi.trim().toUpperCase();
    const orderIdClean = form.orderId?.trim().toUpperCase() || resiClean; // Fail-safe jika order ID kosong set setara resi
    const skuClean = form.sku.replace(/\s+/g, '').toUpperCase();
    
    const isDuplicate = items.some(item => 
      item.resi.toUpperCase() === resiClean && item.sku.toUpperCase() === skuClean
    );
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
      orderId: orderIdClean, // 🚀 TERKEREN: Simpan order ID terpisah agar dijodohkan sales
      resi: resiClean, 
      sku: targetSku, 
      qty: form.qty, 
      productName: targetProductName,
      note: form.note, 
      isUsed: false, 
      createdAt: serverTimestamp()
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
          const restoreQty = Number(item.qty || 1) * (Number(product.multiplier) || 1);
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
      const restoreQty = item.qty * (Number(product.multiplier) || 1); 
      await updateDoc(productRef, { stock: increment(restoreQty) });
    }
    await deleteDoc(doc(db, `users/${this.currentUser.uid}/shopee_warehouse`, item.id));
  }

  // 🚀 PERBAIKAN TOTAL: MASS IMPORT KINI BERBASIS BATCH WRITE & SINKRON SEUTUHNYA DENGAN SALES
  // Ganti fungsi processMassImport di dalam file AdvancedFulfillmentService.ts Kakak dengan versi presisi ini:

  public async processMassImport(file: File, items: any[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // 🚀 KUNCI PERBAIKAN KEVIN: Koordinat kolom disesuaikan murni dengan realita berkas Excel
      const config = { 
        dataStartRow: 1, 
        cols: { 
          orderId: 0, // Nomor Pesanan (Index 0)
          resi: 1,    // Nomor Resi (Index 1)
          sku: 8,     // Kode SKU (Index 8)
          name: 7     // Nama Produk (Tetap Index 7 atau sesuaikan jika ada pergeseran)
        } 
      };

      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
          const rawRows = data.slice(config.dataStartRow);
          
          const advancedBatch = writeBatch(db);
          
          // Indeks keunikan ditarik berdasarkan Resi asli (Index 1) + SKU (Index 8)
          const existingKeys = new Set(items.map(i => `${i.resi.toUpperCase()}_${i.sku.toUpperCase()}`));
          let addedCount = 0;

          for (const row of rawRows) {
            // Tarik nilai murni dari koordinat baru
            const orderIdVal = String(row[config.cols.orderId] || "").trim().toUpperCase();
            const resiVal = String(row[config.cols.resi] || "").trim().toUpperCase();
            const rawSku = String(row[config.cols.sku] || "").replace(/\s+/g, '').toUpperCase();
            
            // Fail-safe penentu validitas baris data
            if (!orderIdVal || !resiVal || !rawSku) continue;

            const currentKey = `${resiVal}_${rawSku}`;
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
                finalDeductionQty = 1 * (Number(product.multiplier) || 1);
              }
            }

            // Gabungan kunci ID dokumen di Firestore agar unik per-item titipan
            const compositeDocId = `${resiVal}_${targetSku}`;
            const warehouseDocRef = doc(db, `users/${this.currentUser.uid}/shopee_warehouse`, compositeDocId);

            // Mendaftarkan titipan advanced booking ke database
            advancedBatch.set(warehouseDocRef, {
              orderId: orderIdVal, // 🚀 Tersimpan rapi di field orderId (Dari Index 0)
              resi: resiVal,       // 🚀 Tersimpan rapi di field resi (Dari Index 1)
              sku: targetSku, 
              qty: 1, 
              productName: targetProductName,
              note: "Impor Massal Shopee Kilat", 
              isUsed: false, 
              createdAt: serverTimestamp()
            });

            // Eksekusi potong stok di rak utama ruko agar tidak selisih fisik
            const productRef = doc(db, `users/${this.currentUser.uid}/products`, targetProductId);
            advancedBatch.update(productRef, { stock: increment(-finalDeductionQty) });

            existingKeys.add(currentKey);
            addedCount++;
          }
          
          if (addedCount > 0) {
            await advancedBatch.commit();
          }
          
          resolve(addedCount);
        } catch (err) { reject(err); }
      };
      reader.readAsBinaryString(file);
    });
  }
}