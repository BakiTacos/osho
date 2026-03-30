"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../lib/firebase"; 
import { useAuth } from "../context/AuthContext";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { 
  Search, Bell, HelpCircle, Plus, ShoppingBag, 
  Wallet, Box, TrendingUp, AlertCircle, Calendar
} from "lucide-react";

// --- KOMPONEN TOOLTIP KUSTOM ---
const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <span className="group relative inline-flex items-center">
    {children}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
      <span className="relative w-max max-w-[180px] bg-[#0F172A] text-white text-[10px] font-medium py-1.5 px-3 rounded-lg shadow-2xl text-center leading-relaxed">
        {text}
      </span>
      <span className="w-2.5 h-2.5 bg-[#0F172A] rotate-45 -mt-1.5"></span>
    </span>
  </span>
);

export default function Home() {
  const { currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('id-ID', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState("2026");

  // State Data Real-time
  const [stats, setStats] = useState({ omset: 0, modal: 0, profit: 0, stokKritis: 0 });
  const [marketplaceData, setMarketplaceData] = useState({ Shopee: 0, Tiktok: 0, Lazada: 0, Offline: 0 });
  const [loading, setLoading] = useState(true);

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = ["2024", "2025", "2026"];

  useEffect(() => {
    if (!currentUser) return;

    // 1. Ambil Data Produk (Stok Kritis)
    const qProd = query(collection(db, `users/${currentUser.uid}/products`));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const products = snapshot.docs.map(doc => doc.data());
      const kritis = products.filter(p => p.stock <= 10).length;
      setStats(prev => ({ ...prev, stokKritis: kritis }));
    });

    // 2. Ambil Data Penjualan (Omset & Modal)
    const qSales = query(collection(db, `users/${currentUser.uid}/sales`), orderBy("createdAt", "desc"));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const sales = snapshot.docs.map(doc => doc.data());
      
      // Filter berdasarkan bulan & tahun terpilih
      const filteredSales = sales.filter(s => {
        if (!s.createdAt) return false;
        const date = s.createdAt.toDate();
        const monthName = date.toLocaleString('id-ID', { month: 'long' });
        const yearName = date.getFullYear().toString();
        return monthName === selectedMonth && yearName === selectedYear && s.status !== 'Retur';
      });

      // Kalkulasi Ringkasan
      let totalOmset = 0;
      let totalModal = 0;
      let mpCounts: any = { Shopee: 0, Tiktok: 0, Lazada: 0, Offline: 0 };

      filteredSales.forEach(s => {
        totalOmset += s.total || 0;
        totalModal += s.hpp || 0;
        
        // Hitung proporsi marketplace
        const source = s.marketplace || 'Offline';
        if (mpCounts[source] !== undefined) {
          mpCounts[source] += s.total || 0;
        }
      });

      setStats(prev => ({ ...prev, omset: totalOmset, modal: totalModal, profit: totalOmset - totalModal }));
      setMarketplaceData(mpCounts);
      setLoading(false);
    });

    return () => { unsubProd(); unsubSales(); };
  }, [currentUser, selectedMonth, selectedYear]);

  // Hitung persentase untuk Donut Chart sederhana
  const totalGmv = Object.values(marketplaceData).reduce((a, b) => a + b, 0);
  const getPercentage = (val: number) => totalGmv === 0 ? "0%" : `${((val / totalGmv) * 100).toFixed(0)}%`;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-4">
        <div className="relative flex-1 lg:flex-none lg:w-96 ml-16 lg:ml-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input type="text" placeholder="Cari analisis..." className="w-full bg-[#EDF2F7] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#0047AB]" />
        </div>
        <div className="flex items-center space-x-3 sm:space-x-6 text-[#64748B]">
          <div className="hidden sm:flex items-center space-x-4"><Bell size={20}/><HelpCircle size={20}/></div>
          <div className="flex items-center space-x-3 border-l border-[#E2E8F0] pl-3 sm:pl-6">
            <span className="hidden md:block text-sm font-bold text-[#0F172A] uppercase">Kia</span>
            <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center text-xs font-black shadow-lg">K</div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="px-4 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-[42px] font-black text-[#0F172A] tracking-tighter">Dasbor</h2>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Data periode {selectedMonth} {selectedYear}</p>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="flex-1 sm:flex-none bg-white border border-[#E2E8F0] px-4 py-2 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#0047AB]">
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="flex-1 sm:flex-none bg-white border border-[#E2E8F0] px-4 py-2 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#0047AB]">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="px-4 sm:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Omset */}
        <div className="bg-white p-7 rounded-[28px] shadow-sm border border-[#F1F5F9] relative overflow-hidden group">
          <div className="flex justify-between items-start mb-8">
            <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><ShoppingBag size={24} /></div>
            <div className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">LIVE DATA</div>
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-1">Total Omset</p>
          <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">Rp {stats.omset.toLocaleString('id-ID')}</h3>
          <div className="absolute bottom-0 left-0 w-full h-[6px] bg-[#0047AB]"></div>
        </div>

        {/* Modal */}
        <div className="bg-white p-7 rounded-[28px] shadow-sm border border-[#F1F5F9] relative overflow-hidden group">
          <div className="flex justify-between items-start mb-8">
            <div className="p-3 bg-slate-50 text-[#64748B] rounded-2xl"><Wallet size={24} /></div>
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-1">Total Modal (HPP)</p>
          <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">Rp {stats.modal.toLocaleString('id-ID')}</h3>
          <div className="absolute bottom-0 left-0 w-full h-[6px] bg-slate-200"></div>
        </div>

        {/* Stok Kritis */}
        <div className="bg-white p-7 rounded-[28px] shadow-sm border border-[#F1F5F9] relative overflow-hidden group md:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start mb-8">
            <div className="p-3 bg-[#FFF1F2] text-[#E11D48] rounded-2xl"><Box size={24} /></div>
            {stats.stokKritis > 0 && (
               <div className="animate-pulse flex items-center space-x-1 text-[#E11D48] bg-[#FFF1F2] px-2.5 py-1 rounded-lg text-[10px] font-black">
                 <AlertCircle size={14} /> <span>PERLU RESTOCK</span>
               </div>
            )}
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-1">Stok Kritis (≤10)</p>
          <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{stats.stokKritis} SKU</h3>
          <div className="absolute bottom-0 left-0 w-full h-[6px] bg-[#E11D48]"></div>
        </div>
      </div>

      {/* CHART & MARKETPLACE SECTION */}
      <div className="px-4 sm:px-10 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ringkasan Performa (Proyeksi Visual) */}
        <div className="lg:col-span-2 bg-white p-8 sm:p-10 rounded-[32px] border border-[#F1F5F9] shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-xl font-black text-[#0F172A] tracking-tight">Perbandingan Kas</h4>
              <p className="text-xs font-bold text-[#94A3B8] uppercase mt-1">Omset vs Modal {selectedMonth}</p>
            </div>
            <div className="flex space-x-4">
               <div className="flex items-center space-x-2 text-[10px] font-black text-[#64748B] uppercase">
                 <div className="w-2 h-2 rounded-full bg-[#0047AB]"></div> <span>Omset</span>
               </div>
               <div className="flex items-center space-x-2 text-[10px] font-black text-[#64748B] uppercase">
                 <div className="w-2 h-2 rounded-full bg-slate-200"></div> <span>Modal</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-48 gap-4">
             {/* Simple bar visualizer */}
             <div className="flex-1 flex flex-col items-center group">
                <div className="w-full flex flex-col justify-end gap-1 h-full">
                  <div style={{ height: '100%' }} className="w-full bg-[#0047AB] rounded-t-xl shadow-lg shadow-blue-100"></div>
                  <div style={{ height: `${(stats.modal/stats.omset)*100}%` }} className="w-full bg-slate-100 rounded-t-md"></div>
                </div>
                <span className="text-[10px] font-black text-[#0F172A] mt-4 uppercase">Akumulasi</span>
             </div>
             {/* Teks Penjelas */}
             <div className="flex-[2] bg-slate-50 rounded-3xl p-6 flex flex-col justify-center">
                <p className="text-xs font-bold text-[#64748B] leading-relaxed">
                  Berdasarkan data {selectedMonth}, Anda menghasilkan profit bersih sebesar 
                  <span className="text-[#0047AB] ml-1 font-black">Rp {stats.profit.toLocaleString('id-ID')}</span>.
                </p>
                <div className="mt-4 flex items-center text-emerald-500 font-black text-xl">
                   <TrendingUp size={20} className="mr-2"/> 
                   {stats.omset > 0 ? ((stats.profit / stats.omset) * 100).toFixed(1) : 0}% <span className="text-[10px] text-slate-400 ml-2 uppercase">Margin</span>
                </div>
             </div>
          </div>
        </div>

        {/* Proporsi Marketplace Real-time */}
        <div className="bg-white p-8 sm:p-10 rounded-[32px] border border-[#F1F5F9] shadow-sm flex flex-col">
          <h4 className="text-xl font-black text-[#0F172A] tracking-tight mb-8">Marketplace GMV</h4>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 border-[16px] border-[#0047AB] rounded-full flex flex-col items-center justify-center shadow-inner group transition-all">
               <span className="text-2xl font-black text-[#0F172A]">Rp {(totalGmv / 1000000).toFixed(1)}M</span>
               <span className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-[0.2em]">Total GMV</span>
            </div>

            <div className="w-full mt-10 space-y-4">
              {[
                { name: "Shopee", val: marketplaceData.Shopee, color: "bg-[#0047AB]" },
                { name: "Tiktok", val: marketplaceData.Tiktok, color: "bg-black" },
                { name: "Lazada", val: marketplaceData.Lazada, color: "bg-blue-400" },
                { name: "Offline", val: marketplaceData.Offline, color: "bg-slate-300" }
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${m.color}`}></div>
                    <span className="text-xs font-bold text-[#64748B]">{m.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#0F172A]">{getPercentage(m.val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        select { -webkit-appearance: none; appearance: none; }
      `}</style>
    </div>
  );
}