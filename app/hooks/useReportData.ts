import { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";

export function useReportData(currentUser: any, selectedMonth: number, selectedYear: number) {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Buat Batasan Waktu (Date Range) untuk Server Firebase
    // Ini akan mengambil dari tanggal 1 sampai tanggal terakhir di bulan yang dipilih
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

    // 2. QUERY SALES (HEMAT READ: Hanya narik bulan ini)
    const qSales = query(
      collection(db, `users/${currentUser.uid}/sales`),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate),
      orderBy("createdAt", "desc")
    );
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. QUERY EXPENSES (HEMAT READ: Hanya narik bulan ini)
    const qExpenses = query(
      collection(db, `users/${currentUser.uid}/expenses`),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate),
      orderBy("createdAt", "desc")
    );
    const unsubExpenses = onSnapshot(qExpenses, (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

    // 5. QUERY PRODUCTS (KECUALI PRODUK, INI TETAP LOAD SEMUA)
    // Produk biasanya ditarik semua karena kita butuh valuasi total aset gudang saat ini,
    // bukan cuma produk yang dibuat di bulan tersebut.
    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // CLEANUP
    return () => { unsubSales(); unsubExpenses(); unsubInvoices(); unsubProd(); };
  }, [currentUser, selectedMonth, selectedYear]); // Reload jika user ganti bulan di UI

  return { sales, expenses, products, invoices };
}