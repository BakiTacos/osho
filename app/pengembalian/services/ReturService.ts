// app/inventaris/pengembalian/services/ReturService.ts
import { db } from "../../../lib/firebase";
import { 
  collection, writeBatch, doc, query, where, getDocs, serverTimestamp, increment 
} from "firebase/firestore";
import * as XLSX from 'xlsx';
import { ReturOrder, ManualFormState } from "../types/retur";

export class ReturService {
  constructor(private uid: string) {}

  private getTodayString(): string {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  }

  // 🚀 Impor Excel dengan Aturan Karantina Pending SKU
  public async processExcelImport(
    file: File, 
    marketplace: "shopee" | "tiktok", 
    products: any[]
  ): Promise<{ updated: number; pending: number; created: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
          
          const targetIndex = marketplace === "shopee" ? 4 : 0;
          const startRow = marketplace === "shopee" ? 1 : 1; 
          const rawRows = data.slice(startRow);
          
          const batch = writeBatch(db);
          let updated = 0;
          let pending = 0;
          let created = 0;
          const todayString = this.getTodayString();

          for (const row of rawRows) {
            const orderId = String(row[targetIndex] || "").trim().replace(/^#/, "");
            if (!orderId) continue;

            const qSales = query(
              collection(db, `users/${this.uid}/sales`), 
              where("orderId", "==", orderId)
            );
            const snapshot = await getDocs(qSales);

            if (!snapshot.empty) {
              snapshot.forEach((docSnap) => {
                const saleData = docSnap.data();
                if (saleData.status !== "Retur") {
                  batch.update(docSnap.ref, { status: "Retur", penanganan: "Proses" });
                  updated++;
                }
              });
            } else {
              // 🚀 Deteksi keberadaan SKU di katalog lokal ruko
              const excelSku = String(row[marketplace === "shopee" ? 14 : 2] || "").trim().toUpperCase();
              const matchedProd = products.find(p => p.sku === excelSku);

              const newSaleRef = doc(collection(db, `users/${this.uid}/sales`));
              
              // Jika SKU tidak ketemu di sistem Kevin, status penanganan langsung dikarantina ke "Pending SKU"
              const penangananStatus = matchedProd ? "Proses" : "Pending SKU";
              
              if (!matchedProd) pending++; else created++;

              batch.set(newSaleRef, {
                orderId: orderId,
                product: matchedProd ? matchedProd.name : "PRODUK TIDAK TERDAFTAR (WAJIB JODOHKAN SKU)",
                sku: excelSku || "KOSONG",
                qty: 1,
                hpp: matchedProd ? (Number(matchedProd.costPrice) || 0) : 0,
                total: 0,
                marketplace: `${marketplace === "shopee" ? "Shopee" : "TikTok"} (Lama)`,
                status: "Retur",
                penanganan: penangananStatus,
                returFinal: false,
                profit: 0,
                date: todayString,
                createdAt: serverTimestamp(),
                catatan: matchedProd ? "" : "Otomatis tertahan di karantina karena kode SKU di file Excel tidak terdaftar di sistem ruko."
              });
            }
          }

          await batch.commit();
          resolve({ updated, pending, created });
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsBinaryString(file);
    });
  }

  // 🚀 PERBAIKAN: Input Manual Menggunakan Asal Marketplace Pilihan Secara Dinamis
  public async processManualSubmit(form: ManualFormState, prod: any): Promise<void> {
    const lossAmount = (Number(prod.costPrice) || 0) * form.qty;
    const todayLokal = this.getTodayString();
    const batch = writeBatch(db);

    const prodRef = doc(db, `users/${this.uid}/products`, prod.id);
    const salesRef = doc(collection(db, `users/${this.uid}/sales`));

    if (form.kondisi === "Bagus") {
      batch.update(prodRef, { stock: increment(form.qty) });
      batch.set(salesRef, {
        orderId: `RETUR-MANUAL-${Math.floor(Date.now() / 1000)}`,
        product: prod.name,
        sku: prod.sku,
        qty: form.qty,
        hpp: lossAmount,
        total: 0,
        marketplace: form.marketplace, // 🚀 SEKARANG DINAMIS (Shopee / TikTok / Lazada / Gudang Offline)
        status: "Retur",
        penanganan: "Selesai", 
        returFinal: true,
        profit: 0,
        date: todayLokal,
        createdAt: serverTimestamp(),
        catatan: `[Paket Manual Terdata] ${form.reason}`
      });
    } else {
      batch.update(prodRef, { stock: increment(-form.qty) });
      
      const expRef = doc(collection(db, `users/${this.uid}/expenses`));
      batch.set(expRef, {
        category: "Penyusutan Gudang",
        description: `Barang Rusak [${prod.sku}] x${form.qty} - ${form.reason} (${form.marketplace})`,
        amount: lossAmount,
        paidBy: "SISTEM",
        date: todayLokal,
        createdAt: serverTimestamp()
      });

      batch.set(salesRef, {
        orderId: `AFKIR-${Math.floor(Date.now() / 1000)}`,
        product: prod.name,
        sku: prod.sku,
        qty: form.qty,
        hpp: lossAmount,
        total: 0,
        marketplace: form.marketplace, // 🚀 SEKARANG DINAMIS (Bukan string statis "Gudang" lagi)
        status: "Retur",
        penanganan: "Afkir",
        returFinal: true,
        profit: -lossAmount,
        date: todayLokal,
        createdAt: serverTimestamp(),
        catatan: form.reason
      });
    }
    await batch.commit();
  }
}