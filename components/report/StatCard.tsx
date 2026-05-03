import React from 'react';
import { Info, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function StatCard({ title, value, icon, color, trend, isUp, subtitle, highlight }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-[#0047AB] border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-500 border-red-100"
  };

  return (
    <div className={`bg-white p-8 rounded-[32px] border ${highlight ? 'border-[#0047AB]/20 shadow-md ring-1 ring-[#0047AB]/5' : 'border-slate-100 shadow-sm'} relative group overflow-hidden`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colors[color]} shadow-sm`}>{icon}</div>
        <button className="p-1 text-slate-300 hover:text-slate-500 transition-colors"><Info size={16} /></button>
      </div>
      
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className={`text-2xl font-black ${highlight ? 'text-[#0047AB]' : 'text-[#0F172A]'} tracking-tighter mb-4`}>{value}</h3>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{trend}
          </div>
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">vs bln lalu</span>
        </div>
        {subtitle && <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-tighter">{subtitle}</span>}
      </div>
      <div className={`absolute bottom-0 left-0 h-1 transition-all group-hover:w-full w-0 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
    </div>
  );
}