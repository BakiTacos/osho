import React from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';

export const ManualInputModal = ({ isOpen, onClose, manualForm, setManualForm, useCatalogPrice, setUseCatalogPrice, isProcessing, onSubmit, addManualItem, removeManualItem, updateManualItem }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div><h2 className="text-2xl font-black text-[#0F172A] tracking-tighter">Manual Multi-Input</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Satu Nomor Pesanan untuk Banyak Produk</p></div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X/></button>
        </div>
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nomor Pesanan</label><input required value={manualForm.orderId} onChange={(e) => setManualForm({...manualForm, orderId: e.target.value})} placeholder="ID Pesanan" className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-blue-100" /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Sumber</label><select value={manualForm.source} onChange={(e) => setManualForm({...manualForm, source: e.target.value})} className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm"><option>Shopee</option><option>Tiktok</option><option>Lazada</option><option>Offline</option></select></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Status</label><select value={manualForm.status} onChange={(e) => setManualForm({...manualForm, status: e.target.value})} className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm"><option value="Proses">Proses</option><option value="Selesai">Selesai</option></select></div>
          </div>
          <div className="flex items-center justify-between"><h4 className="text-[11px] font-black text-[#0047AB] uppercase tracking-[0.2em]">Daftar Produk ({manualForm.items.length})</h4><button type="button" onClick={() => setUseCatalogPrice(!useCatalogPrice)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all border-2 ${useCatalogPrice ? "bg-[#0047AB] text-white shadow-md shadow-blue-100" : "text-slate-400"}`}>{useCatalogPrice ? "Gunakan Harga Katalog" : "Gunakan Harga Manual"}</button></div>
          <div className="space-y-4">
            {manualForm.items.map((item: any, index: number) => (
              <div key={index} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col gap-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2"><input required value={item.sku} onChange={(e) => updateManualItem(index, 'sku', e.target.value)} placeholder="SKU Produk" className="w-full bg-white border-none rounded-2xl py-3 px-5 font-bold text-sm" /></div>
                  <div className="flex items-center bg-white rounded-2xl px-3 shadow-sm"><span className="text-[9px] font-black text-slate-300 mr-2 uppercase">Qty</span><input type="number" min="1" required value={item.qty} onChange={(e) => updateManualItem(index, 'qty', e.target.value)} className="w-full border-none font-black text-[#0047AB] text-center" /></div>
                  {manualForm.items.length > 1 && (<button type="button" onClick={() => removeManualItem(index)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl self-center md:self-auto"><Trash2 size={18}/></button>)}
                </div>
                {!useCatalogPrice && (<div className="grid grid-cols-2 gap-4"><div className="flex items-center bg-white rounded-2xl px-5"><span className="text-[9px] font-black text-slate-300 mr-2">RP</span><input type="number" placeholder="Jual per Unit" value={item.manualPrice} onChange={(e) => updateManualItem(index, 'manualPrice', e.target.value)} className="w-full border-none py-3 font-bold text-sm" /></div><div className="flex items-center bg-white rounded-2xl px-5"><span className="text-[9px] font-black text-slate-300 mr-2">MODAL</span><input type="number" placeholder="Modal per Unit" value={item.manualCost} onChange={(e) => updateManualItem(index, 'manualCost', e.target.value)} className="w-full border-none py-3 font-bold text-sm" /></div></div>)}
              </div>
            ))}
          </div>
          <button type="button" onClick={addManualItem} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 font-black text-[10px] uppercase hover:border-[#0047AB] hover:text-[#0047AB] transition-all flex items-center justify-center gap-2 hover:bg-blue-50/30"><Plus size={16}/> Tambah Produk Lagi</button>
        </form>
        <div className="p-10 border-t border-slate-50 bg-white"><button type="submit" onClick={onSubmit} disabled={isProcessing} className="w-full bg-[#0047AB] text-white py-5 rounded-[24px] font-black text-sm shadow-xl flex items-center justify-center gap-2">{isProcessing ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20} strokeWidth={3}/>}{isProcessing ? "MEMPROSES..." : "SIMPAN SEMUA & POTONG STOK"}</button></div>
      </div>
    </div>
  );
};