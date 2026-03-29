"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  ArrowLeft, Save, X, Package, Tag, 
  Layers, CircleDollarSign, Hash, ImageIcon, Loader2 
} from "lucide-react";

export default function TambahProdukPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  // --- STATE FORM ---
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Dapur',
    price: '',
    costPrice: '',
    stock: '',
    imageUrl: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LOGIKA SIMPAN KE FIREBASE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, `users/${currentUser.uid}/products`), {
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        category: formData.category,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        stock: Number(formData.stock),
        imageUrl: formData.imageUrl || "https://placehold.co/400x400?text=No+Image",
        createdAt: serverTimestamp()
      });

      router.push('/inventaris'); // Kembali ke halaman list
    } catch (error) {
      console.error("Error adding product: ", error);
      alert("Gagal menambahkan produk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300">
      
      {/* --- HEADER NAVIGATION --- */}
      <div className="px-4 sm:px-10 pt-8 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-[#64748B] hover:text-[#0047AB] transition-colors font-bold text-sm group"
        >
          <div className="p-2 bg-white rounded-xl border border-[#E2E8F0] group-hover:border-[#0047AB] transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="ml-16 lg:ml-0">Kembali ke Inventaris</span>
        </button>
      </div>

      <div className="px-4 sm:px-10 mt-10 pb-20">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Tambah Produk Baru</h1>
          <p className="text-[#64748B] mt-2 text-sm font-medium">Lengkapi informasi produk untuk menambahkannya ke dalam katalog stok Anda.</p>

          <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- KIRI: FORM UTAMA --- */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm space-y-6">
                
                {/* Nama Produk */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                    <Package size={14} className="mr-2" /> Nama Produk
                  </label>
                  <input 
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    type="text" 
                    placeholder="Contoh: Meja Kerja Kayu Minimalis"
                    className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* SKU */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <Hash size={14} className="mr-2" /> SKU Produk
                    </label>
                    <input 
                      required
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      type="text" 
                      placeholder="Contoh: MJA-001"
                      className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                    />
                  </div>

                  {/* Kategori */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <Layers size={14} className="mr-2" /> Kategori
                    </label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                    >
                      <option value="Dapur">Dapur</option>
                      <option value="Kamar Mandi">Kamar Mandi</option>
                      <option value="Kebersihan">Kebersihan</option>
                      <option value="Penyimpanan">Penyimpanan</option>
                      <option value="Ruang Tamu">Ruang Tamu</option>
                      <option value="Kamar Tidur">Kamar Tidur</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Harga */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <CircleDollarSign size={14} className="mr-2" /> Harga Jual (IDR)
                    </label>
                    <input 
                      required
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      type="number" 
                      placeholder="0"
                      className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                    />
                  </div>

                  {/* Harga Modal */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <CircleDollarSign size={14} className="mr-2" /> Harga Modal (IDR)
                    </label>
                    <input 
                      required
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleChange}
                      type="number" 
                      placeholder="0"
                      className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                    />
                  </div>

                  {/* Stok */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <Tag size={14} className="mr-2" /> Jumlah Stok
                    </label>
                    <input 
                      required
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      type="number" 
                      placeholder="0"
                      className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center space-x-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-[#0047AB] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>Simpan Produk</span>
                </button>
                <button 
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-4 bg-white border border-[#E2E8F0] text-[#64748B] rounded-2xl font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                >
                  Batal
                </button>
              </div>
            </div>

            {/* --- KANAN: MEDIA & PREVIEW --- */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm space-y-6 text-center">
                <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest block text-left">
                  <ImageIcon size={14} className="inline mr-2" /> Foto Produk
                </label>
                
                {/* Image Preview */}
                <div className="w-full aspect-square rounded-2xl bg-[#F8F9FB] border-2 border-dashed border-[#E2E8F0] flex items-center justify-center overflow-hidden relative group">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-[#94A3B8]">
                      <ImageIcon size={48} strokeWidth={1} />
                      <p className="text-[10px] font-bold mt-2 uppercase">Pratinjau Foto</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <input 
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    type="text" 
                    placeholder="Tempel URL Gambar di sini..."
                    className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-[11px] font-bold focus:ring-2 focus:ring-[#0047AB]"
                  />
                  <p className="text-[9px] text-[#94A3B8] font-medium leading-relaxed italic">
                    Untuk saat ini, gunakan URL gambar (Contoh: Google Drive / Imgur).
                  </p>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}