// app/penjualan/hooks/useAdvancedFulfillmentData.ts
import { useState, useEffect } from 'react';
import { db } from "../../../../lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export function useAdvancedFulfillmentData(
  currentUser: any, 
  refreshTrigger: number // 🚀 TRICK CERDAS: Ganti limit dengan pemicu counter penyegaran RAM
) {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // 🚀 SEKTOR 1: TARIK MASTER KATALOG PRODUK (Hanya dipanggil SEKALI SEUMUR HIDUP saat user login)
  useEffect(() => {
    if (!currentUser) return;

    const fetchMasterProducts = async () => {
      try {
        const prodSnap = await getDocs(collection(db, `users/${currentUser.uid}/products`));
        setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Gagal memuat master katalog di modul advanced:", err);
      }
    };

    fetchMasterProducts();
  }, [currentUser]); // 🔒 LOCK: Mengurangi konsumsi Reads Firebase katalog produk secara drastis!


  // 🚀 SEKTOR 2: TARIK DATA ADVANCED SHIPMENT (One-Time Fetch & Bebas Limit Kaku)
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const fetchAdvancedWarehouseData = async () => {
      try {
        // 🔥 FORMULA BARU: Hilangkan limit, murni saring dokumen yang belum terpakai saja
        const qWarehouse = query(
          collection(db, `users/${currentUser.uid}/shopee_warehouse`), 
          where("isUsed", "==", false), // <-- Ambil semua resi booking aktif yang belum laku terjual
          orderBy("createdAt", "desc")
        );

        const warehouseSnap = await getDocs(qWarehouse);
        const warehouseList = warehouseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (isMounted) {
          setItems(warehouseList);
        }
      } catch (error) {
        console.error("Error fetching strict advanced warehouse rows:", error);
      }
    };

    fetchAdvancedWarehouseData();

    return () => { isMounted = false; };
  }, [currentUser, refreshTrigger]); // 🔄 Hanya memicu tarik data jika user login atau tombol/aksi memicu trigger counter

  return { items, products };
}