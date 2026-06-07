"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from "../context/AuthContext";
import { 
  ShoppingBag, 
  Wallet, 
  Box, 
  AlertCircle,
  Calculator, 
  Link as LinkIcon, 
  ListTodo, 
  BoxIcon, 
  MapIcon, 
  Settings,
  ArrowRight,
  Landmark,
  EyeOff,   
  Eye       
} from "lucide-react";

import { subscribeCriticalStock, subscribeSalesData, DashboardStats } from "../lib/services/dashboard";

export default function Home() {
  const { currentUser } = useAuth();
  
  const [timeFilter, setTimeFilter] = useState("Hari Ini"); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('id-ID', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [showCards, setShowCards] = useState(true);

  const [stats, setStats] = useState<DashboardStats & { stokKritis: number }>({ 
    omset: 0, modal: 0, profit: 0, grossProfit: 0, stokKritis: 0 
  });

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = ["2024", "2025", "2026"];

  useEffect(() => {
    const isCardsHidden = localStorage.getItem('sny_hide_dashboard_cards');
    if (isCardsHidden === 'true') {
      setShowCards(false);
    }
  }, []);

  const toggleCardsVisibility = () => {
    const newState = !showCards;
    setShowCards(newState);
    localStorage.setItem('sny_hide_dashboard_cards', (!newState).toString());
  };

  useEffect(() => {
    if (!currentUser) return;

    let startDate = new Date();
    let endDate = new Date();

    if (timeFilter === "Hari Ini") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeFilter === "7 Hari") {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const monthIndex = months.indexOf(selectedMonth);
      startDate = new Date(Number(selectedYear), monthIndex, 1); 
      endDate = new Date(Number(selectedYear), monthIndex + 1, 0); 
      endDate.setHours(23, 59, 59, 999);
    }

    const unsubProd = subscribeCriticalStock(currentUser.uid, (count) => {
      setStats(prev => ({ ...prev, stokKritis: count }));
    });

    const unsubSales = subscribeSalesData(currentUser.uid, startDate, endDate, (newStats) => {
      setStats(prev => ({ ...prev, ...newStats }));
    });

    return () => { 
      unsubProd(); 
      unsubSales(); 
    };
  }, [currentUser, timeFilter, selectedMonth, selectedYear]);

  const getPeriodLabel = () => {
    if (timeFilter === "Hari Ini") return "Hari Ini";
    if (timeFilter === "7 Hari") return "7 Hari Terakhir";
    return `${selectedMonth} ${selectedYear}`;
  };

  const shortcuts = [
    { name: "Inventaris", desc: "Kelola stok & harga", icon: Calculator, href: "/inventaris", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { name: "Penjualan", desc: "Data transaksi harian", icon: LinkIcon, href: "/penjualan", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { name: "Pembayaran", desc: "Cek Tagihan & kas", icon: ListTodo, href: "/pembayaran", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { name: "Retur", desc: "Klaim barang kembali", icon: BoxIcon, href: "/pengembalian", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { name: "Laporan", desc: "Laporan Keseluruhan", icon: MapIcon, href: "/laporan", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { name: "Pengaturan", desc: "Konfigurasi akun", icon: Settings, href: "/settings", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
  ];

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-28 lg:pb-16">
      
      {/* HEADER SECTION */}
      <div className="px-4 sm:px-10 pt-10 pb-6 border-b border-[#E2E8F0] mb-6 bg-white shadow-sm flex flex-col gap-4 transition-all duration-300">
        
        {/* Baris Atas: Judul & Tombol Toggle */}
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-3xl sm:text-[42px] font-black text-[#0F172A] tracking-tighter leading-none">Beranda</h2>
          
          <button 
            onClick={toggleCardsVisibility}
            className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-sm active:scale-95 border ${
              showCards 
                ? "bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200" 
                : "bg-blue-50 text-[#0047AB] hover:bg-blue-100 border-blue-200"
            }`}
          >
            {showCards ? (
              <><EyeOff size={18} /> <span className="hidden sm:inline">Sembunyikan Statistik</span></>
            ) : (
              <><Eye size={18} /> <span className="hidden sm:inline">Tampilkan Statistik</span></>
            )}
            {/* Teks khusus mobile agar tidak terlalu panjang */}
            <span className="sm:hidden">{showCards ? "Tutup" : "Lihat Performa"}</span>
          </button>
        </div>

        {/* 🚀 CONDITIONAL RENDERING: FILTER AREA (Hanya Muncul Jika Analitik Aktif) */}
        {showCards && (
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <div className="inline-flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <p className="text-[10px] sm:text-xs font-black text-slate-600 uppercase tracking-widest">
                  Data Ditampilkan: <span className="text-[#0047AB] ml-1">{getPeriodLabel()}</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto overflow-x-auto no-scrollbar">
                {["Hari Ini", "7 Hari", "Bulan"].map((filterOpt) => (
                  <button
                    key={filterOpt}
                    onClick={() => setTimeFilter(filterOpt)}
                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                      timeFilter === filterOpt 
                        ? "bg-[#0047AB] text-white shadow-md scale-[1.02]" 
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {filterOpt === "Bulan" ? "Pilih Bulan" : filterOpt}
                  </button>
                ))}
              </div>

              {timeFilter === "Bulan" && (
                <div className="flex space-x-2 animate-in fade-in slide-in-from-left-2 w-full sm:w-auto">
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="flex-1 sm:flex-none bg-white border-2 border-[#0047AB]/20 hover:border-[#0047AB] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-[#0F172A] shadow-sm outline-none transition-all cursor-pointer"
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)} 
                    className="flex-1 sm:flex-none bg-white border-2 border-[#0047AB]/20 hover:border-[#0047AB] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-[#0F172A] shadow-sm outline-none transition-all cursor-pointer"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🚀 CONDITIONAL RENDERING: STAT CARDS (Hanya Muncul Jika Analitik Aktif) */}
      {showCards && (
        <div className="px-4 sm:px-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          
          <div className="bg-white p-4 sm:p-7 rounded-[24px] sm:rounded-[28px] shadow-sm border border-[#F1F5F9] relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
            <div className="flex justify-between items-start">
              <div className="p-2 sm:p-3 bg-[#F0F7FF] text-[#0047AB] rounded-xl sm:rounded-2xl"><ShoppingBag size={20} /></div>
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-0.5 sm:mb-1">Total Penjualan</p>
              <h3 className="text-sm sm:text-xl xl:text-3xl font-black text-[#0F172A] tracking-tight truncate">Rp {stats.omset.toLocaleString('id-ID')}</h3>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[5px] bg-[#0047AB]"></div>
          </div>

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

          <div className="bg-emerald-500 p-4 sm:p-7 rounded-[24px] sm:rounded-[28px] shadow-md shadow-emerald-200 border border-emerald-400 relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group">
            <div className="absolute -right-6 -top-6 text-emerald-400/30 transform group-hover:scale-110 transition-transform duration-500">
               <Landmark size={120} strokeWidth={1} />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div className="p-2 sm:p-3 bg-white/20 text-white rounded-xl sm:rounded-2xl backdrop-blur-sm"><Landmark size={20} /></div>
              <div className="text-[8px] sm:text-[10px] font-black text-emerald-900 bg-white/30 px-2 py-0.5 sm:py-1 rounded-md">CUAN</div>
            </div>
            <div className="relative z-10">
              <p className="text-[8px] sm:text-[10px] font-black text-emerald-100 uppercase tracking-[0.15em] mb-0.5 sm:mb-1">Keuntungan Kotor</p>
              <h3 className="text-sm sm:text-xl xl:text-3xl font-black text-white tracking-tight truncate">Rp {stats.grossProfit.toLocaleString('id-ID')}</h3>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-7 rounded-[24px] sm:rounded-[28px] shadow-sm border border-[#F1F5F9] relative overflow-hidden flex flex-col justify-between min-h-[140px] sm:min-h-[160px]">
            <div className="flex justify-between items-start">
              <div className="p-2 sm:p-3 bg-[#FFF1F2] text-[#E11D48] rounded-xl sm:rounded-2xl"><Box size={20} /></div>
              {stats.stokKritis > 0 && (
                 <div className="animate-pulse flex items-center space-x-1 text-[#E11D48] bg-[#FFF1F2] px-2 py-0.5 sm:py-1 rounded-md text-[8px] sm:text-[10px] font-black">
                   <AlertCircle size={12} /> <span className="hidden sm:inline">RESTOCK</span>
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
      )}

      {/* QUICK ACCESS / SHORTCUT SECTION */}
      <div className={`px-4 sm:px-10 py-8 sm:py-12 transition-all duration-300 ${!showCards ? 'pt-2' : 'mt-4'}`}>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">Akses Cepat</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          {shortcuts.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className="group bg-white p-5 sm:p-6 rounded-3xl border border-[#F1F5F9] shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col items-start hover:-translate-y-1"
            >
              <div className={`p-3 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${item.bg} ${item.color}`}>
                <item.icon size={24} strokeWidth={2.5} />
              </div>
              <h5 className="text-sm font-black text-[#0F172A] mb-1 group-hover:text-[#0047AB] transition-colors">{item.name}</h5>
              <p className="text-[10px] font-bold text-[#94A3B8] leading-snug mb-4">{item.desc}</p>
              
              <div className="mt-auto flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#0047AB] transition-colors">
                Buka <ArrowRight size={12} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        select { -webkit-appearance: none; appearance: none; }
      `}</style>
    </div>
  );
}