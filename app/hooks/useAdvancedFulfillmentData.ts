import { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

// Tambahkan parameter queryLimit dengan default 300
export function useAdvancedFulfillmentData(currentUser: any, queryLimit: number = 300) {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // 1. MASTER DATA: Aman (Load semua untuk mapping & validasi)
    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. DATA TRANSAKSIONAL: Pasang Rem (Limit)
    // Hanya menarik 300 resi terbaru. Resi lama yang sudah selesai tidak akan disedot.
    const qWarehouse = query(
      collection(db, `users/${currentUser.uid}/shopee_warehouse`), 
      orderBy("createdAt", "desc"),
      limit(queryLimit) // <-- INI PENGAMANYA
    );

    const unsubWarehouse = onSnapshot(qWarehouse, (snap) => {
        setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubProd(); unsubWarehouse(); };
  }, [currentUser, queryLimit]); // Tambahkan queryLimit ke dependency

  return { items, products };
}