"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { ArrowLeftRight, Package, Save, Info, Search, X } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function SkuMappingPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    aliasSku: '',
    targetSku: '',
    name: '',
    useCustomPrice: false, // Default: Ikut harga utama
    customPrice: ''
    });

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      // Hanya ambil produk yang BUKAN mapping untuk jadi target utama
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((p:any) => !p.isMapping));
    });
    return () => unsub();
  }, [currentUser]);

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
        // 1. Cari data produk utama berdasarkan targetSku yang dipilih
        const targetProduct = products.find(p => p.sku === form.targetSku.toUpperCase());
        
        if (!targetProduct) {
        alert("SKU Utama tidak ditemukan!");
        setLoading(false);
        return;
        }

        // 2. Simpan SKU Mapping dengan menyertakan Kategori dari SKU Utama
        await addDoc(collection(db, `users/${currentUser.uid}/products`), {
        sku: form.aliasSku.toUpperCase(),
        name: form.name || `${targetProduct.name} (Mapping)`,
        isMapping: true,
        linkedSku: form.targetSku.toUpperCase(),
        imageUrl: targetProduct.imageUrl || null, 
        
        // --- PENAMBAHAN KATEGORI ---
        category: targetProduct.category || "Uncategorized", 
        
        stock: 0, 
        useCustomPrice: form.useCustomPrice,
        price: form.useCustomPrice ? Number(form.customPrice) : targetProduct.price,
        
        // HPP selalu ikut pusat agar profit per kategori tetap akurat
        costPrice: targetProduct.costPrice || 0, 
        
        createdAt: serverTimestamp()
        });

        alert("SKU Mapping berhasil disimpan dengan kategori yang sama!");
        router.push('/inventaris');
    } catch (error) {
        console.error("Gagal menyimpan mapping:", error);
        alert("Terjadi kesalahan saat menyimpan.");
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20">
      <div className="px-4 sm:px-10 pt-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-4 hover:text-[#0047AB]">
          <X size={16}/> BATALKAN
        </button>
        <h1 className="text-3xl font-black tracking-tighter text-[#0F172A]">SKU Mapping</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Hubungkan SKU Cabang ke Stok Utama</p>
      </div>

      <div className="px-4 sm:px-10 mt-10 max-w-3xl">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <form onSubmit={handleSaveMapping} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SKU ALIAS (CABANG) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">SKU Alias (Cabang)</label>
                <input 
                  required
                  placeholder="Contoh: Baju-M-Red"
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#0047AB]"
                  value={form.aliasSku}
                  onChange={e => setForm({...form, aliasSku: e.target.value})}
                />
              </div>

              {/* SKU UTAMA (TARGET) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Hubungkan ke SKU Utama</label>
                <select 
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#0047AB]"
                  value={form.targetSku}
                  onChange={e => setForm({...form, targetSku: e.target.value})}
                >
                  <option value="">Pilih SKU Utama</option>
                  {products.map(p => (
                    <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nama Produk (Opsional)</label>
              <input 
                placeholder="Nama untuk tampilan di penjualan"
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#0047AB]"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>

            <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                    <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Pengaturan Harga Jual</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Pilih untuk membedakan harga di SKU Alias ini</p>
                    </div>
                    <button 
                    type="button"
                    onClick={() => setForm({...form, useCustomPrice: !form.useCustomPrice})}
                    className={`w-12 h-6 rounded-full transition-all relative ${form.useCustomPrice ? 'bg-[#0047AB]' : 'bg-slate-300'}`}
                    >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.useCustomPrice ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>

                {form.useCustomPrice && (
                    <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Harga Jual Khusus (Rp)</label>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">Rp</span>
                        <input 
                        type="number"
                        required={form.useCustomPrice}
                        placeholder="Masukkan harga berbeda"
                        className="w-full bg-white border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-sm focus:ring-2 focus:ring-[#0047AB] shadow-sm"
                        value={form.customPrice}
                        onChange={e => setForm({...form, customPrice: e.target.value})}
                        />
                    </div>
                    </div>
                )}
                </div>

            <div className="bg-blue-50 p-6 rounded-[24px] border border-blue-100 flex gap-4">
              <Info className="text-[#0047AB] shrink-0" size={20}/>
              <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase">
                Sistem akan memotong stok pada **SKU UTAMA** setiap kali ada penjualan menggunakan **SKU ALIAS** ini. Pastikan SKU Utama memiliki stok yang cukup.
              </p>
            </div>

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-[#0047AB] text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {loading ? "PROSES..." : "SIMPAN MAPPING SKU"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}