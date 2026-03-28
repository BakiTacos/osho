"use client";

import React, { useState } from 'react';
import { 
  Search, Bell, HelpCircle, Plus, ShoppingBag, 
  Wallet, Box, TrendingUp, AlertCircle, Menu
} from "lucide-react";

// --- KOMPONEN TOOLTIP KUSTOM ---
const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <span className="group relative inline-flex items-center">
    {children}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
      <span className="relative w-max max-w-[180px] sm:max-w-[200px] bg-[#0F172A] text-white text-[10px] font-medium py-1.5 px-3 rounded-lg shadow-2xl text-center leading-relaxed">
        {text}
      </span>
      <span className="w-2.5 h-2.5 bg-[#0F172A] rotate-45 -mt-1.5"></span>
    </span>
  </span>
);

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState("Maret");
  const [selectedYear, setSelectedYear] = useState("2026");

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = ["2024", "2025", "2026"];

  return (
    /* 
      PERBAIKAN RESPONSIVE: 
      - ml-0 (Mobile), lg:ml-72 (Desktop) 
      - p-4 (Mobile), sm:p-10 (Desktop)
    */
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300">
      
      {/* --- KONTROL ATAS --- */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
          <input 
            type="text" 
            placeholder="Cari analisis..." 
            className="w-full bg-[#EDF2F7] border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#0047AB] transition-all"
          />
        </div>
        
        {/* Icons & Profile */}
        <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-5 text-[#64748B]">
          <div className="flex items-center space-x-5">
            <button className="hover:text-[#0F172A]"><Bell size={22} /></button>
            <button className="hover:text-[#0F172A]"><HelpCircle size={22} /></button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block h-8 w-[1px] bg-[#E2E8F0]"></div>
            <span className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">Kia</span>
            {/* Avatar hanya muncul di mobile sebagai indikator profil */}
            <div className="sm:hidden w-8 h-8 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-[10px] font-bold">K</div>
          </div>
        </div>
      </div>

      {/* --- HEADER DASBOR --- */}
      <div className="px-4 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8">
        <p className="text-[10px] sm:text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.25em] mb-1">Dasbor Penjualan</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-3xl sm:text-[42px] font-black text-[#0F172A] tracking-tighter leading-none">Dasbor</h2>
          
          {/* Dropdowns */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-white border border-[#E2E8F0] px-4 sm:px-5 py-2 sm:py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-[#0047AB] cursor-pointer"
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
            </div>

            <div className="relative flex-1 sm:flex-none">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none bg-white border border-[#E2E8F0] px-4 sm:px-5 py-2 sm:py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-[#0047AB] cursor-pointer"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- GRID KARTU STATISTIK --- */}
      <div className="px-4 sm:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Omset */}
        <div className="bg-white p-6 sm:p-7 rounded-[24px] shadow-sm border border-[#F1F5F9] relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
            <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><ShoppingBag size={24} /></div>
            <div className="flex items-center space-x-1 text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black">
              <TrendingUp size={14} /> <span>+12.4%</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-1 flex items-center">
            Total Omset Penjualan 
            <Tooltip text="Akumulasi pendapatan kotor dari semua channel marketplace.">
              <HelpCircle size={12} className="ml-1 opacity-30 cursor-help" />
            </Tooltip>
          </div>
          <h3 className="text-2xl sm:text-[34px] font-black text-[#0F172A] tracking-tight truncate">Rp 428.590.000</h3>
          <div className="absolute bottom-0 left-0 w-full h-[6px] bg-[#0047AB]"></div>
        </div>

        {/* Modal */}
        <div className="bg-white p-6 sm:p-7 rounded-[24px] shadow-sm border border-[#F1F5F9] relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
            <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><Wallet size={24} /></div>
            <div className="flex items-center space-x-1 text-[#0047AB] bg-[#F0F7FF] px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black">
              <TrendingUp size={14} /> <span>+8.2%</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-1 flex items-center">
            Total Modal Keluar 
            <Tooltip text="Total biaya HPP dan biaya operasional yang dikeluarkan.">
              <HelpCircle size={12} className="ml-1 opacity-30 cursor-help" />
            </Tooltip>
          </div>
          <h3 className="text-2xl sm:text-[34px] font-black text-[#0F172A] tracking-tight truncate">Rp 328.590.000</h3>
          <div className="absolute bottom-0 left-8 w-24 h-[6px] bg-[#0047AB] rounded-t-full"></div>
        </div>

        {/* Stok */}
        <div className="bg-white p-6 sm:p-7 rounded-[24px] shadow-sm border border-[#F1F5F9] relative overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
            <div className="p-3 bg-[#FFF1F2] text-[#E11D48] rounded-2xl"><Box size={24} /></div>
            <div className="flex items-center space-x-1 text-[#E11D48] bg-[#FFF1F2] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-black tracking-tighter">
              <AlertCircle size={14} /> <span>STOK RENDAH</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-1 flex items-center">
            Stok Kritis 
            <Tooltip text="Jumlah SKU yang berada di bawah batas minimum stok aman.">
              <HelpCircle size={12} className="ml-1 opacity-30 cursor-help" />
            </Tooltip>
          </div>
          <h3 className="text-2xl sm:text-[34px] font-black text-[#0F172A] tracking-tight">24 SKU</h3>
          <div className="absolute bottom-0 left-8 w-12 h-[6px] bg-[#E11D48] rounded-t-full"></div>
        </div>
      </div>

      {/* --- BAGIAN BAWAH: GRAFIK & PROPORSI --- */}
      <div className="px-4 sm:px-10 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Proyeksi Penjualan */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-10 rounded-[28px] border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-10">
            <div>
              <h4 className="text-lg sm:text-xl font-black text-[#0F172A] flex items-center tracking-tight">
                Proyeksi Penjualan 
                <Tooltip text="Estimasi perbandingan arus kas masuk dan keluar.">
                  <HelpCircle size={16} className="ml-2 opacity-20 cursor-help" />
                </Tooltip>
              </h4>
              <div className="text-[10px] sm:text-xs font-medium text-[#94A3B8] mt-1 uppercase tracking-wider">Pemasok vs Arus Kas</div>
            </div>
            {/* Legend */}
            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2 text-[10px] font-black text-[#64748B] uppercase">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#0047AB]"></div> <span>Modal</span>
               </div>
               <div className="flex items-center space-x-2 text-[10px] font-black text-[#64748B] uppercase">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]"></div> <span>Penjualan</span>
               </div>
            </div>
          </div>
          
          {/* Scrollable Chart on Mobile */}
          <div className="overflow-x-auto pb-4 sm:pb-0">
            <div className="flex items-end justify-between h-48 sm:h-56 min-w-[450px] sm:min-w-0 space-x-2 sm:space-x-4">
              {[
                {day: 'SEN', m: 50, p: 90}, {day: 'SEL', m: 70, p: 100}, 
                {day: 'RAB', m: 45, p: 80}, {day: 'KAM', m: 65, p: 90}, 
                {day: 'JUM', m: 60, p: 95}, {day: 'SAB', m: 35, p: 65}, 
                {day: 'MIN', m: 30, p: 55}
              ].map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center group">
                  <Tooltip text={`M: ${bar.m}% | P: ${bar.p}%`}>
                    <div className="w-10 sm:w-12 relative h-40 sm:h-48 flex flex-col justify-end cursor-pointer">
                      <div style={{height: `${bar.p}%`}} className="w-full bg-[#F1F5F9] rounded-t-md transition-all group-hover:bg-[#E2E8F0] z-10"></div>
                      <div style={{height: `${bar.m}%`}} className="w-full bg-[#0047AB] rounded-t-md absolute bottom-0 left-0 z-20 shadow-[0_-4px_10px_rgba(0,71,171,0.2)]"></div>
                    </div>
                  </Tooltip>
                  <span className="text-[10px] sm:text-[11px] font-black text-[#94A3B8] mt-4 sm:mt-6 tracking-widest">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proporsi Marketplace */}
        <div className="bg-white p-6 sm:p-10 rounded-[28px] border border-[#F1F5F9] shadow-sm">
          <h4 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight mb-8 sm:mb-10 flex items-center">
            Proporsi Marketplace 
            <Tooltip text="Distribusi Gross Merchandise Value per platform.">
              <HelpCircle size={16} className="ml-2 opacity-20 cursor-help" />
            </Tooltip>
          </h4>
          
          <div className="flex flex-col items-center">
            <Tooltip text="Total GMV Rp 2.400.000.000">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 border-[12px] sm:border-[16px] border-[#0047AB] rounded-full flex flex-col items-center justify-center shadow-inner cursor-pointer hover:scale-105 transition-transform">
                <p className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tighter">Rp 2.4B</p>
                <p className="text-[8px] sm:text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">GMV</p>
              </div>
            </Tooltip>

            <div className="w-full mt-8 sm:mt-10 space-y-3 sm:space-y-4">
              {[
                {name: "Shopee", val: "45%", color: "bg-[#0047AB]"},
                {name: "TikTok Shop", val: "32%", color: "bg-[#BFDBFE]"},
                {name: "Lazada", val: "23%", color: "bg-[#1E293B]"},
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${m.color}`}></div>
                    <span className="text-xs font-bold text-[#64748B] group-hover:text-[#0F172A] transition-colors">{m.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#0F172A]">{m.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAB - Adjusted size for mobile */}
      <button className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 w-14 h-14 sm:w-16 sm:h-16 bg-[#0047AB] text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-all z-30 active:scale-95">
        <Plus 
          className="w-6 h-6 sm:w-[30px] sm:h-[30px]" 
          strokeWidth={3} 
        />
      </button>

      <style jsx>{`
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        /* Custom scrollbar for mobile chart */
        .overflow-x-auto::-webkit-scrollbar {
          height: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}