"use client";


import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";

import { useAuth } from "../../context/AuthContext";
import { 
  collection, onSnapshot, query, where, 
  doc, updateDoc, increment, orderBy,
  writeBatch, getDocs, addDoc, serverTimestamp
} from "firebase/firestore";
import { 
  Search, Package, TrendingDown, Upload
} from "lucide-react";
import * as XLSX from 'xlsx';

export default function PengembalianPage() {
  const { currentUser } = useAuth();
  const [returOrders, setReturOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 🚀 STATE BARU: Menentukan marketplace untuk acuan index excel
  const [selectedMarketplace, setSelectedMarketplace] = useState<"shopee" | "tiktok">("shopee");

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

  // --- LOGIKA IMPOR EXCEL BERDASARKAN PILIHAN MARKETPLACE ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
        
        // Menentukan baris awal data & index nomor pesanan berdasarkan pilihan marketplace
        const targetIndex = selectedMarketplace === "shopee" ? 4 : 0;
        const startRow = selectedMarketplace === "shopee" ? 1 : 1; // Sesuaikan jika ada baris kosong di awal file
        
        const rawRows = data.slice(startRow);
        const batch = writeBatch(db);
        let foundCount = 0;

        for (const row of rawRows) {
          // Ambil nilai berdasarkan index target platform
          const orderId = String(row[targetIndex] || "").trim().replace(/^#/, "");
          if (!orderId) continue;

          // Query pencarian dokumen penjualan yang memiliki orderId sama
          const qSales = query(
            collection(db, `users/${currentUser.uid}/sales`), 
            where("orderId", "==", orderId)
          );
          
          const snapshot = await getDocs(qSales);

          snapshot.forEach((docSnap) => {
            const saleData = docSnap.data();
            // Hanya update jika statusnya belum menjadi Retur
            if (saleData.status !== "Retur") {
              batch.update(docSnap.ref, { 
                status: "Retur", 
                penanganan: "Proses" 
              });
              foundCount++;
            }
          });
        }

        if (foundCount > 0) {
          await batch.commit();
          alert(`✅ Sukses! ${foundCount} pesanan ${selectedMarketplace.toUpperCase()} berhasil diubah ke status Retur.`);
        } else {
          alert(`Proses selesai. Tidak ada transaksi baru yang cocok untuk platform ${selectedMarketplace.toUpperCase()}.`);
        }

      } catch (err) { 
        console.error(err);
        alert("Gagal memproses file Excel. Pastikan format kolom marketplace yang dipilih sudah sesuai."); 
      } finally { 
        setIsProcessing(false); 
        e.target.value = ''; 
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- LOGIKA UPDATE STATUS & EFEK OTOMATIS ---
  const handleStatusChange = async (order: any, newStatus: string) => {
    if (order.returFinal) {
      alert("Pesanan ini sudah diproses secara final.");
      return;
    }

    const orderRef = doc(db, `users/${currentUser?.uid}/sales`, order.id);
    const initialProd = products.find(p => p.sku === order.sku?.toUpperCase());

    try {
      if (newStatus === "Selesai") {
        // 🚀 HITUNG PROFIT YANG HARUS DIKEMBALIKAN (Total Penjualan - Modal)
        const keuntunganBatal = (order.total || 0) - (order.hpp || 0);

        if (initialProd) {
          let targetId = initialProd.id;
          let qtyToReturn = order.qty || 1;

          if (initialProd.isMapping && initialProd.linkedSku) {
            const mainProd = products.find(p => p.sku === initialProd.linkedSku);
            if (mainProd) {
              targetId = mainProd.id;
              const multiplier = initialProd.multiplier || 1;
              qtyToReturn = (order.qty || 1) * multiplier;
            }
          }

          // Kembalikan barang ke stok gudang karena kondisi masih bagus
          await updateDoc(doc(db, `users/${currentUser?.uid}/products`, targetId), {
            stock: increment(qtyToReturn)
          });
        }
        
        // 1. Kunci status transaksi asli tanpa mengubah nominal profit historisnya
        await updateDoc(orderRef, { penanganan: newStatus, returFinal: true });

        // 2. Ambil tanggal lokal hari ini (Bulan ini)
        const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
        const todayLokal = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

        // 3. Tarik kembali keuntungan yang sudah keburu diambil bulan lalu, catat sebagai Opex Bulan Ini
        if (keuntunganBatal > 0) {
          await addDoc(collection(db, `users/${currentUser?.uid}/expenses`), {
            category: "Koreksi Profit Retur",
            description: `Retur Barang OK (Pesanan: #${order.orderId}) - Penyesuaian margin yang batal diperoleh`,
            amount: keuntunganBatal,
            paidBy: "SISTEM",
            date: todayLokal,
            createdAt: serverTimestamp()
          });
        }
        
        alert(`✅ Status Selesai: Barang balik ke stok & pembatalan profit Rp ${keuntunganBatal.toLocaleString('id-ID')} dicatat ke Operasional bulan ini.`);

      } else if (newStatus === "Rusak" || newStatus === "Tidak Kembali") {
        const kerugian = order.hpp || 0;
        
        // 1. Batal/Nol-kan profit di transaksi lama (Karena barang tidak jadi terjual)
        await updateDoc(orderRef, { penanganan: newStatus, profit: 0, returFinal: true });

        // 2. Suntikkan kerugian tersebut ke Biaya Operasional (Expenses) BULAN INI (Hari ini)
        const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
        const todayLokal = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

        // Pastikan Kakak sudah import 'addDoc' dan 'serverTimestamp' dari "firebase/firestore" di bagian paling atas file
        await addDoc(collection(db, `users/${currentUser?.uid}/expenses`), {
          category: "Kerugian Retur",
          description: `Retur ${newStatus} (Pesanan: #${order.orderId}) - ${order.product}`,
          amount: kerugian,
          paidBy: "SISTEM",
          date: todayLokal,
          createdAt: serverTimestamp()
        });

        alert(`Status ${newStatus}: Transaksi dibatalkan dan kerugian Rp ${kerugian.toLocaleString('id-ID')} otomatis dicatat ke Biaya Operasional bulan ini.`);
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
      
      {/* HEADER & CONTROLS */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#0F172A] leading-tight">Manajemen Retur</h1>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Otomatisasi Stok & Akuntansi Kerugian</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          {/* 🚀 TOGGLE PILIHAN MARKETPLACE */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setSelectedMarketplace("shopee")}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                selectedMarketplace === "shopee" 
                  ? "bg-white text-orange-600 shadow-xs" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Shopee
            </button>
            <button
              onClick={() => setSelectedMarketplace("tiktok")}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                selectedMarketplace === "tiktok" 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              TikTok
            </button>
          </div>

          {/* TOMBOL IMPORT FILE EXCEL */}
          <label className="cursor-pointer flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black text-slate-600 uppercase hover:bg-slate-50 hover:text-[#0047AB] transition-all shadow-sm shrink-0">
            <Upload size={14} /> 
            <span>{isProcessing ? "Memproses..." : `Impor Retur ${selectedMarketplace}`}</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls" disabled={isProcessing} />
          </label>

          {/* SEARCH BAR */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari No. Pesanan..." 
              className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0047AB] transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="px-4 sm:px-10 mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-red-500 flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 sm:mb-3 flex items-center">
              <TrendingDown size={12} className="mr-1 shrink-0"/> Kerugian Realita
            </p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A] truncate">Rp {totalLoss.toLocaleString('id-ID')}</h3>
          </div>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Dari Barang Rusak/Hilang</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-[#F1F5F9] shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 sm:mb-3">Total Kasus Retur</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A]">{returOrders.length} Kasus</h3>
          </div>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Masuk ke Sistem</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-orange-400 flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 sm:mb-3">Masih Proses</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A]">{returOrders.filter(o => !o.returFinal).length} Pesanan</h3>
          </div>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Menunggu Keputusan</p>
        </div>

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