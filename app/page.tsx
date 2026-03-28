"use client";

import React, { useState } from 'react';
import { 
  Search, Bell, HelpCircle, Plus, ShoppingBag, 
  Wallet, Box, TrendingUp, AlertCircle 
} from "lucide-react";

// --- KOMPONEN TOOLTIP KUSTOM (Sudah diperbaiki agar tidak Hydration Error) ---
const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <span className="group relative inline-flex items-center">
    {children}
    {/* Perbaikan: Menambahkan left-1/2 dan -translate-x-1/2 untuk centering sempurna */}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
      <span className="relative w-max max-w-[200px] bg-[#0F172A] text-white text-[10px] font-medium py-1.5 px-3 rounded-lg shadow-2xl text-center leading-relaxed">
        {text}
      </span>
      {/* Segitiga Tooltip */}
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
    /* Menambahkan ml-72 agar konten bergeser ke kanan dan tidak tertutup Sidebar */
    <div className="text-[#1E293B] ml-72 min-h-screen bg-[#F8F9FB]">
      
      {/* Kontrol Atas */}
      <div className="px-10 pt-8 flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
          <input 
            type="text" 
            placeholder="Cari analisis..." 
            className="w-full bg-[#EDF2F7] border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#0047AB] transition-all"
          />
        </div>
        <div className="flex items-center space-x-5 text-[#64748B]">
          <button className="hover:text-[#0F172A]"><Bell size={22} /></button>
          <button className="hover:text-[#0F172A]"><HelpCircle size={22} /></button>
          <div className="h-8 w-[1px] bg-[#E2E8F0]"></div>
          <span className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">Kia</span>
        </div>
      </div>

      {/* Header Dasbor */}
      <div className="px-10 pt-10 pb-8">
        <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.25em] mb-1">Dasbor Penjualan</p>
        <div className="flex items-center justify-between">
          <h2 className="text-[42px] font-black text-[#0F172A] tracking-tighter">Dasbor</h2>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-white border border-[#E2E8F0] px-5 py-2.5 pr-10 rounded-xl text-sm font-bold shadow-sm hover:bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-[#0047AB] cursor-pointer"
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
            </div>

            <div className="relative">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-white border border-[#E2E8F0] px-5 py-2.5 pr-10 rounded-xl text-sm font-bold shadow-sm hover:bg-[#F8F9FB] focus:outline-none focus:ring-2 focus:ring-[#0047AB] cursor-pointer"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Kartu Statistik */}
      <div className="px-10 grid grid-cols-3 gap-8">
        {/* Omset */}
        <div className="bg-white p-7 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F1F5F9] relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><ShoppingBag size={24} /></div>
            <div className="flex items-center space-x-1 text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-lg text-[11px] font-black">
              <TrendingUp size={14} />
              <span>+12.4%</span>
            </div>
          </div>
          <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-1 flex items-center">
            Total Omset Penjualan 
            <Tooltip text="Akumulasi pendapatan kotor dari semua channel marketplace.">
              <HelpCircle size={12} className="ml-1 opacity-30 cursor-help" />
            </Tooltip>
          </div>
          <h3 className="text-[34px] font-black text-[#0F172A] tracking-tight">Rp 428.590.000</h3>
          <div className="absolute bottom-0 left-0 w-full h-[6px] bg-[#0047AB]"></div>
        </div>

        {/* Modal */}
        <div className="bg-white p-7 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F1F5F9] relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><Wallet size={24} /></div>
            <div className="flex items-center space-x-1 text-[#0047AB] bg-[#F0F7FF] px-2.5 py-1 rounded-lg text-[11px] font-black">
              <TrendingUp size={14} />
              <span>+8.2%</span>
            </div>
          </div>
          <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-1 flex items-center">
            Total Modal Keluar 
            <Tooltip text="Total biaya HPP dan biaya operasional yang dikeluarkan.">
              <HelpCircle size={12} className="ml-1 opacity-30 cursor-help" />
            </Tooltip>
          </div>
          <h3 className="text-[34px] font-black text-[#0F172A] tracking-tight">Rp 328.590.000</h3>
          <div className="absolute bottom-0 left-8 w-24 h-[6px] bg-[#0047AB] rounded-t-full"></div>
        </div>

        {/* Stok */}
        <div className="bg-white p-7 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F1F5F9] relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div className="p-3 bg-[#FFF1F2] text-[#E11D48] rounded-2xl"><Box size={24} /></div>
            <div className="flex items-center space-x-1 text-[#E11D48] bg-[#FFF1F2] px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter">
              <AlertCircle size={14} />
              <span>STOK RENDAH</span>
            </div>
          </div>
          <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-1 flex items-center">
            Stok Kritis 
            <Tooltip text="Jumlah SKU yang berada di bawah batas minimum stok aman.">
              <HelpCircle size={12} className="ml-1 opacity-30 cursor-help" />
            </Tooltip>
          </div>
          <h3 className="text-[34px] font-black text-[#0F172A] tracking-tight">24 SKU</h3>
          <div className="absolute bottom-0 left-8 w-12 h-[6px] bg-[#E11D48] rounded-t-full"></div>
        </div>
      </div>

      {/* Bagian Bawah: Grafik & Proporsi */}
      <div className="px-10 py-10 grid grid-cols-3 gap-8">
        <div className="col-span-2 bg-white p-10 rounded-[28px] border border-[#F1F5F9] shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-xl font-black text-[#0F172A] flex items-center tracking-tight">
                Proyeksi Penjualan 
                <Tooltip text="Estimasi perbandingan arus kas masuk dan keluar.">
                  <HelpCircle size={16} className="ml-2 opacity-20 cursor-help" />
                </Tooltip>
              </h4>
              <div className="text-xs font-medium text-[#94A3B8] mt-1">Pembayaran ke Pemasok vs Estimasi Arus Kas</div>
            </div>
            <div className="flex items-center space-x-6">
               <div className="flex items-center space-x-2 text-[11px] font-black text-[#64748B] uppercase tracking-wider">
                 <div className="w-3 h-3 rounded-full bg-[#0047AB]"></div> <span>Modal</span>
               </div>
               <div className="flex items-center space-x-2 text-[11px] font-black text-[#64748B] uppercase tracking-wider">
                 <div className="w-3 h-3 rounded-full bg-[#E2E8F0]"></div> <span>Penjualan</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-56 space-x-4">
            {[
              {day: 'SEN', m: 50, p: 90}, 
              {day: 'SEL', m: 70, p: 100}, 
              {day: 'RAB', m: 45, p: 80}, 
              {day: 'KAM', m: 65, p: 90}, 
              {day: 'JUM', m: 60, p: 95}, 
              {day: 'SAB', m: 35, p: 65}, 
              {day: 'MIN', m: 30, p: 55}
            ].map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center group">
                <Tooltip text={`M: ${bar.m}% | P: ${bar.p}%`}>
                  <div className="w-full relative h-48 w-12 flex flex-col justify-end cursor-pointer">
                    <div style={{height: `${bar.p}%`}} className="w-full bg-[#F1F5F9] rounded-t-md transition-all group-hover:bg-[#E2E8F0]"></div>
                    <div style={{height: `${bar.m}%`}} className="w-full bg-[#0047AB] rounded-t-md absolute bottom-0 shadow-[0_-4px_10px_rgba(0,71,171,0.2)]"></div>
                  </div>
                </Tooltip>
                <span className="text-[11px] font-black text-[#94A3B8] mt-6 tracking-widest">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[28px] border border-[#F1F5F9] shadow-sm">
          <h4 className="text-xl font-black text-[#0F172A] tracking-tight mb-10 flex items-center">
            Proporsi Marketplace 
            <Tooltip text="Distribusi Gross Merchandise Value per platform.">
              <HelpCircle size={16} className="ml-2 opacity-20 cursor-help" />
            </Tooltip>
          </h4>
          
          <div className="flex flex-col items-center">
            <Tooltip text="Total GMV Rp 2.400.000.000">
              <div className="relative w-44 h-44 border-[16px] border-[#0047AB] rounded-full flex flex-col items-center justify-center shadow-inner cursor-pointer hover:scale-105 transition-transform">
                <p className="text-2xl font-black text-[#0F172A] tracking-tighter">Rp 2.4B</p>
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Total GMV</p>
              </div>
            </Tooltip>

            <div className="w-full mt-10 space-y-4">
              {[
                {name: "Shopee", val: "45%", color: "bg-[#0047AB]"},
                {name: "TikTok Shop", val: "32%", color: "bg-[#BFDBFE]"},
                {name: "Lazada", val: "23%", color: "bg-[#1E293B]"},
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${m.color}`}></div>
                    <span className="text-xs font-bold text-[#64748B] group-hover:text-[#0F172A] transition-colors">{m.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#0F172A]">{m.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button className="fixed bottom-10 right-10 w-16 h-16 bg-[#0047AB] text-white rounded-2xl shadow-[0_15px_35px_rgba(0,71,171,0.3)] flex items-center justify-center hover:scale-105 transition-all active:scale-95 z-30 group">
        <Plus size={30} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
      </button>

      <style jsx>{`
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
      `}</style>
    </div>
  );
}