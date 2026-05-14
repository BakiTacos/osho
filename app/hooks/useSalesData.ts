import { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, where, limit } from "firebase/firestore";

export function useSalesData(
  currentUser: any,
  timeFilter: string, // Wajib disuntikkan dari page.tsx
  selectedMonth: number,
  selectedYear: number
) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [shopeeWarehouse, setShopeeWarehouse] = useState<any[]>([]);
  const [activeFees, setActiveFees] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    // 1. MASTER DATA: Katalog (Aman)
    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setCatalog(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. SETTINGS: Biaya Admin
    const unsubFees = onSnapshot(doc(db, `users/${currentUser.uid}/settings`, "admin_fees"), (snap) => {
      if (snap.exists()) setActiveFees(snap.data());
    });

    // 3. LOGIKA FILTER WAKTU (SERVER-SIDE) - INI KUNCINYA
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
      // Filter "Bulan"
      startDate = new Date(selectedYear, selectedMonth, 1);
      endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    }

    // 4. DATA TRANSAKSI: Penjualan
    // TANPA LIMIT: Agar omset di dashboard akurat sesuai rentang waktu yang dipilih
    const qSales = query(
      collection(db, `users/${currentUser.uid}/sales`),
      where("createdAt", ">=", startDate),
      where("createdAt", "<=", endDate),
      orderBy("createdAt", "desc")
    );
    const unsubSales = onSnapshot(qSales, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. DATA OPERASIONAL: Gudang Shopee
    // Ini tetap pakai limit(300) karena hanya untuk mencocokkan resi terbaru
    const qWarehouse = query(
      collection(db, `users/${currentUser.uid}/shopee_warehouse`),
      orderBy("createdAt", "desc"),
      limit(300)
    );
    const unsubWarehouse = onSnapshot(qWarehouse, (snap) => {
      setShopeeWarehouse(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubProd(); unsubSales(); unsubWarehouse(); unsubFees(); };
  }, [currentUser, timeFilter, selectedMonth, selectedYear]); // Reload jika tab filter berubah

  return { catalog, transactions, shopeeWarehouse, activeFees };
}