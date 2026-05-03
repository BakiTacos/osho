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

  const [manualForm, setManualForm] = useState({
    orderId: '', source: 'Shopee', status: 'Proses', items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }]
  });

  // Derived Data (Filters & Stats)
  const filteredTransactions = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const txDate = t.createdAt.toDate();
    const now = new Date();
    const diffInDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
    
    let timeMatch = timeFilter === "Hari Ini" ? txDate.toDateString() === now.toDateString() : timeFilter === "3 Hari" ? diffInDays <= 3 : diffInDays <= 30;
    const statusMatch = statusFilter === "Semua" || t.status === statusFilter;
    const searchMatch = t.orderId.toLowerCase().includes(searchSales.toLowerCase()) || t.product.toLowerCase().includes(searchSales.toLowerCase()) || t.sku.toLowerCase().includes(searchSales.toLowerCase());

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
          const netProfit = salesService.calculateNetProfitEntry(totalRevenue, totalHpp, selectedMarketplace);

          await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
            orderId: finalId, sku, product: productName, total: totalRevenue, hpp: totalHpp, qty, profit: netProfit, marketplace: config.name, status: 'Proses', createdAt: serverTimestamp()
          });
          await salesService.updateProductStock(sku, -qty, finalId);
          addedCount++;
        }
        alert(`Berhasil impor ${addedCount} data.`);
      } catch (err) { alert("Gagal memproses file."); } 
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
      setManualForm({ orderId: '', source: 'Shopee', status: 'Proses', items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }] });
      alert("Pesanan tersimpan!");
    } catch (err) { alert("Terjadi kesalahan."); } 
    finally { setIsProcessing(false); }
  };

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-10">
      <div className="px-4 sm:px-10 pt-8 flex flex-col md:flex-row justify-between gap-6">
        <div><h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">Penjualan</h1><p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center"><Check size={12} className="mr-1 text-emerald-500" /> Multi-Product Input Ready</p></div>
        <div className="flex bg-white p-1 rounded-2xl border shadow-sm self-start">
          {["Hari Ini", "3 Hari", "1 Bulan"].map((opt) => (
            <button key={opt} onClick={() => setTimeFilter(opt)} className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all ${timeFilter === opt ? "bg-[#0047AB] text-white" : "text-slate-400"}`}>{opt}</button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsManualModalOpen(true)} className="bg-white text-[#0047AB] border-2 border-[#0047AB] px-5 py-3 rounded-2xl font-black text-xs"><Plus size={18} className="inline mr-2"/>Input</button>

          <button onClick={() => router.push('/penjualan/advanced')} className="bg-[#0047AB] text-white px-5 py-3 rounded-2xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center space-x-2">
            <Plus size={18} strokeWidth={3} />
            <span>Advance Shipment</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border shadow-sm"><p className="text-[10px] font-black text-[#94A3B8] mb-1">Omset {timeFilter}</p><h3 className="text-4xl font-black">Rp {stats.omset.toLocaleString('id-ID')}</h3></div>
        <div className="bg-white p-8 rounded-[32px] border-l-4 border-l-emerald-500 shadow-sm"><p className="text-[10px] font-black text-emerald-600 mb-1">Profit Bersih {timeFilter}</p><h3 className="text-4xl font-black text-emerald-600">Rp {stats.profit.toLocaleString('id-ID')}</h3></div>
      </div>

      {selectedIds.length > 0 && (
        <div className="px-4 sm:px-10 mt-6 flex justify-between bg-red-50 p-4 rounded-2xl border border-red-100">
          <p className="text-xs font-black text-red-600">{selectedIds.length} Item Terpilih</p>
          <button onClick={() => { salesService.bulkDeleteTransactions(transactions, selectedIds); setSelectedIds([]); }} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px]"><Trash2 size={14} className="inline mr-2"/> Hapus Terpilih</button>
        </div>
      )}

      <div className="px-4 sm:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border shadow-sm">
            <h4 className="text-lg font-black mb-6">Sumber Impor</h4>
            <div className="space-y-3">
              {Object.keys(MARKETPLACE_CONFIG).map((key) => (
                <button key={key} onClick={() => setSelectedMarketplace(key)} className={`w-full flex justify-between p-4 rounded-2xl border-2 font-bold text-sm ${selectedMarketplace === key ? "border-[#0047AB] bg-blue-50 text-[#0047AB]" : "border-slate-50 text-slate-400"}`}><span className="capitalize">{MARKETPLACE_CONFIG[key].name}</span>{selectedMarketplace === key && <Check size={18} />}</button>
              ))}
            </div>
            <div className="mt-8 relative group">
              {isProcessing && <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center rounded-[24px]"><Loader2 className="animate-spin text-[#0047AB]" /></div>}
              <input type="file" accept=".xlsx, .csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="border-2 border-dashed rounded-[24px] p-10 text-center group-hover:bg-slate-50"><Upload className="mx-auto text-[#0047AB] mb-4" size={32} /><p className="text-sm font-black">Upload Laporan</p></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FB] border-b">
                <tr className="text-[10px] font-black text-[#94A3B8]">
                  <th className="px-8 py-5"><input type="checkbox" onChange={() => setSelectedIds(selectedIds.length === currentItems.length ? [] : currentItems.map(t => t.id))} checked={selectedIds.length === currentItems.length && currentItems.length > 0} /></th>
                  <th className="px-4 py-5">Item</th><th className="px-6 py-5 text-right">Qty</th><th className="px-6 py-5 text-right">Net Profit</th><th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-8 py-5"><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])} /></td>
                    <td className="px-4 py-5"><span className="text-sm font-black uppercase">{t.product}</span><br/><span className="text-[9px] text-[#0047AB]">#{t.orderId} • {t.sku}</span></td>
                    <td className="px-6 py-5 text-right text-xs">{t.qty}</td>
                    <td className="px-6 py-5 text-right font-black text-emerald-600">Rp {t.profit.toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2"><button onClick={() => salesService.deleteTransaction(t)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ManualInputModal 
        isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} manualForm={manualForm} setManualForm={setManualForm} 
        useCatalogPrice={useCatalogPrice} setUseCatalogPrice={setUseCatalogPrice} isProcessing={isProcessing} onSubmit={handleManualSubmit} 
        addManualItem={() => setManualForm({...manualForm, items: [...manualForm.items, { sku: '', qty: 1, manualPrice: '', manualCost: '' }]})} 
        removeManualItem={(index: number) => setManualForm({...manualForm, items: manualForm.items.filter((_, i) => i !== index)})} 
        updateManualItem={(index: number, field: string, value: any) => { const newItems = [...manualForm.items]; newItems[index] = { ...newItems[index], [field]: value }; setManualForm({ ...manualForm, items: newItems }); }} 
      />
    </div>
  );
}