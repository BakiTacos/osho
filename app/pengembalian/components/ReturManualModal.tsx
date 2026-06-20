// components/ReturManualModal.tsx
import React from 'react';
import { X, AlertTriangle } from "lucide-react";
import { ManualFormState } from "../types/retur";

interface ReturManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ManualFormState;
  setForm: React.Dispatch<React.SetStateAction<ManualFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  products: any[];
}

export const ReturManualModal = ({ isOpen, onClose, form, setForm, onSubmit, products }: ReturManualModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-6 sm:p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={18}/></button>
        <div className="mb-4">
          <div className="w-11 h-11 bg-blue-50 text-[#0047AB] rounded-2xl flex items-center justify-center mb-2"><AlertTriangle size={20}/></div>
          <h2 className="text-base font-black text-[#0F172A] uppercase tracking-tight">Input Barang Manual</h2>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kondisi Barang</label>
            <select value={form.kondisi} onChange={(e) => setForm({...form, kondisi: e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-black text-[#0F172A] text-xs mt-1 outline-none">
              <option value="Rusak">❌ Rusak / Cacat (Potong Stok & Biaya OPEX)</option>
              <option value="Bagus">✅ Masih Bagus / Nyasar (Tambah Kembali ke Stok Rak)</option>
            </select>
          </div>

          {/* 🚀 BARU: SELEKTOR PILIHAN ASAL MARKETPLACE */}
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asal Toko / Sumber</label>
            <select value={form.marketplace} onChange={(e) => setForm({...form, marketplace: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-black text-[#0F172A] text-xs mt-1 outline-none">
              <option value="Shopee">Shopee</option>
              <option value="TikTok Shop">TikTok Shop</option>
              <option value="Lazada">Lazada</option>
              <option value="Gudang Offline">Gudang Offline / Manual</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU Produk</label>
            <input list="sku-list" required value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-black text-[#0F172A] text-xs mt-1 uppercase outline-none focus:ring-2 focus:ring-[#0047AB]" placeholder="Ketik SKU..."/>
            <datalist id="sku-list">
              {products.map(p => <option key={p.id} value={p.sku}>{p.name}</option>)}
            </datalist>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah</label>
              <input type="number" min="1" required value={form.qty} onChange={(e) => setForm({...form, qty: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-black text-[#0F172A] text-xs mt-1 outline-none"/>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Alasan</label>
              <input required value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-bold text-[#0F172A] text-xs mt-1 outline-none" placeholder="Paket retur nyasar ketemu"/>
            </div>
          </div>
          
          <button type="submit" className="w-full bg-[#0047AB] text-white py-3 rounded-xl font-black text-xs uppercase shadow-xs mt-2">Proses Pengembalian</button>
        </form>
      </div>
    </div>
  );
};