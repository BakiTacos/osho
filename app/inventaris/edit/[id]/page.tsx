"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from "../../../../lib/firebase";
import { useAuth } from "../../../../context/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { 
  ArrowLeft, Save, Package, Tag, 
  Layers, CircleDollarSign, Hash, ImageIcon, Loader2 
} from "lucide-react";

export default function EditProdukPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams(); // Mengambil ID dari URL
  const productId = params.id as string;
  
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Dapur',
    price: '',
    costPrice: '',
    stock: '',
    imageUrl: ''
  });

  // --- AMBIL DATA AWAL PRODUK ---
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
            imageUrl: data.imageUrl || ''
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LOGIKA UPDATE KE FIREBASE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !productId) return;

    setLoading(true);
    try {
      const docRef = doc(db, `users/${currentUser.uid}/products`, productId);
      await updateDoc(docRef, {
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        category: formData.category,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        stock: Number(formData.stock),
        imageUrl: formData.imageUrl,
        updatedAt: serverTimestamp() // Mencatat waktu perubahan
      });

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
      
      {/* --- HEADER --- */}
      <div className="px-4 sm:px-10 pt-8 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-[#64748B] hover:text-[#0047AB] transition-colors font-bold text-sm group"
        >
          <div className="p-2 bg-white rounded-xl border border-[#E2E8F0] group-hover:border-[#0047AB] transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="ml-16 lg:ml-0">Batal Edit</span>
        </button>
      </div>

      <div className="px-4 sm:px-10 mt-10 pb-20">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Edit Produk</h1>
          <p className="text-[#64748B] mt-2 text-sm font-medium italic">ID: {productId}</p>

          <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* --- KIRI: FORM --- */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm space-y-6">
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                    <Package size={14} className="mr-2" /> Nama Produk
                  </label>
                  <input 
                    required name="name" value={formData.name} onChange={handleChange}
                    type="text" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <Hash size={14} className="mr-2" /> SKU
                    </label>
                    <input 
                      required name="sku" value={formData.sku} onChange={handleChange}
                      type="text" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <Layers size={14} className="mr-2" /> Kategori
                    </label>
                    <select 
                      name="category" value={formData.category} onChange={handleChange}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <CircleDollarSign size={14} className="mr-2" /> Modal
                    </label>
                    <input 
                      required name="costPrice" value={formData.costPrice} onChange={handleChange}
                      type="number" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <CircleDollarSign size={14} className="mr-2" /> Jual
                    </label>
                    <input 
                      required name="price" value={formData.price} onChange={handleChange}
                      type="number" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center">
                      <Tag size={14} className="mr-2" /> Stok
                    </label>
                    <input 
                      required name="stock" value={formData.stock} onChange={handleChange}
                      type="number" className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB]"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-[#0047AB] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span>Perbarui Produk</span>
              </button>
            </div>

            {/* --- KANAN: MEDIA --- */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm space-y-6">
                <div className="w-full aspect-square rounded-2xl bg-[#F8F9FB] border-2 border-dashed border-[#E2E8F0] overflow-hidden flex items-center justify-center">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={40} className="text-[#94A3B8]" />
                  )}
                </div>
                <input 
                  name="imageUrl" value={formData.imageUrl} onChange={handleChange}
                  placeholder="URL Gambar..."
                  className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-[11px] font-bold focus:ring-2 focus:ring-[#0047AB]"
                />
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}