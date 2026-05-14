"use client";

import React, { useState, useEffect  } from 'react';
import { db } from "../lib/firebase"; 
import { useAuth } from "../context/AuthContext";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { 
  Search, Bell, HelpCircle, ShoppingBag, 
  Wallet, Box, TrendingUp, AlertCircle
} from "lucide-react";

export default function Home() {
  const { currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('id-ID', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState("2026");

  // State Data Real-time
  const [stats, setStats] = useState({ omset: 0, modal: 0, profit: 0, grossProfit: 0, stokKritis: 0 });
  const [marketplaceData, setMarketplaceData] = useState({ Shopee: 0, Tiktok: 0, Lazada: 0, Offline: 0 });
  const [loading, setLoading] = useState(true);

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = ["2024", "2025", "2026"];

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    // ==========================================
    // OPTIMASI 1: STOK KRITIS (HEMAT BIAYA READ)
    // ==========================================
    // Server Firebase hanya akan mengirim produk yang stoknya <= 10.
    // Pastikan field 'stock' di Firebase Kakak tersimpan sebagai tipe data Number, bukan String.
    const qProd = query(
      collection(db, `users/${currentUser.uid}/products`),
      where("stock", "<=", 10)
    );
    
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      // Kita cukup menghitung jumlah dokumen yang dikirim Firebase
      setStats(prev => ({ ...prev, stokKritis: snapshot.docs.length }));
    });

    // ==========================================
    // OPTIMASI 2: PENJUALAN BULANAN (HEMAT BIAYA READ)
    // ==========================================
    // Kita ubah string Bulan & Tahun menjadi rentang Waktu (Date)
    const monthIndex = months.indexOf(selectedMonth);
    const startDate = new Date(Number(selectedYear), monthIndex, 1); // Tanggal 1 bulan ini
    const endDate = new Date(Number(selectedYear), monthIndex + 1, 1); // Tanggal 1 bulan depan

    // Server Firebase hanya akan mengirim data yang terjadi di dalam rentang waktu bulan ini.
    const qSales = query(
      collection(db, `users/${currentUser.uid}/sales`),
      where("createdAt", ">=", startDate),
      where("createdAt", "<", endDate)
    );

    const unsubSales = onSnapshot(qSales, (snapshot) => {
      let totalOmset = 0;
      let totalModal = 0;
      let totalGrossProfit = 0;
      let mpCounts: any = { Shopee: 0, Tiktok: 0, Lazada: 0, Offline: 0 };

      snapshot.docs.forEach(doc => {
        const s = doc.data();
        
        // Kita hanya perlu filter status Retur di sini karena tanggal sudah difilter oleh Firebase
        if (s.status !== 'Retur') {
          totalOmset += Number(s.total) || 0;
          totalModal += Number(s.hpp) || 0;
          totalGrossProfit += Number(s.profit) || 0; 
          
          const source = s.marketplace || 'Offline';
          if (mpCounts[source] !== undefined) {
            mpCounts[source] += Number(s.total) || 0;
          }
        }
      });

      setStats(prev => ({ 
        ...prev, 
        omset: totalOmset, 
        modal: totalModal, 
        grossProfit: totalGrossProfit,
        profit: totalOmset - totalModal
      }));
      
      setMarketplaceData(mpCounts);
      setLoading(false);
    });

    // Membersihkan listener saat pindah halaman atau ganti bulan
    return () => { 
      unsubProd(); 
      unsubSales(); 
    };
  }, [currentUser, selectedMonth, selectedYear]);

  // Hitung persentase untuk Donut Chart sederhana
  const totalGmv = Object.values(marketplaceData).reduce((a, b) => a + b, 0);
  const getPercentage = (val: number) => totalGmv === 0 ? "0%" : `${((val / totalGmv) * 100).toFixed(0)}%`;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-16">
      
      {/* HEADER SECTION */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-4">
        <div className="relative flex-1 lg:flex-none lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input 
            type="text" 
            placeholder="Cari analisis..." 
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0047AB]" 
          />
        </div>
        <div className="flex items-center space-x-3 sm:space-x-6 text-[#64748B]">
          <div className="flex items-center space-x-4"><Bell size={20} className="cursor-pointer hover:text-[#0047AB]"/><HelpCircle size={20} className="cursor-pointer hover:text-[#0047AB]"/></div>
          <div className="flex items-center space-x-3 border-l border-[#E2E8F0] pl-3 sm:pl-6">
            <span className="hidden md:block text-sm font-black text-[#0F172A] uppercase">Kia</span>
            <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center text-xs font-black shadow-lg">K</div>
          </div>
        </div>
      </div>

      {/* FILTER & TITLE BAR */}
      <div className="px-4 sm:px-10 pt-8 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-[42px] font-black text-[#0F172A] tracking-tighter leading-none">Dasbor</h2>
            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mt-1">Data periode {selectedMonth} {selectedYear}</p>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="flex-1 sm:flex-none bg-white border border-[#E2E8F0] px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-sm outline-none focus:ring-2 focus:ring-[#0047AB] cursor-pointer">
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="flex-1 sm:flex-none bg-white border border-[#E2E8F0] px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-sm outline-none focus:ring-2 focus:ring-[#0047AB] cursor-pointer">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* STAT CARDS - RESPONSIVE 2 COLUMNS ON MOBILE */}
      <div className="px-4 sm:px-10 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        
        {/* Card 1: Omset (Blue) */}
        <div className="bg-white p-4 sm:p-7 rounded-[24px] sm:rounded-[28px] shadow-sm border border-[#F1F5F9] relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-3 bg-[#F0F7FF] text-[#0047AB] rounded-xl sm:rounded-2xl"><ShoppingBag size={20} /></div>
            <div className="text-[8px] sm:text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 sm:py-1 rounded-md">LIVE</div>
          </div>
          <div>
            <p className="text-[8px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-0.5 sm:mb-1">Total Omset</p>
            <h3 className="text-sm sm:text-xl xl:text-3xl font-black text-[#0F172A] tracking-tight truncate">Rp {stats.omset.toLocaleString('id-ID')}</h3>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[5px] bg-[#0047AB]"></div>
        </div>

        {/* Card 2: Modal (Slate) */}
        <div className="bg-white p-4 sm:p-7 rounded-[24px] sm:rounded-[28px] shadow-sm border border-[#F1F5F9] relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-3 bg-slate-50 text-[#64748B] rounded-xl sm:rounded-2xl"><Wallet size={20} /></div>
          </div>
          <div>
            <p className="text-[8px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-0.5 sm:mb-1">Total Modal (HPP)</p>
            <h3 className="text-sm sm:text-xl xl:text-3xl font-black text-[#0F172A] tracking-tight truncate">Rp {stats.modal.toLocaleString('id-ID')}</h3>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[5px] bg-slate-200"></div>
        </div>

        {/* Card 3: Stok Kritis (Red - Full Width on Mobile) */}
        <div className="bg-white p-4 sm:p-7 rounded-[24px] sm:rounded-[28px] shadow-sm border border-[#F1F5F9] relative overflow-hidden col-span-2 lg:col-span-1 flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="p-2 sm:p-3 bg-[#FFF1F2] text-[#E11D48] rounded-xl sm:rounded-2xl"><Box size={20} /></div>
            {stats.stokKritis > 0 && (
               <div className="animate-pulse flex items-center space-x-1 text-[#E11D48] bg-[#FFF1F2] px-2 py-0.5 sm:py-1 rounded-md text-[8px] sm:text-[10px] font-black">
                 <AlertCircle size={12} /> <span>RESTOCK</span>
               </div>
            )}
          </div>
          <div>
            <p className="text-[8px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-0.5 sm:mb-1">Stok Kritis (≤10)</p>
            <h3 className="text-sm sm:text-xl xl:text-3xl font-black text-[#0F172A] tracking-tight">{stats.stokKritis} SKU</h3>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[5px] bg-[#E11D48]"></div>
        </div>
      </div>

      {/* CHART & MARKETPLACE SECTION - RESPONSIVE COLUMN-FIRST */}
      <div className="px-4 sm:px-10 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: Kas Comparison Card */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[32px] border border-[#F1F5F9] shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h4 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">Perbandingan Kas</h4>
              <p className="text-[9px] sm:text-xs font-bold text-[#94A3B8] uppercase mt-0.5">Omset vs Modal {selectedMonth}</p>
            </div>
            <div className="flex space-x-4">
               <div className="flex items-center space-x-1.5 text-[8px] sm:text-[10px] font-black text-[#64748B] uppercase">
                 <div className="w-2 h-2 rounded-full bg-[#0047AB]"></div> <span>Omset</span>
               </div>
               <div className="flex items-center space-x-1.5 text-[8px] sm:text-[10px] font-black text-[#64748B] uppercase">
                 <div className="w-2 h-2 rounded-full bg-slate-200"></div> <span>Modal</span>
               </div>
            </div>
          </div>
          
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-6 sm:gap-8 h-auto sm:h-48">
            {/* Bar Visualizer: Omset vs Profit Kotor */}
            <div className="w-full sm:w-1/3 flex flex-col justify-end gap-1.5 h-36 sm:h-full">
              <div className="flex items-end gap-3 h-full">
                {/* Bar Omset (100%) */}
                <div className="flex-1 flex flex-col justify-end h-full">
                  <div className="w-full bg-[#0047AB]/10 rounded-t-xl h-full relative group">
                    <div className="absolute inset-0 bg-[#0047AB] rounded-t-xl shadow-lg shadow-blue-100/50"></div>
                  </div>
                </div>
                
                {/* Bar Profit Kotor (Percentage) */}
                <div className="flex-1 flex flex-col justify-end h-full">
                  <div className="w-full bg-slate-100 rounded-t-xl h-full relative">
                    <div 
                      style={{ height: stats.omset > 0 ? `${(stats.grossProfit / stats.omset) * 100}%` : '0%' }} 
                      className="absolute bottom-0 left-0 w-full bg-emerald-500 rounded-t-xl shadow-lg shadow-emerald-100/50 transition-all duration-1000"
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-black text-[#0F172A] mt-2 uppercase">
                <span className="flex-1 text-center">Omset</span>
                <span className="flex-1 text-center">Gross</span>
              </div>
            </div>

            {/* Explanatory Text */}
            <div className="flex-[2] bg-slate-50 rounded-3xl p-5 sm:p-6 flex flex-col justify-center">
              <p className="text-xs sm:text-sm font-bold text-[#64748B] leading-relaxed">
                Bulan {selectedMonth} telah menghasilkan profit kotor (setelah potong admin & logistik) sebesar 
                <span className="text-emerald-600 ml-1 font-black whitespace-nowrap">
                  Rp {stats.grossProfit.toLocaleString('id-ID')}
                </span>.
              </p>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-emerald-600 font-black text-lg sm:text-xl">
                  <TrendingUp size={20} className="mr-1.5 shrink-0"/> 
                  {stats.omset > 0 ? ((stats.grossProfit / stats.omset) * 100).toFixed(1) : 0}% 
                  <span className="text-[10px] text-slate-400 ml-2 uppercase tracking-widest">Real Margin</span>
                </div>
                
                {/* Info tambahan HPP */}
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-300 uppercase">Estimasi HPP</p>
                  <p className="text-[10px] font-bold text-slate-500">Rp {stats.modal.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Proporsi Marketplace Real-time */}
        <div className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[32px] border border-[#F1F5F9] shadow-sm flex flex-col justify-between">
          <h4 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight mb-6">Marketplace GMV</h4>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 border-[12px] sm:border-[16px] border-[#0047AB] rounded-full flex flex-col items-center justify-center shadow-inner group transition-all duration-300">
               <span className="text-lg sm:text-2xl font-black text-[#0F172A]">Rp {(totalGmv / 1000000).toFixed(1)}M</span>
               <span className="text-[7px] sm:text-[8px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mt-0.5">Total GMV</span>
            </div>

            <div className="w-full mt-8 sm:mt-10 space-y-3 sm:space-y-4">
              {[
                { name: "Shopee", val: marketplaceData.Shopee, color: "bg-[#0047AB]" },
                { name: "Tiktok", val: marketplaceData.Tiktok, color: "bg-black" },
                { name: "Lazada", val: marketplaceData.Lazada, color: "bg-blue-400" },
                { name: "Offline", val: marketplaceData.Offline, color: "bg-slate-300" }
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${m.color}`}></div>
                    <span className="text-xs font-bold text-[#64748B]">{m.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#0F172A]">{getPercentage(m.val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        select { -webkit-appearance: none; appearance: none; }
      `}</style>
    </div>
  );
}