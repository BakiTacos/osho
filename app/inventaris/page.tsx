"use client";

import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { Search, Bell, Plus, Package, MoreVertical, Edit2, Trash2, Check, ArrowUpDown, Download, Loader2 } from "lucide-react";

// IMPORT CLEAN ARCHITECTURE
import { useInventoryData, Product } from "../hooks/useInventoryData";
import { InventoryService } from "../../lib/services/InventoryService";
import { InventoryStats } from "../../components/inventory/InventoryStats";

export default function InventarisPage() {
  const { currentUser } = useAuth();
  
  // Custom Hook & Service
  const { products, activeFees } = useInventoryData(currentUser);
  const inventoryService = new InventoryService(currentUser, activeFees);

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

  // Handlers linked to Service
  const handleMassImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsImporting(true);
    try {
      const count = await inventoryService.processMassImport(file);
      alert(`Impor selesai. ${count} SKU unik berhasil diproses.`);
    } catch (err) {
      alert("Format file tidak didukung atau kolom salah.");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus produk ini dari inventaris?")) {
      await inventoryService.deleteProduct(id);
      setActiveMenuId(null);
    }
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
        const estA = inventoryService.getMarketplaceEstimation(a.price, a.costPrice, a.isMapping ? a.multiplier : 1);
        const estB = inventoryService.getMarketplaceEstimation(b.price, b.costPrice, b.isMapping ? b.multiplier : 1);
        valA = sortBy === "netProfit" ? (estA?.shopee?.netProfit || 0) : (estA?.shopee?.margin || 0);
        valB = sortBy === "netProfit" ? (estB?.shopee?.netProfit || 0) : (estB?.shopee?.margin || 0);
      } else {
        valA = a[sortBy as keyof Product] || 0;
        valB = b[sortBy as keyof Product] || 0;
      }
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-10">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-4">
        <div className="relative flex-1 lg:flex-none lg:w-96 ml-16 lg:ml-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input type="text" placeholder="Cari produk atau SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#EDF2F7] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#0047AB]" />
        </div>
        <div className="flex items-center space-x-6">
          <Bell size={20} className="hidden sm:block cursor-pointer text-[#64748B] hover:text-[#0047AB]" />
          <div className="flex items-center space-x-3 border-l pl-6"><span className="hidden md:block text-sm font-bold text-[#0F172A]">KIA</span><div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center text-xs font-black">K</div></div>
        </div>
      </div>

      {/* TITLE & ACTIONS */}
      <div className="px-4 sm:px-10 mt-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter leading-tight">Inventaris</h1>
          <p className="text-[#64748B] mt-2 text-sm font-medium">Manajemen stok dan performa margin produk secara massal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative">
            <input type="file" accept=".xlsx, .xls" onChange={handleMassImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isImporting} />
            <button className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center space-x-2">
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={3} />}<span>{isImporting ? "Memproses..." : "Impor Excel"}</span>
            </button>
          </div>
          <Link href="/inventaris/tambah"><button className="bg-[#0047AB] text-white px-5 py-3 rounded-xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center space-x-2"><Plus size={16} strokeWidth={3} /><span>Tambah Produk</span></button></Link>
          <Link href="/inventaris/mapping"><button className="bg-white text-[#0047AB] border-2 border-[#0047AB] px-5 py-3 rounded-xl font-black text-xs hover:bg-blue-50 transition-all flex items-center space-x-2"><ArrowUpDown size={16} strokeWidth={3} /><span>Mapping SKU</span></button></Link>
          <Link href="/inventaris/multi-edit"><button className="bg-white text-emerald-600 border-2 border-emerald-600 px-5 py-3 rounded-xl font-black text-xs hover:bg-emerald-50 transition-all flex items-center space-x-2"><Edit2 size={16} strokeWidth={3} /><span>Edit Massal</span></button></Link>
        </div>
      </div>

      <InventoryStats totalProducts={products.length} lowStockCount={lowStockCount} outOfStockCount={outOfStockCount} />

      {/* FILTER & SORT */}
      <div className="px-4 sm:px-10 mt-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-sm overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-[#0047AB] text-white shadow-md" : "text-[#64748B] hover:bg-slate-50"}`}>{cat}</button>
          ))}
        </div>
        <div className="flex bg-white rounded-xl border border-[#E2E8F0] p-1 shadow-sm items-center">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent border-none text-[10px] font-black text-[#0F172A] uppercase tracking-wider focus:ring-0 px-3">
            <option value="name">Urut: Nama</option><option value="stock">Urut: Stok</option><option value="price">Urut: Harga Jual</option><option value="netProfit">Urut: Keuntungan (Rp)</option><option value="netMargin">Urut: Margin (%)</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="p-1.5 hover:bg-slate-50 rounded-lg text-[#0047AB]"><ArrowUpDown size={14} /></button>
        </div>
      </div>

      {/* TABLE */}
      <div className="px-4 sm:px-10 py-8">
        <div className="bg-white rounded-[28px] border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                  <th className="px-8 py-5">Produk</th><th className="px-6 py-5">SKU</th><th className="px-6 py-5 text-right">HPP (Modal)</th><th className="px-6 py-5 text-right">Jual</th>
                  <th className="px-4 py-5 text-center bg-orange-50/30">Shopee</th><th className="px-4 py-5 text-center bg-slate-50">TikTok</th><th className="px-4 py-5 text-center bg-blue-50/30">Lazada</th>
                  <th className="px-6 py-5 text-center">Stok</th><th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F9FB]">
                {processedProducts.map((p) => {
                  const multiplier = p.isMapping ? (p.multiplier || 1) : 1;
                  const est = inventoryService.getMarketplaceEstimation(p.price, p.costPrice, multiplier);
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5"><div className="flex items-center space-x-4"><span className="text-sm font-black text-[#0F172A] uppercase leading-tight">{p.name}</span></div></td>
                      <td className="px-6 py-5 text-xs font-bold text-[#64748B] uppercase">{p.sku}</td>
                      <td className="px-6 py-5 text-right text-xs font-bold text-slate-400">Rp {(p.costPrice * multiplier).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-5 text-right text-xs font-black text-[#0F172A]">Rp {p.price.toLocaleString('id-ID')}</td>
                      {['shopee', 'tiktok', 'lazada'].map((mp) => (
                        <td key={mp} className="px-4 py-5 text-center border-l border-slate-50">
                          {est && est[mp] ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-[11px] font-black ${est[mp].netProfit > 0 ? "text-emerald-600" : "text-red-500"}`}>Rp {est[mp].netProfit.toLocaleString('id-ID')}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md mt-1 ${est[mp].margin >= 15 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{est[mp].margin.toFixed(1)}%</span>
                            </div>
                          ) : (<span className="text-[10px] text-slate-300 italic">No Data</span>)}
                        </td>
                      ))}
                      <td className="px-6 py-5 text-center">
                        {editingStockId === p.id ? (
                          <div className="flex items-center justify-center space-x-1">
                            <input autoFocus type="number" className="w-16 p-1 border border-[#0047AB] rounded text-center text-xs font-black" value={tempStock} onChange={(e) => setTempStock(Number(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && handleUpdateStock(p.id)} />
                            <button onClick={() => handleUpdateStock(p.id)} className="text-green-600"><Check size={16}/></button>
                          </div>
                        ) : (
                          <div onClick={() => { setEditingStockId(p.id); setTempStock(p.stock); }} className={`cursor-pointer inline-block text-sm font-black p-1 px-3 rounded-md transition-all ${p.stock <= 10 ? "text-red-600 bg-red-50" : "text-[#0F172A] hover:bg-slate-100"}`}>{p.stock}</div>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right relative">
                        <button onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)} className="p-2 hover:bg-slate-100 rounded-lg text-[#94A3B8]"><MoreVertical size={18} /></button>
                        {activeMenuId === p.id && (
                          <div className="absolute right-10 top-12 w-40 bg-white border border-[#F1F5F9] rounded-xl shadow-2xl z-[110] py-1">
                            <Link href={`/inventaris/edit/${p.id}`} className="flex items-center space-x-3 px-4 py-3 text-xs font-black text-[#64748B] hover:bg-blue-50 hover:text-[#0047AB]"><Edit2 size={14} /> <span>Edit Produk</span></Link>
                            <button onClick={() => handleDelete(p.id)} className="w-full flex items-center space-x-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50"><Trash2 size={14} /> <span>Hapus</span></button>
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
      </div>
    </div>
  );
}