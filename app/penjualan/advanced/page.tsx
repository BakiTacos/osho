// app/penjualan/advanced/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { 
  PackageCheck, Search, Plus, Trash2, Truck, AlertCircle, 
  Loader2, Timer, Upload, ChevronLeft, ChevronRight 
} from "lucide-react";

// 🚀 EMBED MODULAR MONOLITH: Semua dependensi ditarik dari struktur domain lokal yang terisolasi
import { useAdvancedFulfillmentData } from "./hooks/useAdvancedFulfillmentData";
import { AdvancedFulfillmentService } from "./services/AdvancedFulfillmentService";
import { AddWarehouseModal } from "./components/AddWarehouseModal";

export default function GudangShopeePage() {
  const { currentUser } = useAuth();

  // --- STATE AKLIR REFRESH COUNTER (SINKRONISASI LAYER UI & SERVICE) ---
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerDataRefresh = () => setRefreshTrigger(prev => prev + 1);
  
  // Custom Hook & OOP Service lokal domain advanced
  const { items, products } = useAdvancedFulfillmentData(currentUser, refreshTrigger);
  const fulfillmentService = new AdvancedFulfillmentService(currentUser, products);

  // States Kontrol UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ resi: '', sku: '', qty: 1, note: 'Pengiriman Kilat Shopee' });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset pagination ke halaman 1 setiap kali user melakukan pencarian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- HANDLERS JEMBATAN AKSI ---
  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isProcessing) return;
    setIsProcessing(true);
    try {
      await fulfillmentService.addWarehouseItem(form, items);
      
      triggerDataRefresh(); // 🔄 Denyut data layar langsung diperbarui otomatis
      alert("✅ Data booking manual berhasil disimpan!");
      setIsModalOpen(false);
      setForm({ resi: '', sku: '', qty: 1, note: 'Pengiriman Kilat Shopee' });
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleCleanupDuplicates = async () => {
    if (!currentUser || items.length === 0) return;
    if (!window.confirm("Sistem akan menghapus duplikat DAN mengembalikan stok yang terpotong ganda. Lanjutkan?")) return;
    setIsProcessing(true);
    try {
      const { deleteCount, totalStockRestored } = await fulfillmentService.cleanupDuplicates(items);
      
      triggerDataRefresh(); // 🔄 Data ganda lenyap seketika dari array state
      if (deleteCount > 0) {
        alert(`✅ Sukses! ${deleteCount} data duplikat dihapus dan ${totalStockRestored} unit stok berhasil dikembalikan ke gudang.`);
      } else {
        alert("✨ Hebat, Kev! Tidak ditemukan komponen data duplikat.");
      }
    } catch (err) { 
      alert("❌ Terjadi kesalahan saat sinkronisasi stok ganda."); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleDeleteWarehouseItem = async (item: any) => {
    if (!window.confirm(`Hapus resi ${item.resi}? Stok ${item.productName} sebanyak ${item.qty} unit akan dikembalikan.`)) return;
    setIsProcessing(true);
    try {
      await fulfillmentService.deleteWarehouseItem(item);
      
      triggerDataRefresh(); // 🔄 Kembalikan kuantitas stok terpotong aman
      alert(`✅ Berhasil! ${item.productName} telah kembali ke stok utama rak ruko.`);
    } catch (err) { 
      alert("❌ Terjadi kesalahan saat mengembalikan stok fisik."); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);
    try {
      const addedCount = await fulfillmentService.processMassImport(file, items);
      
      triggerDataRefresh(); // 🚀 Ratusan resi baru ter-render kilat
      alert(`✅ Berhasil impor ${addedCount} data baru. Data duplikat otomatis dilewati.`);
    } catch (err) { 
      alert("❌ Gagal mengekstrak data dari file excel. Cek susunan koordinat kolom.");
      console.error(err); 
    } finally { 
      setIsProcessing(false); 
      e.target.value = ''; 
    }
  };

  // --- DERIVED DATA LOGIC ---
  const filteredItems = items.filter(i => 
    String(i.resi || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(i.sku || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 🚀 REFAKTOR STATS: Sekarang murni memantau data booking aktif yang belum dipakai jualan
  const stats = { 
    total: filteredItems.length, 
    pending: filteredItems.filter(i => !i.isUsed).length
  };

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20 transition-all duration-300">
      
      {/* HEADER & ACTIONS SECTION */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#0F172A] leading-tight uppercase">Shopee Fulfillment</h1>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 sm:mt-2 flex items-center gap-1.5">
            <Truck size={12} className="text-[#0047AB] shrink-0"/> Gudang & Pengiriman Kilat (Advance)
          </p>
        </div>
        
        {/* ACTION BUTTONS GROUP */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto">
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)} 
            className="cursor-pointer flex-1 sm:flex-none justify-center bg-[#0047AB] text-white px-5 py-3.5 sm:px-6 sm:py-4 rounded-[18px] sm:rounded-[24px] font-black text-xs shadow-md shadow-blue-100 flex items-center gap-2 hover:scale-[1.01] active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3}/> 
            <span>INPUT RESI KILAT</span>
          </button>
          
          <button 
            type="button"
            onClick={handleCleanupDuplicates} 
            disabled={isProcessing || items.length === 0} 
            className="cursor-pointer flex-1 sm:flex-none justify-center bg-white text-orange-500 border-2 border-orange-500 px-4 py-3 sm:px-5 sm:py-3.5 rounded-[18px] sm:rounded-[24px] font-black text-xs hover:bg-orange-50 flex items-center gap-2 transition-all disabled:opacity-40"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
            <span>BERSIHKAN DUPLIKAT</span>
          </button>
          
          <div className="relative group flex-1 sm:flex-none">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              disabled={isProcessing} 
            />
            <button 
              type="button"
              className="w-full sm:w-auto justify-center bg-emerald-600 text-white px-5 py-3.5 sm:px-6 sm:py-4 rounded-[18px] sm:rounded-[24px] font-black text-xs shadow-md shadow-emerald-100 flex items-center gap-2 hover:scale-[1.01] active:scale-95 transition-all"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>}
              <span>{isProcessing ? "MEMPROSES..." : "IMPOR MASSAL"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 CARD STATS SEKARANG RESPONSIF 2 KOLOM (Card Berhasil Terpakai resmi dibuang) */}
      <div className="px-4 sm:px-10 mt-6 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-widest mb-1 sm:mb-2">Total Resi Terdata</p>
          <h3 className="text-xl sm:text-3xl font-black text-[#0F172A]">{stats.total}</h3>
        </div>
        <div className="bg-white p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm border-l-4 border-l-orange-500 flex flex-col justify-between">
          <p className="text-[8px] sm:text-[10px] font-black text-orange-500 uppercase tracking-[0.15em] sm:tracking-widest mb-1 sm:mb-2">Menunggu Matching Sales</p>
          <h3 className="text-xl sm:text-3xl font-black text-[#0F172A]">{stats.pending}</h3>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <div className="px-4 sm:px-10 mt-6 sm:mt-8">
        <div className="relative max-w-md group">
          <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari Resi atau SKU..." 
            className="w-full bg-white border border-slate-200 rounded-[18px] sm:rounded-[22px] py-3 sm:py-4 pl-12 sm:pl-14 pr-6 text-xs sm:text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#0047AB] transition-all" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* TABLE DATA LIST WITH PAGINATION */}
      <div className="px-4 sm:px-10 mt-6 sm:mt-8">
        <div className="bg-white rounded-[24px] sm:rounded-[32px] border shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="overflow-x-auto no-scrollbar flex-1">
            <table className="w-full text-left min-w-[650px] lg:min-w-0">
              <thead className="bg-slate-50/50 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-5 py-4 sm:px-8 sm:py-6">Informasi Resi</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-6">Produk & SKU Utama</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-6 text-center">Qty</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-6">Status</th>
                  <th className="px-5 py-4 sm:px-8 sm:py-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 group transition-all text-xs sm:text-sm font-bold text-slate-600">
                    <td className="px-5 py-4 sm:px-8 sm:py-6">
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-black text-[#0047AB]">#{item.resi}</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-1 uppercase italic truncate max-w-[150px]">{item.note}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-6">
                      <p className="text-xs sm:text-sm font-black text-[#0F172A] uppercase truncate max-w-[180px]">{item.productName}</p>
                      <p className="text-[8px] sm:text-[10px] font-bold text-[#0047AB] mt-0.5 uppercase">{item.sku}</p>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-center">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black text-slate-600">{item.qty}</span>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tight bg-orange-50 text-orange-600">
                        <Timer size={10}/>
                        <span>Menunggu Order</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 sm:px-8 sm:py-6 text-right">
                      <button 
                        type="button"
                        disabled={isProcessing} 
                        onClick={() => handleDeleteWarehouseItem(item)} 
                        className="cursor-pointer p-1.5 sm:p-2 text-slate-300 hover:text-red-500 rounded-xl disabled:opacity-30 transition-colors"
                      >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredItems.length === 0 && (
              <div className="py-16 sm:py-24 text-center">
                <PackageCheck size={40} className="mx-auto text-slate-200 mb-4 animate-pulse" />
                <p className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada data resi kilat aktif</p>
              </div>
            )}
          </div>

          {/* PAGINATION NAVIGATION */}
          {filteredItems.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-[#F1F5F9] flex items-center justify-between bg-white mt-auto">
              <span className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} dari {filteredItems.length} Resi
              </span>
              
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setCurrentPage(p => p - 1)} 
                  disabled={currentPage === 1} 
                  className="p-2 border border-[#E2E8F0] text-slate-400 hover:text-[#0047AB] rounded-lg disabled:opacity-20 transition-all cursor-pointer flex items-center justify-center"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[9px] sm:text-[10px] font-black text-[#0F172A] flex items-center justify-center bg-slate-50">
                  Page {currentPage} of {totalPages || 1}
                </div>

                <button 
                  type="button"
                  onClick={() => setCurrentPage(p => p + 1)} 
                  disabled={currentPage === totalPages || totalPages === 0} 
                  className="p-2 border border-[#E2E8F0] text-slate-400 hover:text-[#0047AB] rounded-lg disabled:opacity-20 transition-all cursor-pointer flex items-center justify-center"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <AddWarehouseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} form={form} setForm={setForm} onSubmit={handleAddWarehouse} isProcessing={isProcessing} />
    </div>
  );
}