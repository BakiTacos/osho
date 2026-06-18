"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  collection, onSnapshot, query, where, 
  doc, updateDoc, increment, orderBy,
  writeBatch, getDocs, serverTimestamp
} from "firebase/firestore";
import { 
  Search, Package, TrendingDown, Upload, AlertTriangle, X, Filter
} from "lucide-react";
import * as XLSX from 'xlsx';

export default function PengembalianPage() {
  const { currentUser } = useAuth();
  const [returOrders, setReturOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 🚀 STATE BARU: Filter Status Penanganan (Default: Proses)
  const [statusFilter, setStatusFilter] = useState("Proses");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedMarketplace, setSelectedMarketplace] = useState<"shopee" | "tiktok">("shopee");

  // STATE UNTUK FITUR AFKIR GUDANG
  const [isAfkirModalOpen, setIsAfkirModalOpen] = useState(false);
  const [afkirForm, setAfkirForm] = useState({ sku: '', qty: 1, reason: '' });

  useEffect(() => {
    if (!currentUser) return;

    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

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
        
        const targetIndex = selectedMarketplace === "shopee" ? 4 : 0;
        const startRow = selectedMarketplace === "shopee" ? 1 : 1; 
        
        const rawRows = data.slice(startRow);
        const batch = writeBatch(db);
        let foundCount = 0;

        for (const row of rawRows) {
          const orderId = String(row[targetIndex] || "").trim().replace(/^#/, "");
          if (!orderId) continue;

          const qSales = query(
            collection(db, `users/${currentUser.uid}/sales`), 
            where("orderId", "==", orderId)
          );
          
          const snapshot = await getDocs(qSales);

          snapshot.forEach((docSnap) => {
            const saleData = docSnap.data();
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

  // 🚀 FITUR AFKIR: Sinkronisasi ke Tabel Retur
  const handleAfkirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const prod = products.find(p => p.sku === afkirForm.sku.toUpperCase());
    if (!prod) return alert("❌ SKU tidak ditemukan di database Master Produk!");

    const lossAmount = (Number(prod.costPrice) || 0) * afkirForm.qty;
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    const todayLokal = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

    try {
      const batch = writeBatch(db);
      
      // 1. Potong Stok Produk
      const prodRef = doc(db, `users/${currentUser.uid}/products`, prod.id);
      batch.update(prodRef, { stock: increment(-afkirForm.qty) });

      // 2. Suntik Kerugian ke Biaya Operasional (Opex)
      const expRef = doc(collection(db, `users/${currentUser.uid}/expenses`));
      batch.set(expRef, {
        category: "Penyusutan Gudang",
        description: `Barang Rusak [${prod.sku}] x${afkirForm.qty} - ${afkirForm.reason}`,
        amount: lossAmount,
        paidBy: "SISTEM",
        date: todayLokal,
        createdAt: serverTimestamp()
      });

      // 3. 🚀 Catat ke tabel Sales sebagai "Retur Afkir" agar transparan di tabel
      const afkirSalesRef = doc(collection(db, `users/${currentUser.uid}/sales`));
      batch.set(afkirSalesRef, {
        orderId: `AFKIR-${Math.floor(Date.now() / 1000)}`,
        product: prod.name,
        sku: prod.sku,
        qty: afkirForm.qty,
        hpp: lossAmount, // Total HPP yang hilang
        total: 0,
        marketplace: "Gudang", // Indikator asal usul
        status: "Retur",
        penanganan: "Afkir", // Status penanganan
        returFinal: true, // Langsung final tanpa perlu diklik lagi
        profit: -lossAmount,
        date: todayLokal,
        createdAt: serverTimestamp(),
        catatan: afkirForm.reason // Transparansi alasan
      });

      await batch.commit();
      
      alert(`✅ Barang Penyusutan berhasil dicatat! Stok terpotong dan riwayat muncul di tabel.`);
      setIsAfkirModalOpen(false);
      setAfkirForm({ sku: '', qty: 1, reason: '' });
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses barang Penyusutan.");
    }
  };

  const handleStatusChange = async (order: any, newStatus: string) => {
    if (order.returFinal) {
      alert("Pesanan ini sudah diproses secara final.");
      return;
    }

    const orderRef = doc(db, `users/${currentUser?.uid}/sales`, order.id);
    const initialProd = products.find(p => p.sku === order.sku?.toUpperCase());

    try {
      let orderDate = new Date();
      if (order.createdAt?.toDate) orderDate = order.createdAt.toDate();
      else if (order.createdAt) orderDate = new Date(order.createdAt);
      else if (order.date) orderDate = new Date(order.date);

      const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
      const todayLokal = new Date(Date.now() - tzoffset);
      const todayString = todayLokal.toISOString().split('T')[0];
      
      const isCurrentMonth = orderDate.getMonth() === todayLokal.getMonth() && orderDate.getFullYear() === todayLokal.getFullYear();
      const keuntunganBatal = (order.total || 0) - (order.hpp || 0);

      const batch = writeBatch(db);

      if (newStatus === "Selesai") {
        if (initialProd) {
          let targetId = initialProd.id;
          let qtyToReturn = order.qty || 1;
          if (initialProd.isMapping && initialProd.linkedSku) {
            const mainProd = products.find(p => p.sku === initialProd.linkedSku);
            if (mainProd) {
              targetId = mainProd.id;
              qtyToReturn = (order.qty || 1) * (initialProd.multiplier || 1);
            }
          }
          batch.update(doc(db, `users/${currentUser?.uid}/products`, targetId), { stock: increment(qtyToReturn) });
        }

        if (isCurrentMonth) {
          batch.update(orderRef, { penanganan: newStatus, profit: 0, returFinal: true });
        } else {
          batch.update(orderRef, { penanganan: newStatus, returFinal: true });
          if (keuntunganBatal > 0) {
            const expRef = doc(collection(db, `users/${currentUser?.uid}/expenses`));
            batch.set(expRef, {
              category: "Koreksi Profit Retur",
              description: `Retur Barang OK (Bulan Lalu) - #${order.orderId}`,
              amount: keuntunganBatal,
              paidBy: "SISTEM",
              date: todayString,
              createdAt: serverTimestamp()
            });
          }
        }
        await batch.commit();
        alert(`✅ Status Selesai: Stok dipulihkan.`);

      } else if (newStatus === "Rusak" || newStatus === "Tidak Kembali") {
        
        if (isCurrentMonth) {
          batch.update(orderRef, { penanganan: newStatus, profit: 0, returFinal: true });
          const expRef = doc(collection(db, `users/${currentUser?.uid}/expenses`));
          batch.set(expRef, {
            category: "Kerugian Retur (HPP)",
            description: `Retur Rusak [Bulan Ini] - #${order.orderId}`,
            amount: order.hpp || 0,
            paidBy: "SISTEM",
            date: todayString,
            createdAt: serverTimestamp()
          });
        } else {
          batch.update(orderRef, { penanganan: newStatus, returFinal: true });
          const totalKerugian = order.total || order.hpp || 0; 
          const expRef = doc(collection(db, `users/${currentUser?.uid}/expenses`));
          batch.set(expRef, {
            category: "Kerugian Retur & Profit",
            description: `Retur Rusak [Bulan Lalu] - #${order.orderId}`,
            amount: totalKerugian,
            paidBy: "SISTEM",
            date: todayString,
            createdAt: serverTimestamp()
          });
        }
        await batch.commit();
        alert(`⚠️ Status ${newStatus}: Dicatat sebagai kerugian.`);

      } else {
        await updateDoc(orderRef, { penanganan: newStatus });
      }
    } catch (error) {
      console.error("Gagal memproses retur:", error);
      alert("Terjadi kesalahan sistem saat memproses retur.");
    }
  };

  // 🚀 KALKULASI TOTAL KERUGIAN (Termasuk Afkir Gudang)
  const totalLoss = returOrders.reduce((acc, curr) => {
    if (curr.penanganan === "Rusak" || curr.penanganan === "Tidak Kembali" || curr.penanganan === "Afkir") {
      return acc + (curr.hpp || 0);
    }
    return acc;
  }, 0);

  // 🚀 LOGIKA FILTER GANDA (Search + Dropdown Status)
  const filteredData = returOrders.filter(item => {
    const matchSearch = item.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.product?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Default status jika belum ada field penanganan adalah "Proses"
    const currentStatus = item.penanganan || "Proses";
    const matchStatus = statusFilter === "Semua" ? true : currentStatus === statusFilter;

    return matchSearch && matchStatus;
  });

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
          
          {/* TOGGLE PILIHAN MARKETPLACE */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button onClick={() => setSelectedMarketplace("shopee")} className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${selectedMarketplace === "shopee" ? "bg-white text-orange-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}>Shopee</button>
            <button onClick={() => setSelectedMarketplace("tiktok")} className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${selectedMarketplace === "tiktok" ? "bg-slate-900 text-white shadow-xs" : "text-slate-400 hover:text-slate-600"}`}>TikTok</button>
          </div>

          {/* TOMBOL IMPORT EXCEL */}
          <label className="cursor-pointer flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black text-[#0F172A] uppercase hover:bg-slate-50 transition-all shadow-sm shrink-0">
            <Upload size={14} /> 
            <span className="hidden sm:inline">{isProcessing ? "Memproses..." : `Impor Retur ${selectedMarketplace}`}</span>
            <span className="sm:hidden">Impor</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls" disabled={isProcessing} />
          </label>

          {/* TOMBOL INPUT AFKIR GUDANG */}
          <button onClick={() => setIsAfkirModalOpen(true)} className="flex items-center justify-center gap-2 bg-red-500 border border-red-600 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black text-white uppercase hover:bg-red-600 transition-all shadow-sm shrink-0">
            <AlertTriangle size={14} /> 
            <span className="hidden sm:inline">Input Penyusutan Gudang</span>
            <span className="sm:hidden">Penyusutan</span>
          </button>
        </div>
      </div>

      {/* 🚀 FILTER BAR & SEARCH (BARIS KEDUA) */}
      <div className="px-4 sm:px-10 mt-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Cari No. Pesanan atau Nama Produk..." 
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0047AB] transition-all shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* DROPDOWN FILTER STATUS */}
        <div className="relative w-full sm:w-auto shrink-0">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-8 text-[10px] sm:text-xs font-black text-slate-600 uppercase outline-none focus:ring-2 focus:ring-[#0047AB] transition-all cursor-pointer shadow-sm appearance-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Proses">🔄 Sedang Diproses</option>
            <option value="Menunggu Barang">🚚 Menunggu Barang</option>
            <option value="Selesai">✅ Selesai (Barang OK)</option>
            <option value="Rusak">❌ Barang Rusak</option>
            <option value="Tidak Kembali">⚠️ Tidak Kembali</option>
            <option value="Afkir">🗑️ Penyusutan Gudang</option>
          </select>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="px-4 sm:px-10 mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-red-500 flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 sm:mb-3 flex items-center"><TrendingDown size={12} className="mr-1 shrink-0"/> Kerugian Realita</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A] truncate">Rp {totalLoss.toLocaleString('id-ID')}</h3>
          </div>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Termasuk Susut Gudang</p>
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
                  <th className="px-4 py-4 sm:px-6 sm:py-5">Asal / Marketplace</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-5 text-center">Penanganan</th>
                  <th className="px-5 py-4 sm:px-8 sm:py-5 text-right">Kerugian (Modal)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/50 transition-all text-xs sm:text-sm font-bold">
                    <td className="px-5 py-4 sm:px-8 sm:py-6">
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-black text-[#0047AB] mb-0.5 sm:mb-1">#{order.orderId}</span>
                        <span className="text-xs sm:text-sm font-bold text-[#0F172A] uppercase leading-tight truncate max-w-[200px] sm:max-w-[300px]" title={order.product}>{order.product}</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-1 uppercase">SKU: {order.sku} • Qty: {order.qty}</span>
                        
                        {/* 🚀 Transparansi Alasan Khusus Gudang */}
                        {order.marketplace === "Gudang" && order.catatan && (
                          <span className="mt-1.5 px-2 py-0.5 bg-red-50 text-red-500 rounded text-[8px] font-black uppercase w-fit tracking-widest border border-red-100">
                            Alasan: {order.catatan}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${
                        order.marketplace === 'Shopee' ? 'bg-orange-50 text-orange-600' :
                        order.marketplace === 'Tiktok' ? 'bg-slate-900 text-white' : 
                        order.marketplace === 'Gudang' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600'
                      }`}>{order.marketplace}</span>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-6">
                      <div className="flex justify-center">
                        {/* 🚀 Jika dari Gudang, statusnya statis dan tidak bisa diubah */}
                        {order.marketplace === "Gudang" ? (
                          <span className="text-[8px] sm:text-[10px] font-black uppercase px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border-2 border-red-100 bg-red-50 text-red-600">
                             🗑️ Penyusutan Gudang
                          </span>
                        ) : (
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
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-4 sm:px-8 sm:py-6 text-right font-black text-xs sm:text-sm ${
                      order.penanganan === 'Rusak' || order.penanganan === 'Tidak Kembali' || order.penanganan === 'Afkir' ? 'text-red-500' : 'text-slate-400'
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
                {statusFilter !== "Semua" ? `Belum ada data dengan status: ${statusFilter}` : "Belum ada data retur"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🚀 MODAL INPUT AFKIR GUDANG */}
      {isAfkirModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 sm:p-8 relative shadow-2xl">
            <button onClick={() => setIsAfkirModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={20}/></button>
            <div className="mb-6">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4"><AlertTriangle size={24}/></div>
              <h2 className="text-xl font-black text-[#0F172A] tracking-tight">Input Penyusutan Gudang</h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1">Catat barang rusak/hilang tanpa nomor pesanan.</p>
            </div>
            <form onSubmit={handleAfkirSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU Barang Rusak</label>
                <input list="sku-list" required value={afkirForm.sku} onChange={(e) => setAfkirForm({...afkirForm, sku: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 font-black text-[#0F172A] text-sm mt-1 uppercase outline-none focus:ring-2 focus:ring-red-200" placeholder="Ketik SKU..."/>
                <datalist id="sku-list">
                  {products.map(p => <option key={p.id} value={p.sku}>{p.name}</option>)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah (Qty)</label>
                  <input type="number" min="1" required value={afkirForm.qty} onChange={(e) => setAfkirForm({...afkirForm, qty: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 font-black text-[#0F172A] text-sm mt-1 outline-none focus:ring-2 focus:ring-red-200" placeholder="0"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Alasan</label>
                <input required value={afkirForm.reason} onChange={(e) => setAfkirForm({...afkirForm, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 font-bold text-[#0F172A] text-sm mt-1 outline-none focus:ring-2 focus:ring-red-200" placeholder="Contoh: Pecah saat bongkar muat"/>
              </div>
              <button type="submit" className="w-full mt-6 bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-md shadow-red-200 hover:-translate-y-1 transition-all">
                Potong Stok & Catat Kerugian
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}