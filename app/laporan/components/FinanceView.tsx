// app/inventaris/laporan/components/FinanceView.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Info, PieChart as PieIcon, BarChart3, Wallet } from 'lucide-react';

interface FinanceViewProps {
  summary: any;
  chartData: any[];
  deepDetail: any;
}

const COLORS = ['#0047AB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

export const FinanceView = ({ summary, chartData, deepDetail }: FinanceViewProps) => {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  const chartInsight = useMemo(() => {
    if (chartData.length === 0) return "Belum ada data penjualan tercatat bulan ini.";
    if (summary.totalOmset === 0) return "Aktivitas niaga ruko terpantau landai.";
    if (summary.netProfit > summary.totalOpex) {
      return `Tren Positif: Keuntungan bersih bulan ini berhasil mengungguli seluruh pengeluaran operasional Anda. Pertahankan ritme jualan SKU terlaris!`;
    }
    return `Perhatian Gudang: Rasio pengeluaran operasional tergolong tinggi. Pertimbangkan menekan biaya operasional.`;
  }, [chartData, summary]);

  const totalOpexValue = useMemo(() => {
    return deepDetail.opexChartData.reduce((acc: number, curr: any) => acc + curr.value, 0);
  }, [deepDetail.opexChartData]);

  // 🚀 KUNCI PERBAIKAN: Mengurutkan data anggaran OPEX dari yang paling besar ke terkecil
  const sortedOpexData = useMemo(() => {
    if (!deepDetail.opexChartData) return [];
    return [...deepDetail.opexChartData].sort((a, b) => b.value - a.value);
  }, [deepDetail.opexChartData]);

  return (
    <div className="mt-6 space-y-6 animate-in fade-in duration-300 w-full">
      
      {/* ======================================================= */}
      {/* 📱 BARIS 1: 3 KARTU FINANSIAL UTAMA SEJAJAR DI MOBILE      */}
      {/* ======================================================= */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
        {/* KARTU 1: OMSET */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Omset</p>
          <h3 className="text-[10px] sm:text-xs md:text-lg lg:text-xl font-black text-emerald-600 truncate mt-1">
            Rp {Math.round(summary.totalOmset).toLocaleString('id-ID')}
          </h3>
        </div>

        {/* KARTU 2: LABA KOTOR */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Laba Kotor</p>
          <h3 className="text-[10px] sm:text-xs md:text-lg lg:text-xl font-black text-[#0047AB] truncate mt-1">
            Rp {Math.round(summary.grossProfit).toLocaleString('id-ID')}
          </h3>
        </div>

        {/* KARTU 3: OPEX */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Operasional</p>
          <h3 className="text-[10px] sm:text-xs md:text-lg lg:text-xl font-black text-red-600 truncate mt-1">
            Rp {Math.round(summary.totalOpex).toLocaleString('id-ID')}
          </h3>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 👑 BARIS 1.5: KARTU LABA BERSIH (WARNA DISERAGAMKAN PUTIH BERSIH) */}
      {/* ======================================================= */}
      <div className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${summary.netProfit > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            <Wallet size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Sisa Keuntungan Bersih (Laba Bersih)</p>
            <h2 className={`text-base sm:text-2xl font-black tracking-tight mt-0.5 ${summary.netProfit > 0 ? "text-emerald-600" : "text-red-500"}`}>
              Rp {Math.round(summary.netProfit).toLocaleString('id-ID')}
            </h2>
          </div>
        </div>
        <span className={`text-[8px] sm:text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
          summary.netProfit > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
        }`}>
          {summary.netProfit > 0 ? "Untung" : "Rugi"}
        </span>
      </div>

      {/* ======================================================= */}
      {/* 📊 BARIS 2: BENTANG GRAFIK HARIAN (LEBAR PENUH)           */}
      {/* ======================================================= */}
      <div className="bg-white p-4 sm:p-6 rounded-[28px] border border-slate-100 shadow-xs w-full">
        <div className="mb-4 flex justify-between items-start sm:items-center">
          <div>
            <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 size={14} className="text-[#0047AB]" />
              <span>Tren Performa Harian</span>
            </h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Komparasi nilai omset harian ruko dengan keuntungan kotor jualan</p>
          </div>
          <span className="lg:hidden text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-wider animate-pulse">
            👈 Geser Grafik
          </span>
        </div>
        
        <div className="w-full overflow-x-auto no-scrollbar mt-4">
          <div className="h-64 sm:h-80 w-[720px] lg:w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`]} labelFormatter={(label) => `Tanggal: ${label}`} contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '11px', fontWeight: 'bold' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} />
                  <Bar dataKey="pemasukan" name="Omset" fill="#0047AB" radius={[3, 3, 0, 0]} maxBarSize={12} />
                  <Bar dataKey="laba" name="Profit" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-[#F0F7FF] rounded-2xl border border-blue-100 flex gap-3 items-start">
          <Info className="text-[#0047AB] shrink-0 mt-0.5" size={15} />
          <p className="text-[10px] font-bold text-blue-700 leading-normal uppercase tracking-wide">
            {chartInsight}
          </p>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 🍩 BARIS 3: DIAGRAM LINGKARAN OPERASIONAL INTERAKTIF       */}
      {/* ======================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-100 shadow-xs w-full">
        <div className="flex items-center gap-2 mb-2 border-b border-slate-50 pb-2">
          <PieIcon size={15} className="text-[#0047AB]" />
          <div>
            <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Porsi Anggaran Pengeluaran Operasional</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Rincian pembagian dana operasional ruko urut dari pengeluaran terbesar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-4">
          
          {/* Sisi Kiri: Chart Donat Interaktif */}
          <div className="md:col-span-5 h-52 sm:h-60 w-full relative flex items-center justify-center">
            {mounted && sortedOpexData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={sortedOpexData} 
                      innerRadius={65} 
                      outerRadius={85} 
                      paddingAngle={3} 
                      dataKey="value"
                      animationDuration={450}
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {sortedOpexData.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          className="outline-none transition-all duration-200"
                          style={{
                            transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)',
                            transformOrigin: 'center',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none uppercase">
                  <span className="text-[9px] font-black text-slate-400 tracking-wider">
                    {activeIndex !== null ? sortedOpexData[activeIndex].name : "Total Operasional"}
                  </span>
                  <span className="text-sm font-black text-[#0F172A] mt-0.5">
                    {activeIndex !== null 
                      ? `${((sortedOpexData[activeIndex].value / (totalOpexValue || 1)) * 100).toFixed(0)}%`
                      : `100%`
                    }
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center text-[9px] font-black text-slate-400 uppercase">Tidak ada biaya operasional</div>
            )}
          </div>

          {/* Sisi Kanan: Daftar Urutan Biaya Terbesar Teratas (Sorted Legenda) */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {sortedOpexData.map((item: any, i: number) => {
              const percentage = totalOpexValue > 0 ? (item.value / totalOpexValue) * 100 : 0;
              const isHovered = activeIndex === i;

              return (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
                    isHovered 
                      ? "bg-slate-50/80 border-[#0047AB] scale-[1.01]" 
                      : "bg-[#F8F9FB]/50 border-slate-100 hover:bg-slate-50/50"
                  }`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center gap-2 max-w-[70%]">
                    {/* Index warna disesuaikan dengan urutan aslinya agar sinkron dengan irisan pie chart */}
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-[#0F172A] uppercase truncate">{item.name}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{percentage.toFixed(0)}% Porsi Kas</span>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-black text-[#0F172A] text-right shrink-0">
                    Rp {item.value.toLocaleString('id-ID')}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

    </div>
  );
};