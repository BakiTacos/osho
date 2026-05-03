"use client";

import React, { useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { PackageCheck, Search, Plus, Trash2, Truck, AlertCircle, Loader2, CheckCircle2, Timer, Upload } from "lucide-react";

// IMPORT CLEAN ARCHITECTURE
import { useAdvancedFulfillmentData } from "../../hooks/useAdvancedFulfillmentData";
import { AdvancedFulfillmentService } from "../../../lib/services/AdvancedFulfillmentService";
import { AddWarehouseModal } from "../../../components/advanced/AddWarehouseModal";

export default function GudangShopeePage() {
  const { currentUser } = useAuth();
  
  // Custom Hook & OOP Service
  const { items, products } = useAdvancedFulfillmentData(currentUser);
  const fulfillmentService = new AdvancedFulfillmentService(currentUser, products);

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ resi: '', sku: '', qty: 1, note: 'Pengiriman Kilat Shopee' });

  // Handlers
  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isProcessing) return;
    setIsProcessing(true);
    try {
      await fulfillmentService.addWarehouseItem(form, items);
      alert("Data berhasil disimpan!");
      setIsModalOpen(false);
      setForm({ resi: '', sku: '', qty: 1, note: 'Pengiriman Kilat Shopee' });
    } catch (err: any) { alert(err.message); } 
    finally { setIsProcessing(false); }
  };

  const handleCleanupDuplicates = async () => {
    if (!currentUser || items.length === 0) return;
    if (!window.confirm("Sistem akan menghapus duplikat DAN mengembalikan stok yang terpotong ganda. Lanjutkan?")) return;
    setIsProcessing(true);
    try {
      const { deleteCount, totalStockRestored } = await fulfillmentService.cleanupDuplicates(items);
      if (deleteCount > 0) alert(`Sukses! ${deleteCount} data duplikat dihapus dan ${totalStockRestored} unit stok berhasil dikembalikan ke gudang.`);
      else alert("Hebat! Tidak ditemukan data duplikat.");
    } catch (err) { alert("Terjadi kesalahan saat sinkronisasi stok."); } 
    finally { setIsProcessing(false); }
  };

  const handleDeleteWarehouseItem = async (item: any) => {
    if (!window.confirm(`Hapus resi ${item.resi}? Stok ${item.productName} sebanyak ${item.qty} unit akan dikembalikan.`)) return;
    setIsProcessing(true);
    try {
      await fulfillmentService.deleteWarehouseItem(item);
      alert(`Berhasil! ${item.productName} telah kembali ke stok utama.`);
    } catch (err) { alert("Terjadi kesalahan saat mengembalikan stok."); } 
    finally { setIsProcessing(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);
    try {
      const addedCount = await fulfillmentService.processMassImport(file, items);
      alert(`Berhasil impor ${addedCount} data baru. Data duplikat otomatis dilewati.`);
    } catch (err) { console.error(err); } 
    finally { setIsProcessing(false); e.target.value = ''; }
  };

  // Derived Data
  const filteredItems = items.filter(i => i.resi.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.toLowerCase().includes(searchTerm.toLowerCase()));
  const stats = { total: items.length, pending: items.filter(i => !i.isUsed).length, used: items.filter(i => i.isUsed).length };

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20 transition-all duration-300">
      <div className="px-4 sm:px-10 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-[#0F172A]">Shopee Fulfillment</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2"><Truck size={12} className="text-[#0047AB]"/> Gudang & Pengiriman Kilat (Advance)</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#0047AB] text-white px-6 py-4 rounded-[24px] font-black text-xs shadow-xl shadow-blue-100 flex items-center gap-3"><Plus size={18} strokeWidth={3}/> INPUT RESI KILAT</button>
        <button onClick={handleCleanupDuplicates} disabled={isProcessing || items.length === 0} className="bg-white text-orange-500 border-2 border-orange-500 px-5 py-3 rounded-[24px] font-black text-xs hover:bg-orange-50 flex items-center gap-2">{isProcessing ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}<span>BERSIHKAN DUPLIKAT</span></button>
        <div className="relative group">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isProcessing} />
          <button className="bg-emerald-600 text-white px-6 py-4 rounded-[24px] font-black text-xs shadow-xl shadow-emerald-100 flex items-center gap-2">{isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Upload size={18}/>}<span>{isProcessing ? "MEMPROSES..." : "IMPOR MASSAL SHOPEE"}</span></button>
        </div>
      </div>

      <div className="px-4 sm:px-10 mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Resi Terdata</p><h3 className="text-3xl font-black text-[#0F172A]">{stats.total}</h3></div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Menunggu Matching</p><h3 className="text-3xl font-black text-[#0F172A]">{stats.pending}</h3></div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm border-l-4 border-l-emerald-500"><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Berhasil Terpakai</p><h3 className="text-3xl font-black text-[#0F172A]">{stats.used}</h3></div>
      </div>

      <div className="px-4 sm:px-10 mt-10">
        <div className="relative max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047AB]" size={20} />
          <input type="text" placeholder="Cari Resi atau SKU..." className="w-full bg-white border rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#0047AB]" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="px-4 sm:px-10 mt-8">
        <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr><th className="px-8 py-6">Informasi Resi</th><th className="px-6 py-6">Produk & SKU Utama</th><th className="px-6 py-6 text-center">Qty</th><th className="px-6 py-6">Status</th><th className="px-8 py-6 text-right">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 group">
                    <td className="px-8 py-6"><div className="flex flex-col"><span className="text-sm font-black text-[#0047AB]">#{item.resi}</span><span className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">{item.note}</span></div></td>
                    <td className="px-6 py-6"><p className="text-sm font-black text-[#0F172A] uppercase">{item.productName}</p><p className="text-[10px] font-bold text-[#0047AB] mt-1 uppercase">{item.sku}</p></td>
                    <td className="px-6 py-6 text-center"><span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-600">{item.qty}</span></td>
                    <td className="px-6 py-6"><div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase ${item.isUsed ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>{item.isUsed ? <CheckCircle2 size={12}/> : <Timer size={12}/>}{item.isUsed ? "Sudah Terpakai" : "Menunggu Order"}</div></td>
                    <td className="px-8 py-6 text-right">{!item.isUsed && <button disabled={isProcessing} onClick={() => handleDeleteWarehouseItem(item)} className="p-2 text-slate-300 hover:text-red-500 rounded-xl disabled:opacity-30">{isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && <div className="py-24 text-center"><PackageCheck size={48} className="mx-auto text-slate-100 mb-4" /><p className="text-[10px] font-black text-slate-300 uppercase">Belum ada data resi kilat</p></div>}
        </div>
      </div>

      <AddWarehouseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} form={form} setForm={setForm} onSubmit={handleAddWarehouse} isProcessing={isProcessing} />
    </div>
  );
}