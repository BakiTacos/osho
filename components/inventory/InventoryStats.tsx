import React from 'react';
import { Package, AlertTriangle, Slash, HelpCircle } from "lucide-react";

export const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <span className="group relative inline-flex items-center">
    {children}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-[100] pointer-events-none">
      <span className="relative w-max max-w-[200px] bg-[#0F172A] text-white text-[10px] font-medium py-1.5 px-3 rounded-lg shadow-2xl text-center leading-relaxed whitespace-nowrap">
        {text}
      </span>
      <span className="w-2.5 h-2.5 bg-[#0F172A] rotate-45 -mt-1.5"></span>
    </span>
  </span>
);

export const InventoryStats = ({ totalProducts, lowStockCount, outOfStockCount }: any) => (
  <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-white p-7 rounded-[28px] border border-[#F1F5F9] shadow-sm relative">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><Package size={22} /></div>
        <Tooltip text="Total variasi produk terdaftar."><HelpCircle size={14} className="opacity-20 cursor-help" /></Tooltip>
      </div>
      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Total SKU</p>
      <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{totalProducts}</h3>
      <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-[#0047AB] rounded-tr-full rounded-bl-[28px]"></div>
    </div>

    <div className="bg-white p-7 rounded-[28px] border border-[#F1F5F9] shadow-sm relative">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-[#FFF1F2] text-[#E11D48] rounded-2xl"><AlertTriangle size={22} /></div>
        <Tooltip text="Stok menipis (di bawah 10 unit)."><HelpCircle size={14} className="opacity-20 cursor-help" /></Tooltip>
      </div>
      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Stok Rendah</p>
      <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{lowStockCount}</h3>
      <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-[#E11D48] rounded-tr-full rounded-bl-[28px]"></div>
    </div>

    <div className="bg-white p-7 rounded-[28px] border border-[#F1F5F9] shadow-sm relative">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl"><Slash size={22} /></div>
        <Tooltip text="Produk yang stoknya benar-benar habis."><HelpCircle size={14} className="opacity-20 cursor-help" /></Tooltip>
      </div>
      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Kosong</p>
      <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{outOfStockCount}</h3>
      <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-slate-200 rounded-tr-full rounded-bl-[28px]"></div>
    </div>
  </div>
);