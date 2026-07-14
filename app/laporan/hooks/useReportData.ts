// app/inventaris/laporan/hooks/useReportData.ts
import { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

export function useReportData(currentUser: any, selectedMonth: number, selectedYear: number) {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    async function fetchReportSnapshot() {
      try {
        setLoading(true);

        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

        const salesQueryNormal = query(
          collection(db, `users/${currentUser.uid}/sales`),
          where("createdAt", ">=", startDate),
          where("createdAt", "<=", endDate),
          orderBy("createdAt", "desc")
        );

        const salesQueryRetur = query(
          collection(db, `users/${currentUser.uid}/sales`),
          where("status", "==", "Retur"),
          where("statusUpdatedAt", ">=", startDate),
          where("statusUpdatedAt", "<=", endDate)
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

        const customerInvoicesQuery = query(
          collection(db, `users/${currentUser.uid}/customer_invoices`),
          where("date", ">=", startDate.toISOString().split('T')[0]),
          where("date", "<=", endDate.toISOString().split('T')[0])
        );

        const productsQuery = query(
          collection(db, `users/${currentUser.uid}/products`),
          orderBy("name", "asc")
        );

        const [salesSnapNormal, salesSnapRetur, expensesSnap, invoicesSnap, customerInvoicesSnap, productsSnap] = await Promise.all([
          getDocs(salesQueryNormal),
          getDocs(salesQueryRetur),
          getDocs(expensesQuery),
          getDocs(invoicesQuery),
          getDocs(customerInvoicesQuery),
          getDocs(productsQuery)
        ]);

        const salesMap = new Map();
        salesSnapNormal.docs.forEach(docSnap => salesMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() }));
        salesSnapRetur.docs.forEach(docSnap => salesMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() }));
        setSales(Array.from(salesMap.values()));
        setExpenses(expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setInvoices(invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setCustomerInvoices(customerInvoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (err) {
        console.error("Gagal mengunduh ringkasan data laporan:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportSnapshot();
  }, [currentUser, selectedMonth, selectedYear]);

  return { sales, expenses, products, invoices, customerInvoices, loading };
}