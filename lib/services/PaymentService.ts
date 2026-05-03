import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, increment } from "firebase/firestore";

export class PaymentService {
  constructor(private currentUser: any, private products: any[]) {}

  // --- FILTER & CALCULATIONS ---
  public filterByTime(data: any[], timeFilter: string, month: number, year: number) {
    const now = new Date();
    return data.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = item.createdAt.toDate();
      const diffInDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);

      if (timeFilter === "Hari Ini") return itemDate.toDateString() === now.toDateString();
      if (timeFilter === "3 Hari") return diffInDays <= 3;
      if (timeFilter === "Bulan") return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      return true;
    });
  }

  public calculateStats(filteredWithdrawals: any[], filteredInvoices: any[], filteredExpenses: any[]) {
    const platformStats: Record<string, number> = filteredWithdrawals.reduce((acc: any, curr) => {
      acc[curr.platform] = (acc[curr.platform] || 0) + curr.amount;
      return acc;
    }, {});

    const totalWithdrawal = (Object.values(platformStats) as number[]).reduce((a, b) => a + b, 0);
    const totalPaidInvoices = filteredInvoices.filter(inv => inv.status === 'TERBAYAR').reduce((acc, curr) => acc + curr.amount, 0);
    const totalUnpaidInvoices = filteredInvoices.filter(inv => inv.status === 'BELUM BAYAR').reduce((acc, curr) => acc + curr.amount, 0);
    const totalOpex = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return { platformStats, totalWithdrawal, totalPaidInvoices, totalUnpaidInvoices, totalOpex };
  }

  // --- FIRESTORE ACTIONS ---
  public async saveWithdraw(form: any) {
    if (Number(form.amount) <= 0) throw new Error("Jumlah harus > 0");
    await addDoc(collection(db, `users/${this.currentUser.uid}/withdrawals`), { ...form, amount: Number(form.amount), status: 'Berhasil', editCount: 0, createdAt: serverTimestamp() });
  }

  public async saveExpense(form: any) {
    if (Number(form.amount) <= 0) throw new Error("Jumlah harus > 0");
    await addDoc(collection(db, `users/${this.currentUser.uid}/expenses`), { ...form, amount: Number(form.amount), createdAt: serverTimestamp() });
  }

  public async saveInvoice(form: any, items: any[]) {
    const hasInvalid = items.some(i => Number(i.qty) <= 0 || Number(i.price) <= 0);
    if (hasInvalid) throw new Error("Qty dan Harga harus lebih besar dari 0");

    const total = items.reduce((a, b) => a + (b.qty * b.price), 0);
    await addDoc(collection(db, `users/${this.currentUser.uid}/supplier_invoices`), { ...form, items, amount: total, createdAt: serverTimestamp() });
    
    for (const item of items) {
      const matched = this.products.find(p => p.sku === item.sku.toUpperCase());
      if (matched) {
        const qtyToInc = item.unit === 'lusin' ? Number(item.qty) * 12 : Number(item.qty);
        await updateDoc(doc(db, `users/${this.currentUser.uid}/products`, matched.id), { stock: increment(qtyToInc) });
      }
    }
  }

  public async deleteInvoice(inv: any) {
    for (const item of inv.items) {
      const matched = this.products.find(p => p.sku === item.sku.toUpperCase());
      if (matched) {
        const qtyToDec = item.unit === 'lusin' ? Number(item.qty) * 12 : Number(item.qty);
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