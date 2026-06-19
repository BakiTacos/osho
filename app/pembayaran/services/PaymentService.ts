import { db } from "../../../lib/firebase";
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, increment } from "firebase/firestore";

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

  public async saveInvoice(form: any, items: any[]) {
    // 🚀 FIX: Jangan pakai b.qty * b.price! Langsung jumlahkan Subtotal (b.price) saja.
    const total = items.reduce((a, b) => a + Number(b.price || 0), 0);
    
    const { id, dueDate, ...dataToSave } = form;
    const transactionDate = dueDate ? new Date(dueDate) : new Date();

    if (id) {
      const docRef = doc(db, `users/${this.currentUser.uid}/supplier_invoices`, id);
      await updateDoc(docRef, { 
        ...dataToSave, dueDate, items, amount: total, createdAt: transactionDate, updatedAt: serverTimestamp() 
      });
    } else {
      await addDoc(collection(db, `users/${this.currentUser.uid}/supplier_invoices`), { 
        ...dataToSave, dueDate, items, amount: total, createdAt: transactionDate, updatedAt: serverTimestamp() 
      });
      
      for (const item of items) {
        const matched = this.products.find(p => p.sku === item.sku.toUpperCase());
        if (matched) {
          const qtyToInc = item.unit === 'lusin' ? Number(item.qty) * 12 : item.unit === 'half_lusin' ? Number(item.qty) * 6 : Number(item.qty);
          await updateDoc(doc(db, `users/${this.currentUser.uid}/products`, matched.id), { stock: increment(qtyToInc) });
        }
      }
    }
  }

  public async deleteInvoice(inv: any) {
    for (const item of inv.items) {
      const matched = this.products.find(p => p.sku === item.sku.toUpperCase());
      if (matched) {
        const qtyToDec = item.unit === 'lusin' ? Number(item.qty) * 12 : item.unit === 'half_lusin' ? Number(item.qty) * 6 : Number(item.qty);
        await updateDoc(doc(db, `users/${this.currentUser.uid}/products`, matched.id), { stock: increment(-qtyToDec) });
      }
    }
    await deleteDoc(doc(db, `users/${this.currentUser.uid}/supplier_invoices`, inv.id));
  }

  public async toggleInvoiceStatus(inv: any) {
    const next = inv.status === 'TERBAYAR' ? 'BELUM BAYAR' : 'TERBAYAR';
    await updateDoc(doc(db, `users/${this.currentUser.uid}/supplier_invoices`, inv.id), { status: next });
  }

  public async deleteDocument(collectionName: string, id: string) {
    await deleteDoc(doc(db, `users/${this.currentUser.uid}/${collectionName}`, id));
  }
}