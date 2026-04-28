"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import * as XLSX from 'xlsx';
import { 
  collection, onSnapshot, query, addDoc, 
  serverTimestamp, orderBy, doc, updateDoc, increment, deleteDoc 
} from "firebase/firestore";
import { 
  PackageCheck, Search, Plus, X, Trash2, 
  Truck, Hash, Info, History, AlertCircle, Loader2,
  CheckCircle2, Timer,
  Upload
} from "lucide-react";

export default function GudangShopeePage() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    resi: '',
    sku: '',
    qty: 1,
    note: 'Pengiriman Kilat Shopee'
  });

  useEffect(() => {
    if (!currentUser) return;

    // Sinkronisasi Katalog Produk
    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Sinkronisasi Data Warehouse
    const unsubWarehouse = onSnapshot(
      query(collection(db, `users/${currentUser.uid}/shopee_warehouse`), orderBy("createdAt", "desc")),
      (snap) => {
        setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => { unsubProd(); unsubWarehouse(); };
  }, [currentUser]);

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isProcessing) return;

    setIsProcessing(true);
    // 1. Pembersihan SKU (Sama dengan logika Penjualan)
    const cleanSku = form.sku.replace(/\s+/g, '').toUpperCase();
    const product = products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === cleanSku);

    if (!product) {
      alert("SKU tidak ditemukan di katalog utama!");
      setIsProcessing(false);
      return;
    }

    try {
      let targetSku = product.sku;
      let targetProductId = product.id;
      let targetProductName = product.name;
      let finalDeductionQty = form.qty;

      // 2. Logika Mapping & Multiplier (Sync dengan Penjualan)
      if (product.isMapping && product.linkedSku) {
        const mainProd = products.find(p => 
          p.sku.replace(/\s+/g, '').toUpperCase() === product.linkedSku.replace(/\s+/g, '').toUpperCase()
        );
        if (mainProd) {
          targetSku = mainProd.sku;
          targetProductId = mainProd.id;
          targetProductName = mainProd.name;
          finalDeductionQty = form.qty * (product.multiplier || 1);
        }
      }

      // 3. Simpan ke Database Warehouse
      await addDoc(collection(db, `users/${currentUser.uid}/shopee_warehouse`), {
        resi: form.resi.trim(),
        sku: targetSku, // Simpan SKU Utamanya
        qty: form.qty,
        productName: targetProductName,
        note: form.note,
        isUsed: false,
        createdAt: serverTimestamp()
      });

      // 4. Potong Stok Utama secara Akurat
      await updateDoc(doc(db, `users/${currentUser.uid}/products`, targetProductId), {
        stock: increment(-finalDeductionQty)
      });

      alert(`Berhasil! Stok ${targetProductName} berkurang ${finalDeductionQty} unit.`);
      setIsModalOpen(false);
      setForm({ resi: '', sku: '', qty: 1, note: 'Pengiriman Kilat Shopee' });
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWarehouseItem = async (item: any) => {
    const confirmDelete = window.confirm(
      `Hapus resi ${item.resi}? Stok ${item.productName} sebanyak ${item.qty} unit akan dikembalikan ke Inventaris Utama.`
    );
    
    if (!confirmDelete || !currentUser) return;

    try {
      setIsProcessing(true);

      // 1. Cari produk di katalog berdasarkan SKU yang tersimpan di record warehouse
      const product = products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === item.sku.toUpperCase());

      if (product) {
        // 2. Kembalikan stok (Gunakan increment positif)
        // Kita asumsikan item.qty adalah jumlah unit yang sebelumnya dipotong
        const productRef = doc(db, `users/${currentUser.uid}/products`, product.id);
        
        // Jika sebelumnya saat input kita pakai multiplier, maka saat hapus juga harus dikalikan
        // Namun karena di logic Add kita sudah menyimpan SKU Utama, biasanya multipliernya adalah 1
        const restoreQty = item.qty * (product.multiplier || 1); 

        await updateDoc(productRef, {
          stock: increment(restoreQty)
        });
      }

      // 3. Hapus dokumen dari shopee_warehouse
      await deleteDoc(doc(db, `users/${currentUser.uid}/shopee_warehouse`, item.id));

      alert(`Berhasil! ${item.productName} telah kembali ke stok utama.`);
    } catch (err) {
      console.error("Gagal menghapus & mengembalikan stok:", err);
      alert("Terjadi kesalahan saat mengembalikan stok.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = items.filter(i => 
    i.resi.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistik Warehouse
  const stats = {
    total: items.length,
    pending: items.filter(i => !i.isUsed).length,
    used: items.filter(i => i.isUsed).length
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);

    const reader = new FileReader();
    // Config khusus Shopee Kilat
    const config = { dataStartRow: 1, cols: { orderId: 1, sku: 8, name: 7 } };

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
        
        const rawRows = data.slice(config.dataStartRow);
        let addedCount = 0;

        for (const row of rawRows) {
          const orderIdVal = String(row[config.cols.orderId] || "").trim();
          const rawSku = String(row[config.cols.sku] || "").replace(/\s+/g, '').toUpperCase();
          
          if (!orderIdVal || !rawSku) continue;

          // Cek apakah sudah ada di warehouse
          const isDuplicate = items.some(w => w.resi === orderIdVal && w.sku === rawSku);
          if (isDuplicate) continue;

          // Cari di Katalog untuk Mapping & Potong Stok
          const product = products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === rawSku);
          if (!product) continue;

          let targetSku = product.sku;
          let targetProductId = product.id;
          let targetProductName = product.name;
          let finalDeductionQty = 1; // Fixed 1 untuk Shopee Kilat

          // Handle Mapping
          if (product.isMapping && product.linkedSku) {
            const mainProd = products.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === product.linkedSku.replace(/\s+/g, '').toUpperCase());
            if (mainProd) {
              targetSku = mainProd.sku;
              targetProductId = mainProd.id;
              targetProductName = mainProd.name;
              finalDeductionQty = 1 * (product.multiplier || 1);
            }
          }

          // Simpan ke Warehouse
          await addDoc(collection(db, `users/${currentUser.uid}/shopee_warehouse`), {
            resi: orderIdVal,
            sku: targetSku,
            qty: 1,
            productName: targetProductName,
            note: "Impor Massal Shopee Kilat",
            isUsed: false,
            createdAt: serverTimestamp()
          });

          // Potong Stok Utama
          await updateDoc(doc(db, `users/${currentUser.uid}/products`, targetProductId), {
            stock: increment(-finalDeductionQty)
          });

          addedCount++;
        }
        alert(`Berhasil impor massal ${addedCount} data kilat.`);
      } catch (err) {
        console.error(err);
        alert("Gagal memproses file.");
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20 transition-all duration-300">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-[#0F172A]">Shopee Fulfillment</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Truck size={12} className="text-[#0047AB]"/> Gudang & Pengiriman Kilat (Advance)
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#0047AB] text-white px-6 py-4 rounded-[24px] font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
          <Plus size={18} strokeWidth={3}/> INPUT RESI KILAT
        </button>

        <div className="relative group">
  <input 
    type="file" accept=".xlsx, .xls" 
    onChange={handleFileUpload} 
    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    disabled={isProcessing}
  />
  <button className="bg-emerald-600 text-white px-6 py-4 rounded-[24px] font-black text-xs shadow-xl shadow-emerald-100 flex items-center gap-2">
    {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Upload size={18}/>}
    <span>{isProcessing ? "MEMPROSES..." : "IMPOR MASSAL SHOPEE"}</span>
  </button>
</div>
      </div>

      {/* STATS ROW */}
      <div className="px-4 sm:px-10 mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Resi Terdata</p>
          <h3 className="text-3xl font-black text-[#0F172A]">{stats.total}</h3>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Menunggu Matching</p>
          <h3 className="text-3xl font-black text-[#0F172A]">{stats.pending}</h3>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Berhasil Terpakai</p>
          <h3 className="text-3xl font-black text-[#0F172A]">{stats.used}</h3>
        </div>
      </div>

      {/* SEARCH */}
      <div className="px-4 sm:px-10 mt-10">
        <div className="relative max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Cari Resi atau SKU..." 
            className="w-full bg-white border border-slate-200 rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#0047AB] transition-all shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="px-4 sm:px-10 mt-8">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">Informasi Resi</th>
                  <th className="px-6 py-6">Produk & SKU Utama</th>
                  <th className="px-6 py-6 text-center">Qty</th>
                  <th className="px-6 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#0047AB] tracking-tight">#{item.resi}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">{item.note}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm font-black text-[#0F172A] uppercase leading-tight">{item.productName}</p>
                      <p className="text-[10px] font-bold text-[#0047AB] mt-1 uppercase tracking-tighter">{item.sku}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-600">{item.qty}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.isUsed ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                      }`}>
                        {item.isUsed ? <CheckCircle2 size={12}/> : <Timer size={12}/>}
                        {item.isUsed ? "Sudah Terpakai" : "Menunggu Order"}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {!item.isUsed && (
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleDeleteWarehouseItem(item)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
                        >
                          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="py-24 text-center">
              <PackageCheck size={48} className="mx-auto text-slate-100 mb-4" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Belum ada data resi kilat</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL INPUT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tighter text-[#0F172A]">Input Resi Kilat</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X/></button>
            </div>
            <form onSubmit={handleAddWarehouse} className="space-y-6">
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

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full bg-[#0047AB] text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20} strokeWidth={3}/>}
                {isProcessing ? "MEMPROSES..." : "SIMPAN & POTONG STOK"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}