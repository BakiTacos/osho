import React from 'react';
import { X, Plus, Trash2, Landmark, Pencil } from 'lucide-react';

export const WithdrawModal = ({ isOpen, onClose, form, setForm, onSubmit }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black tracking-tighter">Tarik Saldo</h2><button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X/></button></div>
        <form onSubmit={onSubmit} className="space-y-4">
          <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}><option>Shopee</option><option>TikTok Shop</option><option>Lazada</option><option>Offline</option></select>
          <input type="number" required placeholder="Nominal Rp" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          <button type="submit" className="w-full py-4 bg-[#0047AB] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Konfirmasi Penarikan</button>
        </form>
      </div>
    </div>
  );
};

export const ExpenseModal = ({ isOpen, onClose, form, setForm, onSubmit }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black tracking-tighter text-orange-500">Input Opex</h2><button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X/></button></div>
        <form onSubmit={onSubmit} className="space-y-4">
          <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option>Listrik/Air</option><option>Gaji Karyawan</option><option>Iklan/Ads</option><option>Sewa Tempat</option><option>Packaging</option><option>Lainnya</option></select>
          <input required className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" placeholder="Deskripsi" onChange={e => setForm({...form, description: e.target.value})} />
          <input type="number" required placeholder="Jumlah Rp" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" onChange={e => setForm({...form, amount: e.target.value})} />
          <button type="submit" className="w-full mt-4 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Simpan Pengeluaran</button>
        </form>
      </div>
    </div>
  );
};

export const InvoiceModal = ({ isOpen, onClose, form, setForm, items, setItems, products, onSubmit }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative no-scrollbar">
        <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black tracking-tighter">Tambah Nota & Restock</h2><button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X/></button></div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nomor Nota</label><input required value={form.noNota} className="w-full bg-slate-50 rounded-2xl py-4 px-6 font-bold text-sm border-none focus:ring-2 focus:ring-[#0047AB]" placeholder="Contoh: INV/2024/001" onChange={e => setForm({...form, noNota: e.target.value})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nama Supplier</label><input required value={form.supplier} className="w-full bg-slate-50 rounded-2xl py-4 px-6 font-bold text-sm border-none focus:ring-2 focus:ring-[#0047AB]" placeholder="Nama Toko / Distributor" onChange={e => setForm({...form, supplier: e.target.value})} /></div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2"><h5 className="text-[10px] font-black uppercase text-[#0047AB] tracking-widest">Detail Item Belanja</h5><button type="button" onClick={() => setItems([...items, {sku:'', name:'', qty:1, price:0, unit:'lusin'}])} className="flex items-center gap-2 text-[9px] font-black bg-blue-50 text-[#0047AB] px-4 py-2 rounded-xl hover:bg-blue-100 transition-all"><Plus size={12}/> TAMBAH ITEM</button></div>
            <div className="grid grid-cols-12 gap-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"><div className="col-span-2">SKU Produk</div><div className="col-span-3">Nama Barang</div><div className="col-span-2">Satuan</div><div className="col-span-2 text-center">Qty</div><div className="col-span-2">Harga Beli</div><div className="col-span-1"></div></div>
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="grid grid-cols-12 gap-3 bg-slate-50/50 p-3 rounded-2xl items-center border border-slate-100">
                  <input required className="col-span-2 bg-white py-3 px-4 rounded-xl text-xs font-bold border-none shadow-sm focus:ring-2 focus:ring-blue-200" placeholder="SKU" value={item.sku} onChange={e => { const newItems = [...items]; newItems[idx].sku = e.target.value; const matched = products.find((p: any) => p.sku === e.target.value.toUpperCase()); if(matched) newItems[idx].name = matched.name; setItems(newItems); }}/>
                  <input className="col-span-3 bg-transparent py-3 px-4 rounded-xl text-xs font-bold text-slate-400 border-none" placeholder="Nama Produk" value={item.name} readOnly/>
                  <select className="col-span-2 bg-white py-3 px-2 rounded-xl text-xs font-black text-[#0047AB] border-none shadow-sm cursor-pointer" value={item.unit} onChange={e => { const newItems = [...items]; newItems[idx].unit = e.target.value; setItems(newItems); }}><option value="lusin">Lusin (x12)</option><option value="pcs">Pcs (Satuan)</option></select>
                  <input type="number" required min="1" className="col-span-2 bg-white py-3 px-4 rounded-xl text-xs font-bold text-center border-none shadow-sm focus:ring-2 focus:ring-blue-200" value={item.qty} onChange={e => { const newItems = [...items]; newItems[idx].qty = Number(e.target.value); setItems(newItems); }}/>
                  <input type="number" required min="1" className="col-span-2 bg-white py-3 px-4 rounded-xl text-xs font-black text-[#0047AB] border-none shadow-sm focus:ring-2 focus:ring-blue-200" placeholder="Rp" value={item.price || ''} onChange={e => { const newItems = [...items]; newItems[idx].price = Number(e.target.value); setItems(newItems); }}/>
                  <button type="button" onClick={() => setItems(items.filter((_: any, i: number) => i !== idx))} className="col-span-1 text-red-300 hover:text-red-500 transition-all flex justify-center"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-6 border-t border-slate-50">
            <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ringkasan Biaya</p><div className="text-2xl font-black text-[#0F172A]">Rp {items.reduce((a: any,b: any) => a + (b.qty * b.price), 0).toLocaleString('id-ID')}</div></div>
            <div className="flex gap-3"><button type="button" onClick={onClose} className="px-8 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">Batal</button><button type="submit" className="px-10 py-4 bg-[#0047AB] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all">Simpan Nota & Update Stok</button></div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const HistoryModal = ({ isOpen, onClose, withdrawals, onDelete, onEdit }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black tracking-tighter">Riwayat Penarikan</h2><button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X/></button></div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
          {withdrawals.map((w: any) => (
            <div key={w.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group transition-all">
              <div className="flex items-center gap-4"><div className="p-2 bg-white rounded-lg text-[#0047AB] shadow-sm"><Landmark size={16}/></div><div><p className="text-[11px] font-black">{w.platform}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{w.createdAt?.toDate().toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p></div></div>
              <div className="flex items-center gap-2"><p className="text-sm font-black text-[#0F172A]">Rp {w.amount.toLocaleString('id-ID')}</p><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => onEdit(w)} className="p-1.5 text-slate-400 hover:text-[#0047AB] bg-white rounded-lg shadow-sm"><Pencil size={12}/></button><button onClick={() => onDelete(w.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg shadow-sm"><Trash2 size={12}/></button></div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};