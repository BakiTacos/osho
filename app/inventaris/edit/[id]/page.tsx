// app/inventaris/edit/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from "../../../../lib/firebase";
import { useAuth } from "../../../../context/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { 
  ArrowLeft, Save, Package, Tag, 
  Layers, CircleDollarSign, Hash, Loader2,
  CheckCircle2, AlertCircle, CircleHelp, MapPin
} from "lucide-react";

export default function EditProdukPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // --- STATE FORM ---
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
    isMapping: false,
    linkedSku: '',
    location: '' // 🚀 SINKRON STATE: Penampung draf lokasi rak baru
  });

  useEffect(() => {
    const fetchProductData = async () => {
      if (!currentUser || !productId) return;

      try {
        const docRef = doc(db, `users/${currentUser.uid}/products`, productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || '',
            sku: data.sku || '',
            category: data.category || 'Dapur',
            price: data.price?.toString() || '',
            costPrice: data.costPrice?.toString() || '',
            stock: data.stock?.toString() || '',
            useMarketplacePrices: data.useMarketplacePrices || false,
            priceShopee: data.priceShopee?.toString() || '',
            priceTiktok: data.priceTiktok?.toString() || '',
            priceLazada: data.priceLazada?.toString() || '',
            isMapping: data.isMapping || false,
            linkedSku: data.linkedSku || '',
            location: data.location || '' // 🚀 SEDOT DATA: Tarik data lokasi rak yang tersimpan di Firebase
          });
        } else {
          alert("Produk tidak ditemukan!");
          router.push('/inventaris');
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchProductData();
  }, [currentUser, productId, router]);

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
    if (!currentUser || !productId) return;

    setLoading(true);
    try {
      const docRef = doc(db, `users/${currentUser.uid}/products`, productId);
      
      const updateData: any = {
        name: formData.name.toUpperCase().trim(), // Seragamkan huruf besar tegas saat diubah
        sku: formData.sku.toUpperCase().replace(/\s+/g, ''),
        category: formData.category,
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,
        location: formData.location.toUpperCase().trim(), // 🚀 PERBARUI DATA: Kirim lokasi baru ter-sanitasi ke Firebase
        useMarketplacePrices: formData.useMarketplacePrices,
        updatedAt: serverTimestamp()
      };

      // Hanya update Harga Modal jika statusnya BUKAN merupakan SKU terhubung (Mapping)
      if (!formData.isMapping) {
        updateData.costPrice = Number(formData.costPrice) || 0;
      }

      if (formData.useMarketplacePrices) {
        updateData.priceShopee = Number(formData.priceShopee) || 0;
        updateData.priceTiktok = Number(formData.priceTiktok) || 0;
        updateData.priceLazada = Number(formData.priceLazada) || 0;
      }

      await updateDoc(docRef, updateData);
      router.push('/inventaris');
    } catch (error) {
      console.error("Error updating product: ", error);
      alert("Gagal memperbarui produk.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="ml-0 lg:ml-72 min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <Loader2 className="animate-spin text-[#0047AB]" size={32} />
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER NAVIGASI */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="cursor-pointer flex items-center space-x-2 text-[#64748B] hover:text-[#0047AB] transition-colors font-bold text-sm group">
          <div className="p-2 bg-white rounded-xl border border-[#E2E8F0] group-hover:border-[#0047AB] transition-all">
            <ArrowLeft size={16} />
          </div>
          <span>Batal Perubahan</span>
        </button>
      </div>

      {/* AREA KONTEN UTAMA */}
      <div className="px-4 sm:px-10 mt-8 max-w-4xl">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tighter">Ubah Data Produk</h1>
          <p className="text-[#64748B] mt-1 text-xs font-black uppercase tracking-widest">Perbarui informasi barang gudang Anda</p>
        </div>
          
        {/* INDIKATOR SKU TERHUBUNG (MAPPING) */}
        {formData.isMapping && (
          <div className="mt-6 flex items-center gap-3 bg-blue-50 border border-blue-100 p-4 rounded-2xl text-[#0047AB]">
            <CheckCircle2 size={18} className="shrink-0" />
            <p className="text-xs font-black uppercase tracking-wide">
              Produk ini Terhubung ke SKU Induk: <span className="underline font-black">{formData.linkedSku}</span>
            </p>
          </div>
        )}

        {/* FORM PERUBAHAN BARANG */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:space-y-6">
          <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[28px] border border-[#F1F5F9] shadow-xs space-y-5 sm:space-y-6">
            
            {/* 1. NAMA BARANG */}
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                <Package size={14} className="mr-2" /> Nama Produk
              </label>
              <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Masukkan nama lengkap barang..." className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#0047AB] outline-none" />
            </div>

            {/* 2. SKU, KATEGORI, & LOKASI RAK FISIK (RESPONSIVE GRID 3 KOLOM) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                  <Hash size={14} className="mr-2" /> Kode SKU Toko
                </label>
                <input required name="sku" value={formData.sku} onChange={handleChange} type="text" placeholder="Contoh: SNY-GUDANG-01" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#0047AB] outline-none uppercase" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                  <Layers size={14} className="mr-2" /> Kategori Ruangan
                </label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#0047AB] cursor-pointer outline-none">
                  <option value="Dapur">Dapur</option>
                  <option value="Kamar Mandi">Kamar Mandi</option>
                  <option value="Kebersihan">Kebersihan</option>
                  <option value="Penyimpanan">Penyimpanan</option>
                  <option value="Ruang Tamu">Ruang Tamu</option>
                  <option value="Kamar Tidur">Kamar Tidur</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* 🚀 BARU: INPUT EDIT LOKASI RAK FISIK GUDANG (SEIMBANG SEBARIS) */}
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                  <MapPin size={14} className="mr-2" /> Lokasi Rak Gudang
                </label>
                <input name="location" value={formData.location} onChange={handleChange} type="text" placeholder="Contoh: RAK-B2" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#0047AB] outline-none uppercase" />
              </div>
            </div>

            {/* 3. MODAL, JUAL, & SISA STOK */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                  <CircleDollarSign size={14} className="mr-2" /> Harga Modal (HPP)
                  {formData.isMapping && <AlertCircle size={12} className="ml-2 text-blue-500 shrink-0" />}
                </label>
                <input 
                  disabled={formData.isMapping}
                  name="costPrice" 
                  value={formData.costPrice} 
                  onChange={handleChange} 
                  type="number" 
                  placeholder="Rp" 
                  className={`w-full border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-black outline-none transition-all ${
                    formData.isMapping 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                      : "bg-[#F8F9FB] text-[#0047AB] focus:ring-2 focus:ring-[#0047AB]"
                  }`} 
                />
                {formData.isMapping && (
                  <p className="text-[8px] font-bold text-[#0047AB] uppercase mt-1 px-1">Tersinkron Otomatis ke SKU Induk</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                  <CircleDollarSign size={14} className="mr-2" /> Harga Jual Umum
                </label>
                <input required name="price" value={formData.price} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-black text-[#0F172A] focus:ring-2 focus:ring-[#0047AB] outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                  <Tag size={14} className="mr-2" /> Sisa Stok Gudang
                </label>
                <input required name="stock" value={formData.stock} onChange={handleChange} type="number" placeholder="0" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#0047AB] outline-none" />
              </div>
            </div>

            {/* 4. HARGA CUSTOM TIAP MARKETPLACE (OPSIONAL) */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black text-[#0F172A] uppercase tracking-tight">Atur Harga Per Marketplace</h3>
                  <div className="group relative cursor-help">
                    <CircleHelp size={13} className="text-slate-300" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-[#0F172A] text-white text-[9px] font-bold p-2 rounded-xl leading-relaxed z-50 whitespace-normal">
                      Aktifkan sakelar jika Kakak ingin menetapkan harga jual yang berbeda-beda khusus di Shopee, TikTok, atau Lazada.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" name="useMarketplacePrices" checked={formData.useMarketplacePrices} onChange={handleChange} className="sr-only peer" />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0047AB]"></div>
                </label>
              </div>

              {formData.useMarketplacePrices && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-orange-600 ml-1">Harga Shopee</label>
                    <input name="priceShopee" value={formData.priceShopee} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-orange-50/30 border border-orange-100 rounded-xl py-3 px-4 text-xs font-black text-orange-600 focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-900 ml-1">Harga TikTok</label>
                    <input name="priceTiktok" value={formData.priceTiktok} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-black text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-blue-600 ml-1">Harga Lazada</label>
                    <input name="priceLazada" value={formData.priceLazada} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-blue-50/30 border border-blue-100 rounded-xl py-3 px-4 text-xs font-black text-blue-600 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* TOMBOL SIMPAN */}
          <div className="flex items-center mt-6">
            <button type="submit" disabled={loading} className="cursor-pointer w-full flex items-center justify-center space-x-2 bg-[#0047AB] text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-blue-100 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Simpan Perubahan Data</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}