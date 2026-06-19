import React from 'react';
import { Search } from "lucide-react";

export default function SalesFilters({
  timeFilter, setTimeFilter,
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear,
  searchSales, setSearchSales,
  statusTab, setStatusTab,
  pendingCount
}: any) {
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];

  return (
    <div className="px-4 sm:px-10 mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* TIME FILTERS */}
        <div className="flex flex-wrap items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm gap-2">
          {["Hari Ini", "3 Hari", "Bulan"].map((opt) => (
            <button key={opt} onClick={() => setTimeFilter(opt)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeFilter === opt ? "bg-[#0047AB] text-white shadow-md" : "text-slate-400 hover:text-[#0047AB]"}`}>
              {opt}
            </button>
          ))}

          {/* MONTH & YEAR SELECTOR */}
          <div className="flex items-center gap-1 ml-1 pl-3 border-l border-slate-100">
            <select 
              value={selectedMonth} 
              onChange={(e) => { setSelectedMonth(Number(e.target.value)); setTimeFilter("Bulan"); }} 
              className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-2 py-2 text-[#0047AB] outline-none cursor-pointer"
            >
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => { setSelectedYear(Number(e.target.value)); setTimeFilter("Bulan"); }} 
              className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-2 py-2 text-[#0047AB] outline-none cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full lg:max-w-xs group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Cari SKU, Resi, atau Marketplace..." 
            value={searchSales} 
            onChange={(e) => setSearchSales(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold shadow-sm focus:ring-2 focus:ring-[#0047AB] outline-none transition-all" 
          />
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
      {["Semua", "Proses", "Pending", "Selesai", "Retur"].map((tab) => (
        <button 
          key={tab} 
          onClick={() => setStatusTab(tab)}
          className={`pb-3 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex items-center ${
            statusTab === tab ? "text-[#0047AB]" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span>{tab}</span>
          
          {/* 🔴 BADGE INDIKATOR: Muncul merah menyala jika ada data Produk Luar Katalog */}
          {tab === "Pending" && pendingCount > 0 && (
            <span className="ml-1.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[16px] h-4 tracking-normal normal-case animate-pulse shadow-sm shadow-rose-100">
              {pendingCount}
            </span>
          )}
          
          {statusTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0047AB]"></div>}
        </button>
      ))}
    </div>
    </div>
  );
}