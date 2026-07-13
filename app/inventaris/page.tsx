// app/inventaris/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { 
  Plus, Download, Loader2, Package, 
  ChevronLeft, ChevronRight, Layers,
  ArrowUp, ArrowDown, CheckCircle2, AlertTriangle 
} from "lucide-react";

import { useInventoryData } from "./hooks/useInventoryData";
import { useInventoryFilter } from "./hooks/useInventoryFilter";
import { InventoryService } from "./services/InventoryService";

import { InventoryStats } from "./components/InventoryStats";
import { InventorySearch } from "./components/InventorySearch";
import { CategoryFilter } from "./components/CategoryFilter";
import { InventoryMobileGrid } from "./components/InventoryMobileGrid";
import { InventoryDesktopTable } from "./components/InventoryDesktopTable";

// Struktur tipe data untuk menampung notifikasi kilat di ruko
interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

export default function InventarisPage() {
  const { currentUser } = useAuth();
  
  // Ambil data produk awal dari hook
  const { products: initialProducts, activeFees } = useInventoryData(currentUser);
  
  // 🚀 PERBAIKAN 1: Tampung produk ke dalam state lokal agar bisa berubah instan (Real-time Mirroring)
  const [localProducts, setLocalProducts] = useState<any[]>([]);

  // Sinkronisasikan state lokal setiap kali data initialProducts dari Firebase berubah
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setLocalProducts(initialProducts);
    }
  }, [initialProducts]);
  
  const inventoryService = React.useMemo(() => {
    return new InventoryService(currentUser, activeFees, localProducts);
  }, [currentUser, activeFees, localProducts]);

  const {
    searchTerm, setSearchTerm, selectedCategory, setSelectedCategory,
    sortBy, setSortBy, sortOrder, setSortOrder, currentPage, setCurrentPage,
    totalPages, currentItems, processedProducts, itemsPerPage, stats 
  } = useInventoryFilter(localProducts, inventoryService);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  
  const [viewMode, setViewMode] = useState<"semua" | "harga" | "stok">("semua");
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [selectedProfits, setSelectedProfits] = useState<string[]>(["shopee", "tiktok", "lazada", "offline"]);

  // 🚀 PERBAIKAN 2: State Kendali Notifikasi Kilat Toast
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" });

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    // Otomatis sembunyikan notifikasi setelah 3 detik
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) { setShowScrollButtons(true); } 
      else { setShowScrollButtons(false); }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

  const handleMassImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsImporting(true);
    try {
      const count = await inventoryService.processMassImport(file);
      triggerToast(`Impor selesai! ${count} produk berhasil diproses.`, "success");
    } catch (err) { 
      triggerToast("Gagal memproses file impor Excel.", "error");
    } finally { 
      setIsImporting(false); 
      e.target.value = ''; 
    }
  };

  // 🚀 PERBAIKAN 3: Update fungsi agar tabel langsung berubah instan di layar RAM laptop/HP
  const handleUpdateStock = async (id: string) => {
    try {
      const parsedStock = Number(tempStock);
      
      // Jalankan fungsi update ke server Firestore cloud
      await inventoryService.updateStock(id, parsedStock);
      
      // Langsung tembak perubahan ke state lokal RAM (Ubah data detik itu juga di tabel UI)
      setLocalProducts(prev => 
        prev.map(p => p.id === id ? { ...p, stock: parsedStock } : p)
      );
      
      setEditingStockId(null);
      triggerToast("Jumlah stok varian produk berhasil diperbarui!", "success");
    } catch (error) {
      triggerToast("Gagal memperbarui sisa stok fisik.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Kakak yakin ingin menghapus produk ini dari katalog?")) {
      try { 
        await inventoryService.deleteProduct(id); 
        
        // Hapus langsung dari memori tabel lokal
        setLocalProducts(prev => prev.filter(p => p.id !== id));
        
        setActiveMenuId(null); 
        triggerToast("Produk berhasil dihapus dari katalog gudang.", "success");
      } 
      catch (error) { 
        triggerToast("Gagal menghapus produk dari database.", "error");
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <Loader2 className="animate-spin text-[#0047AB]" size={32} />
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-32 lg:pb-16 relative">
      
      {/* ======================================================= */}
      {/* 🚀 NOTIFIKASI TOAST KILAT MELAYANG (FIX NOTIFIKASI BINGUNG) */}
      {/* ======================================================= */}
      {toast.show && (
        <div className="fixed top-6 right-4 sm:right-10 z-[100] max-w-sm w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {toast.type === "success" ? (
            <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
          ) : (
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Notifikasi Sistem</p>
            <p className="text-xs font-black text-slate-700 uppercase mt-0.5 leading-snug">{toast.message}</p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="px-4 sm:px-10 pt-8 sm:pt-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#0F172A] tracking-tighter leading-none uppercase">Daftar Produk</h1>
          <p className="text-[#64748B] mt-2 text-[11px] sm:text-xs font-bold uppercase">Pantau ketersediaan stok barang dan estimasi profit bersih jualan.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative hidden md:block sm:flex-none">
            <input type="file" accept=".xlsx, .xls" onChange={handleMassImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isImporting} />
            <button type="button" className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-sm">
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{isImporting ? "Memproses..." : "Impor Excel"}</span>
            </button>
          </div>
          <Link href="/inventaris/tambah" className="flex-1 sm:flex-none">
            <button type="button" className="w-full bg-[#0047AB] text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-blue-700 transition-all flex items-center justify-center space-x-1.5 shadow-sm">
              <Plus size={14} /><span>Tambah Produk</span>
            </button>
          </Link>
          <Link href="/inventaris/mapping" className="flex-1 sm:flex-none">
            <button type="button" className="w-full bg-white text-[#0047AB] border border-[#0047AB] px-4 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-blue-50 transition-all flex items-center justify-center space-x-1.5 shadow-xs">
              <Layers size={14} /><span>Hubungkan SKU</span>
            </button>
          </Link>
        </div>
      </div>

      {/* RANGKUMAN STATISTIK */}
      <InventoryStats totalProducts={stats.totalProducts} lowStockCount={stats.lowStockCount} outOfStockCount={stats.outOfStockCount} />

      {/* KONTROL SELECTOR FILTER MODE JEMPOL KILAT */}
      <div className="px-4 sm:px-10 mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-full md:max-w-xs shadow-xs">
          {[
            { id: "semua", label: "Lihat Semua" },
            { id: "harga", label: "Mode Harga" },
            { id: "stok", label: "Mode Stok" }
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setViewMode(mode.id as any)}
              className={`flex-1 text-center py-2 text-[10px] sm:text-xs font-black uppercase rounded-lg transition-all ${
                viewMode === mode.id ? "bg-[#0047AB] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* 🚀 OPSI CHECKBOX ESTIMASI PROFIT MARKETPLACE & OFFLINE */}
        {viewMode !== "stok" && (
          <div className="flex flex-wrap items-center bg-white py-2 px-4 rounded-xl border border-slate-200 gap-4 shadow-xs text-[10px] sm:text-xs font-black text-slate-600">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400">Tampilkan Profit:</span>
            {["shopee", "tiktok", "lazada", "offline"].map((mp) => (
              <label key={mp} className="flex items-center gap-1.5 cursor-pointer uppercase select-none">
                <input
                  type="checkbox"
                  checked={selectedProfits.includes(mp)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProfits([...selectedProfits, mp]);
                    } else {
                      setSelectedProfits(selectedProfits.filter(x => x !== mp));
                    }
                  }}
                  className="rounded border-slate-300 text-[#0047AB] focus:ring-[#0047AB]"
                />
                <span>{mp}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* BAR PENCARIAN & URUTAN DATA */}
      <InventorySearch 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        sortBy={sortBy} setSortBy={setSortBy}
        sortOrder={sortOrder} setSortOrder={setSortOrder}
      />

      {/* FILTER KATEGORI */}
      <CategoryFilter selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />

      {/* DAFTAR BARANG UTAMA */}
      <div className="px-4 sm:px-10 py-6">
        
        {/* Render Mobile */}
        <InventoryMobileGrid 
          items={currentItems} inventoryService={inventoryService}
          activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId}
          editingStockId={editingStockId} setEditingStockId={setEditingStockId}
          tempStock={tempStock} setTempStock={setTempStock}
          onUpdateStock={handleUpdateStock} onDelete={handleDelete}
          viewMode={viewMode}
          selectedProfits={selectedProfits}
        />

        {/* Render Desktop */}
        <InventoryDesktopTable 
          items={currentItems} inventoryService={inventoryService}
          activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId}
          editingStockId={editingStockId} setEditingStockId={setEditingStockId}
          tempStock={tempStock} setTempStock={setTempStock}
          onUpdateStock={handleUpdateStock} onDelete={handleDelete}
          viewMode={viewMode}
          selectedProfits={selectedProfits}
        />

        {/* NAVIGATION PAGINATION CONTROL */}
        {processedProducts.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <span className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, processedProducts.length)} - {Math.min(currentPage * itemsPerPage, processedProducts.length)} dari {processedProducts.length} Barang
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button type="button" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 border border-slate-200 text-slate-400 hover:text-[#0047AB] rounded-xl disabled:opacity-20 transition-all"><ChevronLeft size={16} /></button>
              <div className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black text-[#0F172A] bg-slate-50 flex items-center justify-center">Halaman {currentPage} dari {totalPages || 1}</div>
              <button type="button" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-200 text-slate-400 hover:text-[#0047AB] rounded-xl disabled:opacity-20 transition-all"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {processedProducts.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
            <Package size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Barang tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* UNIVERSAL FLOATING QUICK JUMPER */}
      {showScrollButtons && (
        <div className="fixed bottom-20 lg:bottom-8 right-4 flex flex-col gap-2 z-[95] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button type="button" onClick={scrollToTop} className="w-11 h-11 bg-white border border-slate-200 text-[#0047AB] rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 active:scale-90 transition-all cursor-pointer"><ArrowUp size={18} strokeWidth={2.5} /></button>
          <button type="button" onClick={scrollToBottom} className="w-11 h-11 bg-white border border-slate-200 text-[#0047AB] rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 active:scale-90 transition-all cursor-pointer"><ArrowDown size={18} strokeWidth={2.5} /></button>
        </div>
      )}
    </div>
  );
}