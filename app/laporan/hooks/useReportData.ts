// app/inventaris/laporan/hooks/useReportData.ts
import { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

export function useReportData(currentUser: any, selectedMonth: number, selectedYear: number) {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    async function fetchReportSnapshot() {
      try {
        setLoading(true);

        // Pembatasan tanggal awal dan akhir bulan pilihan secara presisi
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

        // 🚀 ONE-TIME FETCH (MENGUTAMAKAN LOCAL CACHE DEVICE - 0% BOROS)
        const salesQuery = query(
          collection(db, `users/${currentUser.uid}/sales`),
          where("createdAt", ">=", startDate),
          where("createdAt", "<=", endDate),
          orderBy("createdAt", "desc")
        );
        
        const expensesQuery = query(
          collection(db, `users/${currentUser.uid}/expenses`),
          where("createdAt", ">=", startDate),
          where("createdAt", "<=", endDate),
          orderBy("createdAt", "desc")
        );

        const invoicesQuery = query(
          collection(db, `users/${currentUser.uid}/supplier_invoices`),
          where("createdAt", ">=", startDate),
          where("createdAt", "<=", endDate),
          orderBy("createdAt", "desc")
        );

        const productsQuery = query(
          collection(db, `users/${currentUser.uid}/products`),
          orderBy("name", "asc")
        );

        // Eksekusi penarikan data secara kolektif paralel demi akselerasi kecepatan load
        const [salesSnap, expensesSnap, invoicesSnap, productsSnap] = await Promise.all([
          getDocs(salesQuery),
          getDocs(expensesQuery),
          getDocs(invoicesQuery),
          getDocs(productsQuery)
        ]);

        setSales(salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setExpenses(expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setInvoices(invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (err) {
        console.error("Gagal mengunduh ringkasan data laporan:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportSnapshot();
  }, [currentUser, selectedMonth, selectedYear]);

  return { sales, expenses, products, invoices, loading };
}