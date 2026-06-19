"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { 
  Search, Plus, MoreVertical, Edit2, Trash2, CheckCircle2, 
  ArrowUpDown, Download, Loader2, Info, Package, 
  ChevronLeft, ChevronRight, Layers
} from "lucide-react";

import { useInventoryData, Product } from "../inventaris/hooks/useInventoryData";
import { InventoryService } from "../inventaris/services/InventoryService";
import { InventoryStats } from "./components/InventoryStats";

export default function InventarisPage() {
  const { currentUser } = useAuth();
  
  const { products, activeFees } = useInventoryData(currentUser);
  const inventoryService = new InventoryService(currentUser, activeFees, products);

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "netProfit" | "netMargin">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const categories = ["Semua", "Dapur", "Kamar Mandi", "Kebersihan", "Penyimpanan", "Ruang Tamu", "Kamar Tidur", "Lainnya"];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy, sortOrder]);

  // Handlers
  const handleMassImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsImporting(true);
    try {
      const count = await inventoryService.processMassImport(file);
      alert(`Impor selesai. ${count} produk berhasil diproses.`);
    } catch (err) { 
      alert("Gagal memproses file. Pastikan format kolom sudah sesuai."); 
    } finally { 
      setIsImporting(false); 
      e.target.value = ''; 
    }
  };

  const handleUpdateStock = async (id: string) => {
    await inventoryService.updateStock(id, Number(tempStock));
    setEditingStockId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Kakak yakin ingin menghapus produk ini?")) {
      try {
        await inventoryService.deleteProduct(id);
        setActiveMenuId(null); 
      } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan saat menghapus produk.");
      }
    }
  };

  // Logic Filtering & Sorting
  const processedProducts = products
    .filter(p => (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())) && (selectedCategory === "Semua" || p.category === selectedCategory))
    .sort((a, b) => {
      let valA: any, valB: any;
      if (sortBy === "netProfit" || sortBy === "netMargin") {
        const estA = inventoryService.getMarketplaceEstimation(a);
        const estB = inventoryService.getMarketplaceEstimation(b);
        valA = sortBy === "netProfit" ? (estA?.results?.shopee?.netProfit || 0) : (estA?.results?.shopee?.margin || 0);
        valB = sortBy === "netProfit" ? (estB?.results?.shopee?.netProfit || 0) : (estB?.results?.shopee?.margin || 0);
      } else {
        valA = a[sortBy as keyof Product] || 0;
        valB = b[sortBy as keyof Product] || 0;
      }
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  // Pagination Logic
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const currentItems = processedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <Loader2 className="animate-spin text-[#0047AB]" size={32} />
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-24 lg:pb-12">
      
      {/* 🚀 BARIS JUDUL UTAMA */}
      <div className="px-4 sm:px-10 pt-8 sm:pt-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tighter leading-none">Daftar Produk</h1>
          <p className="text-[#64748B] mt-2 text-xs sm:text-sm font-bold">Pantau ketersediaan stok barang gudang dan pantauan estimasi profit bersih.</p>
        </div>

        {/* TOMBOL AKSI CEPAT */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input type="file" accept=".xlsx, .xls" onChange={handleMassImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isImporting} />
            <button className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-sm">
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{isImporting ? "Memproses..." : "Impor Excel"}</span>
            </button>
          </div>
          
          <Link href="/inventaris/tambah" className="flex-1 sm:flex-none">
            <button className="w-full bg-[#0047AB] text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-blue-700 transition-all flex items-center justify-center space-x-1.5 shadow-sm">
              <Plus size={14} />
              <span>Tambah Produk</span>
            </button>
          </Link>
          
          <Link href="/inventaris/mapping" className="flex-1 sm:flex-none">
            <button className="w-full bg-white text-[#0047AB] border border-[#0047AB] px-4 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-blue-50 transition-all flex items-center justify-center space-x-1.5 shadow-xs">
              <Layers size={14} />
              <span>Hubungkan SKU</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 🚀 KOTAK RINGKASAN DATA STOK */}
      <InventoryStats totalProducts={products.length} lowStockCount={lowStockCount} outOfStockCount={outOfStockCount} />

      {/* 🚀 PENCARIAN & SORTING DATA */}
      <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="relative sm:col-span-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
          <input 
            type="text" 
            placeholder="Ketik SKU atau nama produk di sini..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0047AB] transition-all shadow-xs" 
          />
        </div>

        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-xs sm:col-span-4 items-center justify-between">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full bg-transparent border-none text-[10px] font-black text-[#0F172A] uppercase tracking-wider focus:ring-0 px-3 cursor-pointer outline-none">
            <option value="name">Urutkan: Nama Barang</option>
            <option value="stock">Urutkan: Sisa Stok</option>
            <option value="price">Urutkan: Harga Jual</option>
            <option value="netProfit">Urutkan: Profit Shopee</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="p-2 hover:bg-slate-50 rounded-lg text-[#0047AB] transition-colors shrink-0">
            <ArrowUpDown size={14} />
          </button>
        </div>
      </div>

      {/* FILTER KATEGORI */}
      <div className="px-4 sm:px-10 mt-4 flex bg-transparent overflow-x-auto no-scrollbar gap-1.5">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-[#0047AB] text-white shadow-sm" : "bg-white text-[#64748B] border border-slate-200 hover:bg-slate-50"}`}>{cat}</button>
        ))}
      </div>

      {/* 🚀 KONTEN UTAMA INVENTARIS */}
      <div className="px-4 sm:px-10 py-6">
        
        {/* ========================================== */}
        {/* 📱 VIEW MOBILE: 2 CARD PER ROW (OPTIMAL ANDROID) */}
        {/* ========================================== */}
        <div className="grid grid-cols-2 lg:hidden gap-3">
          {currentItems.map((p) => {
            const estData = inventoryService.getMarketplaceEstimation(p);
            if (!estData) return null;

            return (
              <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative min-h-[220px]">
                
                {/* Bagian Identitas Atas */}
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <p className="text-[8px] font-black text-[#0047AB] uppercase tracking-tighter truncate max-w-[80%]">SKU: {p.sku}</p>
                    
                    {/* Menu Menu Dropdown */}
                    <div className="relative shrink-0">
                      <button onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)} className="p-0.5 text-slate-300 hover:text-slate-600">
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuId === p.id && (
                        <div className="absolute right-0 top-5 w-28 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 text-[9px] font-black">
                          <Link href={`/inventaris/edit/${p.id}`} className="block px-2.5 py-1.5 text-slate-600 hover:bg-slate-50">EDIT</Link>
                          <button onClick={() => handleDelete(p.id)} className="w-full text-left px-2.5 py-1.5 text-red-500 hover:bg-red-50">HAPUS</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-black text-[#0F172A] uppercase leading-tight mt-0.5 line-clamp-2 min-h-[2rem]" title={p.name}>
                    {p.name}
                  </h4>
                  
                  {p.isMapping && (
                    <span className="inline-block bg-blue-50 text-[#0047AB] px-1 py-0.5 rounded text-[7px] font-black uppercase mt-1 tracking-tighter truncate max-w-full">
                      📦 {p.linkedSku}
                    </span>
                  )}
                </div>

                {/* Harga Modal & Jual (Tumpuk Vertikal Ringkas) */}
                <div className="space-y-1 my-2 bg-slate-50/70 p-2 rounded-xl border border-slate-100/50 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Modal:</span>
                    <span className="text-[#0F172A] font-black">Rp {Math.round(estData.actualCost * estData.multiplier).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Jual:</span>
                    <span className="text-[#0F172A] font-black">Rp {p.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Profit Platform Ringkas */}
                <div className="space-y-1 bg-white border border-slate-100 p-1.5 rounded-xl text-[9px] font-black">
                  {['shopee', 'tiktok', 'lazada'].map((mp) => {
                    const mpData = estData.results[mp];
                    return (
                      <div key={mp} className="flex justify-between items-center gap-1">
                        <span className="text-slate-400 uppercase text-[8px]">{mp}:</span>
                        {mpData ? (
                          <span className={mpData.netProfit > 0 ? "text-emerald-600" : "text-red-500"}>
                            Rp {Math.round(mpData.netProfit).toLocaleString('id-ID')}
                          </span>
                        ) : <span className="text-slate-300 italic">N/A</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Pengubah Sisa Stok Cepat */}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100 text-[10px]">
                  <span className="text-[8px] font-black uppercase text-slate-400">Stok</span>
                  {editingStockId === p.id ? (
                    <div className="flex items-center space-x-0.5">
                      <input autoFocus type="number" className="w-10 p-0.5 border border-[#0047AB] rounded text-center text-xs font-black" value={tempStock} onChange={(e) => setTempStock(Number(e.target.value))} />
                      <button onClick={() => handleUpdateStock(p.id)} className="text-emerald-600"><CheckCircle2 size={14}/></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setEditingStockId(p.id); setTempStock(p.stock); }}
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${p.stock <= 10 ? "bg-red-50 text-red-500 border border-red-100 animate-pulse" : "bg-slate-100 text-[#0F172A]"}`}
                    >
                      {p.stock} Pcs
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* ========================================== */}
        {/* 🖥️ VIEW DESKTOP: TABLE FORMAT ARSITEKTUR */}
        {/* ========================================== */}
        <div className="hidden lg:block bg-white rounded-[28px] border border-[#F1F5F9] shadow-xs overflow-hidden flex flex-col min-h-[500px]">
          <div className="overflow-x-auto no-scrollbar flex-1">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                  <th className="px-8 py-5">Nama Barang</th>
                  <th className="px-6 py-5">SKU Toko</th>
                  <th className="px-6 py-5 text-right">Harga Modal</th>
                  <th className="px-6 py-5 text-right">Harga Jual</th>
                  <th className="px-4 py-5 text-center bg-orange-50/20 border-x border-orange-100/50">Profit Shopee</th>
                  <th className="px-4 py-5 text-center bg-slate-50 border-x border-slate-100">Profit TikTok</th>
                  <th className="px-4 py-5 text-center bg-blue-50/20 border-x border-blue-100/50">Profit Lazada</th>
                  <th className="px-6 py-5 text-center">Stok Gudang</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F9FB]">
                {currentItems.map((p) => {
                  const estData = inventoryService.getMarketplaceEstimation(p);
                  if (!estData) return null;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#0F172A] uppercase leading-tight">{p.name}</span>
                          {p.isMapping && (
                            <span className="text-[9px] font-bold text-[#0047AB] mt-1 flex items-center gap-1 uppercase">
                              🗂️ Terhubung: {p.linkedSku}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-[#64748B] uppercase">{p.sku}</td>
                      <td className="px-6 py-5 text-right font-black text-xs text-[#0F172A]">Rp {(estData.actualCost * estData.multiplier).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-5 text-right font-black text-xs text-[#0F172A]">Rp {p.price.toLocaleString('id-ID')}</td>

                      {/* ESTIMASI PLATFORM */}
                      {['shopee', 'tiktok', 'lazada'].map((mp) => {
                        const mpData = estData.results[mp];
                        const isTiktok = mp === 'tiktok';
                        return (
                          <td key={mp} className={`px-4 py-5 text-center relative ${isTiktok ? 'group/tk' : ''}`}>
                            {mpData ? (
                              <div className="flex flex-col items-center">
                                <span className={`text-xs font-black ${mpData.netProfit > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                  Rp {Math.round(mpData.netProfit).toLocaleString('id-ID')}
                                </span>
                                <span className="text-[9px] font-black text-slate-400 mt-0.5">({mpData.margin.toFixed(0)}% Margin)</span>
                                
                                {isTiktok && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/tk:block w-64 bg-[#0F172A] text-white p-4 rounded-2xl shadow-xl z-[120] pointer-events-none">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-700 pb-1 text-center">Rincian Profit Per Wilayah</p>
                                    <div className="space-y-1.5">
                                      {inventoryService.getTikTokRegionBreakdown(p).map((reg: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-[10px]">
                                          <span className="text-slate-400 uppercase">{reg.regionName}</span>
                                          <span className={`font-black ${reg.netProfit > 0 ? "text-emerald-400" : "text-red-400"}`}>Rp {Math.round(reg.netProfit).toLocaleString('id-ID')}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F172A] rotate-45 -mt-1"></div>
                                  </div>
                                )}
                              </div>
                            ) : <span className="text-[10px] text-slate-300 italic uppercase">N/A</span>}
                          </td>
                        );
                      })}

                      {/* EDIT STOK DESKTOP */}
                      <td className="px-6 py-5 text-center">
                        {editingStockId === p.id ? (
                          <div className="flex items-center justify-center space-x-1">
                            <input autoFocus type="number" className="w-16 p-1 border border-[#0047AB] rounded text-center text-xs font-black" value={tempStock} onChange={(e) => setTempStock(Number(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && handleUpdateStock(p.id)} />
                            <button onClick={() => handleUpdateStock(p.id)} className="text-emerald-600"><CheckCircle2 size={16}/></button>
                          </div>
                        ) : (
                          <div onClick={() => { setEditingStockId(p.id); setTempStock(p.stock); }} className={`cursor-pointer inline-block text-xs font-black px-4 py-1.5 rounded-lg ${p.stock <= 10 ? "text-red-600 bg-red-50" : "text-[#0F172A] hover:bg-slate-100"}`}>
                            {p.stock} Pcs
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-5 text-right relative">
                        <button onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)} className="p-2 text-[#94A3B8] hover:text-slate-600"><MoreVertical size={16} /></button>
                        {activeMenuId === p.id && (
                          <div className="absolute right-10 top-12 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-[11px] font-black">
                            <Link href={`/inventaris/edit/${p.id}`} className="block px-4 py-2.5 text-slate-600 hover:bg-slate-50">EDIT BARANG</Link>
                            <button onClick={() => handleDelete(p.id)} className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50">HAPUS DATA</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🚀 NAVIGASI PAGINATION */}
        {processedProducts.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <span className="text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, processedProducts.length)} - {Math.min(currentPage * itemsPerPage, processedProducts.length)} dari {processedProducts.length} Barang
            </span>
            
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 border border-slate-200 text-slate-400 hover:text-[#0047AB] rounded-xl disabled:opacity-20 transition-all cursor-pointer"><ChevronLeft size={16} /></button>
              <div className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black text-[#0F172A] bg-slate-50 flex items-center justify-center">Halaman {currentPage} dari {totalPages || 1}</div>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-200 text-slate-400 hover:text-[#0047AB] rounded-xl disabled:opacity-20 transition-all cursor-pointer"><ChevronRight size={16} /></button>
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
    </div>
  );
}