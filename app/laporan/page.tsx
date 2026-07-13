// app/inventaris/laporan/page.tsx
"use client";

import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

import { useReportData } from "./hooks/useReportData";
import { ReportService } from "../laporan/services/ReportService";

// 🚀 IMPORT BARU SEBAGAI BENTUK MODULAR MONOLITH BERKAS BERSIH
import { FinanceView } from "./components/FinanceView";
import { StockView } from "./components/StockView";

export default function LaporanPage() {
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState("Keuangan");
  const [timeRange, setTimeRange] = useState("Bulan + Tahun");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  

  const { sales, expenses, products, invoices, customerInvoices, loading } = useReportData(currentUser, selectedMonth, selectedYear);

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];

  const reportService = new ReportService(sales, expenses, products, invoices, customerInvoices, selectedMonth, selectedYear, timeRange);
  const deepDetail = reportService.getDeepFinancialDetail();

  const financialSummary = reportService.getFinancialSummary();
  const stockFinancials = reportService.getStockFinancials();
  const stockAnalyzerStats = reportService.getStockAnalyzerStats();
  
  // 🚀 SEKARANG MEMANGGIL DATA GRAFIK HARIAN PRESISI TANPA ISI BULAN KOSONG
  const chartData = reportService.getChartData();

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pt-8 sm:pt-10 pb-16">
      
      {/* HEADER ANALYSIS & SELECTOR FILTER KALENDER */}
      <div className="px-4 sm:px-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Analisis Performa Bisnis</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#0F172A] leading-none">Ringkasan Laporan</h1>
        </div>

        {/* INTEGRASI BAR FILTER RAPI */}
        <div className="flex flex-wrap items-center bg-white p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs gap-0.5 sm:gap-1 w-full md:w-auto">
          {["Bulan + Tahun", "3 Bulan Terakhir", "Tahun Ini"].map((opt) => (
            <button 
              key={opt} 
              type="button" 
              onClick={() => setTimeRange(opt)} 
              className={`flex-1 md:flex-none text-center px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all ${
                timeRange === opt ? "bg-[#0047AB] text-white shadow-xs" : "text-slate-400 hover:text-[#0047AB]"
              }`}
            >
              {opt}
            </button>
          ))}
          
          {timeRange === "Bulan + Tahun" && (
            <div className="flex items-center gap-1 w-full md:w-auto justify-center mt-1 md:mt-0 ml-0 md:ml-2 pl-0 md:pl-2 border-t md:border-t-0 md:border-l border-slate-100 pt-1 md:pt-0">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-slate-50 border-none rounded-lg text-[9px] sm:text-[10px] font-black uppercase px-2 py-1.5 text-[#0047AB] outline-none cursor-pointer">
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-slate-50 border-none rounded-lg text-[9px] sm:text-[10px] font-black uppercase px-2 py-1.5 text-[#0047AB] outline-none cursor-pointer">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* FILTER TAB SUB-MENU */}
      <div className="px-4 sm:px-10 mt-6 sm:mt-8 flex gap-8 border-b border-slate-200">
        {["Keuangan", "Stok"].map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`pb-3 sm:pb-4 text-xs sm:text-sm font-bold transition-all relative ${activeTab === tab ? "text-[#0047AB]" : "text-slate-400 hover:text-slate-600"}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0047AB]"></div>}
          </button>
        ))}
      </div>

      {/* DYNAMIC VIEWS WITH COMPACT LOADING SHIELD */}
      <div className="px-4 sm:px-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-2">
            <Loader2 className="animate-spin text-[#0047AB]" size={28} />
            <p className="text-[9px] font-black uppercase tracking-widest">Memetakan Kas Finansial...</p>
          </div>
        ) : activeTab === "Keuangan" ? (
          <FinanceView 
            summary={financialSummary} 
            chartData={chartData} 
            deepDetail={deepDetail} 
          />
        ) : (
          <StockView 
            stockStats={stockAnalyzerStats} 
            financials={stockFinancials} 
            products={products}
            sales={sales}
            currentMonthName={months[selectedMonth]} />
        )}
      </div>

    </div>
  );
}