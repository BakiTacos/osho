"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  ArrowLeft, Save, Package, Tag, 
  Layers, CircleDollarSign, Hash, ImageIcon, Loader2,
  ChevronRight, CircleHelp
} from "lucide-react";

export default function TambahProdukPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  // --- STATE FORM DIPERBARUI ---
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Dapur',
    price: '',
    costPrice: '',
    stock: '',
    imageUrl: '',
    // Marketplace Specific Pricing
    useMarketplacePrices: false,
    priceShopee: '',
    priceTiktok: '',
    priceLazada: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    });
  };

  // --- LOGIKA SIMPAN KE FIREBASE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const productData: any = {
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        category: formData.category,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        stock: Number(formData.stock),
        imageUrl: formData.imageUrl || "https://placehold.co/400x400?text=No+Image",
        useMarketplacePrices: formData.useMarketplacePrices,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Tambahkan harga marketplace jika opsi diaktifkan
      if (formData.useMarketplacePrices) {
        productData.priceShopee = Number(formData.priceShopee) || 0;
        productData.priceTiktok = Number(formData.priceTiktok) || 0;
        productData.priceLazada = Number(formData.priceLazada) || 0;
      }

      await addDoc(collection(db, `users/${currentUser.uid}/products`), productData);

      router.push('/inventaris');
    } catch (error) {
      console.error("Error adding product: ", error);
      alert("Gagal menambahkan produk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-8 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-[#64748B] hover:text-[#0047AB] transition-colors font-bold text-sm group"
        >
          <div className="p-2 bg-white rounded-xl border border-[#E2E8F0] group-hover:border-[#0047AB] transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="ml-16 lg:ml-0">Batal & Kembali</span>
        </button>
      </div>

      <div className="px-4 sm:px-10 mt-10 pb-20">
        <div className="max-w-5xl">
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Tambah Produk Baru</h1>
          <p className="text-[#64748B] mt-2 text-sm font-medium uppercase tracking-widest text-[10px]">Lengkapi katalog inventaris Anda</p>

          <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm space-y-6">
                
                {/* IDENTITAS DASAR */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                    <Package size={14} className="mr-2" /> Nama Produk
                  </label>
                  <input required name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Masukkan nama barang..." className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <Hash size={14} className="mr-2" /> SKU
                    </label>
                    <input required name="sku" value={formData.sku} onChange={handleChange} type="text" placeholder="Contoh: SNY-001" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <Layers size={14} className="mr-2" /> Kategori
                    </label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]">
                      <option value="Dapur">Dapur</option><option value="Kamar Mandi">Kamar Mandi</option><option value="Kebersihan">Kebersihan</option><option value="Penyimpanan">Penyimpanan</option><option value="Ruang Tamu">Ruang Tamu</option><option value="Kamar Tidur">Kamar Tidur</option><option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* HARGA & STOK */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <CircleDollarSign size={14} className="mr-2" /> Modal
                    </label>
                    <input required name="costPrice" value={formData.costPrice} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <CircleDollarSign size={14} className="mr-2" /> Jual Umum
                    </label>
                    <input required name="price" value={formData.price} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <Tag size={14} className="mr-2" /> Stok
                    </label>
                    <input required name="stock" value={formData.stock} onChange={handleChange} type="number" placeholder="0" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]" />
                  </div>
                </div>

                {/* --- OPSIONAL: MARKETPLACE PRICING --- */}
                <div className="pt-6 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-tight">Harga Per Marketplace</h3>
                      <div className="group relative">
                        <CircleHelp size={14} className="text-slate-300" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-[9px] p-2 rounded-lg leading-relaxed z-50">
                          Aktifkan jika Kakak ingin membedakan harga jual di Shopee, TikTok, atau Lazada.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="useMarketplacePrices" checked={formData.useMarketplacePrices} onChange={handleChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0047AB]"></div>
                    </label>
                  </div>

                  {formData.useMarketplacePrices && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-orange-500 ml-1">Shopee</label>
                        <input name="priceShopee" value={formData.priceShopee} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-orange-50/30 border border-orange-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-orange-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-900 ml-1">TikTok</label>
                        <input name="priceTiktok" value={formData.priceTiktok} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-slate-900" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-blue-600 ml-1">Lazada</label>
                        <input name="priceLazada" value={formData.priceLazada} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-blue-50/30 border border-blue-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center space-x-2 bg-[#0047AB] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-70">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>Simpan Produk</span>
                </button>
              </div>
            </div>

            {/* MEDIA PREVIEW */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm space-y-6">
                <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest block"><ImageIcon size={14} className="inline mr-2" /> Foto Produk</label>
                <div className="w-full aspect-square rounded-2xl bg-[#F8F9FB] border-2 border-dashed border-[#E2E8F0] flex items-center justify-center overflow-hidden">
                  {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={48} className="text-slate-200" />}
                </div>
                <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} type="text" placeholder="Tempel URL Gambar..." className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-[10px] font-bold focus:ring-2 focus:ring-[#0047AB]" />
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}