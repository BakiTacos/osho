// app/inventaris/mapping/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, X } from "lucide-react";
import { useRouter } from 'next/navigation';
import { SkuMappingForm } from './components/SkuMappingForm';

export default function SkuMappingPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [products, setProducts] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 🚀 ANTI-BOCOR: Ambil data produk satu kali saja (One-time Fetch) via getDocs cache-first
  useEffect(() => {
    if (!currentUser) return;
    
    async function loadTargetProducts() {
      try {
        setInitialLoading(true);
        const q = query(collection(db, `users/${currentUser.uid}/products`), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        
        const masterProducts = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() as any }))
          .filter(p => !p.isMapping); // Filter murni barang induk utama
          
        setProducts(masterProducts);
      } catch (err) {
        console.error("Gagal memuat daftar produk induk:", err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadTargetProducts();
  }, [currentUser]);

  // Handler eksekusi simpan data ke Firebase
  const handleSaveMapping = async (formData: any) => {
    if (!currentUser) return;
    setSubmitLoading(true);

    try {
      const targetProduct = products.find(p => p.sku === formData.targetSku.toUpperCase());
      if (!targetProduct) return alert("SKU Utama tidak ditemukan!");

      // Tembak dokumen mapping baru ke koleksi produk utama
      await addDoc(collection(db, `users/${currentUser.uid}/products`), {
        sku: formData.aliasSku.toUpperCase(),
        name: formData.name || `${targetProduct.name} (Mapping)`,
        isMapping: true,
        linkedSku: formData.targetSku.toUpperCase(),
        multiplier: Number(formData.multiplier) || 1,
        imageUrl: targetProduct.imageUrl || null,
        category: targetProduct.category || "Uncategorized",
        stock: 0, // Barang mapping stok aslinya dikunci di angka 0 (Ikut Induk)
        useCustomPrice: formData.useCustomPrice,
        price: formData.useCustomPrice ? Number(formData.customPrice) : targetProduct.price,
        costPrice: targetProduct.costPrice,
        createdAt: serverTimestamp()
      });

      alert("SKU Mapping dengan Kelipatan Stok berhasil disimpan!");
      router.push('/inventaris');
    } catch (error) {
      console.error("Gagal menyimpan mapping:", error);
      alert("Terjadi kesalahan sistem saat menyimpan data.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <Loader2 className="animate-spin text-[#0047AB]" size={32} />
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20 transition-all duration-300">
      
      {/* HEADER BAR */}
      <div className="px-4 sm:px-10 pt-8">
        <button 
          type="button"
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-400 font-black text-xs mb-4 hover:text-[#0047AB] transition-colors"
        >
          <X size={14} strokeWidth={3}/> Batalkan
        </button>
        <h1 className="text-3xl font-black tracking-tighter text-[#0F172A]">Pemetaan SKU</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Hubungkan SKU Cabang ke SKU Utama</p>
      </div>

      {/* AREA ISIAN FORM UTAMA */}
      <div className="px-4 sm:px-10 mt-8 w-full">
        <SkuMappingForm 
          products={products} 
          onSave={handleSaveMapping} 
          loading={submitLoading} 
        />
      </div>

    </div>
  );
}