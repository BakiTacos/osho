// app/inventaris/pengembalian/services/ReturService.ts
import { db } from "../../../lib/firebase";
import { 
  collection, writeBatch, doc, query, where, getDocs, serverTimestamp, increment 
} from "firebase/firestore";
import * as XLSX from 'xlsx';
import { ReturOrder, AfkirFormState, MysteriousReturnFormState } from "../types/retur";

export class ReturService {
  constructor(private uid: string) {}

  private getTodayString(): string {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  }

  // 🚀 FUNGSI BANTUAN INTERNAL: Melakukan pembalikan otomatis data titipan advanced jika terdeteksi retur kembali ke ruko
  // 🚀 UPGRADE RADIKAL: Fungsi penjinak spasi gaib lintas format untuk data advanced shipment
  private async reverseAdvancedShipmentIfExist(batch: any, orderId: string, resi: string, sku: string) {
    // Helper untuk membersihkan string dari spasi normal, spasi gaib Excel (\u00A0), dan kapital total
    const sterilizeString = (val: any): string => {
      if (!val) return "";
      return String(val)
        .replace(/[\s\u00A0]+/g, '') // Kikis habis spasi biasa DAN non-breaking space gaib Excel
        .toUpperCase()
        .trim();
    };

    const cleanExcelOrderId = sterilizeString(orderId);
    const cleanExcelResi = sterilizeString(resi);
    const cleanSku = sterilizeString(sku);

    // Saring database shopee_warehouse berdasarkan kesamaan SKU barang
    const qWarehouse = query(
      collection(db, `users/${this.uid}/shopee_warehouse`),
      where("sku", "==", cleanSku)
    );
    
    const whSnapshot = await getDocs(qWarehouse);
    if (!whSnapshot.empty) {
      let matchedDocRef = null;
      
      // PRIORITAS 1: Cocokkan nomor resi murni secara hyper-sanitized
      whSnapshot.docs.forEach((docSnap) => {
        const whData = docSnap.data();
        const whResi = sterilizeString(whData.resi);
        
        // Pastikan dokumen belum dibebaskan (isUsed === true) dan resi benar-benar klop
        if (cleanExcelResi !== "" && whResi === cleanExcelResi && whData.isUsed === true) {
          matchedDocRef = docSnap.ref;
        }
      });

      // PRIORITAS 2: Jika nomor resi gagal tembus, gunakan Nomor Pesanan (Order ID) sebagai pelapis cadangan
      if (!matchedDocRef) {
        whSnapshot.docs.forEach((docSnap) => {
          const whData = docSnap.data();
          const whOrderId = sterilizeString(whData.orderId);
          
          if (cleanExcelOrderId !== "" && whOrderId === cleanExcelOrderId && whData.isUsed === true) {
            matchedDocRef = docSnap.ref;
          }
        });
      }

      // Jika sukses terjodohkan, lepas gembok status booking-nya seketika
      if (matchedDocRef) {
        batch.update(matchedDocRef, { 
          isUsed: false, 
          usedAt: null,
          returLoggedAt: serverTimestamp(),
          catatanRetur: "Status booking dilepas otomatis. Radar hyper-sanitized mendeteksi kecocokan fisik paket retur kembali ke ruko."
        });
      } else {
        console.warn(`[Gagal Match Advanced] Resi: ${cleanExcelResi} atau OrderId: ${cleanExcelOrderId} dengan SKU: ${cleanSku} tidak ditemukan dokumen aktifnya di Shopee Warehouse.`);
      }
    }
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
              const excelSku = String(row[marketplace === "shopee" ? 14 : 2] || "").trim().toUpperCase();
              const matchedProd = products.find(p => p.sku === excelSku);

              const newSaleRef = doc(collection(db, `users/${this.uid}/sales`));
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
                unrecorded: true,
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

  // 🚀 FUNGSI BARU BERBASIS MULTI-MUTASI: Mengubah status tindakan retur tabel reguler via admin ruko
  public async handleStatusChangeBatch(order: any, newStatus: string): Promise<void> {
    const batch = writeBatch(db);
    const salesDocRef = doc(db, `users/${this.uid}/sales`, order.id);
    
    const cleanSku = String(order.sku || "").replace(/\s+/g, '').toUpperCase().trim();
    const qProd = query(collection(db, `users/${this.uid}/products`), where("sku", "==", cleanSku));
    const prodSnap = await getDocs(qProd);

    const returFinal = ["Selesai", "Rusak", "Tidak Kembali", "Afkir"].includes(newStatus);
    let profitVal = Number(order.profit || 0);
    let totalVal = Number(order.total || 0);
    const isUnrecorded = order.unrecorded === true || Number(order.total || 0) === 0;

    let costPrice = 0;
    let sellingPrice = 0;
    if (!prodSnap.empty) {
      const prodData = prodSnap.docs[0].data();
      costPrice = Number(prodData.costPrice || 0);
      sellingPrice = Number(prodData.price || prodData.sellingPrice || 0);
    }

    if (returFinal) {
      totalVal = 0; // Omset diset ke 0 karena dana dikembalikan ke pembeli
      const qty = Number(order.qty || 1);
      
      if (isUnrecorded) {
        if (newStatus === "Selesai") {
          // Barang kembali bagus: rugi sebesar margin profit yang hilang
          profitVal = -((sellingPrice - costPrice) * qty);
        } else {
          // Barang rusak/hilang: rugi sebesar seluruh harga jual produk
          profitVal = -(sellingPrice * qty);
        }
      } else {
        if (newStatus === "Selesai") {
          // Barang kembali bagus: net profit impact adalah 0 karena barang kembali ke rak
          profitVal = 0;
        } else {
          // Barang rusak/hilang: net profit impact rugi sebesar modal HPP barang
          profitVal = -(costPrice * qty);
        }
      }
    }

    // Kunci perubahan status utama di dokumen riwayat penjualan
    batch.update(salesDocRef, { 
      penanganan: newStatus, 
      returFinal: returFinal,
      total: totalVal,
      profit: profitVal,
      hpp: costPrice * Number(order.qty || 1)
    });

    if (newStatus === "Selesai") {
      // Jika paket dinyatakan mendarat selamat dan kembali masuk rak produk utama ruko
      if (!prodSnap.empty) {
        const prodDoc = prodSnap.docs[0];
        const prodData = prodDoc.data();
        let targetProductId = prodDoc.id;
        let restoreQty = Number(order.qty || 1);

        if (prodData.isMapping && prodData.linkedSku) {
          const qMain = query(collection(db, `users/${this.uid}/products`), where("sku", "==", prodData.linkedSku.replace(/\s+/g, '').toUpperCase().trim()));
          const mainSnap = await getDocs(qMain);
          if (!mainSnap.empty) {
            targetProductId = mainSnap.docs[0].id;
            restoreQty = restoreQty * (Number(prodData.multiplier) || 1);
          }
        }

        // Pulihkan kuantitas produk reguler ke dalam inventaris ruko
        batch.update(doc(db, `users/${this.uid}/products`, targetProductId), { stock: increment(restoreQty) });
      }

      // 🚀 EKSEKUSI PENYELARASAN ADVANCED: Batalkan booking status titipan shopee_warehouse secara paralel
      await this.reverseAdvancedShipmentIfExist(batch, order.orderId || "", order.resi || "", order.sku || "");
    }

    await batch.commit();
  }

  // 🚀 Input Manual Menggunakan Asal Marketplace Pilihan Secara Dinamis (Afkir Internal)
  public async processManualSubmit(form: AfkirFormState, prod: any): Promise<void> {
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
        marketplace: form.marketplace, 
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
      
      batch.set(salesRef, {
        orderId: `AFKIR-${Math.floor(Date.now() / 1000)}`,
        product: prod.name,
        sku: prod.sku,
        qty: form.qty,
        hpp: lossAmount,
        total: 0,
        marketplace: form.marketplace, 
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

  // 🚀 PERBAIKAN TOTAL: INPUT PAKET MISTERIUS MANUAL KINI KEBAL DOUBLE POTONG STOK & REVERSE BOOKING ADVANCED
  // 🚀 PERBAIKAN FINAL: Kunci nama properti agar aman membaca type MysteriousReturnFormState ruko
  public async processMysteriousReturn(form: MysteriousReturnFormState & { penhandling?: string; penanganan?: string }, prod: any): Promise<void> {
    const batch = writeBatch(db);
    const todayLokal = this.getTodayString();

    const prodRef = doc(db, `users/${this.uid}/products`, prod.id);
    const hppAmount = Number(prod.costPrice || 0);
    const estimatedSalePrice = Number(prod.sellingPrice || 0);
    
    const lostProfitPerUnit = estimatedSalePrice - hppAmount;
    const totalLostProfit = lostProfitPerUnit * form.qty;

    // Ambil status penanganan secara aman dari salah satu properti yang aktif di FormState Kakak
    const finalStatusPenanganan = form.penhandling || form.penanganan || "Proses";

    if (finalStatusPenanganan === "Selesai") {
      // Pulihkan jumlah kuantitas fisik masuk kembali ke rak ruko utama
      batch.update(prodRef, { stock: increment(form.qty) });

      // 🚀 EKSEKUSI SINKRONISASI JALUR ADVANCED: Deteksi dan bebaskan gembok isUsed resi Shopee Warehouse
      await this.reverseAdvancedShipmentIfExist(batch, form.orderIdOrResi, form.orderIdOrResi, prod.sku);
    }

    const salesRef = doc(collection(db, `users/${this.uid}/sales`));
    
    let initialProfit = 0;
    if (finalStatusPenanganan === "Selesai") {
      initialProfit = -totalLostProfit;
    } else if (["Rusak", "Tidak Kembali", "Afkir"].includes(finalStatusPenanganan)) {
      initialProfit = -(estimatedSalePrice * form.qty);
    }

    batch.set(salesRef, {
      orderId: form.orderIdOrResi.toUpperCase().trim(),
      resi: form.orderIdOrResi.toUpperCase().trim(), // Duplikat penampung kunci resi sebagai pengenal andalan scanner
      product: prod.name,
      sku: prod.sku.toUpperCase().trim(),
      qty: form.qty,
      hpp: hppAmount * form.qty,
      total: estimatedSalePrice * form.qty,
      marketplace: `${form.marketplace} (Misterius)`,
      status: "Retur",
      penanganan: finalStatusPenanganan, 
      returFinal: finalStatusPenanganan === "Selesai" || finalStatusPenanganan === "Rusak" || finalStatusPenanganan === "Tidak Kembali" || finalStatusPenanganan === "Afkir", 
      profit: initialProfit,
      unrecorded: true,
      date: todayLokal,
      createdAt: serverTimestamp(),
      catatan: finalStatusPenanganan === "Selesai"
        ? `[Paket Misterius Selesai] Fisik masuk rak ruko. Booking advanced dilepas. Koreksi profit Rp ${totalLostProfit.toLocaleString('id-ID')} dicatat ke profitabilitas retur. Ket: ${form.reason}`
        : `[Paket Misterius Tertahan - Status: ${finalStatusPenanganan}] Fisik barang belum masuk rak. Alasan: ${form.reason}`
    });

    await batch.commit();
  }
}