import { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  imageUrl: string;
  isMapping?: boolean;
  linkedSku?: string;
  multiplier?: number;
}

export function useInventoryData(currentUser: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFees, setActiveFees] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;
    
    // 1. Listen Data Produk
    const q = query(collection(db, `users/${currentUser.uid}/products`), orderBy("name", "asc"));
    const unsubProd = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    });

    // 2. Listen Data Biaya Admin
    const unsubFees = onSnapshot(doc(db, `users/${currentUser.uid}/settings`, "admin_fees"), (snap) => {
      if (snap.exists()) setActiveFees(snap.data());
    });

    return () => { unsubProd(); unsubFees(); };
  }, [currentUser]);

  return { products, activeFees };
}