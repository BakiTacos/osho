// app/invoicing/components/InvoiceModal.tsx
"use client";

import React from 'react';
import { X, Plus, Trash2, Save, Calendar, User, FileText, Image as ImageIcon, Palette, ShieldCheck, Mail, MapPin, Sparkles, FileDown, Phone } from 'lucide-react';
import { CustomerInvoiceItem, CustomerInvoicePdfService, formatTerbilang } from '../services/CustomerInvoicePdfService';

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
  onSaveSellerProfile: () => void; // Simpan default seller profile
}

// Helper untuk kompresi gambar client-side (menjamin ukuran file kecil agar Firestore tidak crash)
const compressImage = (file: File, maxWidth = 200, maxHeight = 200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

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
  onSubmit,
  onSaveSellerProfile
}: InvoiceModalProps) {

  const colorPresets = [
    { name: "Cobalt Blue", hex: "#0047AB" },
    { name: "Emerald Green", hex: "#10B981" },
    { name: "Ruby Red", hex: "#EF4444" },
    { name: "Charcoal Black", hex: "#1E293B" },
    { name: "Royal Purple", hex: "#7C3AED" },
    { name: "Deep Wine", hex: "#991B1B" }
  ];

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
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 200, 200, 0.75);
        setForm({ ...form, logoBase64: compressed });
      } catch (err) {
        console.error("Gagal mengompres logo:", err);
        alert("Gagal memproses gambar logo.");
      }
    }
  };

  const handleRemoveLogo = () => {
    setForm({ ...form, logoBase64: "" });
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 200, 100, 0.7);
        setForm({ ...form, signatureBase64: compressed });
      } catch (err) {
        console.error("Gagal mengompres tanda tangan:", err);
        alert("Gagal memproses gambar tanda tangan.");
      }
    }
  };

  const handleRemoveSignature = () => {
    setForm({ ...form, signatureBase64: "" });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  // CETAK PDF SEKALIGUS DARI DRAFT YANG SEDANG DIISI (LIVE INPUT)
  const handleDownloadPdfCurrent = () => {
    CustomerInvoicePdfService.generatePdf({
      invoiceNumber: form.invoiceNumber || "DRAFT-PDF",
      recipient: form.recipient || "Nama Pelanggan",
      recipientAddress: form.recipientAddress || "-",
      recipientPhone: form.recipientPhone || "-",
      date: form.date,
      dueDate: form.dueDate,
      items: items,
      discount: Number(form.discount) || 0,
      tax: Number(form.tax) || 0,
      subtotal: calculatedValues.subtotal,
      total: calculatedValues.total,
      notes: form.notes,
      bankInfo: form.bankInfo,
      logoBase64: form.logoBase64,
      sellerName: form.sellerName,
      sellerAddress: form.sellerAddress,
      sellerContact: form.sellerContact,
      sellerPhone: form.sellerPhone,
      themeColor: form.themeColor,
      sellerPic: form.sellerPic,
      signatureBase64: form.signatureBase64
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-t-[32px] sm:rounded-[40px] p-5 sm:p-8 max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col justify-between no-scrollbar">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-center mb-5 border-b pb-4 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-[#0F172A]">
              {mode === "ADD" ? "Buat Invoice Baru" : "Edit Invoice Pelanggan"}
            </h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              Kelola penagihan penjualan ruko secara profesional dengan live preview & tanda tangan
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

        {/* KONTROL FORM UTAMA - PEMBUNGKUS KESELURUHAN KOLOM INPUT & TOMBOL AKSI */}
        <form onSubmit={onSubmit} className="flex flex-col justify-between flex-1 overflow-hidden">
          
          {/* TWO-COLUMN CONTENT GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start overflow-y-auto no-scrollbar flex-1 pr-0.5 pb-2">
            
            {/* ========================================== */}
            {/* 📝 LEFT COLUMN: INTERACTIVE FORM EDITOR     */}
            {/* ========================================== */}
            <div className="xl:col-span-7 space-y-6">
              
              {/* BRANDING, COLOR, LOGO & SIGNATURE CUSTOMIZER */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100/80">
                
                {/* Logo Upload */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                    <ImageIcon size={12} className="text-slate-400" />
                    <span>Logo Ruko</span>
                  </label>
                  
                  {form.logoBase64 ? (
                    <div className="relative w-full h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 group">
                      <img src={form.logoBase64} alt="Preview Logo" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-md cursor-pointer"
                        title="Hapus Logo"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-20 bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center hover:border-[#0047AB] transition-colors cursor-pointer p-1">
                      <ImageIcon size={18} className="text-slate-300 mb-0.5" />
                      <span className="text-[7.5px] font-black text-slate-400 uppercase text-center">Pilih Logo Toko</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Signature Upload */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                    <ShieldCheck size={12} className="text-slate-400" />
                    <span>Foto Tanda Tangan</span>
                  </label>
                  
                  {form.signatureBase64 ? (
                    <div className="relative w-full h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 group">
                      <img src={form.signatureBase64} alt="Preview Tanda Tangan" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-md cursor-pointer"
                        title="Hapus Tanda Tangan"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-20 bg-white border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center hover:border-[#0047AB] transition-colors cursor-pointer p-1">
                      <ShieldCheck size={18} className="text-slate-300 mb-0.5" />
                      <span className="text-[7.5px] font-black text-slate-400 uppercase text-center">Unggah TTD</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Theme Color Selection */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider flex items-center gap-1">
                    <Palette size={12} className="text-slate-400" />
                    <span>Warna Tema</span>
                  </label>
                  
                  <div className="grid grid-cols-1 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60 h-20 overflow-y-auto no-scrollbar">
                    <div className="flex flex-wrap gap-1 items-center justify-center">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setForm({ ...form, themeColor: preset.hex })}
                          className={`w-5.5 h-5.5 rounded-full border transition-all cursor-pointer ${
                            form.themeColor === preset.hex ? "scale-110 ring-2 ring-slate-400" : "opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-1 border-t border-slate-100 pt-1">
                      <input
                        type="color"
                        value={form.themeColor}
                        onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={form.themeColor}
                        onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                        className="w-full bg-slate-50 text-[8px] font-black text-center uppercase tracking-wide py-0.5 rounded border-none outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* SELLER (Pengirim) CONFIGURATION */}
              <div className="space-y-3 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <h5 className="text-[9px] font-black uppercase text-[#0047AB] tracking-widest">
                    Data Pengirim (Profil Penjual)
                  </h5>
                  <button
                    type="button"
                    onClick={onSaveSellerProfile}
                    className="cursor-pointer text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1"
                  >
                    <Save size={10} /> Simpan sebagai Default
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                      <ShieldCheck size={11} className="text-slate-400" />
                      <span>Nama Penjual / Ruko</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Penjual"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                      value={form.sellerName}
                      onChange={e => setForm({ ...form, sellerName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                      <User size={11} className="text-slate-400" />
                      <span>Nama Penanggung Jawab (PIC)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Penanggung Jawab"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                      value={form.sellerPic}
                      onChange={e => setForm({ ...form, sellerPic: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                      <Phone size={11} className="text-slate-400" />
                      <span>No Telepon Pengirim</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nomor Telepon Pengirim"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                      value={form.sellerPhone}
                      onChange={e => setForm({ ...form, sellerPhone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                      <Mail size={11} className="text-slate-400" />
                      <span>Kontak / Email</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Kontak Penjual"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                      value={form.sellerContact}
                      onChange={e => setForm({ ...form, sellerContact: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" />
                      <span>Alamat Toko</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Alamat Penjual"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                      value={form.sellerAddress}
                      onChange={e => setForm({ ...form, sellerAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* CLIENT & METADATA SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <FileText size={11} />
                    <span>Nomor Invoice</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-2.5 font-black text-xs text-slate-500 cursor-not-allowed outline-none"
                    value={form.invoiceNumber}
                    readOnly
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <User size={11} />
                    <span>Nama Pelanggan (Klien)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Pelanggan"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                    value={form.recipient}
                    onChange={e => setForm({ ...form, recipient: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <Phone size={11} />
                    <span>No Telepon Penerima</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nomor Telepon Penerima"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                    value={form.recipientPhone}
                    onChange={e => setForm({ ...form, recipientPhone: e.target.value })}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <MapPin size={11} />
                    <span>Alamat Penerima (Klien)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Alamat Penerima"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                    value={form.recipientAddress}
                    onChange={e => setForm({ ...form, recipientAddress: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <Calendar size={11} />
                    <span>Tanggal Invoice</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                    <Calendar size={11} />
                    <span>Tanggal Jatuh Tempo</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* PRODUCTS GRID LIST */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h5 className="text-[9px] font-black uppercase text-[#0047AB] tracking-widest">
                    Daftar Item Tagihan
                  </h5>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="cursor-pointer flex items-center gap-1 text-[8px] font-black bg-blue-50 text-[#0047AB] px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all"
                  >
                    <Plus size={10} strokeWidth={3} /> TAMBAH BARIS
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[250px] overflow-y-auto no-scrollbar pr-0.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2 bg-slate-50/40 p-3.5 rounded-xl border border-slate-100">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="col-span-12 sm:col-span-6 space-y-0.5">
                          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Pilih dari Katalog</span>
                          <select
                            className="w-full bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-xs font-bold text-slate-500 outline-none"
                            value=""
                            onChange={(e) => handleSelectProduct(idx, e.target.value)}
                          >
                            <option value="">-- Pilih produk dari katalog --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                [{p.sku || "NO SKU"}] {p.name} - Rp{p.price?.toLocaleString()}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-12 sm:col-span-3 space-y-0.5">
                          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">SKU</span>
                          <input
                            type="text"
                            required
                            className="w-full bg-white py-1 px-2 rounded-lg text-xs font-black border uppercase outline-none text-slate-700"
                            placeholder="SKU"
                            value={item.sku}
                            onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                          />
                        </div>

                        <div className="col-span-12 sm:col-span-3 flex justify-end mt-2 sm:mt-0">
                          <button
                            type="button"
                            disabled={items.length === 1}
                            onClick={() => handleRemoveItemRow(idx)}
                            className="cursor-pointer flex items-center gap-1 py-1 px-2.5 bg-red-50 text-red-500 rounded-lg text-[8.5px] font-black uppercase hover:bg-red-100 disabled:opacity-20 transition-all"
                          >
                            <Trash2 size={10} /> Hapus
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="col-span-12 sm:col-span-6 space-y-0.5">
                          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Nama Produk</span>
                          <input
                            type="text"
                            required
                            className="w-full bg-white py-1 px-2 rounded-lg text-xs font-bold border outline-none text-slate-700"
                            placeholder="Nama Produk"
                            value={item.productName}
                            onChange={e => handleItemChange(idx, 'productName', e.target.value)}
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2 space-y-0.5">
                          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Qty</span>
                          <input
                            type="number"
                            required
                            min="1"
                            className="w-full bg-white py-1 px-1 rounded-lg text-xs font-black text-center border outline-none text-slate-700"
                            value={item.qty}
                            onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                          />
                        </div>

                        <div className="col-span-8 sm:col-span-4 space-y-0.5">
                          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">Harga</span>
                          <div className="flex items-center bg-white border rounded-lg px-2 py-0.5">
                            <span className="text-[9px] font-black text-slate-400 mr-0.5">Rp</span>
                            <input
                              type="number"
                              required
                              min="0"
                              className="w-full bg-transparent text-xs font-black text-[#0047AB] outline-none"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <h5 className="text-[9px] font-black uppercase text-[#0047AB] tracking-widest">PPN & Diskon</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Diskon (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-black text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                        value={form.discount}
                        onChange={e => setForm({ ...form, discount: e.target.value === "" ? 0 : Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Pajak PPN</label>
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-black text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB]"
                        value={form.tax}
                        onChange={e => setForm({ ...form, tax: Number(e.target.value) })}
                      >
                        <option value={0}>0%</option>
                        <option value={10}>10%</option>
                        <option value={11}>11%</option>
                        <option value={12}>12%</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Rekening Pembayaran</label>
                    <textarea
                      rows={2}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-[10px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB] resize-none"
                      placeholder="Informasi Rekening Bank"
                      value={form.bankInfo}
                      onChange={e => setForm({ ...form, bankInfo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[9px] font-black uppercase text-[#0047AB] tracking-widest">Catatan Memo</h5>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Memo Invoice</label>
                    <textarea
                      rows={5}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-[10px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#0047AB] resize-none"
                      placeholder="Catatan / Memo"
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* ========================================== */}
            {/* 🖥️ RIGHT COLUMN: STICKY LIVE PREVIEW        */}
            {/* ========================================== */}
            <div className="xl:col-span-5 border-l border-slate-100 pl-4 hidden xl:block sticky top-2 max-h-[78vh] overflow-y-auto no-scrollbar">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/50 flex flex-col gap-3">
                
                {/* Preview Header Alert */}
                <div className="flex items-center gap-1.5 text-[8.5px] font-black text-[#0047AB] uppercase tracking-widest bg-blue-50/70 py-1.5 px-3 rounded-lg border border-blue-100/50">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>Live Preview Tampilan Cetak PDF</span>
                </div>

                {/* MINI A5 INVOICE PAGE SIMULATOR */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs font-sans text-[#1E293B] flex flex-col justify-between min-h-[480px] relative overflow-hidden">
                  
                  {/* Header Profile */}
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        {form.logoBase64 ? (
                          <div className="w-8 h-8 rounded border border-slate-100 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                            <img src={form.logoBase64} alt="logo preview" className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                            <ImageIcon size={14} />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-black uppercase leading-tight truncate max-w-[130px]">{form.sellerName || "Simple and Yours"}</h4>
                          <p className="text-[7px] text-slate-400 truncate max-w-[130px]">{form.sellerAddress || "Alamat Toko"}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <h4 className="text-xs font-black uppercase tracking-tight" style={{ color: form.themeColor }}>INVOICE</h4>
                        <p className="text-[7.5px] font-black text-slate-500">#{form.invoiceNumber || "INV-NEW"}</p>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 my-3" />

                    {/* Metadata client (Dua kolom sejajar disamakan persis dengan cetak PDF 2 kolom) */}
                    <div className="grid grid-cols-12 gap-2 text-[8px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-semibold text-slate-600">
                      
                      {/* Kolom Kiri: Detail Klien */}
                      <div className="col-span-7 space-y-1">
                        <div>
                          <span className="text-slate-400 block tracking-wider text-[7px] uppercase font-bold">Nama Pelanggan:</span>
                          <span className="font-black text-slate-800 uppercase block truncate">{form.recipient || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block tracking-wider text-[7px] uppercase font-bold">Telp Pelanggan:</span>
                          <span className="text-slate-700 font-bold block">{form.recipientPhone || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block tracking-wider text-[7px] uppercase font-bold">Alamat Pelanggan:</span>
                          <span className="text-slate-700 block break-words leading-tight">{form.recipientAddress || "-"}</span>
                        </div>
                      </div>

                      {/* Kolom Kanan: Detail Transaksi */}
                      <div className="col-span-5 border-l border-slate-200 pl-2.5 space-y-1">
                        <div>
                          <span className="text-slate-400 block tracking-wider text-[7px] uppercase font-bold">Tanggal Invoice:</span>
                          <span className="text-slate-700 block font-bold">{formatDate(form.date)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block tracking-wider text-[7px] uppercase font-bold">Jatuh Tempo:</span>
                          <span className="text-red-500 block font-black">{formatDate(form.dueDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items preview list (Kolom disamakan persis dengan cetak PDF 6 Kolom) */}
                    <div className="mt-4">
                      <div className="grid grid-cols-12 text-[6.5px] font-black text-white uppercase py-1 px-1.5 rounded tracking-tight text-center" style={{ backgroundColor: form.themeColor }}>
                        <span className="col-span-1">NO</span>
                        <span className="col-span-2 text-left">SKU</span>
                        <span className="col-span-4 text-left">DESKRIPSI</span>
                        <span className="col-span-1">QTY</span>
                        <span className="col-span-2 text-right">HARGA</span>
                        <span className="col-span-2 text-right">TOTAL</span>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-[140px] overflow-y-auto no-scrollbar text-[7.5px] mt-1">
                        {items.map((it, idx) => (
                          <div key={idx} className="grid grid-cols-12 py-1.5 px-1.5 font-bold items-center text-center">
                            <span className="col-span-1 text-slate-400 font-bold text-[7px]">{idx + 1}</span>
                            <span className="col-span-2 font-black text-slate-600 truncate uppercase text-left pr-1">{it.sku || "-"}</span>
                            <span className="col-span-4 font-bold text-slate-700 truncate text-left pr-1">{it.productName || "-"}</span>
                            <span className="col-span-1 font-black">{it.qty}</span>
                            <span className="col-span-2 text-right font-black text-slate-600">Rp{(it.price || 0).toLocaleString()}</span>
                            <span className="col-span-2 text-right font-black text-slate-900">Rp{((it.qty || 0) * (it.price || 0)).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subtotals & footer signature preview (Side-by-side layout preview) */}
                  <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                    <div className="grid grid-cols-12 gap-3">
                      
                      {/* Left: bank transfer & notes inside mini simulator */}
                      <div className="col-span-6 space-y-1 bg-slate-50 border border-slate-100 p-1.5 rounded-lg text-[7px] overflow-hidden leading-tight">
                        <span className="font-black text-slate-500 uppercase block border-b border-slate-200 pb-0.5 text-[6.5px]">Pembayaran</span>
                        {form.bankInfo && <p className="text-slate-500 truncate"><span className="font-bold text-slate-700">Bank:</span> {form.bankInfo.replace(/\n/g, ' • ')}</p>}
                        {form.notes && <p className="text-slate-500 truncate"><span className="font-bold text-slate-700">Memo:</span> {form.notes}</p>}
                      </div>

                      {/* Right: Subtotal block */}
                      <div className="col-span-6 flex flex-col justify-end text-[7.5px] font-bold text-slate-500">
                        <div className="flex justify-between items-center">
                          <span>Subtotal:</span>
                          <span>Rp {Math.round(calculatedValues.subtotal).toLocaleString('id-ID')}</span>
                        </div>
                        {form.discount > 0 && (
                          <div className="flex justify-between items-center text-red-500 mt-0.5">
                            <span>Diskon:</span>
                            <span>-Rp {Math.round(form.discount).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {form.tax > 0 && (
                          <div className="flex justify-between items-center text-blue-500 mt-0.5">
                            <span>Pajak ({form.tax}%):</span>
                            <span>+{form.tax}%</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[9px] font-black text-[#0F172A] mt-1 pt-1 border-t border-slate-100">
                          <span>TOTAL:</span>
                          <span style={{ color: form.themeColor }}>
                            Rp {Math.round(calculatedValues.total).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* 🚀 TERBILANG NOMINAL DI PREVIEW (Paling Bawah setelah Pembayaran & Totals) */}
                    <div className="text-[6.8px] italic text-slate-500 text-left mt-2.5 font-bold break-words border-t border-dotted border-slate-200 pt-1">
                      Terbilang: {formatTerbilang(calculatedValues.total)}
                    </div>

                    {/* Footer Signature */}
                    <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-end text-[7px] text-slate-400">
                      <span>Invoice ini diterbitkan secara digital.</span>
                      <div className="text-right flex flex-col items-end">
                        <span className="font-bold text-slate-600 block">Hormat Kami,</span>
                        
                        {form.signatureBase64 ? (
                          <div className="h-6 w-16 my-0.5 flex items-center justify-end">
                            <img src={form.signatureBase64} alt="signature preview" className="max-h-full max-w-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-4 my-1" />
                        )}

                        <span className="font-black text-slate-800 uppercase block leading-none">{form.sellerName || "Simple and Yours"}</span>
                        {form.sellerPic && (
                          <span className="text-slate-500 font-bold block mt-0.5">{form.sellerPic}</span>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* CALCULATED TOTALS & FOOTER ACTIONS */}
          <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white mt-4 w-full">
            <div className="text-left bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                Ringkasan Nilai Tagihan
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
                <span className="text-lg font-black ml-2" style={{ color: form.themeColor }}>
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
                type="button"
                onClick={handleDownloadPdfCurrent}
                className="cursor-pointer flex-1 sm:flex-none px-6 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <FileDown size={14} /> <span>Unduh PDF</span>
              </button>
              <button
                type="submit"
                className="cursor-pointer flex-[2] sm:flex-none px-8 py-3.5 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5"
                style={{ backgroundColor: form.themeColor }}
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
