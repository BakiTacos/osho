import React from 'react';
import { Info, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function StatCard({ title, value, icon, color, trend, isUp, subtitle, highlight }: any) {
  // Ditambahkan warna orange dan slate untuk mendukung visualisasi OPEX & Offline
  const colors: any = {
    blue: "bg-blue-50 text-[#0047AB] border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-500 border-red-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    slate: "bg-slate-50 text-slate-500 border-slate-150"
  };

  // Default fallback jika warna tidak terdefinisi
  const activeColorClass = colors[color] || colors.blue;

  return (
    <div className={`bg-white p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border ${
      highlight ? 'border-[#0047AB]/20 shadow-md ring-1 ring-[#0047AB]/5' : 'border-slate-100 shadow-sm'
    } relative group overflow-hidden transition-all duration-300`}>
      
      {/* BAGIAN ATAS CARD */}
      <div className="flex justify-between items-start mb-3 sm:mb-6">
        <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${activeColorClass} shadow-sm`}>
          {React.cloneElement(icon, { size: typeof window !== 'undefined' && window.innerWidth < 640 ? 16 : 20 })}
        </div>
        <button className="p-1 text-slate-300 hover:text-slate-500 transition-colors">
          <Info size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>
      
      {/* TITLE & VALUE */}
      <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-0.5 sm:mb-1">
        {title}
      </p>
      <h3 className={`text-base sm:text-2xl font-black ${highlight ? 'text-[#0047AB]' : 'text-[#0F172A]'} tracking-tighter mb-2 sm:mb-4 truncate`}>
        {value}
      </h3>
      
      {/* TREND & SUBTITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-black ${
            isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {isUp ? <ArrowUpRight size={10} className="sm:w-3 sm:h-3" /> : <ArrowDownRight size={10} className="sm:w-3 sm:h-3" />}{trend}
          </div>
          <span className="text-[7px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-wider italic">
            vs bln lalu
          </span>
        </div>
        {subtitle && (
          <span className="text-[7px] sm:text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded uppercase tracking-tighter w-max">
            {subtitle}
          </span>
        )}
      </div>

      {/* HOVER BOTTOM PROGRESS LINE */}
      <div className={`absolute bottom-0 left-0 h-1 transition-all duration-300 group-hover:w-full w-0 ${
        isUp ? 'bg-emerald-500' : 'bg-red-500'
      }`}></div>

    </div>
  );
}