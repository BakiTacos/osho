import React from 'react';
import { Plus, Check } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function SalesHeader({ onOpenManual }: { onOpenManual: () => void }) {
  const router = useRouter();

  return (
    <div className="px-4 sm:px-10 pt-8 flex flex-col xl:flex-row justify-between gap-6">
      <div>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-none">Penjualan</h1>
        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center italic uppercase tracking-widest">
          <Check size={12} className="mr-1 text-emerald-500" /> Multi-Product Input Ready
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={onOpenManual} 
          className="bg-white text-[#0047AB] border-2 border-[#0047AB] px-5 py-3 rounded-2xl font-black text-xs hover:bg-blue-50 transition-all flex items-center space-x-2"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Input Manual</span>
        </button>
        <button 
          onClick={() => router.push('/penjualan/advanced')} 
          className="bg-[#0047AB] text-white px-5 py-3 rounded-2xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center space-x-2"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Advance Shipment</span>
        </button>
      </div>
    </div>
  );
}