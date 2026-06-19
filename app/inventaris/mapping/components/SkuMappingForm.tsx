// app/inventaris/mapping/components/SkuMappingForm.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Info, Hash, ArrowLeftRight, ArrowLeft, Search, Check, Calculator, ShoppingBag } from 'lucide-react';

interface SkuMappingFormProps {
  products: any[];
  onSave: (formData: any) => Promise<void>;
  loading: boolean;
}

export const SkuMappingForm = ({ products, onSave, loading }: SkuMappingFormProps) => {
  const router = useRouter();
  
  const [form, setForm] = useState({
    aliasSku: '',
    targetSku: '',
    name: '',
    useCustomPrice: false,
    customPrice: '',
    multiplier: '1'
  });

  const [searchQuery, setSearchQuery] = useState(""); 
  const [debouncedQuery, setDebouncedQuery] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedQuery(searchQuery); }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return products.filter(p => 
      p.sku.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
      p.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    ).slice(0, 5);
  }, [products, debouncedQuery]);

  const selectedMasterProduct = useMemo(() => {
    return products.find(p => p.sku === form.targetSku);
  }, [products, form.targetSku]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.targetSku) {
      alert("Tolong pilih barang utama terlebih dahulu lewat kolom pencarian!");
      return;
    }
    onSave(form);
  };

  return (
    // 🚀 DOCK GRID UTAMA: Membagi area kiri (8 kolom) dan area kanan (4 kolom) secara seimbang memenuhi layar
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
      
      {/* ======================================================= */}
      {/* 📋 SISI KIRI: KOTAK ISIAN DATA BARANG (8 KOLOM DESKTOP)   */}
      {/* ======================================================= */}
      <div className="lg:col-span-8 space-y-5 bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-xs">
        
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-2">
          <div className="p-2 bg-[#F0F7FF] text-[#0047AB] rounded-xl">
            <ArrowLeftRight size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#0F172A] uppercase tracking-wider">Pemetaan SKU</h3>
            <p className="text-[9px] sm:text-[10px] text-[#94A3B8] font-black uppercase tracking-widest mt-0.5">Hubungkan kode SKU cabang ke SKU utama</p>
          </div>
        </div>

        {/* INPUT DATA SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Kode SKU Cabang</label>
            <input 
              required
              type="text"
              placeholder="Contoh: BAUT-10MM-HITAM"
              className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 font-bold text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#0047AB] transition-all"
              value={form.aliasSku}
              onChange={e => setForm({...form, aliasSku: e.target.value})}
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Cari Kode SKU Utama</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Ketik kode atau nama barang pusat..."
                className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 pl-10 pr-4 font-bold text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#0047AB] transition-all"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) setForm({...form, targetSku: ''});
                }}
                onFocus={() => setShowDropdown(true)}
              />
            </div>

            {showDropdown && searchQuery.trim() !== "" && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs max-h-48 overflow-y-auto no-scrollbar animate-in fade-in duration-150">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-none flex items-center justify-between font-bold text-[#0F172A] uppercase"
                      onClick={() => {
                        setForm({...form, targetSku: p.sku});
                        setSearchQuery(`${p.sku} - ${p.name}`);
                        setShowDropdown(false);
                      }}
                    >
                      <span className="truncate">{p.sku} - {p.name}</span>
                      {form.targetSku === p.sku && <Check size={12} className="text-[#0047AB]" />}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400 font-bold uppercase text-[10px]">Mengetik...</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* NAMA BARANG MODIFIKASI */}
        <div className="space-y-1.5">
          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Nama Produk SKU Cabang</label>
          <input 
            type="text"
            placeholder="Nama produk untuk SKU Cabang"
            className="w-full bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 font-bold text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#0047AB] transition-all"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
        </div>

        {/* TOGGLE HARGA JUAL KHUSUS */}
        <div className="bg-[#F8F9FB] p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wide">Atur Harga Berbeda di SKU Ini?</h4>
              <p className="text-[9px] sm:text-[10px] text-[#94A3B8] font-black uppercase tracking-wider mt-0.5">Aktifkan jika harga jual SKU cabang tidak sama dengan SKU Utama</p>
            </div>
            <button 
              type="button"
              onClick={() => setForm({...form, useCustomPrice: !form.useCustomPrice})}
              className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${form.useCustomPrice ? 'bg-[#0047AB]' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.useCustomPrice ? 'left-6' : 'left-1'}`}></div>
            </button>
          </div>

          {form.useCustomPrice && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200/50 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[9px] sm:text-[10px] font-black text-[#0047AB] uppercase ml-1 tracking-widest">Nominal Harga Jual Khusus Baru (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xs sm:text-sm">Rp</span>
                <input 
                  type="number"
                  required={form.useCustomPrice}
                  placeholder="Masukkan nominal harga jual baru..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-bold text-xs sm:text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0047AB] transition-all"
                  value={form.customPrice}
                  onChange={e => setForm({...form, customPrice: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        {/* RASIO KELIPATAN POTONG STOK */}
        <div className="bg-[#F8F9FB] p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <Hash size={14} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Jumlah Kelipatan Potong Stok pada SKU Utama</h4>
              <p className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest mt-0.5">Berapa unit stok SKU utama berkurang jika terjadi pembelian pada SKU Cabang?</p>
            </div>
          </div>
          <div className="relative">
            <input 
              type="number"
              min="1"
              required
              className="w-full bg-white border border-slate-200 rounded-xl py-3.5 px-4 font-bold text-xs sm:text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0047AB] transition-all"
              value={form.multiplier}
              onChange={e => setForm({...form, multiplier: e.target.value})}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-[10px] uppercase tracking-wider">Unit Per SKU</span>
          </div>
        </div>

        {/* AKSI TOMBOL SIMPAN VS KEMBALI */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => router.push('/inventaris')}
            className="flex-1 order-2 sm:order-1 bg-white border border-slate-200 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            <span>Kembali</span>
          </button>
          <button 
            disabled={loading}
            className="flex-[2] order-1 sm:order-2 bg-[#0047AB] text-white hover:bg-[#003580] disabled:opacity-40 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            {loading ? <span>Menyimpan...</span> : <span>Simpan Pemetaan SKU</span>}
          </button>
        </div>

      </div>

      {/* ======================================================= */}
      {/* 🖥️ SISI KANAN: MONITOR SIMULATOR MANDIRI (4 KOLOM DESKTOP)  */}
      {/* ======================================================= */}
      <div className="lg:col-span-4 space-y-4 w-full">
        
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calculator size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Simulasi Pemetaan</h4>
              <p className="text-[9px] text-[#94A3B8] font-black uppercase tracking-widest mt-0.5">Simulasi secara langsung</p>
            </div>
          </div>

          {selectedMasterProduct ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-[#F8F9FB] p-4 rounded-2xl border border-slate-100 text-xs font-black space-y-2 uppercase">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Barang Cabang:</span>
                  <span className="text-[#0047AB] tracking-tight truncate max-w-[140px]">{form.aliasSku || "(KOSONG)"}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 text-[10px]">Induk Pusat:</span>
                  <span className="text-[#0F172A] truncate max-w-[140px]">{selectedMasterProduct.sku}</span>
                </div>
              </div>

              <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Jika SKU Cabang Terjual 1, Maka:</p>
                <div className="text-xl font-black text-orange-600 tracking-tight">
                  Stok SKU Utama Berkurang {Number(form.multiplier) || 1} Pcs
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                  (Sisa Stok Gudang Terkini: {selectedMasterProduct.stock} Pcs)
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex justify-between text-xs font-black uppercase">
                <span className="text-slate-400">Harga SKU Cabang:</span>
                <span className="text-emerald-600">
                  Rp {form.useCustomPrice 
                    ? (Number(form.customPrice) || 0).toLocaleString('id-ID') 
                    : (selectedMasterProduct.price || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl text-[#94A3B8]">
              <ShoppingBag size={24} className="mx-auto text-slate-200 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-wider px-4 leading-normal">
                Silakan isi SKU Utama untuk melihat visual simulasi pengurangan SKU Utama
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#F0F7FF] p-5 rounded-[24px] border border-blue-100 gap-3 flex items-start">
          <Info className="text-[#0047AB] shrink-0 mt-0.5" size={16}/>
          <div>
            <h5 className="text-xs font-black text-blue-900 uppercase tracking-wide">Petunjuk Aturan Stok</h5>
            <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase mt-1">
              Setiap kali ada pesanan dengan SKU cabang, sistem otomatis memotong jumlah stok di SKU utama sesuai angka kelipatan yang diisi.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};