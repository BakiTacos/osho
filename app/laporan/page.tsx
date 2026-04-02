"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { 
  Search, Bell, HelpCircle, Wallet, TrendingUp, TrendingDown, 
  Package, RefreshCcw, Calendar, ArrowUpRight, ArrowDownRight,
  PlusCircle, Info, Filter, BarChart3, Download, Banknote,
  PackageMinus,
  PackagePlus,
  BadgeDollarSign,
  Trophy,
  AlertTriangle
} from "lucide-react";
import { StockAnalyzer } from "../../lib/StockAnalyzer"; // Import class tadi
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, Cell 
} from 'recharts';

const ADMIN_PERCENT = 0.16;
const FIXED_FEE = 1250;

export default function LaporanPage() {
  const { currentUser } = useAuth();
  
  // Data States
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Filter States
  const [activeTab, setActiveTab] = useState("Keuangan");
  const [timeRange, setTimeRange] = useState("Bulan + Tahun");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];
  const [invoices, setInvoices] = useState<any[]>([]); // Pastikan ini ada

  useEffect(() => {
    if (!currentUser) return;

    const unsubSales = onSnapshot(collection(db, `users/${currentUser.uid}/sales`), (snap) => {
      setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubExpenses = onSnapshot(collection(db, `users/${currentUser.uid}/expenses`), (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInvoices = onSnapshot(
        query(collection(db, `users/${currentUser.uid}/supplier_invoices`), orderBy("createdAt", "desc")), 
        (snap) => {
        setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
    );

    return () => { unsubSales(); unsubExpenses(); unsubInvoices(); unsubProd(); };
  }, [currentUser]);

  const totalInventoryValuation = products.reduce((acc, p) => {
    // Pastikan menggunakan costPrice (HPP) bukan harga jual
    return acc + ((p.stock || 0) * (p.costPrice || 0));
  }, 0);

  // --- ANALISIS FINANSIAL STOK (SINKRON DENGAN BULAN & TAHUN) ---
  const stockFinancials = products.reduce((acc, p) => {
    const stock = p.stock || 0;
    const unitCost = p.costPrice || 0;
    const price = p.price || 0;
    const multiplier = p.isMapping ? (p.multiplier || 1) : 1;

    // 1. Hitung Total HPP per Unit (sudah dikali multiplier)
    const totalHppPerUnit = unitCost * multiplier;
    
    // 2. Hitung Profit Bersih per Unit (sudah dipotong admin 16% & fee 1250)
    const netProfitPerUnit = price - totalHppPerUnit - (price * ADMIN_PERCENT) - FIXED_FEE;
    
    // 3. Margin Persentase
    const marginPercent = price > 0 ? (netProfitPerUnit / price) * 100 : 0;

    // Akumulasi hanya jika produk aktif (memiliki stok)
    if (stock > 0) {
      acc.totalValuation += (totalHppPerUnit * stock);
      acc.totalEstProfit += (netProfitPerUnit * stock);
      
      if (marginPercent < 10) {
        acc.lowMarginCount += 1;
      }
    }

    return acc;
  }, { totalValuation: 0, totalEstProfit: 0, lowMarginCount: 0 });

  const analyzer = new StockAnalyzer(sales, invoices, products, selectedMonth, selectedYear);

    const stockStats = {
      unitOut: analyzer.getTotalUnitOut(),
      unitIn: analyzer.getTotalUnitIn(),
      valuationOut: analyzer.getValuationOut(),
      valuationIn: analyzer.getValuationIn(),
      mostSold: analyzer.getMostSoldProduct(),
      topInventory: analyzer.getTopInventory(),
      totalWarehouseAsset: totalInventoryValuation // Masukkan ke object stats
    };

  // --- LOGIKA FILTER DATA ---
  const getFilteredData = () => {
    const now = new Date();
    
    const isMatch = (date: any) => {
      if (!date) return false;
      const d = date.toDate();
      
      if (timeRange === "Bulan + Tahun") {
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      } else if (timeRange === "3 Bulan Terakhir") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return d >= threeMonthsAgo;
      } else if (timeRange === "Tahun Ini") {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    };

    const filteredSales = sales.filter(s => isMatch(s.createdAt));
    const filteredExpenses = expenses.filter(e => isMatch(e.createdAt));

    return { filteredSales, filteredExpenses };
  };

  const { filteredSales, filteredExpenses } = getFilteredData();

  // --- KALKULASI RINGKASAN ---
  const totalOmset = filteredSales
    .filter(s => s.status !== 'Retur')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const grossProfit = filteredSales
    .filter(s => s.status !== 'Retur')
    .reduce((acc, curr) => acc + (curr.profit || 0), 0);

  const totalOpex = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  // Profit Bersih (Laba Kotor - Opex)
  const netProfit = grossProfit - totalOpex;

  // Kerugian dari Barang Rusak/Hilang
  const totalKerugian = filteredSales
    .filter(s => s.status === 'Retur' && (s.penanganan === 'Rusak' || s.penanganan === 'Tidak Kembali'))
    .reduce((acc, curr) => acc + (curr.hpp || 0), 0);

  // PROFIT FINAL (Profit Bersih - Kerugian Retur)
  const profitFinal = netProfit - totalKerugian;

  // --- PREPARASI DATA GRAFIK (Last 6 Months Trend) ---
  const chartData = months.map((m, index) => {
    const monthlySales = sales.filter(s => s.createdAt?.toDate().getMonth() === index && s.createdAt?.toDate().getFullYear() === selectedYear);
    const monthlyExpenses = expenses.filter(e => e.createdAt?.toDate().getMonth() === index && e.createdAt?.toDate().getFullYear() === selectedYear);
    
    const omset = monthlySales.filter(s => s.status !== 'Retur').reduce((acc, curr) => acc + (curr.total || 0), 0);
    const profit = monthlySales.filter(s => s.status !== 'Retur').reduce((acc, curr) => acc + (curr.profit || 0), 0) - monthlyExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return {
      name: m.substring(0, 3).toUpperCase(),
      pemasukan: omset,
      laba: profit < 0 ? 0 : profit
    };
  }).slice(Math.max(selectedMonth - 5, 0), selectedMonth + 1);

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
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-[#0F172A] leading-none">Kia</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Administrator</p>
            </div>
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
            <button key={opt} onClick={() => setTimeRange(opt)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeRange === opt ? "bg-[#0047AB] text-white shadow-md" : "text-slate-400 hover:text-[#0047AB]"}`}>
              {opt}
            </button>
          ))}
          
          {timeRange === "Bulan + Tahun" && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-100">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase px-2 py-1.5 text-[#0047AB] outline-none cursor-pointer">
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase px-2 py-1.5 text-[#0047AB] outline-none cursor-pointer">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="px-4 sm:px-10 mt-8 flex gap-8 border-b border-slate-200">
        {["Keuangan", "Stok"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === tab ? "text-[#0047AB]" : "text-slate-400 hover:text-slate-600"}`}>
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0047AB]"></div>}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: KEUANGAN */}
      {activeTab === "Keuangan" && (
        <div className="px-4 sm:px-10 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* STAT CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="TOTAL OMSET" value={`IDR ${totalOmset.toLocaleString('id-ID')}`} icon={<Wallet size={20}/>} color="blue" trend="12.5%" isUp={true} />
            
            <StatCard title="TOTAL KERUGIAN" value={`IDR ${totalKerugian.toLocaleString('id-ID')}`} icon={<TrendingDown size={20}/>} color="red" trend="2.1%" isUp={false} />
            
            <StatCard title="PROFIT BERSIH" value={`IDR ${netProfit.toLocaleString('id-ID')}`} icon={<TrendingUp size={20}/>} color="emerald" trend="8.2%" isUp={true} subtitle="Laba - Opex" />
            
            <StatCard title="PROFIT FINAL" value={`IDR ${profitFinal.toLocaleString('id-ID')}`} icon={<Banknote size={20}/>} color="emerald" trend="5.4%" isUp={profitFinal > 0} subtitle="Cuan Bersih Akhir" highlight={true} />
          </div>

          {/* MAIN CHART */}
          <div className="mt-8 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-lg font-black tracking-tight text-[#0F172A]">Tren Laba Rugi</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.15em]">Performa Pemasukan vs Laba Bersih</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-[#0047AB]"></div> Pemasukan
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]"></div> Laba Bersih
                </div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94A3B8'}} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#F8F9FB'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    itemStyle={{fontSize: '11px', fontWeight: 900, textTransform: 'uppercase'}}
                  />
                  <Bar dataKey="pemasukan" fill="#0047AB" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="laba" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Stok" && (
        <div className="px-4 sm:px-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* STAT CARDS STOK */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="STOK KELUAR" value={`${stockStats.unitOut} Unit`} icon={<PackageMinus size={20}/>} color="red" trend="Penjualan" isUp={false} />
            <StatCard title="STOK MASUK" value={`${stockStats.unitIn} Unit`} icon={<PackagePlus size={20}/>} color="blue" trend="Restock" isUp={true} />
            <StatCard title="VALUASI KELUAR" value={`Rp ${stockStats.valuationOut.toLocaleString('id-ID')}`} icon={<BadgeDollarSign size={20}/>} color="red" trend="Total HPP" isUp={false} />
            <StatCard title="VALUASI MASUK" value={`Rp ${stockStats.valuationIn.toLocaleString('id-ID')}`} icon={<Banknote size={20}/>} color="blue" trend="Modal Belanja" isUp={true} />
            <StatCard 
              title={`VALUASI ASET`} 
              value={`Rp ${stockFinancials.totalValuation.toLocaleString('id-ID')}`} 
              icon={<Wallet size={20}/>} 
              color="blue" 
              trend={`${months[selectedMonth]}`} 
              isUp={true} 
              subtitle="Posisi Modal"
            />

            <StatCard 
              title={`POTENSI CUAN`} 
            value={`Rp ${stockFinancials.totalEstProfit.toLocaleString('id-ID')}`} 
            icon={<TrendingUp size={20}/>} 
            color="emerald" 
            trend={`${months[selectedMonth]}`} 
            isUp={true} 
            highlight={true}
            subtitle="Sisa Margin"
          />

            <StatCard 
              title="MARGIN < 10%" 
              value={`${stockFinancials.lowMarginCount} Produk`} 
              icon={<AlertTriangle size={20}/>} 
              color="red" 
              trend="Evaluasi" 
              isUp={false} 
              subtitle="Profit Tipis"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
            {/* Barang Terlaris (Keluar Terbanyak) */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-center mb-6">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Trophy size={24}/></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Top Performance</span>
              </div> 
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Keluar Terbanyak (Bulan Ini)</p>
              <h3 className="text-2xl font-black text-[#0F172A] uppercase leading-tight mb-2">{stockStats.mostSold[0]}</h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-orange-500 text-white text-[11px] font-black rounded-lg">{stockStats.mostSold[1]} Unit Sold</span>
                <span className="text-[10px] font-bold text-slate-400">Total Outgoing</span>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-all duration-500">
                <PackageMinus size={150} />
              </div>
            </div>

            {/* Barang Stok Terbanyak (Live Warehouse) */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-center mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Package size={24}/></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Inventory Asset</span>
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Stok Terbanyak (Gudang)</p>
              <h3 className="text-2xl font-black text-[#0F172A] uppercase leading-tight mb-2">{stockStats.topInventory.name}</h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#0047AB] text-white text-[11px] font-black rounded-lg">{stockStats.topInventory.stock} Unit Ready</span>
                <span className="text-[10px] font-bold text-slate-400">Current Balance</span>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-all duration-500">
                <Package size={150} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#0047AB] text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <PlusCircle size={28} strokeWidth={2.5} />
      </button>

    </div>
  );
}

// --- SUB-COMPONENT: CARD ---
function StatCard({ title, value, icon, color, trend, isUp, subtitle, highlight }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-[#0047AB] border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-500 border-red-100"
  };

  return (
    <div className={`bg-white p-8 rounded-[32px] border ${highlight ? 'border-[#0047AB]/20 shadow-md ring-1 ring-[#0047AB]/5' : 'border-slate-100 shadow-sm'} relative group overflow-hidden`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colors[color]} shadow-sm`}>
          {icon}
        </div>
        <button className="p-1 text-slate-300 hover:text-slate-500 transition-colors">
          <Info size={16} />
        </button>
      </div>
      
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className={`text-2xl font-black ${highlight ? 'text-[#0047AB]' : 'text-[#0F172A]'} tracking-tighter mb-4`}>{value}</h3>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">vs bln lalu</span>
        </div>
        {subtitle && <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-tighter">{subtitle}</span>}
      </div>
      
      <div className={`absolute bottom-0 left-0 h-1 transition-all group-hover:w-full w-0 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
    </div>
  );
}