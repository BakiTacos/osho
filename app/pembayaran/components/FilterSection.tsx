// app/pembayaran/components/FilterSection.tsx
"use client";

import React from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';

export function FilterSection({ 
  timeFilter, 
  setTimeFilter, 
  selectedMonth, 
  setSelectedMonth, 
  selectedYear, 
  setSelectedYear 
}: any) {
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];

  return (
    <div className="px-4 sm:px-10 mt-6 sm:mt-8">
      {/* Pembungkus luar adaptif: melebar penuh di mobile, kompak di desktop */}
      <div className="flex flex-col sm:inline-flex sm:flex-row sm:items-center bg-white p-1.5 rounded-[22px] sm:rounded-full shadow-2xs border border-slate-100 gap-2 sm:gap-0 w-full sm:w-auto overflow-hidden">
        
        {/* TOMBOL UTAMA FILTER UTAMA (Hari Ini / 3 Hari / Bulan) */}
        <div className="flex w-full sm:w-auto bg-slate-50 sm:bg-transparent p-1 sm:p-0 rounded-xl sm:rounded-none gap-1 shrink-0">
          {["Hari Ini", "3 Hari", "Bulan"].map((opt) => (
            <button 
              key={opt} 
              type="button"
              onClick={() => setTimeFilter(opt)} 
              className={`cursor-pointer flex-1 sm:flex-none px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-full text-[10px] sm:text-xs font-black uppercase transition-all text-center whitespace-nowrap ${
                timeFilter === opt 
                  ? "bg-[#0047AB] text-white shadow-xs" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 sm:hover:bg-transparent"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* AREA DROPDOWN SELEKTOR BULAN & TAHUN (AKTIF JIKA OPSI BULAN DIPILIH) */}
        {timeFilter === "Bulan" && (
          <div className="flex items-center w-full sm:w-auto px-1 sm:pl-2 sm:pr-1 animate-in slide-in-from-top-1 sm:slide-in-from-left-2 duration-200">
            {/* Pembatas vertikal estetik (Hanya muncul di layar laptop desktop) */}
            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block shrink-0"></div>
            
            {/* 🚀 JALUR FLUID KOLOM: Dropdown sejajar horizontal penuh di layar HP */}
            <div className="flex gap-2 w-full sm:w-auto items-center">
              
              {/* DROPDOWN PILIHAN BULAN */}
              <div className="relative flex-1 sm:flex-none min-w-0">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))} 
                  className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl px-3.5 py-2.5 pr-8 text-[10px] sm:text-xs font-black uppercase text-[#0047AB] outline-none cursor-pointer appearance-none transition-all truncate"
                >
                  {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#0047AB] pointer-events-none shrink-0" />
              </div>

              {/* DROPDOWN PILIHAN TAHUN */}
              <div className="relative flex-1 sm:flex-none min-w-0">
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))} 
                  className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl px-3.5 py-2.5 pr-8 text-[10px] sm:text-xs font-black uppercase text-[#0047AB] outline-none cursor-pointer appearance-none transition-all truncate"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#0047AB] pointer-events-none shrink-0" />
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}