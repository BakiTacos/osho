// app/invoicing/components/InvoiceModal.tsx
"use client";

import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Calendar, User, FileText, Settings2, Percent } from 'lucide-react';
import { CustomerInvoiceItem } from '../services/CustomerInvoicePdfService';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "ADD" | "EDIT";
  form: any;
  setForm: (form: any) => void;
  items: CustomerInvoiceItem[];
  setItems: (items: CustomerInvoiceItem[]) => void;
  products: any[];
  calculatedValues: { subtotal: number; total: number };
  onSubmit: (e: React.FormEvent) => void;
}

export function InvoiceModal({
  isOpen,
  onClose,
  mode,
  form,
  setForm,
  items,
  setItems,
  products,
  calculatedValues,
  onSubmit
}: InvoiceModalProps) {

  const [activeCatalogRow, setActiveCatalogRow] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setItems([...items, { sku: "", productName: "", qty: 1, price: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CustomerInvoiceItem, value: any) => {
    const newItems = [...items];
    if (field === 'qty' || field === 'price') {
      newItems[index] = {
        ...newItems[index],
        [field]: value === "" ? "" : Number(value)
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
    }
    setItems(newItems);
  };

  const handleSelectProduct = (index: number, prodId: string) => {
    if (!prodId) return;
    const selectedProd = products.find(p => p.id === prodId);
    if (selectedProd) {
      const newItems = [...items];
      newItems[index] = {
        sku: selectedProd.sku || "",
        productName: selectedProd.name || "",
        qty: newItems[index].qty || 1,
        price: selectedProd.price || 0
      };
      setItems(newItems);
      setActiveCatalogRow(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-t-[32px] sm:rounded-[40px] p-5 sm:p-8 max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col justify-between no-scrollbar">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-[#0F172A]">
              {mode === "ADD" ? "Buat Invoice Baru" : "Edit Invoice Pelanggan"}
            </h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              Kelola penagihan penjualan ruko secara profesional
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM CONTAINER */}
        <form onSubmit={onSubmit} className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-0.5">
          
          {/* CLIENT & METADATA SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 sm:p-6 rounded-3xl border border-slate-100">
            {/* Invoice Number */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                <FileText size={12} className="text-slate-400" />
                <span>Nomor Invoice</span>
              </label>
              <input
                type="text"
                required
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3 font-black text-xs text-slate-500 cursor-not-allowed outline-none"
                value={form.invoiceNumber}
                readOnly
              />
            </div>

            {/* Client Recipient Name */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                <User size={12} className="text-slate-400" />
                <span>Nama Pelanggan (Klien)</span>
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama pembeli..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0047AB]"
                value={form.recipient}
                onChange={e => setForm({ ...form, recipient: e.target.value })}
              />
            </div>

            {/* Status Selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                <Settings2 size={12} className="text-slate-400" />
                <span>Status Pembayaran</span>
              </label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 font-black text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0047AB]"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="BELUM BAYAR">BELUM BAYAR</option>
                <option value="LUNAS">LUNAS</option>
                <option value="JATUH TEMPO">JATUH TEMPO</option>
              </select>
            </div>

            {/* Date Pickers */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                <span>Tanggal Invoice</span>
              </label>
              <input
                type="date"
                required
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0047AB]"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                <span>Tanggal Jatuh Tempo</span>
              </label>
              <input
                type="date"
                required
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0047AB]"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* PRODUCTS GRID LIST */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h5 className="text-[10px] sm:text-xs font-black uppercase text-[#0047AB] tracking-widest">
                Daftar Item Invoice
              </h5>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="cursor-pointer flex items-center gap-1 text-[8px] sm:text-[9px] font-black bg-blue-50 text-[#0047AB] px-3 py-2 rounded-xl hover:bg-blue-100 transition-all"
              >
                <Plus size={12} strokeWidth={3} /> TAMBAH PRODUK BARU
              </button>
            </div>

            {/* ITEMS LOOP */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-0.5">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2 bg-slate-50/40 p-4 rounded-2xl border border-slate-100">
                  
                  {/* Row 1: Catalog Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="col-span-12 sm:col-span-6 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Pilih dari Katalog (Opsional)
                      </span>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-500 outline-none"
                        value=""
                        onChange={(e) => handleSelectProduct(idx, e.target.value)}
                      >
                        <option value="">-- Ketik manual atau pilih produk --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku || "NO SKU"}] {p.name} - Rp{p.price?.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-12 sm:col-span-3 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Kode SKU
                      </span>
                      <input
                        type="text"
                        required
                        className="w-full bg-white py-1.5 px-2 rounded-lg text-xs font-black border uppercase outline-none text-slate-700"
                        placeholder="SKU"
                        value={item.sku}
                        onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                      />
                    </div>

                    <div className="col-span-12 sm:col-span-3 flex justify-end">
                      <button
                        type="button"
                        disabled={items.length === 1}
                        onClick={() => handleRemoveItemRow(idx)}
                        className="cursor-pointer flex items-center gap-1 py-1.5 px-3 bg-red-50 text-red-500 rounded-lg text-[9px] font-black uppercase hover:bg-red-100 disabled:opacity-20 transition-all"
                      >
                        <Trash2 size={12} /> Hapus Baris
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Manual input, Qty, Price, Subtotal */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center mt-1">
                    <div className="col-span-12 sm:col-span-6 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Nama Barang di Invoice
                      </span>
                      <input
                        type="text"
                        required
                        className="w-full bg-white py-1.5 px-2 rounded-lg text-xs font-bold border outline-none text-slate-700"
                        placeholder="Nama Produk..."
                        value={item.productName}
                        onChange={e => handleItemChange(idx, 'productName', e.target.value)}
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Kuantitas
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        className="w-full bg-white py-1.5 px-2 rounded-lg text-xs font-black text-center border outline-none text-slate-700"
                        value={item.qty}
                        onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                      />
                    </div>

                    <div className="col-span-8 sm:col-span-4 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Harga Jual Satuan
                      </span>
                      <div className="flex items-center bg-white border rounded-lg px-2">
                        <span className="text-[10px] font-black text-slate-400 mr-1">Rp</span>
                        <input
                          type="number"
                          required
                          min="0"
                          className="w-full bg-transparent py-1.5 text-xs font-black text-[#0047AB] outline-none"
                          placeholder="Harga"
                          value={item.price}
                          onChange={e => handleItemChange(idx, 'price', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* DISCOUNTS, TAXES, NOTES & BANK REK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Taxes and Discounts */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase text-[#0047AB] tracking-widest">
                Penyesuaian Pajak & Diskon
              </h5>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">
                    Diskon Langsung (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 10000"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 font-black text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0047AB]"
                    value={form.discount}
                    onChange={e => setForm({ ...form, discount: e.target.value === "" ? 0 : Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                    <span>Pajak PPN</span> <Percent size={10} className="text-slate-400" />
                  </label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 font-black text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0047AB]"
                    value={form.tax}
                    onChange={e => setForm({ ...form, tax: Number(e.target.value) })}
                  >
                    <option value={0}>Tanpa Pajak (0%)</option>
                    <option value={10}>PPN 10%</option>
                    <option value={11}>PPN 11%</option>
                    <option value={12}>PPN 12%</option>
                  </select>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">
                  Informasi Rekening Bank Ruko
                </label>
                <textarea
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 font-semibold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0047AB] resize-none"
                  placeholder="Isi nama bank, no rekening, dan nama pemilik..."
                  value={form.bankInfo}
                  onChange={e => setForm({ ...form, bankInfo: e.target.value })}
                />
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase text-[#0047AB] tracking-widest">
                Catatan Tambahan
              </h5>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">
                  Memo Pembayaran / Catatan Invoice
                </label>
                <textarea
                  rows={5}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 font-semibold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#0047AB] resize-none"
                  placeholder="Ketik catatan khusus untuk pelanggan jika ada..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* CALCULATED TOTALS & FOOTER */}
          <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white mt-auto">
            <div className="text-left bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                Kalkulasi Ringkasan Nilai Tagihan
              </span>
              <div className="flex gap-4 items-center mt-1">
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Subtotal:</span>
                  <span className="text-xs font-bold text-[#0F172A] ml-1">
                    Rp{Math.round(calculatedValues.subtotal).toLocaleString('id-ID')}
                  </span>
                </div>
                {form.discount > 0 && (
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Diskon:</span>
                    <span className="text-xs font-bold text-red-500 ml-1">
                      -Rp{Math.round(form.discount).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                {form.tax > 0 && (
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Pajak:</span>
                    <span className="text-xs font-bold text-blue-500 ml-1">
                      +{form.tax}%
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">GRAND TOTAL:</span>
                <span className="text-lg font-black text-[#0047AB] ml-2">
                  Rp {Math.round(calculatedValues.total).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#1E293B] rounded-xl font-black text-[10px] uppercase tracking-wider transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="cursor-pointer flex-[2] sm:flex-none px-8 py-3.5 bg-[#0047AB] hover:bg-blue-800 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Save size={14} /> <span>{mode === "ADD" ? "Simpan Invoice" : "Perbarui Invoice"}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
