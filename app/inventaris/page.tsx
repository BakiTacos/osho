"use client";

import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { Search, Bell, Plus, MoreVertical, Edit2, Trash2, Check, ArrowUpDown, Download, Loader2, Info, ArrowLeftRight, Package, CheckCircle2 } from "lucide-react";

// IMPORT CLEAN ARCHITECTURE
import { useInventoryData, Product } from "../hooks/useInventoryData";
import { InventoryService } from "../../lib/services/InventoryService";
import { InventoryStats } from "../../components/inventory/InventoryStats";

export default function InventarisPage() {
  const { currentUser } = useAuth();
  
  // Custom Hook & Service (Sertakan products/catalog ke service)
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

  const categories = ["Semua", "Dapur", "Kamar Mandi", "Kebersihan", "Penyimpanan", "Ruang Tamu", "Kamar Tidur", "Lainnya"];

  // Handlers
  const handleMassImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsImporting(true);
    try {
      const count = await inventoryService.processMassImport(file);
      alert(`Impor selesai. ${count} SKU unik berhasil diproses.`);
    } catch (err) { alert("Gagal memproses file."); } 
    finally { setIsImporting(false); e.target.value = ''; }
  };

  const handleUpdateStock = async (id: string) => {
    await inventoryService.updateStock(id, Number(tempStock));
    setEditingStockId(null);
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

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Kakak yakin ingin menghapus produk ini dari inventaris? Data yang dihapus tidak bisa dikembalikan.")) {
      try {
        await inventoryService.deleteProduct(id);
        setActiveMenuId(null); // Tutup menu dropdown setelah hapus
        // Opsional: Kakak bisa tambahkan toast/notif sukses di sini
      } catch (error) {
        console.error("Gagal menghapus produk:", error);
        alert("Oops! Terjadi kesalahan saat mencoba menghapus produk.");
      }
    }
  };

  return (
  <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-10">
    
    {/* 1. TOP NAVIGATION & SEARCH */}
    <div className="px-4 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-4">
      <div className="relative flex-1 lg:flex-none lg:w-96 ml-16 lg:ml-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
        <input 
          type="text" 
          placeholder="Cari SKU atau Nama Produk..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full bg-[#EDF2F7] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#0047AB] transition-all" 
        />
      </div>
      <div className="flex items-center space-x-6">
        <Bell size={20} className="hidden sm:block cursor-pointer text-[#64748B] hover:text-[#0047AB]" />
        <div className="flex items-center space-x-3 border-l pl-6">
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-[#0F172A] leading-none uppercase">Kia</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center text-xs font-black">K</div>
        </div>
      </div>
    </div>

    {/* 2. TITLE & ACTION BUTTONS */}
    <div className="px-4 sm:px-10 mt-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
      <div>
        <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter leading-tight">Inventaris</h1>
        <p className="text-[#64748B] mt-2 text-sm font-medium">Manajemen stok & optimasi margin lintas marketplace secara real-time.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
        <div className="relative group">
          <input type="file" accept=".xlsx, .xls" onChange={handleMassImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isImporting} />
          <button className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center space-x-2">
            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={3} />}
            <span>{isImporting ? "Memproses..." : "Impor Excel"}</span>
          </button>
        </div>
        <Link href="/inventaris/tambah">
          <button className="bg-[#0047AB] text-white px-5 py-3 rounded-xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center space-x-2">
            <Plus size={16} strokeWidth={3} />
            <span>Tambah Produk</span>
          </button>
        </Link>
        <Link href="/inventaris/mapping">
          <button className="bg-white text-[#0047AB] border-2 border-[#0047AB] px-5 py-3 rounded-xl font-black text-xs hover:bg-blue-50 transition-all flex items-center space-x-2">
            <ArrowUpDown size={16} strokeWidth={3} />
            <span>Mapping SKU</span>
          </button>
        </Link>
      </div>
    </div>

    {/* 3. INVENTORY STATISTICS CARDS */}
    <InventoryStats totalProducts={products.length} lowStockCount={lowStockCount} outOfStockCount={outOfStockCount} />

    {/* 4. FILTER CATEGORIES & SORTING */}
    <div className="px-4 sm:px-10 mt-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-sm overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-[#0047AB] text-white shadow-md" : "text-[#64748B] hover:bg-slate-50"}`}>{cat}</button>
        ))}
      </div>
      <div className="flex bg-white rounded-xl border border-[#E2E8F0] p-1 shadow-sm items-center">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent border-none text-[10px] font-black text-[#0F172A] uppercase tracking-wider focus:ring-0 px-3 cursor-pointer">
          <option value="name">Urut: Nama</option>
          <option value="stock">Urut: Stok</option>
          <option value="price">Urut: Harga Jual</option>
          <option value="netProfit">Urut: Profit (Shopee)</option>
        </select>
        <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="p-1.5 hover:bg-slate-50 rounded-lg text-[#0047AB] transition-colors">
          <ArrowUpDown size={14} />
        </button>
      </div>
    </div>

    {/* 5. DATA TABLE */}
    <div className="px-4 sm:px-10 py-8">
      <div className="bg-white rounded-[28px] border border-[#F1F5F9] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
              <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                <th className="px-8 py-5">Produk & Status</th>
                <th className="px-6 py-5">SKU</th>
                <th className="px-6 py-5 text-right">Modal (Sync)</th>
                <th className="px-6 py-5 text-right">Harga Jual</th>
                <th className="px-4 py-5 text-center bg-orange-50/30 border-x border-orange-100/50">Shopee</th>
                <th className="px-4 py-5 text-center bg-slate-50 border-x border-slate-100">TikTok</th>
                <th className="px-4 py-5 text-center bg-blue-50/30 border-x border-blue-100/50">Lazada</th>
                <th className="px-6 py-5 text-center">Stok</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8F9FB]">
              {processedProducts.map((p) => {
                const estData = inventoryService.getMarketplaceEstimation(p);
                if (!estData) return null;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#0F172A] uppercase leading-tight">{p.name}</span>
                        {p.isMapping && (
                          <span className="text-[9px] font-bold text-[#0047AB] mt-1 flex items-center gap-1 uppercase">
                            <ArrowLeftRight size={10} /> Terhubung ke: {p.linkedSku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-[#64748B] uppercase">{p.sku}</td>
                    
                    {/* MODAL SYNC DISPLAY */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-[#0F172A]">Rp {(estData.actualCost * estData.multiplier).toLocaleString('id-ID')}</span>
                        {p.isMapping && <span className="text-[8px] font-bold text-slate-400 italic uppercase">HPP Induk Terpusat</span>}
                      </div>
                    </td>

                    {/* JUAL DISPLAY */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-[#0F172A]">Rp {p.price.toLocaleString('id-ID')}</span>
                        {p.useMarketplacePrices && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter mt-1">Custom Pricing Aktif</span>}
                      </div>
                    </td>

                    {/* MARKETPLACE COLUMNS */}
                    {['shopee', 'tiktok', 'lazada'].map((mp) => {
                      const mpData = estData.results[mp];
                      const isTiktok = mp === 'tiktok';
                      
                      return (
                        <td key={mp} className={`px-4 py-5 text-center relative ${isTiktok ? 'group/tk' : ''}`}>
                          {mpData ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-[11px] font-black ${mpData.netProfit > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                Rp {mpData.netProfit.toLocaleString('id-ID')}
                              </span>
                              <div className="flex items-center gap-1 mt-1 cursor-help">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${mpData.margin >= 15 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                  {mpData.margin.toFixed(1)}%
                                </span>
                                {isTiktok && <Info size={10} className="text-slate-300 group-hover/tk:text-[#0047AB]" />}
                              </div>

                              {/* TIKTOK REGION TOOLTIP (HANYA UNTUK TIKTOK) */}
                              {isTiktok && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/tk:block w-64 bg-[#0F172A] text-white p-5 rounded-2xl shadow-2xl z-[120] animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 border-b border-slate-700 pb-2 flex justify-between">
                                    <span>Profit Per Wilayah</span>
                                    <span>Standard</span>
                                  </p>
                                  <div className="space-y-2.5">
                                    {inventoryService.getTikTokRegionBreakdown(p).map((reg: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center text-[10px] border-b border-slate-800/50 pb-1">
                                        <span className="text-slate-400 font-medium uppercase tracking-tighter">{reg.regionName}</span>
                                        <div className="text-right">
                                          <span className={`font-black ${reg.netProfit > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            Rp {reg.netProfit.toLocaleString('id-ID')}
                                          </span>
                                          <span className="text-[8px] text-slate-500 ml-1">({reg.margin.toFixed(0)}%)</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-[8px] text-slate-500 italic mt-3 text-center uppercase tracking-tighter font-bold">
                                    *Estimasi Berat Paket ≤ 1KG
                                  </p>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0F172A] rotate-45 -mt-1.5"></div>
                                </div>
                              )}
                              
                              {/* CUSTOM PRICE INDICATOR TOOLTIP */}
                              {p.useMarketplacePrices && !isTiktok && (
                                <div className="hidden group-hover:block absolute -top-10 bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                                  Harga Khusus: Rp {mpData.usedPrice.toLocaleString('id-ID')}
                                </div>
                              )}
                            </div>
                          ) : <span className="text-[10px] text-slate-300 italic uppercase">N/A</span>}
                        </td>
                      );
                    })}

                    {/* STOCK EDITING */}
                    <td className="px-6 py-5 text-center">
                      {editingStockId === p.id ? (
                        <div className="flex items-center justify-center space-x-1">
                          <input 
                            autoFocus 
                            type="number" 
                            className="w-16 p-1 border border-[#0047AB] rounded text-center text-xs font-black shadow-inner outline-none" 
                            value={tempStock} 
                            onChange={(e) => setTempStock(Number(e.target.value))} 
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateStock(p.id)} 
                          />
                          <button onClick={() => handleUpdateStock(p.id)} className="text-emerald-600 hover:scale-110 transition-transform"><CheckCircle2 size={18}/></button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => { setEditingStockId(p.id); setTempStock(p.stock); }} 
                          className={`cursor-pointer inline-block text-sm font-black p-1 px-4 rounded-lg transition-all ${p.stock <= 10 ? "text-red-600 bg-red-50 border border-red-100" : "text-[#0F172A] hover:bg-slate-100 border border-transparent"}`}
                        >
                          {p.stock}
                        </div>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-8 py-5 text-right relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)} className="p-2 hover:bg-slate-100 rounded-lg text-[#94A3B8] transition-colors"><MoreVertical size={18} /></button>
                      {activeMenuId === p.id && (
                        <div className="absolute right-10 top-12 w-44 bg-white border border-[#F1F5F9] rounded-2xl shadow-2xl z-[110] py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                          <Link href={`/inventaris/edit/${p.id}`} className="flex items-center space-x-3 px-4 py-3 text-[11px] font-black text-[#64748B] hover:bg-blue-50 hover:text-[#0047AB] transition-all border-b border-slate-50"><Edit2 size={14} /> <span>EDIT PRODUK</span></Link>
                          <button onClick={() => handleDelete(p.id)} className="w-full flex items-center space-x-3 px-4 py-3 text-[11px] font-black text-red-500 hover:bg-red-50 transition-all"><Trash2 size={14} /> <span>HAPUS DATA</span></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {processedProducts.length === 0 && (
            <div className="py-24 text-center">
              <Package size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Belum Ada Produk Terdaftar</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}