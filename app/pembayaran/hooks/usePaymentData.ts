import { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";

export function usePaymentData(currentUser: any, selectedMonth: number, selectedYear: number) {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser || !currentUser.uid) return;

    // 1. Buat Batasan Waktu (Date Range) untuk Server Firebase
    // Ini memastikan Firebase HANYA mengirim dokumen yang dibuat di bulan yang dipilih
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

    // 2. QUERY PRODUCTS (Tarik semua untuk master data/stok)
    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. QUERY WITHDRAWALS (HEMAT READ: Hanya narik bulan ini)
    const qWithdraw = query(
      collection(db, `users/${currentUser.uid}/withdrawals`),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate),
      orderBy("createdAt", "desc")
    );
    const unsubWithdraw = onSnapshot(qWithdraw, (snap) => {
      setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. QUERY INVOICES (HEMAT READ: Hanya narik bulan ini)
    const qInvoices = query(
      collection(db, `users/${currentUser.uid}/supplier_invoices`),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate),
      orderBy("createdAt", "desc")
    );
    const unsubInvoices = onSnapshot(qInvoices, (snap) => {
      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. QUERY EXPENSES (HEMAT READ: Hanya narik bulan ini)
    const qExpenses = query(
      collection(db, `users/${currentUser.uid}/expenses`),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate),
      orderBy("createdAt", "desc")
    );
    const unsubExpenses = onSnapshot(qExpenses, (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubProd(); unsubWithdraw(); unsubInvoices(); unsubExpenses(); };
  }, [currentUser, selectedMonth, selectedYear]); // Reload jika user ganti bulan di UI

  return { withdrawals, invoices, expenses, products };
}