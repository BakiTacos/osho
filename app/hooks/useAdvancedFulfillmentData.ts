import { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export function useAdvancedFulfillmentData(currentUser: any) {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // Sinkronisasi Katalog Produk
    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Sinkronisasi Data Warehouse
    const unsubWarehouse = onSnapshot(
      query(collection(db, `users/${currentUser.uid}/shopee_warehouse`), orderBy("createdAt", "desc")),
      (snap) => {
        setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => { unsubProd(); unsubWarehouse(); };
  }, [currentUser]);

  return { items, products };
}