import React from 'react';
import { TrendingDown } from "lucide-react";

interface ReturStatsProps {
  stats: { totalLoss: number; totalCases: number; processingCount: number; finalCount: number };
}

export const ReturStats = ({ stats }: ReturStatsProps) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    <div className="bg-white p-4 sm:p-6 rounded-[24px] border border-slate-100 shadow-xs border-l-4 border-l-red-500 flex flex-col justify-between">
      <div>
        <p className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 flex items-center"><TrendingDown size={12} className="mr-1 shrink-0"/> Kerugian Realita</p>
        <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A] truncate">Rp {stats.totalLoss.toLocaleString('id-ID')}</h3>
      </div>
      <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Termasuk Susut Gudang</p>
    </div>
    
    <div className="bg-white p-4 sm:p-6 rounded-[24px] border border-slate-100 shadow-xs flex flex-col justify-between">
      <div>
        <p className="text-[8px] sm:text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Kasus Retur</p>
        <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A]">{stats.totalCases} Kasus</h3>
      </div>
      <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Masuk ke Sistem</p>
    </div>

    <div className="bg-white p-4 sm:p-6 rounded-[24px] border border-slate-100 shadow-xs border-l-4 border-l-orange-400 flex flex-col justify-between">
      <div>
        <p className="text-[8px] sm:text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Masih Proses</p>
        <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A]">{stats.processingCount} Pesanan</h3>
      </div>
      <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Menunggu Keputusan</p>
    </div>

    <div className="bg-white p-4 sm:p-6 rounded-[24px] border border-slate-100 shadow-xs border-l-4 border-l-emerald-500 flex flex-col justify-between">
      <div>
        <p className="text-[8px] sm:text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Selesai/Final</p>
        <h3 className="text-sm sm:text-lg xl:text-xl font-black text-[#0F172A]">{stats.finalCount} Pesanan</h3>
      </div>
      <p className="text-[8px] sm:text-[10px] font-bold text-slate-300 mt-2">Data Ter-update</p>
    </div>
  </div>
);