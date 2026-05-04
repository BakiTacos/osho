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

  useMarketplacePrices?: boolean; // Toggle aktif/tidak
  priceShopee?: number;           // Harga khusus Shopee
  priceTiktok?: number;           // Harga khusus Tiktok
  priceLazada?: number;           // Harga khusus Lazada
  
  // Metadata tambahan (opsional)
  updatedAt?: any;
}

export function useInventoryData(currentUser: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFees, setActiveFees] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // hooks/useInventoryData.ts
  useEffect(() => {
    if (!currentUser) return;

    const settingsRef = doc(db, `users/${currentUser.uid}/settings`, "marketplaceFees");
    
    const unsub = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setActiveFees(docSnap.data());
      } else {
        // JIKA DATA TIDAK ADA, SET KE OBJEK KOSONG AGAR TIDAK LOADING TERUS
        // Atau panggil fungsi inisialisasi default
        setActiveFees({}); 
        console.log("User baru terdeteksi: Menggunakan konfigurasi kosong.");
      }
      setLoadingSettings(false); // Pastikan state loading dimatikan
    });

    return () => unsub();
  }, [currentUser]);
  
  return { products, activeFees, loadingSettings }; // Kembalikan agar bisa dipakai di Page
}