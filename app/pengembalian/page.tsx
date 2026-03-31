"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  collection, onSnapshot, query, where, 
  doc, updateDoc, increment, orderBy 
} from "firebase/firestore";
import { 
  Search, Package, CheckCircle2, 
  AlertTriangle, XCircle, RefreshCcw, 
  TrendingDown
} from "lucide-react";

export default function PengembalianPage() {
  const { currentUser } = useAuth();
  const [returOrders, setReturOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    // Ambil Produk untuk referensi update stok
    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Ambil Penjualan yang berstatus 'Retur'
    const q = query(
      collection(db, `users/${currentUser.uid}/sales`), 
      where("status", "==", "Retur"),
      orderBy("createdAt", "desc")
    );

    const unsubRetur = onSnapshot(q, (snapshot) => {
      setReturOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubProd(); unsubRetur(); };
  }, [currentUser]);

  // --- LOGIKA UPDATE STATUS & EFEK OTOMATIS ---
  const handleStatusChange = async (order: any, newStatus: string) => {
    if (order.returFinal) {
      alert("Pesanan ini sudah diproses secara final.");
      return;
    }

    const orderRef = doc(db, `users/${currentUser?.uid}/sales`, order.id);
    const matchedProd = products.find(p => p.sku === order.sku?.toUpperCase());

    try {
      if (newStatus === "Selesai") {
        if (matchedProd) {
          await updateDoc(doc(db, `users/${currentUser?.uid}/products`, matchedProd.id), {
            stock: increment(order.qty || 1)
          });
        }
        await updateDoc(orderRef, { penanganan: newStatus, profit: 0, returFinal: true });
        alert("Status Selesai: Barang masuk kembali ke stok.");
      } else if (newStatus === "Rusak" || newStatus === "Tidak Kembali") {
        const kerugian = -(order.hpp || 0);
        await updateDoc(orderRef, { penanganan: newStatus, profit: kerugian, returFinal: true });
        alert(`Status ${newStatus}: Dicatat sebagai kerugian modal.`);
      } else {
        await updateDoc(orderRef, { penanganan: newStatus });
      }
    } catch (error) {
      console.error("Gagal memproses retur:", error);
    }
  };

  // --- KALKULASI STATISTIK ---
  const totalLoss = returOrders.reduce((acc, curr) => {
    if (curr.penanganan === "Rusak" || curr.penanganan === "Tidak Kembali") {
      return acc + (curr.hpp || 0);
    }
    return acc;
  }, 0);

  const filteredData = returOrders.filter(item => 
    item.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#0F172A]">Manajemen Retur</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Otomatisasi Stok & Akuntansi Kerugian</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari No. Pesanan..." 
              className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0047AB]"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center font-black shadow-lg">K</div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Kerugian Dialami */}
        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-red-500">
          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center">
            <TrendingDown size={12} className="mr-1"/> Kerugian Realita
          </p>
          <h3 className="text-xl font-black text-[#0F172A]">Rp {totalLoss.toLocaleString('id-ID')}</h3>
          <p className="text-[10px] font-bold text-slate-300 mt-2">Dari Barang Rusak/Hilang</p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 text-blue-600">Total Kasus Retur</p>
          <h3 className="text-xl font-black text-[#0F172A]">{returOrders.length} Kasus</h3>
          <p className="text-[10px] font-bold text-slate-300 mt-2">Masuk ke Sistem</p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-orange-400">
          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-3">Masih Proses</p>
          <h3 className="text-xl font-black text-[#0F172A]">{returOrders.filter(o => !o.returFinal).length} Pesanan</h3>
          <p className="text-[10px] font-bold text-slate-300 mt-2">Menunggu Keputusan</p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3">Selesai/Final</p>
          <h3 className="text-xl font-black text-[#0F172A]">{returOrders.filter(o => o.returFinal).length} Pesanan</h3>
          <p className="text-[10px] font-bold text-slate-300 mt-2">Data Ter-update</p>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="px-4 sm:px-10 mt-10">
        <div className="bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Pesanan & Produk</th>
                  <th className="px-6 py-5">Marketplace</th>
                  <th className="px-6 py-5 text-center">Penanganan Retur</th>
                  <th className="px-8 py-5 text-right">HPP (Modal)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#0047AB] mb-1">#{order.orderId}</span>
                        <span className="text-sm font-bold text-[#0F172A] uppercase leading-tight">{order.product}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">SKU: {order.sku} • Qty: {order.qty}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                        order.marketplace === 'Shopee' ? 'bg-orange-50 text-orange-600' :
                        order.marketplace === 'Tiktok' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {order.marketplace}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center">
                        <select 
                          disabled={order.returFinal}
                          value={order.penanganan || "Proses"}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          className={`text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border-2 outline-none cursor-pointer transition-all ${
                            order.penanganan === 'Selesai' ? "border-emerald-100 bg-emerald-50 text-emerald-600" :
                            (order.penanganan === 'Rusak' || order.penanganan === 'Tidak Kembali') ? "border-red-100 bg-red-50 text-red-600" :
                            "border-blue-100 bg-blue-50 text-blue-600 shadow-sm"
                          }`}
                        >
                          <option value="Proses">🔄 Sedang Diproses</option>
                          <option value="Menunggu Barang">🚚 Menunggu Barang</option>
                          <option value="Selesai">✅ Selesai (Barang OK)</option>
                          <option value="Rusak">❌ Barang Rusak</option>
                          <option value="Tidak Kembali">⚠️ Tidak Kembali</option>
                        </select>
                      </div>
                    </td>
                    <td className={`px-8 py-6 text-right font-black text-sm ${order.penanganan === 'Rusak' || order.penanganan === 'Tidak Kembali' ? 'text-red-500' : 'text-slate-400'}`}>
                      Rp {(order.hpp || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredData.length === 0 && (
              <div className="py-32 flex flex-col items-center justify-center text-slate-300 uppercase text-[10px] font-black tracking-widest opacity-40">
                <Package size={48} className="mb-4" />
                Belum ada data retur
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}