// components/ReturManualModal.tsx
import React from 'react';
import { X, Trash2 } from "lucide-react";
import { AfkirFormState } from "../types/retur";

interface ReturManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: AfkirFormState;
  setForm: React.Dispatch<React.SetStateAction<AfkirFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  products: any[];
}

export const ReturManualModal = ({ isOpen, onClose, form, setForm, onSubmit, products }: ReturManualModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button type="button" onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={18}/></button>
        <div className="mb-4 flex items-center gap-2.5">
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><Trash2 size={20}/></div>
          <div>
            <h2 className="text-sm font-black text-[#0F172A] uppercase">Penyusutan Gudang (Internal)</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Gunakan murni untuk barang cacat/rusak di dalam rak ruko</p>
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kondisi / Tindakan</label>
            <select value={form.kondisi} onChange={(e) => setForm({...form, kondisi: e.target.value as any})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 font-black text-[#0F172A] text-xs mt-1 outline-none">
              <option value="Rusak">❌ Rusak / Cacat (Potong Stok & Catat Pengeluaran)</option>
              <option value="Bagus">✅ Masih Bagus / Nyasar (Tambah Kembali ke Stok Rak)</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SKU Barang Ruko</label>
            <input list="sku-internal-list" required value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 font-black text-[#0F172A] text-xs mt-1 uppercase outline-none" placeholder="Ketik SKU..."/>
            <datalist id="sku-internal-list">{products.map(p => <option key={p.id} value={p.sku}>{p.name}</option>)}</datalist>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jumlah</label>
              <input type="number" min="1" required value={form.qty} onChange={(e) => setForm({...form, qty: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 font-black text-[#0F172A] text-xs mt-1 outline-none"/>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Keterangan Kerusakan</label>
              <input required value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 font-bold text-[#0F172A] text-xs mt-1 outline-none" placeholder="Contoh: Digigit tikus / patah"/>
            </div>
          </div>
          <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-xs uppercase shadow-xs mt-2">Eksekusi Potong Stok</button>
        </form>
      </div>
    </div>
  );
};