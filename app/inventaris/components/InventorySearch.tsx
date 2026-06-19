// app/inventaris/components/InventorySearch.tsx
import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

interface SearchProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  sortBy: string;
  setSortBy: (val: any) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (val: "asc" | "desc") => void;
}

export const InventorySearch = ({ searchTerm, setSearchTerm, sortBy, setSortBy, sortOrder, setSortOrder }: SearchProps) => (
  <div className="px-4 sm:px-10 mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
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
      <button type="button" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="p-2 hover:bg-slate-50 rounded-lg text-[#0047AB] transition-colors shrink-0">
        <ArrowUpDown size={14} />
      </button>
    </div>
  </div>
);