"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { 
  collection, onSnapshot, query, addDoc, 
  serverTimestamp, orderBy, doc, updateDoc, increment, deleteDoc 
} from "firebase/firestore";
import { 
  PackageCheck, Search, Plus, X, Trash2, 
  Truck, Hash, Info, History, AlertCircle 
} from "lucide-react";

export default function GudangShopeePage() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    resi: '',
    sku: '',
    qty: 1,
    note: 'Pengiriman Kilat Shopee'
  });

  useEffect(() => {
    if (!currentUser) return;

    // Ambil Data Produk untuk validasi SKU & potong stok
    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Ambil Riwayat Barang di Gudang Shopee
    const unsubWarehouse = onSnapshot(
      query(collection(db, `users/${currentUser.uid}/shopee_warehouse`), orderBy("createdAt", "desc")),
      (snap) => {
        setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => { unsubProd(); unsubWarehouse(); };
  }, [currentUser]);

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const matchedProd = products.find(p => p.sku === form.sku.toUpperCase());
    if (!matchedProd) return alert("SKU Produk tidak ditemukan!");

    try {
      // 1. Simpan ke database Gudang Shopee
      await addDoc(collection(db, `users/${currentUser.uid}/shopee_warehouse`), {
        ...form,
        sku: form.sku.toUpperCase(),
        productName: matchedProd.name,
        isUsed: false, // Belum di-match dengan penjualan
        createdAt: serverTimestamp()
      });

      // 2. LANGSUNG POTONG STOK UTAMA (Karena barang dikirim ke Shopee)
      await updateDoc(doc(db, `users/${currentUser.uid}/products`, matchedProd.id), {
        stock: increment(-form.qty)
      });

      alert("Data tersimpan! Stok Utama telah dipotong.");
      setIsModalOpen(false);
      setForm({ resi: '', sku: '', qty: 1, note: 'Pengiriman Kilat Shopee' });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(i => 
    i.resi.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#0F172A]">Gudang Shopee (Fulfillment)</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Stok Pra-Kirim & Pengiriman Kilat</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#0047AB] text-white px-6 py-3 rounded-2xl font-black text-xs shadow-xl shadow-blue-100 flex items-center gap-2">
          <Plus size={18} strokeWidth={3}/> INPUT RESI KILAT
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="px-4 sm:px-10 mt-10">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari Nomor Resi atau SKU..." 
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0047AB]"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LIST TABLE */}
      <div className="px-4 sm:px-10 mt-8">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Nomor Resi</th>
                <th className="px-6 py-5">Produk / SKU</th>
                <th className="px-6 py-5 text-center">Qty</th>
                <th className="px-6 py-5">Status Matching</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-[#0047AB]">#{item.resi}</span>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{item.note}</p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold text-[#0F172A]">{item.productName}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{item.sku}</p>
                  </td>
                  <td className="px-6 py-6 text-center font-black text-slate-600">{item.qty}</td>
                  <td className="px-6 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      item.isUsed ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                    }`}>
                      {item.isUsed ? "Terpakai di Penjualan" : "Menunggu Order"}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {!item.isUsed && (
                      <button 
                        onClick={async () => {
                          if(confirm("Hapus? Stok tidak akan kembali otomatis.")) await deleteDoc(doc(db, `users/${currentUser?.uid}/shopee_warehouse`, item.id));
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="py-20 text-center text-slate-300 text-xs font-black uppercase tracking-widest">Belum ada data resi kilat</div>
          )}
        </div>
      </div>

      {/* MODAL INPUT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-10 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tighter">Input Resi Shopee Warehouse</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X/></button>
            </div>
            <form onSubmit={handleAddWarehouse} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nomor Resi Pengiriman</label>
                <input required value={form.resi} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold" placeholder="Contoh: SPXID..." onChange={e => setForm({...form, resi: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">SKU Produk</label>
                  <input required value={form.sku} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold" placeholder="SKU" onChange={e => setForm({...form, sku: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Qty</label>
                  <input type="number" required value={form.qty} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-center" onChange={e => setForm({...form, qty: Number(e.target.value)})} />
                </div>
              </div>
              <div className="bg-amber-50 p-6 rounded-[24px] border border-amber-100 flex gap-4">
                <AlertCircle className="text-amber-600 shrink-0" size={20}/>
                <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                  Menyimpan data ini akan **Lansung Mengurangi Stok** di Inventaris Utama sebanyak {form.qty} unit.
                </p>
              </div>
              <button type="submit" className="w-full bg-[#0047AB] text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-blue-100 transition-all hover:scale-[1.02]">SIMPAN & POTONG STOK</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}