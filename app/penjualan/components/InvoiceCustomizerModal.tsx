// app/penjualan/components/InvoiceCustomizerModal.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, FileText, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { InvoicePdfService } from '../services/InvoicePdfService';

export function InvoiceCustomizerModal({ isOpen, onClose, transaction }: any) {
  const [invoiceForm, setInvoiceForm] = useState<any>({
    orderId: '',
    recipient: '', 
    resi: '',
    marketplace: '',
    createdAt: null,
    total: 0
  });
  
  const [showResi, setShowResi] = useState(true);
  const [showMarketplace, setShowMarketplace] = useState(true);
  const [draftItems, setInvoiceItems] = useState<any[]>([]);

  useEffect(() => {
    if (!transaction || !isOpen) return;

    setInvoiceForm({
      orderId: transaction.orderId || '',
      recipient: transaction.recipient || transaction.customerName || transaction.namaPenerima || '-', 
      resi: transaction.resi || '-',
      marketplace: transaction.marketplace || '-',
      createdAt: transaction.createdAt,
      total: Number(transaction.total) || 0
    });

    if (transaction.items && Array.isArray(transaction.items) && transaction.items.length > 0) {
      setInvoiceItems(
        transaction.items.map((item: any) => {
          const safeQty = Number(item.qty) || 1;
          const safePrice = Number(item.manualPrice) || (Number(item.price || 0) / safeQty) || 0;
          return {
            sku: item.sku || '',
            productName: item.productName || item.product || 'Produk Retail',
            qty: safeQty,
            manualPrice: safePrice
          };
        })
      );
    } else {
      const safeQty = Number(transaction.qty) || 1;
      const computedPrice = safeQty > 0 ? (Number(transaction.total || 0) / safeQty) : Number(transaction.total || 0);

      setInvoiceItems([
        {
          sku: transaction.sku || 'CUSTOM',
          productName: transaction.product || 'Produk Luar Katalog',
          qty: safeQty,
          manualPrice: computedPrice
        }
      ]);
    }
  }, [transaction, isOpen]);

  const currentGrandTotal = useMemo(() => {
    return draftItems.reduce((acc, item) => {
      const price = Number(item.manualPrice);
      const qty = Number(item.qty);
      const validRowTotal = isNaN(price) || isNaN(qty) ? 0 : price * qty;
      return acc + validRowTotal;
    }, 0);
  }, [draftItems]);

  const handleAddRow = () => {
    setInvoiceItems([...draftItems, { sku: '', productName: '', qty: 1, manualPrice: 0 }]);
  };

  const handleRemoveRow = (idx: number) => {
    if (draftItems.length <= 1) return; 
    setInvoiceItems(draftItems.filter((_, i) => i !== idx));
  };

  const handleInputChange = (idx: number, field: string, value: any) => {
    const nextItems = [...draftItems];
    nextItems[idx] = { 
      ...nextItems[idx], 
      [field]: field === 'qty' || field === 'manualPrice' ? (value === '' ? '' : Number(value)) : value 
    };
    setInvoiceItems(nextItems);
  };

  const handleGeneratePdfTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedItems = draftItems.map(item => ({
      sku: String(item.sku || "CUSTOM").toUpperCase().trim(),
      productName: String(item.productName || "Produk Retail").trim(),
      qty: Number(item.qty) || 1,
      manualPrice: Number(item.manualPrice) || 0
    }));

    const compiledTransactionForPdf = {
      ...invoiceForm,
      // 🎯 ANTI-KOSONG: Jika dihapus/kosong di layar, otomatis dikirim string kosong agar ter-fallback rapi di PDF
      recipient: invoiceForm.recipient ? String(invoiceForm.recipient).trim() : '',
      total: currentGrandTotal,
      resi: showResi ? invoiceForm.resi : '', 
      marketplace: showMarketplace ? invoiceForm.marketplace : '-',
      items: sanitizedItems 
    };

    InvoicePdfService.generateInvoice(compiledTransactionForPdf);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-t-[32px] sm:rounded-[40px] p-5 sm:p-8 max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col justify-between no-scrollbar">
        
        {/* KEPALA PANEL ADJUSTMENT */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-[#0F172A]">Pembuatan Invoice</h2>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Isi Detail Invoice yang akan dibuat</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X size={18} /></button>
        </div>

        {/* AREA FORM EDITOR DRAF METADATA & SAKELAR VISIBILITAS */}
        <form onSubmit={handleGeneratePdfTrigger} className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-0.5">
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80">
            {/* 🚀 FIXED OPSIONAL: Atribut 'required' dihapus total agar input bisa dikosongkan secara sah */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                <span>Nama Penerima</span>
                <span className="text-[7px] bg-slate-200 text-slate-500 font-bold px-1 rounded-sm normal-case">Opsional</span>
              </label>
              <input type="text" className="w-full bg-white border rounded-xl py-2.5 px-3 font-black text-xs outline-none text-slate-700 placeholder-slate-300" placeholder="Pelanggan Retail..." value={invoiceForm.recipient} onChange={e => setInvoiceForm({...invoiceForm, recipient: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">No. Pesanan / Order ID</label>
              <input type="text" className="w-full bg-white border rounded-xl py-2.5 px-3 font-black text-xs outline-none text-slate-700" value={invoiceForm.orderId} onChange={e => setInvoiceForm({...invoiceForm, orderId: e.target.value})} />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nomor Resi Kurir</label>
                <button type="button" onClick={() => setShowResi(!showResi)} className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-wider transition-colors ${showResi ? 'text-blue-600' : 'text-slate-400'}`}>
                  {showResi ? <Eye size={10}/> : <EyeOff size={10}/>} {showResi ? "Ditampilkan" : "Disembunyikan"}
                </button>
              </div>
              <input type="text" disabled={!showResi} className={`w-full border rounded-xl py-2.5 px-3 font-black text-xs outline-none transition-all ${showResi ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-300 border-dashed border-slate-200 select-none'}`} value={invoiceForm.resi} onChange={e => setInvoiceForm({...invoiceForm, resi: e.target.value})} />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Marketplace</label>
                <button type="button" onClick={() => setShowMarketplace(!showMarketplace)} className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-wider transition-colors ${showMarketplace ? 'text-blue-600' : 'text-slate-400'}`}>
                  {showMarketplace ? <Eye size={10}/> : <EyeOff size={10}/>} {showMarketplace ? "Ditampilkan" : "Disembunyikan"}
                </button>
              </div>
              <input type="text" disabled={!showMarketplace} className={`w-full border rounded-xl py-2.5 px-3 font-black text-xs outline-none transition-all ${showMarketplace ? 'bg-white text-[#0047AB]' : 'bg-slate-100 text-slate-300 border-dashed border-slate-200 select-none'}`} value={invoiceForm.marketplace} onChange={e => setInvoiceForm({...invoiceForm, marketplace: e.target.value})} placeholder="Shopee / TikTok" />
            </div>
          </div>

          {/* DRAF MANIPULATION TABLE */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h5 className="text-[10px] sm:text-xs font-black uppercase text-[#0047AB] tracking-widest">Informasi Produk</h5>
              <button type="button" onClick={handleAddRow} className="cursor-pointer flex items-center gap-1 text-[8px] sm:text-[9px] font-black bg-blue-50 text-[#0047AB] px-3 py-2 rounded-xl hover:bg-blue-100 transition-all">
                <Plus size={12} strokeWidth={3}/> TAMBAH PRODUK BARU
              </button>
            </div>

            {/* GRID CONTAINER LIST ITEM */}
            <div className="space-y-3 max-h-[260px] overflow-y-auto no-scrollbar pr-0.5">
              {draftItems.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 bg-slate-50/40 p-3 rounded-xl border border-slate-100 items-center">
                  <input type="text" required className="w-full sm:col-span-2 bg-white py-2 px-3 rounded-lg text-xs font-black border uppercase outline-none" placeholder="SKU" value={item.sku || ''} onChange={e => handleInputChange(idx, 'sku', e.target.value)} />
                  <input type="text" required className="w-full sm:col-span-4 bg-white py-2 px-3 rounded-lg text-xs font-bold border outline-none truncate" placeholder="Nama Barang di Invoice" value={item.productName || ''} onChange={e => handleInputChange(idx, 'productName', e.target.value)} />
                  
                  <div className="w-full sm:col-span-2 flex items-center bg-white border rounded-lg px-2">
                    <span className="text-[8px] font-black text-slate-300 uppercase mr-1 sm:hidden">Qty:</span>
                    <input type="number" required min="1" className="w-full bg-transparent py-2 px-1 text-xs font-black text-center outline-none" value={item.qty} onChange={e => handleInputChange(idx, 'qty', e.target.value)} />
                  </div>

                  <div className="w-full sm:col-span-3 flex items-center bg-white border rounded-lg px-3">
                    <span className="text-[10px] font-black text-slate-400 mr-1">Rp</span>
                    <input type="number" required min="0" className="w-full bg-transparent py-2 text-xs font-black text-[#0047AB] outline-none" placeholder="Harga" value={item.manualPrice} onChange={e => handleInputChange(idx, 'manualPrice', e.target.value)} />
                  </div>

                  <div className="w-full sm:col-span-1 flex justify-end">
                    <button type="button" disabled={draftItems.length === 1} onClick={() => handleRemoveRow(idx)} className="cursor-pointer p-2 text-red-300 hover:text-red-500 disabled:opacity-20 rounded-lg transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOCK NOTA PERINGATAN */}
          <div className="flex items-start gap-1.5 p-3 bg-blue-50/40 border border-blue-100 rounded-xl">
            <AlertCircle size={14} className="text-[#0047AB] shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-slate-500 leading-normal uppercase">
              <span className="font-black text-[#0047AB]">Informasi Keamanan:</span> Perubahan nominal, nama penerima, atau visibilitas resi di dalam panel ini murni hanya berlaku sementara untuk pembuatan invoices saja. Data asli tidak akan terpengaruh.
            </p>
          </div>

          {/* FOOTER ACTION PANEL STICKY BAR */}
          <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white mt-auto">
            <div className="text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Kalkulasi Nilai Nota PDF</span>
              <span className="text-xl font-black text-[#0047AB] ml-1">IDR {Math.round(currentGrandTotal).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button type="button" onClick={onClose} className="cursor-pointer flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#1E293B] rounded-xl font-black text-[10px] uppercase tracking-wider transition-all">Batal</button>
              <button type="submit" className="cursor-pointer flex-[2] sm:flex-none px-8 py-3.5 bg-[#0047AB] hover:bg-blue-800 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5">
                <FileText size={14} /> <span>Terbitkan & Unduh PDF</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}