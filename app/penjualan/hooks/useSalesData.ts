// app/penjualan/hooks/useSalesData.ts
import { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { collection, doc, query, where, orderBy, getDocs, getDoc } from "firebase/firestore";

export function useSalesData(
  currentUser: any,
  timeFilter: string,
  selectedMonth: number,
  selectedYear: number,
  refreshTrigger: number 
) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [shopeeWarehouse, setShopeeWarehouse] = useState<any[]>([]);
  const [activeFees, setActiveFees] = useState<any>(null);

  // 🚀 BAGIAN 1: TARIK MASTER DATA (Hanya dipanggil SEKALI SEUMUR HIDUP saat user terdeteksi login)
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchMasterKatalog = async () => {
      try {
        const prodSnap = await getDocs(collection(db, `users/${currentUser.uid}/products`));
        setCatalog(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const feesSnap = await getDoc(doc(db, `users/${currentUser.uid}/settings`, "admin_fees"));
        if (feesSnap.exists()) setActiveFees(feesSnap.data());
      } catch (err) {
        console.error("Gagal mengambil master data katalog:", err);
      }
    };
    fetchMasterKatalog();
  }, [currentUser]); // 🔒 DIKUNCI: Mengurangi konsumsi kuota server secara drastis!

  // 🚀 BAGIAN 2: TARIK DATA TRANSAKSI DINAMIS (Mengikuti gerak filter & pemicu refresh ruko)
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    const fetchTransactionData = async () => {
      try {
        let startDate = new Date();
        let endDate = new Date();

        if (timeFilter === "Hari Ini") {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (timeFilter === "3 Hari") {
          startDate.setDate(startDate.getDate() - 3);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(selectedYear, selectedMonth, 1);
          endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
        }

        const qSales = query(
          collection(db, `users/${currentUser.uid}/sales`),
          where("createdAt", ">=", startDate),
          where("createdAt", "<=", endDate),
          orderBy("createdAt", "desc")
        );
        const salesSnap = await getDocs(qSales);
        const salesList = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const qWarehouse = query(
          collection(db, `users/${currentUser.uid}/shopee_warehouse`),
          where("isUsed", "==", false) 
        );
        const warehouseSnap = await getDocs(qWarehouse);
        const warehouseList = warehouseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (isMounted) {
          setTransactions(salesList);
          setShopeeWarehouse(warehouseList);
        }
      } catch (error) {
        console.error("Error fetching operational sales:", error);
      }
    };

    fetchTransactionData();
    return () => { isMounted = false; };
  }, [currentUser, timeFilter, selectedMonth, selectedYear, refreshTrigger]); 

  return { catalog, transactions, shopeeWarehouse, activeFees };
}