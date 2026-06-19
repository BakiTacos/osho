import React from 'react';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';

export const AddWarehouseModal = ({ isOpen, onClose, form, setForm, onSubmit, isProcessing }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black tracking-tighter text-[#0F172A]">Input Resi Kilat</h2>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X/></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nomor Resi / Order ID</label>
            <input required value={form.resi} className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#0047AB]" placeholder="Contoh: SPXID..." onChange={e => setForm({...form, resi: e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">SKU Produk</label>
              <input required value={form.sku} className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#0047AB]" placeholder="SKU" onChange={e => setForm({...form, sku: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest text-center block">Qty</label>
              <input type="number" required value={form.qty} className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-black text-sm text-center text-[#0047AB]" onChange={e => setForm({...form, qty: Number(e.target.value)})} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Catatan / Note</label>
            <input value={form.note} className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#0047AB]" placeholder="Note" onChange={e => setForm({...form, note: e.target.value})} />
          </div>

          <div className="bg-amber-50 p-6 rounded-[28px] border border-amber-100 flex gap-4">
            <AlertCircle className="text-amber-600 shrink-0" size={20}/>
            <p className="text-[10px] font-black text-amber-700 leading-relaxed uppercase">
              PERINGATAN: Menyimpan data ini akan <span className="underline decoration-2">Lansung Mengurangi Stok Utama</span> di Inventaris karena barang dianggap telah dikirim ke Shopee.
            </p>
          </div>

          <button type="submit" disabled={isProcessing} className="w-full bg-[#0047AB] text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
            {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20} strokeWidth={3}/>}
            {isProcessing ? "MEMPROSES..." : "SIMPAN & POTONG STOK"}
          </button>
        </form>
      </div>
    </div>
  );
};