"use client";

import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { Search, Bell, HelpCircle, PlusCircle } from "lucide-react";

// IMPORT CLEAN ARCHITECTURE
import { useReportData } from "../hooks/useReportData";
import { ReportService } from "../../lib/services/ReportService";
import { FinanceView, StockView } from "../../components/report/ReportViews";

export default function LaporanPage() {
  const { currentUser } = useAuth();
  
  // Custom Hook for Realtime Data
  const { sales, expenses, products, invoices } = useReportData(currentUser);

  // States for Filtering
  const [activeTab, setActiveTab] = useState("Keuangan");
  const [timeRange, setTimeRange] = useState("Bulan + Tahun");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];

  // Init OOP Service
  const reportService = new ReportService(sales, expenses, products, invoices, selectedMonth, selectedYear, timeRange);

  // Computed Data from Service
  const financialSummary = reportService.getFinancialSummary();
  const stockFinancials = reportService.getStockFinancials();
  const stockAnalyzerStats = reportService.getStockAnalyzerStats();
  const chartData = reportService.getChartData(months);

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* TOP NAV */}
      <div className="px-4 sm:px-10 pt-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-sm hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Cari analisis..." className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#0047AB]" />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Bell size={20} className="cursor-pointer hover:text-[#0047AB]" />
            <HelpCircle size={20} className="cursor-pointer hover:text-[#0047AB]" />
          </div>
          <div className="flex items-center gap-3 border-l pl-6">
            <div className="text-right hidden sm:block"><p className="text-xs font-black text-[#0F172A] leading-none">Kia</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Administrator</p></div>
            <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center font-black">K</div>
          </div>
        </div>
      </div>

      {/* HEADER ANALYSIS & FILTER */}
      <div className="px-4 sm:px-10 mt-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Analisis Performa Bisnis</p>
          <h1 className="text-3xl font-black tracking-tighter text-[#0F172A]">Ringkasan Laporan</h1>
        </div>

        <div className="flex flex-wrap items-center bg-white p-1 rounded-2xl border border-slate-100 shadow-sm gap-1">
          {["Bulan + Tahun", "3 Bulan Terakhir", "Tahun Ini"].map((opt) => (
            <button key={opt} onClick={() => setTimeRange(opt)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeRange === opt ? "bg-[#0047AB] text-white shadow-md" : "text-slate-400 hover:text-[#0047AB]"}`}>
              {opt}
            </button>
          ))}
          {timeRange === "Bulan + Tahun" && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-100">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase px-2 py-1.5 text-[#0047AB] outline-none cursor-pointer">
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase px-2 py-1.5 text-[#0047AB] outline-none cursor-pointer">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="px-4 sm:px-10 mt-8 flex gap-8 border-b border-slate-200">
        {["Keuangan", "Stok"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-sm font-bold transition-all relative ${activeTab === tab ? "text-[#0047AB]" : "text-slate-400 hover:text-slate-600"}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0047AB]"></div>}
          </button>
        ))}
      </div>

      {/* DYNAMIC VIEWS RENDERING */}
      {activeTab === "Keuangan" ? (
        <FinanceView summary={financialSummary} chartData={chartData} />
      ) : (
        <StockView stockStats={stockAnalyzerStats} financials={stockFinancials} currentMonthName={months[selectedMonth]} />
      )}

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#0047AB] text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <PlusCircle size={28} strokeWidth={2.5} />
      </button>

    </div>
  );
}