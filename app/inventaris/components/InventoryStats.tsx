import React from 'react';
import { Package, AlertTriangle, Slash, HelpCircle } from "lucide-react";

// 🚀 DESAIN TOOLTIP YANG AMAN UNTUK MOBILE (Mencegah Teks Terpotong di Layar Kecil)
export const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <span className="group relative inline-flex items-center">
    {children}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-[100] pointer-events-none">
      <span className="relative w-max max-w-[160px] sm:max-w-[200px] bg-[#0F172A] text-white text-[9px] sm:text-[10px] font-medium py-1.5 px-2.5 rounded-xl shadow-2xl text-center leading-relaxed whitespace-normal">
        {text}
      </span>
      <span className="w-2 h-2 bg-[#0F172A] rotate-45 -mt-1"></span>
    </span>
  </span>
);

export const InventoryStats = ({ totalProducts, lowStockCount, outOfStockCount }: any) => (
  // 🚀 UX FIX: Menggunakan grid-cols-3 pada mobile agar berjejer rapi ke samping, hemat ruang layar!
  <div className="px-4 sm:px-10 mt-6 grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-6">
    
    {/* KARTU 1: TOTAL VARIASI PRODUK */}
    <div className="bg-white p-3 sm:p-7 rounded-2xl sm:rounded-[28px] border border-[#F1F5F9] shadow-xs relative flex flex-col justify-between min-h-[90px] sm:min-h-[140px]">
      <div className="flex justify-between items-start">
        <div className="p-1.5 sm:p-3 bg-[#F0F7FF] text-[#0047AB] rounded-lg sm:rounded-2xl shrink-0">
          <Package className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <Tooltip text="Total seluruh variasi jenis barang yang terdaftar.">
          <HelpCircle size={12} className="opacity-20 cursor-help hidden sm:block" />
        </Tooltip>
      </div>
      <div className="mt-2 sm:mt-4">
        <p className="text-[8px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider mb-0.5">Total Produk</p>
        <h3 className="text-sm sm:text-3xl font-black text-[#0F172A] tracking-tight">{totalProducts} <span className="text-[9px] sm:text-xs font-bold text-slate-400">SKU</span></h3>
      </div>
      <div className="absolute bottom-0 left-0 w-8 sm:w-32 h-[4px] sm:h-[6px] bg-[#0047AB] rounded-tr-full rounded-bl-2xl sm:rounded-bl-[28px]"></div>
    </div>

    {/* KARTU 2: STOK SIKLUS KRITIS */}
    <div className="bg-white p-3 sm:p-7 rounded-2xl sm:rounded-[28px] border border-[#F1F5F9] shadow-xs relative flex flex-col justify-between min-h-[90px] sm:min-h-[140px]">
      <div className="flex justify-between items-start">
        <div className="p-1.5 sm:p-3 bg-[#FFF1F2] text-[#E11D48] rounded-lg sm:rounded-2xl shrink-0">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <Tooltip text="Jumlah produk dengan sisa stok kritis (di bawah 10 unit).">
          <HelpCircle size={12} className="opacity-20 cursor-help hidden sm:block" />
        </Tooltip>
      </div>
      <div className="mt-2 sm:mt-4">
        <p className="text-[8px] sm:text-[10px] font-black text-red-500 uppercase tracking-wider mb-0.5">Stok Tipis</p>
        <h3 className="text-sm sm:text-3xl font-black text-[#0F172A] tracking-tight">{lowStockCount} <span className="text-[9px] sm:text-xs font-bold text-slate-400">SKU</span></h3>
      </div>
      <div className="absolute bottom-0 left-0 w-8 sm:w-32 h-[4px] sm:h-[6px] bg-[#E11D48] rounded-tr-full rounded-bl-2xl sm:rounded-bl-[28px]"></div>
    </div>

    {/* KARTU 3: STOK BENAR-BENAR HABIS */}
    <div className="bg-white p-3 sm:p-7 rounded-2xl sm:rounded-[28px] border border-[#F1F5F9] shadow-xs relative flex flex-col justify-between min-h-[90px] sm:min-h-[140px]">
      <div className="flex justify-between items-start">
        <div className="p-1.5 sm:p-3 bg-slate-100 text-slate-400 rounded-lg sm:rounded-2xl shrink-0">
          <Slash className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <Tooltip text="Jumlah produk yang sisa stoknya benar-benar habis di gudang.">
          <HelpCircle size={12} className="opacity-20 cursor-help hidden sm:block" />
        </Tooltip>
      </div>
      <div className="mt-2 sm:mt-4">
        <p className="text-[8px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider mb-0.5">Stok Habis</p>
        <h3 className="text-sm sm:text-3xl font-black text-[#0F172A] tracking-tight">{outOfStockCount} <span className="text-[9px] sm:text-xs font-bold text-slate-400">SKU</span></h3>
      </div>
      <div className="absolute bottom-0 left-0 w-8 sm:w-32 h-[4px] sm:h-[6px] bg-slate-300 rounded-tr-full rounded-bl-2xl sm:rounded-bl-[28px]"></div>
    </div>

  </div>
);