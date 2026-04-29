"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { collection, onSnapshot, query, orderBy, doc, writeBatch } from "firebase/firestore";
import { Save, ArrowLeft, Loader2, Search, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function MultiEditPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, `users/${currentUser.uid}/products`), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleChange = (id: string, field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: field === 'name' ? value : Number(value)
      }
    }));
  };

  const handleSaveAll = async () => {
    const changeCount = Object.keys(editedData).length;
    if (changeCount === 0) return alert("Tidak ada perubahan untuk disimpan.");
    
    setIsSaving(true);
    const batch = writeBatch(db);

    try {
      Object.entries(editedData).forEach(([id, changes]) => {
        const docRef = doc(db, `users/${currentUser?.uid}/products`, id);
        batch.update(docRef, changes);
      });

      await batch.commit();
      alert(`Berhasil memperbarui ${changeCount} produk!`);
      router.push('/inventaris');
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventaris" className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-[#0F172A]">Edit Massal Inventaris</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Cepat Harga & Stok</p>
          </div>
        </div>

        <button 
          onClick={handleSaveAll}
          disabled={isSaving || Object.keys(editedData).length === 0}
          className="bg-[#0047AB] text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
          <span>{isSaving ? "MENYIMPAN..." : `SIMPAN ${Object.keys(editedData).length} PERUBAHAN`}</span>
        </button>
      </div>

      <div className="px-4 sm:px-10 mt-8">
        {/* SEARCH BAR */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" placeholder="Filter produk yang ingin diedit..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB] outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Produk</th>
                <th className="px-4 py-5">SKU</th>
                <th className="px-4 py-5 w-40">Harga Jual (Rp)</th>
                <th className="px-4 py-5 w-40">Harga Modal (Rp)</th>
                <th className="px-4 py-5 w-28">Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-all">
                  <td className="px-8 py-4">
                    <input 
                      className="w-full bg-transparent border-none p-0 font-black text-sm text-[#0F172A] focus:ring-0 uppercase"
                      defaultValue={p.name}
                      onChange={(e) => handleChange(p.id, 'name', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-bold text-slate-400">{p.sku}</span>
                  </td>
                  <td className="px-4 py-4">
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 font-black text-sm text-[#0047AB] focus:ring-2 focus:ring-blue-200"
                      defaultValue={p.price}
                      onChange={(e) => handleChange(p.id, 'price', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 font-black text-sm text-slate-600 focus:ring-2 focus:ring-blue-200"
                      defaultValue={p.costPrice}
                      onChange={(e) => handleChange(p.id, 'costPrice', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 font-black text-sm text-center text-[#0F172A] focus:ring-2 focus:ring-blue-200"
                      defaultValue={p.stock}
                      onChange={(e) => handleChange(p.id, 'stock', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredProducts.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <AlertCircle size={40} className="text-slate-200" />
              <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Produk tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}