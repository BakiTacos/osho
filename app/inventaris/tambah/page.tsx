// app/inventaris/tambah/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  ArrowLeft, Save, Package, Tag, 
  Layers, CircleDollarSign, Hash, Loader2,
  Info, MapPin
} from "lucide-react";

export default function TambahProdukPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Dapur',
    price: '',
    costPrice: '',
    stock: '',
    useMarketplacePrices: false,
    priceShopee: '',
    priceTiktok: '',
    priceLazada: '',
    location: '', // 🚀 SINKRON STATE: Penampung draf lokasi rak
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setFormData({ 
      ...formData, 
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const productData: any = {
        name: formData.name.toUpperCase().trim(), 
        sku: formData.sku.toUpperCase().replace(/\s+/g, ''), 
        category: formData.category,
        price: Number(formData.price) || 0,
        costPrice: Number(formData.costPrice) || 0,
        stock: Number(formData.stock) || 0,
        location: formData.location.toUpperCase().trim(), // 🚀 SIMPAN FIRESTORE: Format huruf besar tegas bebas spasi liar
        imageUrl: "https://placehold.co/400x400?text=No+Image", 
        useMarketplacePrices: formData.useMarketplacePrices,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (formData.useMarketplacePrices) {
        productData.priceShopee = Number(formData.priceShopee) || 0;
        productData.priceTiktok = Number(formData.priceTiktok) || 0;
        productData.priceLazada = Number(formData.priceLazada) || 0;
      }

      await addDoc(collection(db, `users/${currentUser.uid}/products`), productData);
      router.push('/inventaris');
    } catch (error) {
      console.error("Gagal menambah produk:", error);
      alert("Gagal menyimpan data produk. Silakan periksa koneksi internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER NAVIGASI */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-8">
        <button 
          type="button"
          onClick={() => router.back()}
          className="cursor-pointer flex items-center gap-2.5 text-[#64748B] hover:text-[#0047AB] transition-colors font-black text-xs uppercase tracking-wider group"
        >
          <div className="p-2 bg-white rounded-xl border border-[#E2E8F0] group-hover:border-[#0047AB] group-hover:bg-blue-50/30 transition-all shadow-xs">
            <ArrowLeft size={14} strokeWidth={3} />
          </div>
          <span>Kembali</span>
        </button>
      </div>

      {/* JUDUL UTAMA */}
      <div className="px-4 sm:px-10 mt-6">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tighter">Tambah Baru</h1>
        <p className="text-[#64748B] mt-1 text-xs font-black uppercase tracking-widest">Daftarkan produk atau variasi baru ke dalam stok gudang</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          
          {/* ======================================================= */}
          {/* 📋 SISI KIRI: AREA UTAMA FORMULIR INPUT (8 KOLOM DESKTOP)  */}
          {/* ======================================================= */}
          <div className="lg:col-span-8 space-y-5 bg-white p-5 sm:p-8 rounded-[28px] border border-[#F1F5F9] shadow-xs">
            
            {/* 1. NAMA BARANG */}
            <div className="space-y-1.5">
              <label className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center ml-1">
                <Package size={13} className="mr-1.5 text-slate-400" /> Nama Lengkap Barang
              </label>
              <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Masukkan nama barang belanjaan secara lengkap..." className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-bold text-[#0F172A] placeholder-slate-400 focus:ring-2 focus:ring-[#0047AB] outline-none transition-all" />
            </div>

            {/* 2. SKU & KATEGORI & LOKASI RAK (SEBARIS SEIMBANG) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center ml-1">
                  <Hash size={13} className="mr-1.5 text-slate-400" /> Kode SKU Toko (Unik)
                </label>
                <input required name="sku" value={formData.sku} onChange={handleChange} type="text" placeholder="Contoh: BAUT-BAJA-10MM" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-bold text-[#0F172A] placeholder-slate-400 focus:ring-2 focus:ring-[#0047AB] outline-none uppercase transition-all" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center ml-1">
                  <Layers size={13} className="mr-1.5 text-slate-400" /> Kategori
                </label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-[#0047AB] cursor-pointer outline-none transition-all">
                  <option value="Dapur">Dapur</option>
                  <option value="Kamar Mandi">Kamar Mandi</option>
                  <option value="Kebersihan">Kebersihan</option>
                  <option value="Penyimpanan">Penyimpanan</option>
                  <option value="Ruang Tamu">Ruang Tamu</option>
                  <option value="Kamar Tidur">Kamar Tidur</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* 🚀 BARU 3. INPUT LOKASI RAK FISIK GUDANG (OPSIONAL) */}
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center ml-1">
                  <MapPin size={13} className="mr-1.5 text-slate-400" /> Lokasi Rak Penyimpanan
                </label>
                <input name="location" value={formData.location} onChange={handleChange} type="text" placeholder="Contoh: RAK-A1" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-bold text-[#0F172A] placeholder-slate-400 focus:ring-2 focus:ring-[#0047AB] outline-none uppercase transition-all" />
              </div>
            </div>

            {/* 3. MODAL, JUAL, & STOK AWAL */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center ml-1">
                  <CircleDollarSign size={13} className="mr-1.5 text-slate-400" /> Harga Modal (HPP)
                </label>
                <input required name="costPrice" value={formData.costPrice} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-black text-[#0047AB] focus:ring-2 focus:ring-[#0047AB] outline-none transition-all" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center ml-1">
                  <CircleDollarSign size={13} className="mr-1.5 text-slate-400" /> Harga Jual Umum
                </label>
                <input required name="price" value={formData.price} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-black text-[#0F172A] focus:ring-2 focus:ring-[#0047AB] outline-none transition-all" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider flex items-center ml-1">
                  <Tag size={13} className="mr-1.5 text-slate-400" /> Jumlah Stok Fisik
                </label>
                <input required name="stock" value={formData.stock} onChange={handleChange} type="number" placeholder="0 Pcs" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-black text-[#0F172A] focus:ring-2 focus:ring-[#0047AB] outline-none transition-all" />
              </div>
            </div>

            {/* 4. SETTING HARGA KHUSUS MARKETPLACE */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wide">Punya Harga Berbeda Di Tiap Aplikasi Jualan?</h4>
                  <p className="text-[9px] sm:text-[10px] text-[#94A3B8] font-black uppercase tracking-wider mt-0.5">Nyalakan jika harga jual di Shopee, TikTok, atau Lazada tidak sama</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input type="checkbox" name="useMarketplacePrices" checked={formData.useMarketplacePrices} onChange={handleChange} className="sr-only peer" />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0047AB]"></div>
                </label>
              </div>

              {formData.useMarketplacePrices && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-orange-600 ml-1">Harga Shopee (Rp)</label>
                    <input name="priceShopee" value={formData.priceShopee} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-orange-50/30 border border-orange-100 rounded-xl py-3 px-4 text-xs font-black text-orange-600 focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-900 ml-1">Harga TikTok (Rp)</label>
                    <input name="priceTiktok" value={formData.priceTiktok} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-black text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-blue-600 ml-1">Harga Lazada (Rp)</label>
                    <input name="priceLazada" value={formData.priceLazada} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-blue-50/30 border border-blue-100 rounded-xl py-3 px-4 text-xs font-black text-blue-600 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                </div>
              )}
            </div>

            {/* TOMBOL ACTIONS UTAMA */}
            <div className="pt-2 border-t border-slate-100">
              <button type="submit" disabled={loading} className="cursor-pointer w-full flex items-center justify-center space-x-2 bg-[#0047AB] text-white py-4 rounded-xl font-black text-xs uppercase shadow-md shadow-blue-100 hover:bg-[#003580] transition-all disabled:opacity-70 active:scale-98">
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                <span>Simpan Barang Baru Ke Katalog</span>
              </button>
            </div>

          </div>

          {/* ======================================================= */}
          {/* 🖥️ SISI KANAN: PAPAN INFORMASI PENDUKUNG (4 KOLOM DESKTOP)  */}
          {/* ======================================================= */}
          <div className="hidden lg:block lg:col-span-4 space-y-4">
            <div className="bg-[#F0F7FF] p-5 rounded-[24px] border border-blue-100 flex gap-3.5 items-start">
              <Info className="text-[#0047AB] shrink-0 mt-0.5" size={16}/>
              <div>
                <h5 className="text-xs font-black text-blue-900 uppercase tracking-wide">Pentingnya Mengisi Harga Modal</h5>
                <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase mt-1.5">
                  Pastikan nominal Harga Modal (HPP) diisi secara akurat sesuai nota pembelian.
                </p>
              </div>
            </div>
          </div>

        </div>
      </form>

    </div>
  );
}