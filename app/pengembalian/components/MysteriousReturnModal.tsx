// components/MysteriousReturnModal.tsx
import React from 'react';
import { X, PackagePlus } from "lucide-react";
import { MysteriousReturnFormState } from "../types/retur";

interface MysteriousReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: MysteriousReturnFormState;
  setForm: React.Dispatch<React.SetStateAction<MysteriousReturnFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  products: any[];
}

export const MysteriousReturnModal = ({ isOpen, onClose, form, setForm, onSubmit, products }: MysteriousReturnModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button type="button" onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={18}/></button>
        <div className="mb-4 flex items-center gap-2.5">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><PackagePlus size={20}/></div>
          <div>
            <h2 className="text-sm font-black text-[#0F172A] uppercase">Paket Retur Tidak Terdata (Misterius)</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Resi/Order hasil input tidak terdaftar di sistem jualan ruko</p>
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nomor Resi / Pesanan Paket</label>
            <input type="text" required value={form.orderIdOrResi} onChange={(e) => setForm({...form, orderIdOrResi: e.target.value})} className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3 font-black text-slate-700 text-xs mt-1 outline-none uppercase" placeholder="Ketik/Scan No Resi Paket"/>
          </div>

          {/* 🚀 BARU: PILIHAN STATUS PENANGANAN AWAL PAKET MISTERIUS */}
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Tindakan Awal</label>
            <select value={form.penanganan} onChange={(e) => setForm({...form, penanganan: e.target.value as any})} className="w-full bg-amber-50 border border-amber-100 rounded-xl py-2.5 px-3 font-black text-[#0F172A] text-xs mt-1 outline-none">
              <option value="Pending SKU">⚠️ Karantina SKU (Butuh Verifikasi SKU)</option>
              <option value="Proses">🔄 Sedang Diproses (Butuh Diperiksa / Investigasi Fisik)</option>
              <option value="Selesai">✅ Selesai (Fisik OK, Langsung Masuk Rak & Potong Laba)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pilih Marketplace Asal</label>
              <select value={form.marketplace} onChange={(e) => setForm({...form, marketplace: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 font-black text-[#0F172A] text-xs mt-1 outline-none">
                <option value="Shopee">Shopee</option>
                <option value="TikTok Shop">TikTok Shop</option>
                <option value="Lazada">Lazada</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SKU Jodoh Produk</label>
              <input list="sku-mystery-list" required value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 font-black text-[#0F172A] text-xs mt-1 uppercase outline-none" placeholder="Cari SKU Ruko..."/>
              <datalist id="sku-mystery-list">{products.map(p => <option key={p.id} value={p.sku}>{p.name}</option>)}</datalist>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty Retur</label>
              <input type="number" min="1" required value={form.qty} onChange={(e) => setForm({...form, qty: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 font-black text-[#0F172A] text-xs mt-1 outline-none"/>
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catatan Lapangan Gudang</label>
              <input required value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 font-bold text-[#0F172A] text-xs mt-1 outline-none" placeholder="Contoh: Barang tertukar / tunggu diunboxing"/>
            </div>
          </div>
          <button type="submit" className="w-full bg-[#0047AB] text-white py-3 rounded-xl font-black text-xs uppercase shadow-xs mt-2">Daftarkan Kasus Paket</button>
        </form>
      </div>
    </div>
  );
};