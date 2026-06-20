// app/pembayaran/components/PaymentModals.tsx
"use client";

import React, { useState } from 'react';
import { X, Plus, Trash2, Landmark, Pencil, AlertCircle, Calendar, HelpCircle } from 'lucide-react';

// ==========================================
// 🚀 1. MODAL WITHDRAWAL (BOTTOM SHEET MOBILE)
// ==========================================
export const WithdrawModal = ({ isOpen, onClose, form, setForm, onSubmit }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-[#0F172A]">Tarik Saldo Omset</h2>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Mutasi Kas Masuk Ruko</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X size={18}/>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Tanggal Penarikan</label>
            <input 
              type="date" 
              required 
              className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl sm:rounded-2xl py-3.5 px-4 sm:py-4 sm:px-6 font-bold text-xs sm:text-sm text-[#0F172A] outline-none" 
              value={form.date || ""} 
              onChange={e => setForm({...form, date: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
             <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Sumber Platform</label>
             <select 
              className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl sm:rounded-2xl py-3.5 px-4 sm:py-4 sm:px-6 font-black text-xs sm:text-sm text-[#0047AB] outline-none cursor-pointer" 
              value={form.platform} 
              onChange={e => setForm({...form, platform: e.target.value})}
             >
               <option value="Shopee">Shopee</option>
               <option value="TikTok Shop">TikTok Shop</option>
               <option value="Lazada">Lazada</option>
               <option value="Rekening Toko">Rekening Toko</option>
               <option value="Offline">Offline</option>
             </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Nominal Penarikan (Rp)</label>
            <input 
              type="number" 
              required 
              placeholder="Masukkan Nominal" 
              className="w-full bg-slate-50 border border-transparent focus:border-blue-200 rounded-xl sm:rounded-2xl py-3.5 px-4 sm:py-4 sm:px-6 font-black text-lg sm:text-xl text-[#0047AB] outline-none" 
              value={form.amount || ""} 
              onChange={e => setForm({...form, amount: e.target.value})} 
            />
          </div>

          <button type="submit" className="w-full mt-4 py-4 bg-[#0047AB] hover:bg-blue-800 text-white rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all cursor-pointer">
            Konfirmasi Penarikan
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 2. MODAL OPEX EXPENSE (BOTTOM SHEET MOBILE)
// ==========================================
export const ExpenseModal = ({ isOpen, onClose, form, setForm, onSubmit }: any) => {
  const [isCustomPayer, setIsCustomPayer] = useState(false);
  const defaultPayers = ["KEVIN", "VALENT"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-orange-500">Input Biaya Operasional</h2>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Akuntansi Pengeluaran Ruko</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-full transition-all">
            <X size={18}/>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Tanggal Pengeluaran</label>
            <input 
              type="date" 
              required 
              className="w-full bg-slate-50 border border-transparent rounded-xl sm:rounded-2xl py-3.5 px-4 font-bold text-xs sm:text-sm text-[#0F172A] outline-none" 
              value={form.date || ""} 
              onChange={e => setForm({...form, date: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Paid By (Penanggung)</label>
              <button 
                type="button" 
                onClick={() => {
                  setIsCustomPayer(!isCustomPayer);
                  setForm({...form, paidBy: ""}); 
                }} 
                className="text-[8px] sm:text-[9px] font-black text-[#0047AB] uppercase hover:underline"
              >
                {isCustomPayer ? "Daftar Nama" : "Ketik Nama"}
              </button>
            </div>
            
            {isCustomPayer ? (
              <input 
                type="text" 
                required 
                placeholder="KETIK NAMA PEMBAYAR" 
                className="w-full bg-white border-2 border-orange-100 focus:border-orange-500 rounded-xl sm:rounded-2xl py-3 px-4 font-black text-xs sm:text-sm uppercase outline-none transition-all" 
                value={form.paidBy || ""} 
                onChange={e => setForm({...form, paidBy: e.target.value.toUpperCase()})}
              />
            ) : (
              <select 
                required 
                className={`w-full border rounded-xl sm:rounded-2xl py-3 px-4 font-black text-xs sm:text-sm cursor-pointer outline-none transition-colors ${!form.paidBy ? 'bg-orange-50/50 border-orange-100 text-orange-500' : 'bg-slate-50 border-transparent text-[#0F172A]'}`} 
                value={form.paidBy || ""} 
                onChange={e => setForm({...form, paidBy: e.target.value})}
              >
                <option value="" disabled hidden>-- PILIH PEMBAYAR --</option>
                {defaultPayers.map(payer => (
                  <option key={payer} value={payer}>{payer}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Kategori Alokasi</label>
            <select 
              required
              className={`w-full border rounded-xl sm:rounded-2xl py-3 px-4 font-black text-xs sm:text-sm cursor-pointer outline-none transition-colors ${!form.category ? 'bg-orange-50/50 border-orange-100 text-orange-500' : 'bg-slate-50 border-transparent text-[#0F172A]'}`} 
              value={form.category || ""} 
              onChange={e => setForm({...form, category: e.target.value})}
            >
              <option value="" disabled hidden>-- PILIH KATEGORI --</option>
              <option value="MAKAN">MAKAN OPERASIONAL</option>
              <option value="Listrik/Air">LISTRIK & AIR GUDANG</option>
              <option value="Gaji Karyawan">GAJI KARYAWAN TOKO</option>
              <option value="Iklan/Ads">BIAYA IKLAN / ADS</option>
              <option value="Sewa Tempat">SEWA RUKO / TEMPAT</option>
              <option value="Packaging">LAKBAN & KARDUS PACKAGING</option>
              <option value="Lainnya">LAINNYA</option>
            </select>
          </div>

          <div className="space-y-1">
             <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Keterangan Nota</label>
             <input 
              required 
              className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-xl sm:rounded-2xl py-3 px-4 font-bold text-xs sm:text-sm outline-none" 
              placeholder="Contoh: Beli lakban shopee 2 pak" 
              value={form.description || ""} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Total Nominal (Rp)</label>
            <input 
              type="number" 
              required 
              placeholder="Rp 0" 
              className="w-full bg-slate-50 border border-transparent focus:border-orange-200 rounded-xl sm:rounded-2xl py-3.5 px-4 font-black text-lg text-orange-600 outline-none" 
              value={form.amount || ""} 
              onChange={e => setForm({...form, amount: e.target.value})} 
            />
          </div>

          <button type="submit" className="w-full mt-2 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 transition-all cursor-pointer">
            Simpan Pengeluaran Opex
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 3. MODAL INVOICE & RESTOCK (FLUID GRID MATRIX MOBILE)
// ==========================================
export const InvoiceModal = ({ 
  isOpen, onClose, form, setForm, items, setItems, products, suppliers = [], onSubmit 
}: any) => {
  if (!isOpen) return null;

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const matchedSup = suppliers.find((s: any) => s.name === selectedName);
    let autoNota = form.noNota || '';
    if (matchedSup) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      autoNota = `${matchedSup.code}-${today}-`;
    }
    setForm({ ...form, supplier: selectedName, noNota: autoNota });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-t-[32px] sm:rounded-[40px] p-5 sm:p-8 max-h-[94vh] overflow-y-auto shadow-2xl relative no-scrollbar flex flex-col justify-between">
        
        {/* KEPALA DOKUMEN MODAL */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-[#0F172A]">Nota Restock Supplier</h2>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Penambahan Stok Rak Fisik & Hutang Dagang</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X size={18} /></button>
        </div>

        {/* BODY UTAMA FORMULIR */}
        <form onSubmit={onSubmit} className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Pilih Supplier Mitra</label>
              <select required value={form.supplier} onChange={handleSupplierChange} className="w-full bg-slate-50 rounded-xl sm:rounded-2xl py-3 px-4 font-black text-xs sm:text-sm border-none outline-none cursor-pointer">
                <option value="" disabled>-- PILIH MITRA SUPPLIER --</option>
                {suppliers.map((sup: any) => <option key={sup.id} value={sup.name}>{sup.name} ({sup.code})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Ketik Nomor Nota Tagihan</label>
              <input type="text" required value={form.noNota} onChange={e => setForm({...form, noNota: e.target.value})} className="w-full bg-slate-50 rounded-xl sm:rounded-2xl py-3 px-4 font-black text-xs sm:text-sm border-none outline-none uppercase text-[#0047AB]" placeholder="Contoh: PREFIX-YYYYMMDD-001" />
            </div>
          </div>

          {/* ITEM RESTOCK SECTION */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h5 className="text-[10px] sm:text-xs font-black uppercase text-[#0047AB] tracking-widest flex items-center gap-1">Detail Keping Belanja</h5>
              <button type="button" onClick={() => setItems([...items, {sku:'', name:'', qty:1, price:0, unit:'lusin'}])} className="cursor-pointer flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black bg-blue-50 text-[#0047AB] px-3 py-2 rounded-xl hover:bg-blue-100 transition-all">
                <Plus size={12} strokeWidth={3}/> TAMBAH BARIS ITEM
              </button>
            </div>
            
            {/* HEADERS GRID - HANYA DI TAMPILKAN PADA UKURAN DESKTOP SCREEN */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <div className="col-span-2">Kode SKU</div>
              <div className="col-span-3">Nama Katalog Utama</div>
              <div className="col-span-2">Kemasan Input</div>
              <div className="col-span-2 text-center">Jumlah Vol (Qty)</div>
              <div className="col-span-2">Subtotal Harga Baris</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* CONTAINER ADAPTIF LIST ITEM (RESPONSIF KARTU DI MOBILE) */}
            <div className="space-y-4 max-h-[360px] sm:max-h-none overflow-y-auto pr-1 no-scrollbar">
              {items.map((item: any, idx: number) => {
                const matched = products.find((p: any) => p.sku === item.sku.toUpperCase().trim());
                let isPriceDiff = false;
                let masterCost = 0;
                let currentItemCostPerPcs = 0;

                if (matched && item.price > 0 && item.qty > 0) { 
                  masterCost = Number(matched.costPrice) || 0;
                  const multiplier = item.unit === 'lusin' ? 12 : item.unit === 'half_lusin' ? 6 : 1;
                  const totalPcs = Number(item.qty) * multiplier;
                  currentItemCostPerPcs = Number(item.price) / totalPcs;
                  
                  if (Math.abs(currentItemCostPerPcs - masterCost) > 1) { 
                    isPriceDiff = true;
                  }
                }

                return (
                  <div key={idx} className="flex flex-col gap-1 border-b border-dashed border-slate-100 sm:border-none pb-3 sm:pb-0">
                    {/* 🚀 KUNCI RESPONSIVE LAYOUT KEVIN: DI MOBILE BERUBAH MENJADI KOMPONEN CARD STACK */}
                    <div className={`flex flex-col md:grid md:grid-cols-12 gap-2.5 md:gap-3 bg-slate-50/60 p-4 md:p-3 rounded-2xl md:items-center border transition-all ${isPriceDiff ? 'border-orange-200 bg-orange-50/20' : 'border-slate-100'}`}>
                      
                      {/* BARIS SKU & NAMA BRAND */}
                      <div className="grid grid-cols-12 gap-2 md:col-span-5">
                        <input required className="col-span-4 md:col-span-5 bg-white py-2.5 px-3 rounded-xl text-xs font-black border border-slate-100 uppercase outline-none focus:ring-2 focus:ring-blue-100" placeholder="SKU RUKO" value={item.sku} onChange={e => { const newItems = [...items]; newItems[idx].sku = e.target.value; const m = products.find((p: any) => p.sku === e.target.value.toUpperCase().trim()); if(m) newItems[idx].name = m.name; setItems(newItems); }}/>
                        <input className="col-span-8 md:col-span-7 bg-transparent py-2.5 px-2 text-xs font-bold text-slate-400 outline-none truncate" placeholder="Katalog Otomatis Cocok" value={item.name} readOnly/>
                      </div>

                      {/* BARIS SATUAN INPUT & JUMLAH (QTY) */}
                      <div className="grid grid-cols-12 gap-2 md:col-span-4 items-center">
                        <div className="col-span-6 md:col-span-6 flex items-center bg-white border border-slate-100 rounded-xl px-1">
                          <select className="w-full bg-transparent py-2.5 px-2 text-[11px] font-black text-[#0047AB] outline-none border-none cursor-pointer" value={item.unit} onChange={e => { const newItems = [...items]; newItems[idx].unit = e.target.value; setItems(newItems); }}>
                            <option value="lusin">Lusin (x12)</option>
                            <option value="half_lusin">1/2 Lsn (x6)</option>
                            <option value="pcs">Pcs (Satuan)</option>
                          </select>
                        </div>
                        <div className="col-span-6 md:col-span-6 flex items-center bg-white border border-slate-100 rounded-xl px-2">
                          <span className="text-[9px] font-black text-slate-300 uppercase select-none md:hidden">Qty:</span>
                          <input type="number" required min="1" className="w-full bg-transparent py-2.5 px-2 text-xs font-black text-center border-none outline-none" value={item.qty} onChange={e => { const newItems = [...items]; newItems[idx].qty = Number(e.target.value); setItems(newItems); }}/>
                        </div>
                      </div>

                      {/* BARIS SUB-TOTAL HARGA BARIS */}
                      <div className="grid grid-cols-12 gap-2 md:col-span-3 items-center">
                        <div className="col-span-10 md:col-span-10 flex items-center bg-white border border-slate-100 rounded-xl px-3">
                          <span className="text-[10px] font-black text-slate-400 mr-1">Rp</span>
                          <input type="number" required min="0" className="w-full bg-transparent py-2.5 text-xs font-black text-[#0047AB] border-none outline-none" placeholder="Subtotal" value={item.price || ''} onChange={e => { const newItems = [...items]; newItems[idx].price = Number(e.target.value); setItems(newItems); }}/>
                        </div>
                        <div className="col-span-2 md:col-span-2 flex justify-end">
                          <button type="button" onClick={() => setItems(items.filter((_: any, i: number) => i !== idx))} className="cursor-pointer p-2 text-red-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={15}/></button>
                        </div>
                      </div>

                    </div>

                    {/* ALARM WARNING VALIDASI PERUBAHAN HARGA MODAL */}
                    {isPriceDiff && (
                       <div className="flex items-start gap-1.5 ml-2 mt-0.5 animate-in fade-in duration-200">
                         <AlertCircle size={11} className="text-orange-500 shrink-0 mt-0.5" />
                         <p className="text-[9px] font-bold text-orange-600 leading-normal">
                           <span className="font-black uppercase">SELISIH:</span> Modal eceran baru <span className="font-black">Rp {Math.round(currentItemCostPerPcs).toLocaleString('id-ID')}</span> berbeda dari database utama (<span className="font-black">Rp {masterCost.toLocaleString('id-ID')}</span>).
                         </p>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOOTER FIX NOTA: SEKARANG MEMPUNYAI FIXED STICKY POSITION DI MOBILE BAR */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white mt-auto">
            <div className="space-y-0.5 text-left bg-slate-50 p-3 sm:p-0 rounded-xl sm:bg-transparent">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Grand Total Nota Belanja</p>
              <div className="text-xl sm:text-2xl font-black text-[#0F172A] ml-1">
                Rp {items.reduce((a: any, b: any) => a + Number(b.price || 0), 0).toLocaleString('id-ID')}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button type="button" onClick={onClose} className="cursor-pointer flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-xl font-black text-[10px] uppercase tracking-wider transition-all">Batal</button>
              <button type="submit" className="cursor-pointer flex-[2] sm:flex-none px-8 py-3.5 bg-[#0047AB] hover:bg-blue-800 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md shadow-blue-100 transition-all">Simpan & Masuk Rak</button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

// ==========================================
// 🚀 4. MODAL HISTORY (BOTTOM SHEET MOBILE DRAWER)
// ==========================================
export const HistoryModal = ({ isOpen, onClose, withdrawals, onDelete, onEdit }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 animate-in slide-in-from-bottom sm:zoom-in duration-300 flex flex-col max-h-[85vh]">
        
        <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3 shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tighter text-[#0F172A]">Riwayat Pencairan Dana</h2>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Log Mutasi Rekening Masuk</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-full transition-all">
            <X size={16}/>
          </button>
        </div>

        {/* CONTAINER SCROLLABLE LIST IDENTITAS MUTASI */}
        <div className="space-y-2.5 overflow-y-auto no-scrollbar flex-1 pr-0.5">
          {withdrawals.map((w: any) => {
            let displayDate = "Tanpa Tanggal";
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
              <div key={w.id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 group transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-white rounded-xl text-[#0047AB] shadow-3xs shrink-0"><Landmark size={15}/></div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#0F172A] uppercase truncate leading-tight">{w.platform}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{displayDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <p className="text-xs sm:text-sm font-black text-[#0047AB]">Rp {w.amount.toLocaleString('id-ID')}</p>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <button type="button" onClick={() => onEdit(w)} className="cursor-pointer p-1.5 text-slate-400 hover:text-[#0047AB] bg-white border border-slate-100 rounded-lg shadow-3xs"><Pencil size={11}/></button>
                    <button type="button" onClick={() => onDelete(w.id)} className="cursor-pointer p-1.5 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-lg shadow-3xs"><Trash2 size={11}/></button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {withdrawals.length === 0 && (
            <div className="py-14 text-center text-slate-300 flex flex-col items-center gap-1">
               <p className="text-[9px] font-black uppercase tracking-widest">Belum Ada Transaksi Cair</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};