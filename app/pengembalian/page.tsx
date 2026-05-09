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
    
    // 1. Cari produk awal berdasarkan SKU yang ada di pesanan
    const initialProd = products.find(p => p.sku === order.sku?.toUpperCase());

    try {
      if (newStatus === "Selesai") {
        if (initialProd) {
          let targetId = initialProd.id;
          let qtyToReturn = order.qty || 1;

          if (initialProd.isMapping && initialProd.linkedSku) {
            const mainProd = products.find(p => p.sku === initialProd.linkedSku);
            if (mainProd) {
              targetId = mainProd.id;
              // KEMBALIKAN SESUAI MULTIPLIER
              const multiplier = initialProd.multiplier || 1;
              qtyToReturn = (order.qty || 1) * multiplier;
            }
          }

          await updateDoc(doc(db, `users/${currentUser?.uid}/products`, targetId), {
            stock: increment(qtyToReturn)
          });
        }
        
        await updateDoc(orderRef, { penanganan: newStatus, profit: 0, returFinal: true });

      } else if (newStatus === "Rusak" || newStatus === "Tidak Kembali") {
        const kerugian = -(order.hpp || 0);
        await updateDoc(orderRef, { penanganan: newStatus, profit: kerugian, returFinal: true });
        alert(`Status ${newStatus}: Dicatat sebagai kerugian modal.`);
      } else {
        await updateDoc(orderRef, { penanganan: newStatus });
      }
    } catch (error) {
      console.error("Gagal memproses retur:", error);
      alert("Terjadi kesalahan sistem saat memproses retur.");
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

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <p className="font-black text-[#0047AB] animate-pulse">MEMUAT DATA ANALISIS...</p>
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER & SEARCH BAR - RESPONSIVE STACK ON MOBILE */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#0F172A] leading-tight">Manajemen Retur</h1>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Otomatisasi Stok & Akuntansi Kerugian</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari No. Pesanan..." 
              className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0047AB] transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center font-black shadow-lg shrink-0">K</div>
        </div>
      </div>

      {/* STATS CARDS - 2 COLUMNS ON MOBILE */}
      <div className="px-4 sm:px-10 mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Kerugian Dialami */}
        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-red-500 flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 sm:mb-3 flex items-center">
              <TrendingDown size={12} className="mr-1 shrink-0"/> Kerugian Realita
            </p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A] truncate">Rp {totalLoss.toLocaleString('id-ID')}</h3>
          </div>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Dari Barang Rusak/Hilang</p>
        </div>

        {/* Card 2: Total Kasus */}
        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-[#F1F5F9] shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 sm:mb-3">Total Kasus Retur</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A]">{returOrders.length} Kasus</h3>
          </div>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Masuk ke Sistem</p>
        </div>

        {/* Card 3: Masih Proses */}
        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-orange-400 flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 sm:mb-3">Masih Proses</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A]">{returOrders.filter(o => !o.returFinal).length} Pesanan</h3>
          </div>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Menunggu Keputusan</p>
        </div>

        {/* Card 4: Selesai/Final */}
        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 sm:mb-3">Selesai/Final</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A]">{returOrders.filter(o => o.returFinal).length} Pesanan</h3>
          </div>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Data Ter-update</p>
        </div>
      </div>

      {/* MAIN TABLE SECTION */}
      <div className="px-4 sm:px-10 mt-8 sm:mt-10">
        <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden min-h-[350px] sm:min-h-[400px]">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[650px] lg:min-w-0">
              <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                <tr className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-5 py-4 sm:px-8 sm:py-5">Pesanan & Produk</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-5">Marketplace</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-5 text-center">Penanganan Retur</th>
                  <th className="px-5 py-4 sm:px-8 sm:py-5 text-right">HPP (Modal)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/50 transition-all text-xs sm:text-sm font-bold">
                    <td className="px-5 py-4 sm:px-8 sm:py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#0047AB] mb-0.5 sm:mb-1">#{order.orderId}</span>
                        <span className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase leading-tight truncate max-w-[200px] sm:max-w-[300px]" title={order.product}>
                          {order.product}
                        </span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-1 uppercase">SKU: {order.sku} • Qty: {order.qty}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase ${
                        order.marketplace === 'Shopee' ? 'bg-orange-50 text-orange-600' :
                        order.marketplace === 'Tiktok' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {order.marketplace}
                      </span>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-6">
                      <div className="flex justify-center">
                        <select 
                          disabled={order.returFinal}
                          value={order.penanganan || "Proses"}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          className={`text-[8px] sm:text-[10px] font-black uppercase px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border-2 outline-none cursor-pointer transition-all ${
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
                    <td className={`px-5 py-4 sm:px-8 sm:py-6 text-right font-black text-xs sm:text-sm ${
                      order.penanganan === 'Rusak' || order.penanganan === 'Tidak Kembali' ? 'text-red-500' : 'text-slate-400'
                    }`}>
                      Rp {(order.hpp || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredData.length === 0 && (
              <div className="py-24 sm:py-32 flex flex-col items-center justify-center text-slate-300 uppercase text-[8px] sm:text-[10px] font-black tracking-widest opacity-40">
                <Package size={40} className="mb-4 animate-pulse" />
                Belum ada data retur
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}