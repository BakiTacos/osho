"use client";

import React, { useState } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Search, ShoppingBag, Upload, ChevronRight, ChevronLeft, Plus, Check, Loader2, Trash2, AlertCircle, Edit2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

// IMPORT CLEAN ARCHITECTURE
import { MARKETPLACE_CONFIG } from "../../lib/constants/sales";
import { useSalesData } from "../hooks/useSalesData";
import { SalesService } from "../../lib/services/SalesService";
import { ManualInputModal } from "../../components/sales/SalesModals";

export default function PenjualanPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  // Custom Hook for Realtime Data
  const { catalog, transactions, shopeeWarehouse, activeFees } = useSalesData(currentUser);
  
  // Init OOP Service
  const salesService = new SalesService(currentUser, catalog, shopeeWarehouse, activeFees);

  // States
  const [selectedMarketplace, setSelectedMarketplace] = useState("shopee");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("Hari Ini");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState("Semua"); 
  const [useCatalogPrice, setUseCatalogPrice] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [searchSales, setSearchSales] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const itemsPerPage = 20;

  const [statusTab, setStatusTab] = useState("Semua"); // Tab: Semua, Pending, Proses, Selesai
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [timeRange, setTimeRange] = useState("Bulan + Tahun"); // Default ke pilihan bulan

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];

  const [manualForm, setManualForm] = useState({
    orderId: '', 
    source: 'Shopee', 
    status: 'Proses', 
    tiktokProvince: '', 
    tiktokWeight: 1, 
    tiktokType: 'Standard',
    items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }]
  });

  // Derived Data (Filters & Stats)
  // --- LOGIKA FILTER TRANSAKSI YANG DIPERBAIKI ---
  const filteredTransactions = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const txDate = t.createdAt.toDate();
    const now = new Date();
    
    // Hitung selisih hari
    const diffInMs = now.getTime() - txDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    let timeMatch = false;

    // 1. Logika Switch untuk Filter Waktu
    if (timeFilter === "Hari Ini") {
      timeMatch = txDate.toDateString() === now.toDateString();
    } else if (timeFilter === "3 Hari") {
      // Kurang dari atau sama dengan 3 hari dari sekarang
      timeMatch = diffInDays <= 3;
    } else {
      // Mode "1 Bulan" atau Pilihan Dropdown Bulan/Tahun
      timeMatch = txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
    }

    // 2. Filter Status (Tab)
    let statusMatch = true;
    if (statusTab === "Pending") statusMatch = t.product === "Produk Luar Katalog";
    else if (statusTab !== "Semua") statusMatch = t.status === statusTab;

    // 3. Search Match
    const searchMatch = 
      t.orderId.toLowerCase().includes(searchSales.toLowerCase()) ||
      t.product.toLowerCase().includes(searchSales.toLowerCase()) ||
      t.sku.toLowerCase().includes(searchSales.toLowerCase()) ||
      (t.marketplace && t.marketplace.toLowerCase().includes(searchSales.toLowerCase()));

    return timeMatch && statusMatch && searchMatch;
  });

  const stats = filteredTransactions.reduce((acc, curr) => {
    if (curr.status !== 'Retur') { acc.omset += curr.total; acc.profit += curr.profit; }
    return acc;
  }, { omset: 0, profit: 0 });

  const pendingTransactions = filteredTransactions.filter(t => t.product === "Produk Luar Katalog");
  const listToDisplay = activeView === "Pending" ? pendingTransactions : filteredTransactions;
  const totalPages = Math.ceil(listToDisplay.length / itemsPerPage);
  const currentItems = listToDisplay.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers linked to Service
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);
    const reader = new FileReader();
    const config = MARKETPLACE_CONFIG[selectedMarketplace];
    const existingOrderIds = new Set(transactions.map(t => String(t.orderId).trim()));

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
        const headers = data[0];
        const finalSkuIdx = (config.cols.sku !== undefined) ? config.cols.sku : headers.findIndex((h: any) => String(h).toUpperCase().includes("SKU"));
        const rawRows = data.slice(config.dataStartRow);
        
        let addedCount = 0;
        for (const row of rawRows) {
          const resiValue = String(row[config.cols.resi] || "").trim();
          const orderIdLama = String(row[config.cols.orderId] || "").trim();
          const finalId = resiValue || orderIdLama;
          if (!finalId || existingOrderIds.has(finalId)) continue;

          // --- LOGIKA BIAYA LOGISTIK TIKTOK (MENGGUNAKAN CONFIG) ---
          let logisticsFee = 0;
          if (selectedMarketplace === 'tiktok') {
            // Ambil data menggunakan Index dari MARKETPLACE_CONFIG
            const shippingType = String(row[config.cols.shippingType] || "Standard"); 
            const destinationProvince = String(row[config.cols.province] || "");  
            const parcelWeight = Number(row[config.cols.weight]) || 0;          
            
            // Panggil Service OOP
            logisticsFee = salesService.calculateTikTokLogistics(shippingType, destinationProvince, parcelWeight);
          }
          // ------------------------------------

          let rawSku = String(row[finalSkuIdx] || "").trim();
          if (selectedMarketplace === 'shopee' && !rawSku) rawSku = String(row[12] || "").trim(); 
          const sku = rawSku.replace(/\s+/g, '').toUpperCase();
          const qty = Number(row[config.cols.qty]) || 1;
          const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
          
          let unitPrice = 0, unitCost = 0, multiplier = 1, productName = "Produk Luar Katalog";
          if (matched) {
            productName = matched.name;
            unitPrice = Number(matched.price) || (Number(row[config.cols.total]) / qty);
            if (matched.isMapping && matched.linkedSku) {
              const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
              unitCost = main ? Number(main.costPrice) : Number(matched.costPrice);
              multiplier = Number(matched.multiplier) || 1;
            } else { unitCost = Number(matched.costPrice) || 0; }
          } else { unitPrice = (Number(row[config.cols.total]) / qty || 0); }

          const totalRevenue = unitPrice * qty;
          const totalHpp = (unitCost * multiplier) * qty;
          
          // Masukkan logisticsFee ke dalam kalkulator Net Profit
          const netProfit = salesService.calculateNetProfitEntry(totalRevenue, totalHpp, selectedMarketplace, logisticsFee);

          // Simpan juga logisticsFee ke Firestore untuk transparansi data
          await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
            orderId: finalId, sku, product: productName, total: totalRevenue, hpp: totalHpp, qty, 
            profit: netProfit, logisticsFee, marketplace: config.name, status: 'Proses', createdAt: serverTimestamp()
          });
          await salesService.updateProductStock(sku, -qty, finalId);
          addedCount++;
        }
        alert(`Berhasil impor ${addedCount} data. Ekstraksi tarif Logistik TikTok aktif.`);
      } catch (err) { alert("Gagal memproses file."); console.error(err); } 
      finally { setIsProcessing(false); e.target.value = ''; }
    };
    reader.readAsBinaryString(file);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeFees) return alert("Data biaya belum dimuat.");
    setIsProcessing(true);
    try {
      await salesService.processMultiProductManual(manualForm, useCatalogPrice);
      setIsManualModalOpen(false);
      setManualForm({ 
        orderId: '', source: 'Shopee', status: 'Proses', 
        tiktokProvince: '', tiktokWeight: 1, tiktokType: 'Standard', // Reset juga
        items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }] 
      });
      alert("Pesanan tersimpan!");
    } catch (err) { alert("Terjadi kesalahan."); } 
    finally { setIsProcessing(false); }
  };

  return (
  <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-10">
    
    {/* 1. HEADER & ACTIONS */}
    <div className="px-4 sm:px-10 pt-8 flex flex-col xl:flex-row justify-between gap-6">
      <div>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-none">Penjualan</h1>
        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center italic uppercase tracking-widest">
          <Check size={12} className="mr-1 text-emerald-500" /> Multi-Product Input Ready
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={() => setIsManualModalOpen(true)} 
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

    {/* 2. FILTER BAR SECTION (Quick Filter + Search) */}
    <div className="px-4 sm:px-10 mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* TIME FILTERS */}
        <div className="flex flex-wrap items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm gap-2">
          {["Hari Ini", "3 Hari", "1 Bulan"].map((opt) => (
            <button key={opt} onClick={() => setTimeFilter(opt)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeFilter === opt ? "bg-[#0047AB] text-white shadow-md" : "text-slate-400 hover:text-[#0047AB]"}`}>
              {opt}
            </button>
          ))}

          {/* MONTH & YEAR SELECTOR (Sync like Report Page) */}
          <div className="flex items-center gap-1 ml-1 pl-3 border-l border-slate-100">
            <select 
              value={selectedMonth} 
              onChange={(e) => { setSelectedMonth(Number(e.target.value)); setTimeFilter("Custom"); }} 
              className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-2 py-2 text-[#0047AB] outline-none cursor-pointer"
            >
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => { setSelectedYear(Number(e.target.value)); setTimeFilter("Custom"); }} 
              className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-2 py-2 text-[#0047AB] outline-none cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full lg:max-w-xs group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Cari SKU, Resi, atau Marketplace..." 
            value={searchSales} 
            onChange={(e) => setSearchSales(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold shadow-sm focus:ring-2 focus:ring-[#0047AB] outline-none transition-all" 
          />
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {["Semua", "Pending", "Proses", "Selesai", "Retur"].map((tab) => (
          <button key={tab} onClick={() => setStatusTab(tab)}
            className={`pb-3 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${statusTab === tab ? "text-[#0047AB]" : "text-slate-400 hover:text-slate-600"}`}>
            {tab} 
            {tab === "Pending" && pendingTransactions.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {pendingTransactions.length}
              </span>
            )}
            {statusTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0047AB]"></div>}
          </button>
        ))}
      </div>
    </div>

    {/* 3. STATS CARDS */}
    <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-[32px] border border-[#F1F5F9] shadow-sm">
        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Omset {timeFilter}</p>
        <h3 className="text-4xl font-black text-[#0F172A]">Rp {stats.omset.toLocaleString('id-ID')}</h3>
      </div>
      <div className="bg-white p-8 rounded-[32px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-emerald-500">
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Profit Bersih {timeFilter}</p>
        <h3 className="text-4xl font-black text-emerald-600">Rp {stats.profit.toLocaleString('id-ID')}</h3>
      </div>
    </div>

    {/* 4. BULK ACTION BAR */}
    {selectedIds.length > 0 && (
      <div className="mx-4 sm:mx-10 mt-6 flex justify-between items-center bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
        <p className="text-xs font-black text-red-600 uppercase tracking-widest">{selectedIds.length} Item Terpilih</p>
        <button onClick={() => { salesService.bulkDeleteTransactions(transactions, selectedIds); setSelectedIds([]); }} 
          className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-red-100 transition-all hover:bg-red-700">
          <Trash2 size={14} /> Hapus Terpilih
        </button>
      </div>
    )}

    {/* 5. MAIN CONTENT (Import & Table) */}
    <div className="px-4 sm:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT: SOURCES */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-8 rounded-[32px] border border-[#F1F5F9] shadow-sm">
          <h4 className="text-lg font-black text-[#0F172A] mb-6 uppercase text-[11px] tracking-[0.2em]">Sumber Impor</h4>
          <div className="space-y-3">
            {Object.keys(MARKETPLACE_CONFIG).map((key) => (
              <button key={key} onClick={() => setSelectedMarketplace(key)} 
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold text-sm ${selectedMarketplace === key ? "border-[#0047AB] bg-blue-50 text-[#0047AB]" : "border-slate-50 text-slate-400 hover:border-slate-200"}`}>
                <span className="capitalize">{MARKETPLACE_CONFIG[key].name}</span>
                {selectedMarketplace === key && <Check size={18} strokeWidth={3} />}
              </button>
            ))}
          </div>
          <div className="mt-8 relative group">
            {isProcessing && <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center rounded-[24px]"><Loader2 className="animate-spin text-[#0047AB] mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Memproses...</span></div>}
            <input type="file" accept=".xlsx, .csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-10 text-center group-hover:bg-slate-50 transition-all group-hover:border-[#0047AB]">
              <Upload className="mx-auto text-[#0047AB] mb-4" size={32} />
              <p className="text-sm font-black text-[#0F172A]">Upload Laporan</p>
              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase italic tracking-tighter italic">Headers auto-detected</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: TABLE SECTION */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          
          {/* HORIZONTAL SCROLL CONTAINER */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                  <th className="px-8 py-5 w-10">
                    <input type="checkbox" className="rounded text-[#0047AB] cursor-pointer" 
                      checked={selectedIds.length === currentItems.length && currentItems.length > 0} 
                      onChange={() => setSelectedIds(selectedIds.length === currentItems.length ? [] : currentItems.map(t => t.id))} />
                  </th>
                  <th className="px-4 py-5 text-left">Item & Sumber</th>
                  <th className="px-6 py-5 text-right">Qty</th>
                  <th className="px-6 py-5 text-right">Net Profit</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map((t) => (
                  <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors group ${t.product === "Produk Luar Katalog" ? "bg-red-50/40" : ""}`}>
                    <td className="px-8 py-5">
                      <input type="checkbox" className="rounded text-[#0047AB] cursor-pointer" 
                        checked={selectedIds.includes(t.id)} 
                        onChange={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])} />
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col max-w-[250px]">
                        <span className={`text-sm font-black leading-tight uppercase truncate ${t.product === "Produk Luar Katalog" ? "text-red-600" : "text-[#0F172A]"}`}>
                          {t.product}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          {/* MARKETPLACE BADGE */}
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border ${
                            t.marketplace?.toLowerCase() === 'shopee' ? "bg-orange-50 text-orange-600 border-orange-100" : 
                            t.marketplace?.toLowerCase() === 'tiktok' ? "bg-slate-900 text-white border-slate-800" : 
                            "bg-blue-50 text-blue-600 border-blue-100"
                          }`}>
                            {t.marketplace}
                          </span>
                          <span className="text-[9px] font-bold text-[#0047AB] tracking-tighter truncate">#{t.orderId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-xs text-slate-400">{t.qty}</td>
                    
                    {/* PROFIT COLUMN WITH TOOLTIP */}
                    <td className="px-6 py-5 text-right relative group">
                      <div className="cursor-help inline-flex flex-col items-end">
                        <span className={`text-sm font-black ${t.status === 'Retur' ? 'text-slate-300 line-through' : 'text-emerald-600'}`}>
                          Rp {t.profit?.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest border-b border-dashed border-slate-300 mt-1">Rincian</span>
                      </div>

                      {/* TOOLTIP DETAILS */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 hidden group-hover:flex flex-col w-56 bg-[#0F172A] text-white p-4 rounded-2xl shadow-2xl z-[100] text-[10px] pointer-events-none transition-all animate-in fade-in slide-in-from-right-2">
                        <p className="font-black border-b border-slate-700 pb-2 mb-3 text-slate-400 uppercase tracking-[0.2em] text-[9px] text-left">Rincian Profit</p>
                        <div className="flex justify-between mb-2"><span className="text-slate-300">Revenue:</span> <span className="font-bold text-emerald-400">Rp {t.total?.toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between mb-2"><span className="text-slate-300">Modal:</span> <span className="font-bold text-red-400">-Rp {t.hpp?.toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between mb-2"><span className="text-slate-300">Admin:</span> <span className="font-bold text-orange-400">-Rp {Math.round(t.total - t.hpp - (t.logisticsFee || 0) - t.profit).toLocaleString('id-ID')}</span></div>
                        {t.logisticsFee > 0 && <div className="flex justify-between mb-2"><span className="text-slate-300">Logistik:</span> <span className="font-bold text-orange-400">-Rp {t.logisticsFee?.toLocaleString('id-ID')}</span></div>}
                        <div className="flex justify-between mt-2 pt-3 border-t border-slate-700 font-black text-xs"><span>NET PROFIT:</span> <span className="text-emerald-400">Rp {t.profit?.toLocaleString('id-ID')}</span></div>
                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-[#0F172A] rotate-45"></div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <select 
                        value={t.status} 
                        onChange={(e) => updateDoc(doc(db, `users/${currentUser?.uid}/sales`, t.id), { status: e.target.value })} 
                        className={`text-[9px] font-black px-3 py-1.5 rounded-full border bg-transparent outline-none cursor-pointer transition-all ${t.status === 'Selesai' ? "text-emerald-600 border-emerald-100 hover:bg-emerald-50" : t.status === 'Retur' ? "text-red-500 border-red-100 hover:bg-red-50" : "text-amber-600 border-amber-100 hover:bg-amber-50"}`}
                      >
                        <option value="Proses">Proses</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Retur">Retur</option>
                      </select>
                    </td>
                    <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                      <button onClick={() => salesService.deleteTransaction(t)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-slate-200">
                <ShoppingBag size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-300">No Transactions Found</p>
              </div>
            )}
          </div>

          {/* PAGINATION SECTION */}
          <div className="p-8 border-t border-[#F8F9FB] flex items-center justify-between">
            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</p>
            <div className="flex items-center space-x-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 border border-[#E2E8F0] rounded-lg text-[#94A3B8] disabled:opacity-20 hover:bg-slate-50"><ChevronLeft size={16}/></button>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 border border-[#E2E8F0] rounded-lg text-[#94A3B8] disabled:opacity-20 hover:bg-slate-50"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 6. MODAL COMPONENTS */}
    <ManualInputModal 
      isOpen={isManualModalOpen} 
      onClose={() => setIsManualModalOpen(false)} 
      manualForm={manualForm} 
      setManualForm={setManualForm} 
      useCatalogPrice={useCatalogPrice} 
      setUseCatalogPrice={setUseCatalogPrice} 
      isProcessing={isProcessing} 
      onSubmit={handleManualSubmit} 
      addManualItem={() => setManualForm({...manualForm, items: [...manualForm.items, { sku: '', qty: 1, manualPrice: '', manualCost: '' }]})} 
      removeManualItem={(index: number) => setManualForm({...manualForm, items: manualForm.items.filter((_, i) => i !== index)})} 
      updateManualItem={(index: number, field: string, value: any) => { const newItems = [...manualForm.items]; newItems[index] = { ...newItems[index], [field]: value }; setManualForm({ ...manualForm, items: newItems }); }} 
    />
  </div>
)}