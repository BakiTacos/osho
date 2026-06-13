import React, { useState } from 'react';
import { X, Plus, Trash2, Landmark, Pencil, AlertCircle } from 'lucide-react';

export const WithdrawModal = ({ isOpen, onClose, form, setForm, onSubmit }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black tracking-tighter">Tarik Saldo</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full">
            <X/>
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* FIELD TANGGAL (NEW) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tanggal Penarikan</label>
            <input 
              type="date" 
              required 
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm text-[#0F172A] cursor-pointer focus:ring-2 focus:ring-blue-100" 
              value={form.date || new Date().toISOString().split('T')[0]} 
              onChange={e => setForm({...form, date: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Sumber Saldo</label>
             <select 
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" 
              value={form.platform} 
              onChange={e => setForm({...form, platform: e.target.value})}
             >
               <option>Shopee</option>
               <option>TikTok Shop</option>
               <option>Lazada</option>
               <option>Rekening Toko</option>
               <option>Offline</option>
             </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nominal Tarik</label>
            <input 
              type="number" 
              required 
              placeholder="Nominal Rp" 
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-black text-xl text-[#0047AB] focus:ring-2 focus:ring-blue-100" 
              value={form.amount || ""} 
              onChange={e => setForm({...form, amount: e.target.value})} 
            />
          </div>

          <button type="submit" className="w-full mt-6 py-4 bg-[#0047AB] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-800 hover:scale-[1.02] transition-all">
            Konfirmasi Penarikan
          </button>
        </form>
      </div>
    </div>
  );
};

export const ExpenseModal = ({ isOpen, onClose, form, setForm, onSubmit }: any) => {
  const [isCustomPayer, setIsCustomPayer] = useState(false);

  // Daftar nama default di database/bisnis
  const defaultPayers = ["KEVIN", "VALENT"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black tracking-tighter text-orange-500">Input Operasional</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
            <X/>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          
          {/* FIELD TANGGAL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tanggal Pengeluaran</label>
            <input 
              type="date" 
              required 
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm text-[#0F172A] cursor-pointer" 
              value={form.date || new Date().toISOString().split('T')[0]} 
              onChange={e => setForm({...form, date: e.target.value})} 
            />
          </div>

          {/* FIELD DIBAYAR OLEH (DENGAN VALIDASI) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center ml-2 mr-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dibayar Oleh</label>
              <button 
                type="button" 
                onClick={() => {
                  setIsCustomPayer(!isCustomPayer);
                  // Kosongkan form.paidBy setiap ganti mode agar user wajib input ulang
                  setForm({...form, paidBy: ""}); 
                }} 
                className="text-[9px] font-black text-[#0047AB] uppercase hover:underline"
              >
                {isCustomPayer ? "Pilih dari Daftar" : "Ketik Manual"}
              </button>
            </div>
            
            {isCustomPayer ? (
              <input 
                type="text" 
                required 
                placeholder="Ketik Nama Pembayar..." 
                className="w-full bg-white border-2 border-orange-100 focus:border-orange-500 focus:ring-0 rounded-2xl py-4 px-6 font-black text-sm uppercase transition-all" 
                value={form.paidBy || ""} 
                onChange={e => setForm({...form, paidBy: e.target.value.toUpperCase()})}
              />
            ) : (
              <select 
                required // Paksa HTML5 untuk memvalidasi select ini
                className={`w-full border-none rounded-2xl py-4 px-6 font-bold text-sm cursor-pointer transition-colors ${!form.paidBy ? 'bg-orange-50 text-orange-400' : 'bg-slate-50 text-[#0F172A]'}`} 
                value={form.paidBy || ""} 
                onChange={e => setForm({...form, paidBy: e.target.value})}
              >
                {/* Opsi default yang ditaruh paling atas, tidak bernilai (value=""), dan disembunyikan saat dropdown dibuka (hidden) */}
                <option value="" disabled hidden>-- Pilih Pembayar --</option>
                {defaultPayers.map(payer => (
                  <option key={payer} value={payer}>{payer}</option>
                ))}
              </select>
            )}
          </div>

          {/* FIELD KATEGORI */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Kategori Biaya</label>
            <select 
              required
              className={`w-full border-none rounded-2xl py-4 px-6 font-bold text-sm cursor-pointer transition-colors ${!form.category ? 'bg-orange-50 text-orange-400' : 'bg-slate-50 text-[#0F172A]'}`} 
              value={form.category || ""} 
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option value="" disabled hidden>-- Pilih Kategori --</option>
              <option value="MAKAN">MAKAN</option>
              <option value="Listrik/Air">Listrik/Air</option>
              <option value="Gaji Karyawan">Gaji Karyawan</option>
              <option value="Iklan/Ads">Iklan/Ads</option>
              <option value="Sewa Tempat">Sewa Tempat</option>
              <option value="Packaging">Packaging</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* FIELD KETERANGAN */}
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Keterangan</label>
             <input 
              required 
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" 
              placeholder="Deskripsi pengeluaran..." 
              value={form.description || ""} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>

          {/* FIELD NOMINAL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Total Nominal</label>
            <input 
              type="number" 
              required 
              placeholder="Rp 0" 
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-black text-xl text-orange-600 focus:ring-2 focus:ring-orange-200" 
              value={form.amount || ""} 
              onChange={e => setForm({...form, amount: e.target.value})} 
            />
          </div>

          <button type="submit" className="w-full mt-4 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-orange-200 hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all">
            Simpan Pengeluaran
          </button>
        </form>
      </div>
    </div>
  );
};

export const InvoiceModal = ({ 
  isOpen, 
  onClose, 
  form, 
  setForm, 
  items, 
  setItems, 
  products, 
  suppliers = [],
  onSubmit 
}: any) => {
  if (!isOpen) return null;

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const matchedSup = suppliers.find((s: any) => s.name === selectedName);
    
    let autoNota = form.noNota || '';
    
    if (matchedSup) {
      // Bikin format otomatis: KODE-YYYYMMDD- (Misal: SUPARTA-20260613-)
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      autoNota = `${matchedSup.code}-${today}-`;
    }

    setForm({ ...form, supplier: selectedName, noNota: autoNota });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative no-scrollbar">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black tracking-tighter">Tambah Nota & Restock</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nama Supplier</label>
              <select 
                required 
                value={form.supplier} 
                onChange={handleSupplierChange}
                className="w-full bg-slate-50 rounded-2xl py-4 px-6 font-bold text-sm border-none focus:ring-2 focus:ring-[#0047AB] cursor-pointer outline-none appearance-none"
              >
                <option value="" disabled>Pilih Supplier Terdaftar...</option>
                {suppliers.map((sup: any) => (
                  <option key={sup.id} value={sup.name}>
                    {sup.name} ({sup.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nomor Nota</label>
              <input 
                required 
                value={form.noNota} 
                onChange={e => setForm({...form, noNota: e.target.value})} 
                className="w-full bg-slate-50 rounded-2xl py-4 px-6 font-bold text-sm border-none focus:ring-2 focus:ring-[#0047AB] outline-none uppercase" 
                placeholder="Contoh: SUPARTA-20260613-001" 
              />
            </div>
            
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h5 className="text-[10px] font-black uppercase text-[#0047AB] tracking-widest">Detail Item Belanja</h5>
              <button type="button" onClick={() => setItems([...items, {sku:'', name:'', qty:1, price:0, unit:'lusin'}])} className="flex items-center gap-2 text-[9px] font-black bg-blue-50 text-[#0047AB] px-4 py-2 rounded-xl hover:bg-blue-100 transition-all">
                <Plus size={12}/> TAMBAH ITEM
              </button>
            </div>
            
            <div className="grid grid-cols-12 gap-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <div className="col-span-2">SKU Produk</div>
              <div className="col-span-3">Nama Barang</div>
              <div className="col-span-2">Satuan</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2">Harga Beli Total</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="space-y-3">
              {items.map((item: any, idx: number) => {
                
                // 🚀 SMART PRICE CHECKER LOGIC
                const matched = products.find((p: any) => p.sku === item.sku.toUpperCase());
                let isPriceDiff = false;
                let masterCost = 0;
                let currentItemCostPerPcs = 0;

                if (matched && item.price > 0) {
                  masterCost = Number(matched.costPrice) || 0;
                  // Tentukan multiplier berdasarkan satuan
                  const multiplier = item.unit === 'lusin' ? 12 : item.unit === 'half_lusin' ? 6 : 1;
                  // Harga per Pcs dari nota saat ini
                  currentItemCostPerPcs = item.price / multiplier;
                  
                  // Toleransi perbedaan Rp 1 untuk menghindari isu pembagian koma (floating point)
                  if (Math.abs(currentItemCostPerPcs - masterCost) > 1) { 
                    isPriceDiff = true;
                  }
                }

                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className={`grid grid-cols-12 gap-3 bg-slate-50/50 p-3 rounded-2xl items-center border transition-all ${isPriceDiff ? 'border-orange-300 bg-orange-50/30' : 'border-slate-100'}`}>
                      <input required className="col-span-2 bg-white py-3 px-4 rounded-xl text-xs font-bold border-none shadow-sm focus:ring-2 focus:ring-blue-200 outline-none uppercase" placeholder="SKU" value={item.sku} onChange={e => { const newItems = [...items]; newItems[idx].sku = e.target.value; const m = products.find((p: any) => p.sku === e.target.value.toUpperCase()); if(m) newItems[idx].name = m.name; setItems(newItems); }}/>
                      <input className="col-span-3 bg-transparent py-3 px-4 rounded-xl text-xs font-bold text-slate-400 border-none outline-none" placeholder="Nama Produk Otomatis" value={item.name} readOnly/>
                      <select className="col-span-2 bg-white py-3 px-2 rounded-xl text-xs font-black text-[#0047AB] border-none shadow-sm cursor-pointer outline-none" value={item.unit} onChange={e => { const newItems = [...items]; newItems[idx].unit = e.target.value; setItems(newItems); }}>
                        <option value="lusin">Lusin (x12)</option>
                        <option value="half_lusin">1/2 Lusin (x6)</option> {/* 🚀 OPSI 6 PCS */}
                        <option value="pcs">Pcs (Satuan)</option>
                      </select>
                      <input type="number" required min="1" className="col-span-2 bg-white py-3 px-4 rounded-xl text-xs font-bold text-center border-none shadow-sm focus:ring-2 focus:ring-blue-200 outline-none" value={item.qty} onChange={e => { const newItems = [...items]; newItems[idx].qty = Number(e.target.value); setItems(newItems); }}/>
                      <input type="number" required min="1" className="col-span-2 bg-white py-3 px-4 rounded-xl text-xs font-black text-[#0047AB] border-none shadow-sm focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Rp" value={item.price || ''} onChange={e => { const newItems = [...items]; newItems[idx].price = Number(e.target.value); setItems(newItems); }}/>
                      <button type="button" onClick={() => setItems(items.filter((_: any, i: number) => i !== idx))} className="col-span-1 text-red-300 hover:text-red-500 transition-all flex justify-center">
                        <Trash2 size={16}/>
                      </button>
                    </div>

                    {/* 🚀 NOTIFIKASI PERINGATAN HARGA */}
                    {isPriceDiff && (
                       <div className="flex items-center gap-1.5 ml-2 mt-0.5 animate-in fade-in zoom-in duration-300">
                         <AlertCircle size={12} className="text-orange-500" />
                         <p className="text-[9px] font-bold text-orange-600">
                           <span className="font-black uppercase">PERHATIAN!</span> Harga beli per-pcs saat ini <span className="font-black border-b border-orange-400">Rp {Math.round(currentItemCostPerPcs).toLocaleString('id-ID')}</span> BERBEDA dengan Data Master Modal (<span className="font-black">Rp {masterCost.toLocaleString('id-ID')}</span>).
                         </p>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-slate-50">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ringkasan Biaya</p>
              <div className="text-2xl font-black text-[#0F172A]">
                Rp {items.reduce((a: any,b: any) => a + (b.qty * b.price), 0).toLocaleString('id-ID')}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-8 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">Batal</button>
              <button type="submit" className="px-10 py-4 bg-[#0047AB] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all">Simpan Nota & Update Stok</button>
            </div>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black tracking-tighter">Riwayat Penarikan</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
            <X/>
          </button>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
          {withdrawals.map((w: any) => {
            // Logika Format Tanggal Pintar
            let displayDate = "Tidak ada tanggal";
            if (w.date) {
               const d = new Date(w.date);
               if (!isNaN(d.getTime())) {
                 displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
               }
            } else if (w.createdAt) {
               const d = w.createdAt.toDate ? w.createdAt.toDate() : new Date(w.createdAt);
               if (!isNaN(d.getTime())) {
                 displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
               }
            }

            return (
              <div key={w.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg text-[#0047AB] shadow-sm"><Landmark size={16}/></div>
                  <div>
                    <p className="text-[11px] font-black text-[#0F172A]">{w.platform}</p>
                    {/* TANGGAL DITAMPILKAN DI SINI */}
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{displayDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-[#0047AB]">Rp {w.amount.toLocaleString('id-ID')}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => onEdit(w)} className="p-1.5 text-slate-400 hover:text-[#0047AB] bg-white rounded-lg shadow-sm"><Pencil size={12}/></button>
                    <button onClick={() => onDelete(w.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg shadow-sm"><Trash2 size={12}/></button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {withdrawals.length === 0 && (
            <div className="py-10 text-center text-slate-300">
               <p className="text-[9px] font-black uppercase tracking-widest">Belum Ada Penarikan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};