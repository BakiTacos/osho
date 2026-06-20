// services/PaymentService.ts
import { db } from "../../../lib/firebase";
import { 
  collection, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, increment, writeBatch , addDoc
} from "firebase/firestore";

export class PaymentService {
  constructor(private currentUser: any, private products: any[]) {}

  public filterByTime(data: any[], timeFilter: string, month: number, year: number) {
    const now = new Date();
    
    const filtered = data.filter(item => {
      if (!item.createdAt) return false;
      
      const itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
      const diffInDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);

      if (timeFilter === "Hari Ini") return itemDate.toDateString() === now.toDateString();
      if (timeFilter === "3 Hari") return diffInDays <= 3;
      if (timeFilter === "Bulan") return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      return true;
    });

    return filtered.sort((a, b) => {
      const dateA = a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const dateB = b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA; 
    });
  }

  public calculateStats(filteredWithdrawals: any[], filteredInvoices: any[], filteredExpenses: any[]) {
    const platformStats: Record<string, number> = filteredWithdrawals.reduce((acc: any, curr) => {
      acc[curr.platform] = (acc[curr.platform] || 0) + curr.amount;
      return acc;
    }, {});

    const payerStats: Record<string, number> = filteredExpenses.reduce((acc: any, curr) => {
      const payer = curr.paidBy || "TIDAK TERSET";
      acc[payer] = (acc[payer] || 0) + Number(curr.amount);
      return acc;
    }, {});

    const totalWithdrawal = (Object.values(platformStats) as number[]).reduce((a, b) => a + b, 0);
    const totalPaidInvoices = filteredInvoices.filter(inv => inv.status === 'TERBAYAR').reduce((acc, curr) => acc + curr.amount, 0);
    const totalUnpaidInvoices = filteredInvoices.filter(inv => inv.status === 'BELUM BAYAR').reduce((acc, curr) => acc + curr.amount, 0);
    const totalOpex = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return { 
      platformStats, 
      payerStats,
      totalWithdrawal, 
      totalPaidInvoices, 
      totalUnpaidInvoices, 
      totalOpex 
    };
  }

  public async saveWithdraw(form: any) {
    if (Number(form.amount) <= 0) throw new Error("Jumlah harus > 0");
    const { id, date, ...dataToSave } = form;
    const transactionDate = date ? new Date(date) : new Date();

    if (id) {
      const docRef = doc(db, `users/${this.currentUser.uid}/withdrawals`, id);
      await updateDoc(docRef, { 
        ...dataToSave, date, amount: Number(dataToSave.amount), createdAt: transactionDate, updatedAt: serverTimestamp() 
      });
    } else {
      await addDoc(collection(db, `users/${this.currentUser.uid}/withdrawals`), { 
        ...dataToSave, date, amount: Number(dataToSave.amount), status: 'Berhasil', editCount: 0, createdAt: transactionDate, updatedAt: serverTimestamp() 
      });
    }
  }

  public async saveExpense(form: any) {
    if (Number(form.amount) <= 0) throw new Error("Jumlah harus > 0");
    const { id, date, ...dataToSave } = form;
    const transactionDate = date ? new Date(date) : new Date();

    if (id) {
      const docRef = doc(db, `users/${this.currentUser.uid}/expenses`, id);
      await updateDoc(docRef, { 
        ...dataToSave, date, amount: Number(dataToSave.amount), createdAt: transactionDate, updatedAt: serverTimestamp() 
      });
    } else {
      await addDoc(collection(db, `users/${this.currentUser.uid}/expenses`), { 
        ...dataToSave, date, amount: Number(dataToSave.amount), createdAt: transactionDate, updatedAt: serverTimestamp() 
      });
    }
  }

  // 🚀 KUNCI REFAKTORISASI 1: LOGIKA SIMPAN & EDIT INVOICE SUPREME BATCH (100% Kebal Selisih Stok)
  public async saveInvoice(form: any, items: any[], originalInvoicesList: any[] = []) {
    const total = items.reduce((a, b) => a + Number(b.price || 0), 0);
    const { id, dueDate, ...dataToSave } = form;
    const transactionDate = dueDate ? new Date(dueDate) : new Date();

    const batch = writeBatch(db);

    // Fungsi internal untuk menghitung konversi eceran Pcs berdasarkan unit grosir
    const calculateConvertedQty = (qty: number, unit: string): number => {
      const cleanUnit = String(unit).toLowerCase().trim();
      if (cleanUnit === 'lusin') return Number(qty) * 12;
      if (cleanUnit === 'half_lusin') return Number(qty) * 6;
      return Number(qty);
    };

    if (id) {
      // --- SKENARIO EDIT DATA NOTA ---
      const oldInvoice = originalInvoicesList.find(inv => inv.id === id);
      if (!oldInvoice) throw new Error("Nota invoice lama tidak ditemukan di state memori RAM ruko.");

      // 1. TAHAP PEMBALIKAN STOK: Kembalikan kuantitas lama dari nota sebelum diedit agar stok netral kembali
      for (const oldItem of (oldInvoice.items || [])) {
        const cleanOldSku = String(oldItem.sku || "").replace(/\s+/g, "").toUpperCase();
        const matchedOldProd = this.products.find(p => p.sku.replace(/\s+/g, "").toUpperCase() === cleanOldSku);
        
        if (matchedOldProd) {
          const oldQtyToDeduct = calculateConvertedQty(oldItem.qty, oldItem.unit);
          const prodRef = doc(db, `users/${this.currentUser.uid}/products`, matchedOldProd.id);
          batch.update(prodRef, { stock: increment(-oldQtyToDeduct) }); // Tarik kembali stok lama dari rak
        }
      }

      // 2. TAHAP PENYUNTIKAN STOK BARU: Masukkan kuantitas baru hasil ketikan revisi admin
      for (const newItem of items) {
        const cleanNewSku = String(newItem.sku || "").replace(/\s+/g, "").toUpperCase();
        const matchedNewProd = this.products.find(p => p.sku.replace(/\s+/g, "").toUpperCase() === cleanNewSku);
        
        if (matchedNewProd) {
          const newQtyToInc = calculateConvertedQty(newItem.qty, newItem.unit);
          const prodRef = doc(db, `users/${this.currentUser.uid}/products`, matchedNewProd.id);
          batch.update(prodRef, { stock: increment(newQtyToInc) }); // Masukkan stok revisi terbaru ke rak
        }
      }

      // 3. Update dokumen utama invoice
      const invoiceDocRef = doc(db, `users/${this.currentUser.uid}/supplier_invoices`, id);
      batch.update(invoiceDocRef, { 
        ...dataToSave, dueDate, items, amount: total, updatedAt: serverTimestamp() 
      });

    } else {
      // --- SKENARIO INPUT BARU ---
      const invoiceCollectionRef = doc(collection(db, `users/${this.currentUser.uid}/supplier_invoices`));
      batch.set(invoiceCollectionRef, { 
        ...dataToSave, dueDate, items, amount: total, createdAt: transactionDate, updatedAt: serverTimestamp() 
      });
      
      for (const item of items) {
        const cleanSku = String(item.sku || "").replace(/\s+/g, "").toUpperCase();
        const matched = this.products.find(p => p.sku.replace(/\s+/g, "").toUpperCase() === cleanSku);
        
        if (matched) {
          const qtyToInc = calculateConvertedQty(item.qty, item.unit);
          const prodRef = doc(db, `users/${this.currentUser.uid}/products`, matched.id);
          batch.update(prodRef, { stock: increment(qtyToInc) });
        }
      }
    }

    // Tembak seluruh mutasi mutasi sekaligus ke awan cloud secara instan (Atomic)
    await batch.commit();
  }

  // 🚀 KUNCI REFAKTORISASI 2: LOGIKA HAPUS INVOICE BERBASIS ATOMIC BATCH WRITE
  public async deleteInvoice(inv: any) {
    const batch = writeBatch(db);

    for (const item of (inv.items || [])) {
      const cleanSku = String(item.sku || "").replace(/\s+/g, "").toUpperCase();
      const matched = this.products.find(p => p.sku.replace(/\s+/g, "").toUpperCase() === cleanSku);
      
      if (matched) {
        // Karena nota kulakan dihapus, berarti barang batal dibeli -> Potong/kurangi stok fisik dari rak ruko
        const cleanUnit = String(item.unit).toLowerCase().trim();
        const qtyToDec = cleanUnit === 'lusin' ? Number(item.qty) * 12 : cleanUnit === 'half_lusin' ? Number(item.qty) * 6 : Number(item.qty);
        
        const prodRef = doc(db, `users/${this.currentUser.uid}/products`, matched.id);
        batch.update(prodRef, { stock: increment(-qtyToDec) });
      }
    }

    // Hapus bersih dokumen tagihan supplier dari database
    const invoiceDocRef = doc(db, `users/${this.currentUser.uid}/supplier_invoices`, inv.id);
    batch.delete(invoiceDocRef);

    await batch.commit();
  }

  public async toggleInvoiceStatus(inv: any) {
    const next = inv.status === 'TERBAYAR' ? 'BELUM BAYAR' : 'TERBAYAR';
    await updateDoc(doc(db, `users/${this.currentUser.uid}/supplier_invoices`, inv.id), { status: next });
  }

  public async deleteDocument(collectionName: string, id: string) {
    await deleteDoc(doc(db, `users/${this.currentUser.uid}/${collectionName}`, id));
  }
}