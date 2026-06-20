import React from 'react';
import { Search, Filter, Upload, AlertTriangle, Loader2 } from "lucide-react";

interface ReturFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  isImporting: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, mp: "shopee" | "tiktok") => void;
  onOpenManualModal: () => void;
}

export const ReturFilters = ({
  searchTerm, setSearchTerm, statusFilter, setStatusFilter, isImporting, onFileUpload, onOpenManualModal
}: ReturFiltersProps) => (
  <div className="space-y-4 w-full">
    {/* BARIS UTAMA ATAS */}
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input 
          type="text" 
          placeholder="Cari No. Pesanan atau Nama Produk..." 
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0047AB] transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="relative w-full sm:w-auto shrink-0">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-8 text-[10px] sm:text-xs font-black text-slate-600 uppercase outline-none focus:ring-2 focus:ring-[#0047AB] transition-all cursor-pointer shadow-sm appearance-none"
        >
          <option value="Semua">Semua Status</option>
          <option value="Proses">🔄 Sedang Diproses</option>
          <option value="Pending SKU">⚠️ Karantina SKU Misterius</option>
          <option value="Menunggu Barang">🚚 Menunggu Barang</option>
          <option value="Selesai">✅ Selesai (Barang OK)</option>
          <option value="Rusak">❌ Barang Rusak</option>
          <option value="Tidak Kembali">⚠️ Tidak Kembali</option>
          <option value="Afkir">🗑️ Penyusutan Gudang</option>
        </select>
      </div>
    </div>

    {/* 🚀 KUNCI PERBAIKAN: HIDDEN EXCEL DI MOBILE UI & PENYATUAN INTEGRASI TOMBOL AKSI */}
    <div className="hidden md:flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2">Pusat Integrasi & Manajemen Kasus Retur</p>
      
      <div className="flex items-center gap-3">
        {/* AKSI IMPOR EXCEL INTEGRAL SHOPEE */}
        <label className="cursor-pointer flex items-center gap-2 bg-orange-50 border border-orange-100 px-3.5 py-2 rounded-xl text-[10px] font-black text-orange-700 uppercase hover:bg-orange-100 transition-all shadow-2xs">
          {isImporting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          <span>Impor Shopee</span>
          <input type="file" className="hidden" onChange={(e) => onFileUpload(e, "shopee")} accept=".xlsx, .xls" disabled={isImporting} />
        </label>

        {/* AKSI IMPOR EXCEL INTEGRAL TIKTOK */}
        <label className="cursor-pointer flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-[10px] font-black text-white uppercase hover:bg-slate-800 transition-all shadow-2xs">
          {isImporting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          <span>Impor TikTok</span>
          <input type="file" className="hidden" onChange={(e) => onFileUpload(e, "tiktok")} accept=".xlsx, .xls" disabled={isImporting} />
        </label>

        {/* AKSI MANUAL */}
        <button onClick={onOpenManualModal} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition-all shadow-2xs">
          <AlertTriangle size={13} />
          <span>Input Barang Manual</span>
        </button>
      </div>
    </div>

    {/* FLOAT ACTION TOMBOL MANUAL KHUSUS HP MOBILE */}
    <div className="md:hidden w-full">
      <button onClick={onOpenManualModal} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-sm">
        <AlertTriangle size={14} />
        <span>Input Barang Manual Gudang</span>
      </button>
    </div>
  </div>
);