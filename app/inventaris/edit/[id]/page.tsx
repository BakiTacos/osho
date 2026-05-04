"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from "../../../../lib/firebase";
import { useAuth } from "../../../../context/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { 
  ArrowLeft, Save, Package, Tag, 
  Layers, CircleDollarSign, Hash, ImageIcon, Loader2,
  Info, CheckCircle2, AlertCircle
} from "lucide-react";

export default function EditProdukPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // --- STATE FORM DENGAN FIELD BARU ---
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
    // Mapping Status
    isMapping: false,
    linkedSku: ''
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
            imageUrl: data.imageUrl || '',
            useMarketplacePrices: data.useMarketplacePrices || false,
            priceShopee: data.priceShopee?.toString() || '',
            priceTiktok: data.priceTiktok?.toString() || '',
            priceLazada: data.priceLazada?.toString() || '',
            isMapping: data.isMapping || false,
            linkedSku: data.linkedSku || ''
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
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !productId) return;

    setLoading(true);
    try {
      const docRef = doc(db, `users/${currentUser.uid}/products`, productId);
      
      // Persiapkan data update
      const updateData: any = {
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        imageUrl: formData.imageUrl,
        useMarketplacePrices: formData.useMarketplacePrices,
        updatedAt: serverTimestamp()
      };

      // Hanya update HPP jika BUKAN mapping
      if (!formData.isMapping) {
        updateData.costPrice = Number(formData.costPrice);
      }

      // Update harga spesifik jika aktif
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
        <Loader2 className="animate-spin text-[#0047AB]" size={40} />
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300">
      
      <div className="px-4 sm:px-10 pt-8 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center space-x-2 text-[#64748B] hover:text-[#0047AB] transition-colors font-bold text-sm group">
          <div className="p-2 bg-white rounded-xl border border-[#E2E8F0] group-hover:border-[#0047AB] transition-all"><ArrowLeft size={18} /></div>
          <span className="ml-16 lg:ml-0">Batal Edit</span>
        </button>
      </div>

      <div className="px-4 sm:px-10 mt-10 pb-20">
        <div className="max-w-5xl">
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Edit Produk</h1>
          
          {formData.isMapping && (
            <div className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-100 p-4 rounded-2xl text-blue-700">
              <CheckCircle2 size={20} />
              <p className="text-xs font-black uppercase tracking-wide">Produk ini terhubung ke SKU Induk: <span className="underline">{formData.linkedSku}</span></p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm space-y-6">
                
                {/* NAMA & SKU */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center"><Package size={14} className="mr-2" /> Nama Produk</label>
                  <input required name="name" value={formData.name} onChange={handleChange} type="text" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center"><Hash size={14} className="mr-2" /> SKU</label>
                    <input required name="sku" value={formData.sku} onChange={handleChange} type="text" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center"><Layers size={14} className="mr-2" /> Kategori</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]">
                      <option value="Dapur">Dapur</option><option value="Kamar Mandi">Kamar Mandi</option><option value="Kebersihan">Kebersihan</option><option value="Penyimpanan">Penyimpanan</option><option value="Ruang Tamu">Ruang Tamu</option><option value="Kamar Tidur">Kamar Tidur</option><option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* HARGA UTAMA & STOK */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <CircleDollarSign size={14} className="mr-2" /> 
                      HPP (Modal) 
                      {formData.isMapping && <AlertCircle size={12} className="ml-2 text-blue-500" />}
                    </label>
                    <input 
                      disabled={formData.isMapping}
                      name="costPrice" value={formData.costPrice} onChange={handleChange}
                      type="number" className={`w-full border-none rounded-xl py-3 px-4 text-sm font-bold ${formData.isMapping ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-[#F8F9FB] focus:ring-2 focus:ring-[#0047AB]"}`} 
                    />
                    {formData.isMapping && <p className="text-[8px] font-bold text-blue-500 uppercase">Otomatis Sync ke SKU Induk</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center"><CircleDollarSign size={14} className="mr-2" /> Harga Umum</label>
                    <input required name="price" value={formData.price} onChange={handleChange} type="number" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center"><Tag size={14} className="mr-2" /> Stok</label>
                    <input required name="stock" value={formData.stock} onChange={handleChange} type="number" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]" />
                  </div>
                </div>

                {/* --- OPSIONAL: HARGA MARKETPLACE --- */}
                <div className="pt-6 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-tight">Harga Per Marketplace</h3>
                      <p className="text-[10px] font-medium text-slate-400">Aktifkan jika harga jual berbeda-beda di tiap toko.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="useMarketplacePrices" checked={formData.useMarketplacePrices} onChange={handleChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0047AB]"></div>
                    </label>
                  </div>

                  {formData.useMarketplacePrices && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-orange-500 ml-1">Harga Shopee</label>
                        <input name="priceShopee" value={formData.priceShopee} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-orange-50/30 border border-orange-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-orange-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-900 ml-1">Harga TikTok</label>
                        <input name="priceTiktok" value={formData.priceTiktok} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-slate-900" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-blue-600 ml-1">Harga Lazada</label>
                        <input name="priceLazada" value={formData.priceLazada} onChange={handleChange} type="number" placeholder="Rp" className="w-full bg-blue-50/30 border border-blue-100 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center space-x-2 bg-[#0047AB] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-70">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span>Simpan Perubahan</span>
              </button>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm space-y-6">
                <div className="w-full aspect-square rounded-2xl bg-[#F8F9FB] border-2 border-dashed border-[#E2E8F0] overflow-hidden flex items-center justify-center">
                  {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={40} className="text-[#94A3B8]" />}
                </div>
                <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="URL Gambar..." className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-[11px] font-bold focus:ring-2 focus:ring-[#0047AB]" />
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}