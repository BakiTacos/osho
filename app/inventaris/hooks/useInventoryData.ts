// app/inventaris/hooks/useInventoryData.ts
import { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { Product } from '../types/inventory';

export function useInventoryData(currentUser: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFees, setActiveFees] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    async function loadInitialData() {
      try {
        setLoading(true);

        // 🚀 SEKAT KEBOCORAN 1: Ambil data produk satu kali (One-time Fetch)
        // Firebase JS SDK otomatis mendahulukan Cache lokal baru mengambil data baru di server
        const q = query(collection(db, `users/${currentUser.uid}/products`), orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);

        // 🚀 SEKAT KEBOCORAN 2: Ambil biaya admin satu kali saja
        const feeDocRef = doc(db, `users/${currentUser.uid}/settings`, "admin_fees");
        const feeSnap = await getDoc(feeDocRef);
        if (feeSnap.exists()) {
          setActiveFees(feeSnap.data());
        }
      } catch (error) {
        console.error("Gagal mengambil data inventaris:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [currentUser]);

  // Ekspor status loading jika Kakak butuh animasi skeleton loader di page utama
  return { products, activeFees, loading };
}