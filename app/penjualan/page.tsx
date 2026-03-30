"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  collection, onSnapshot, query, addDoc, 
  serverTimestamp, deleteDoc, doc, updateDoc, orderBy, increment 
} from "firebase/firestore";
import { 
  Search, Bell, ShoppingBag, Wallet, Info, 
  Upload, MoreHorizontal, ChevronRight, Plus, 
  X, Check, Loader2, Trash2, ArrowLeftRight, Hash,
  Save, Calendar
} from "lucide-react";
import * as XLSX from 'xlsx';

const MARKETPLACE_CONFIG: any = {
  shopee: { name: "Shopee", dataStartRow: 1, cols: { orderId: 0, sku: 6, name: 5, total: 10, qty: 9 } },
  tiktok: { name: "Tiktok", dataStartRow: 2, cols: { orderId: 0, sku: 6, total: 13, qty: 9 } },
  lazada: { name: "Lazada", dataStartRow: 1, cols: { orderId: 0, sku: 6, name: 4, total: 15, qty: 9 } }
};

const ADMIN_PERCENT = 0.16; 
const FIXED_FEE = 1250;     

export default function PenjualanPage() {
  const { currentUser } = useAuth();
  const [selectedMarketplace, setSelectedMarketplace] = useState("shopee");
  const [catalog, setCatalog] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("Hari Ini");
  
  const [useCatalogPrice, setUseCatalogPrice] = useState(true);
  const [manualForm, setManualForm] = useState({
    orderId: '', sku: '', qty: '1', manualPrice: '', manualCost: '', source: 'Shopee', status: 'Proses'
  });

  useEffect(() => {
    if (!currentUser) return;
    const qProd = query(collection(db, `users/${currentUser.uid}/products`));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setCatalog(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const qSales = query(collection(db, `users/${currentUser.uid}/sales`), orderBy("createdAt", "desc"));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubProd(); unsubSales(); };
  }, [currentUser]);

  const updateProductStock = async (sku: string, change: number) => {
    const product = catalog.find(p => p.sku === sku.toUpperCase());
    if (product && product.id) {
      const productRef = doc(db, `users/${currentUser?.uid}/products`, product.id);
      await updateDoc(productRef, { stock: increment(change) });
    }
  };

  const calculateNetProfitEntry = (price: number, cost: number, qty: number) => {
    const revenue = price * qty;
    const hpp = cost * qty;
    const adminFees = (price * ADMIN_PERCENT) * qty;
    return revenue - hpp - adminFees - FIXED_FEE;
  };

  // --- 1. FILTER DUPLIKASI PADA IMPORT EXCEL ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setIsProcessing(true);
    const config = MARKETPLACE_CONFIG[selectedMarketplace];
    const reader = new FileReader();

    // Ambil semua Order ID yang sudah ada di database (dari state transactions)
    const existingOrderIds = new Set(transactions.map(t => String(t.orderId)));

    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
      const rawRows = data.slice(config.dataStartRow);
      
      let addedCount = 0;
      let skippedCount = 0;

      for (const row of rawRows) {
        const orderIdValue = String(row[config.cols.orderId] || "").trim();
        if (!orderIdValue) continue;

        // CEK APAKAH ORDER ID SUDAH ADA?
        if (existingOrderIds.has(orderIdValue)) {
          skippedCount++;
          continue; // Lewati baris ini jika duplikat
        }

        const sku = String(row[config.cols.sku] || "").trim().toUpperCase();
        const matched = catalog.find(p => p.sku === sku);
        const qty = Number(row[config.cols.qty]) || 1;

        const finalPricePerUnit = matched ? matched.price : (Number(row[config.cols.total]) / qty || 0);
        const finalCostPerUnit = matched ? matched.costPrice : 0;
        const totalRevenue = finalPricePerUnit * qty;
        const netProfit = calculateNetProfitEntry(finalPricePerUnit, finalCostPerUnit, qty);

        await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
          orderId: orderIdValue,
          sku,
          product: matched ? matched.name : (row[config.cols.name] || "Produk Luar Katalog"),
          total: totalRevenue,
          hpp: finalCostPerUnit * qty,
          qty,
          profit: netProfit,
          marketplace: config.name,
          status: 'Proses',
          createdAt: serverTimestamp()
        });
        await updateProductStock(sku, -qty);
        addedCount++;
      }
      setIsProcessing(false);
      e.target.value = '';
      alert(`Impor Selesai!\nBerhasil: ${addedCount}\nDuplikat (Dilewati): ${skippedCount}`);
    };
    reader.readAsBinaryString(file);
  };

  // --- 2. FILTER DUPLIKASI PADA INPUT MANUAL ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const orderIdInput = manualForm.orderId.trim();

    // CEK DUPLIKASI DI STATE
    const isDuplicate = transactions.some(t => String(t.orderId).trim() === orderIdInput);
    if (isDuplicate && orderIdInput !== "") {
      alert("Nomor Pesanan ini sudah terdaftar di database!");
      return; // Berhenti jika duplikat
    }

    const matched = catalog.find(p => p.sku === manualForm.sku.toUpperCase());
    const qty = Number(manualForm.qty);
    const finalPrice = useCatalogPrice && matched ? matched.price : Number(manualForm.manualPrice);
    const finalCost = useCatalogPrice && matched ? matched.costPrice : Number(manualForm.manualCost);
    const sku = manualForm.sku.toUpperCase();

    const netProfit = calculateNetProfitEntry(finalPrice, finalCost, qty);

    await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
      orderId: orderIdInput || `MAN-${Date.now()}`,
      sku, product: matched ? matched.name : "Input Manual",
      total: finalPrice * qty, hpp: finalCost * qty, qty, 
      profit: netProfit,
      marketplace: manualForm.source, status: manualForm.status, createdAt: serverTimestamp()
    });

    if (manualForm.status !== 'Retur') await updateProductStock(sku, -qty);
    setIsManualModalOpen(false);
    setManualForm({ orderId: '', sku: '', qty: '1', manualPrice: '', manualCost: '', source: 'Shopee', status: 'Proses' });
  };

  // Logika Filter Tampilan (Hari ini, dsb)
  const filteredTransactions = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const txDate = t.createdAt.toDate();
    const now = new Date();
    const diffInMs = now.getTime() - txDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    if (timeFilter === "Hari Ini") return txDate.toDateString() === now.toDateString();
    if (timeFilter === "3 Hari") return diffInDays <= 3;
    if (timeFilter === "1 Bulan") return diffInDays <= 30;
    return true;
  });

  const handleStatusChange = async (t: any, newStatus: string) => {
    if (!currentUser) return;
    const oldStatus = t.status;
    await updateDoc(doc(db, `users/${currentUser.uid}/sales`, t.id), { status: newStatus });
    if (newStatus === 'Retur' && oldStatus !== 'Retur') await updateProductStock(t.sku, t.qty);
    else if (oldStatus === 'Retur' && newStatus !== 'Retur') await updateProductStock(t.sku, -t.qty);
  };

  const handleDelete = async (t: any) => {
    if (!confirm("Hapus transaksi? Stok akan dikembalikan.")) return;
    await deleteDoc(doc(db, `users/${currentUser?.uid}/sales`, t.id));
    if (t.status !== 'Retur') await updateProductStock(t.sku, t.qty);
  };

  const stats = filteredTransactions.reduce((acc, curr) => {
    if (curr.status !== 'Retur') {
      acc.omset += curr.total;
      acc.profit += curr.profit;
    }
    return acc;
  }, { omset: 0, profit: 0 });

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-none">Laporan Penjualan</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center">
            <Check size={12} className="mr-1 text-emerald-500" /> Duplicate protection & Net Profit active
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-[#F1F5F9] shadow-sm self-start">
          {["Hari Ini", "3 Hari", "1 Bulan"].map((opt) => (
            <button key={opt} onClick={() => setTimeFilter(opt)}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${timeFilter === opt ? "bg-[#0047AB] text-white shadow-md" : "text-slate-400 hover:text-[#0047AB]"}`}>
              {opt}
            </button>
          ))}
        </div>

        <button onClick={() => setIsManualModalOpen(true)} className="bg-[#0047AB] text-white px-5 py-3 rounded-2xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2">
          <Plus size={18} strokeWidth={3} />
          <span>Input Manual</span>
        </button>
      </div>

      {/* STATS */}
      <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-[#F1F5F9] shadow-sm">
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Omset {timeFilter}</p>
          <h3 className="text-4xl font-black text-[#0047AB]">Rp {stats.omset.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Profit Bersih {timeFilter}</p>
          <h3 className="text-4xl font-black text-emerald-600">Rp {stats.profit.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      <div className="px-4 sm:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SIDEBAR UPLOAD */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-[#F1F5F9] shadow-sm">
            <h4 className="text-lg font-black text-[#0F172A] mb-6 uppercase text-[11px] tracking-[0.2em]">Sumber Impor</h4>
            <div className="space-y-3">
              {Object.keys(MARKETPLACE_CONFIG).map((key) => (
                <button key={key} onClick={() => setSelectedMarketplace(key)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold text-sm ${selectedMarketplace === key ? "border-[#0047AB] bg-blue-50 text-[#0047AB]" : "border-slate-50 text-slate-400 hover:border-slate-200"}`}>
                  <span className="capitalize">{MARKETPLACE_CONFIG[key].name}</span>
                  {selectedMarketplace === key && <Check size={18} strokeWidth={3} />}
                </button>
              ))}
            </div>
            <div className="mt-8 relative group">
              {isProcessing && <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center rounded-[24px]"><Loader2 className="animate-spin text-[#0047AB] mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Memproses...</span></div>}
              <input type="file" accept=".xlsx, .csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-10 text-center group-hover:bg-slate-50 transition-all group-hover:border-[#0047AB]">
                <Upload className="mx-auto text-[#0047AB] mb-4" size={32} />
                <p className="text-sm font-black text-[#0F172A]">Upload Laporan</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Skip duplicate order IDs</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden min-h-[500px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                  <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                    <th className="px-8 py-5">Item</th>
                    <th className="px-6 py-5 text-right">Qty</th>
                    <th className="px-6 py-5 text-right">Net Profit</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#0F172A] leading-tight uppercase">{t.product}</span>
                          <span className="text-[9px] font-bold text-[#0047AB] mt-1 tracking-tighter">#{t.orderId} • {t.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-xs text-slate-400">{t.qty}</td>
                      <td className={`px-6 py-5 text-right text-sm font-black ${t.status === 'Retur' ? 'text-slate-300 line-through' : 'text-emerald-600'}`}>
                        Rp {t.profit.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <select value={t.status} onChange={(e) => handleStatusChange(t, e.target.value)}
                          className={`text-[9px] font-black px-3 py-1.5 rounded-full border bg-transparent cursor-pointer outline-none ${t.status === 'Selesai' ? "text-emerald-600 border-emerald-100" : t.status === 'Retur' ? "text-red-600 border-red-100" : "text-amber-600 border-amber-100"}`}>
                          <option value="Proses">Proses</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Retur">Retur</option>
                        </select>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => handleDelete(t)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-slate-200">
                  <ShoppingBag size={64} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Belum Ada Transaksi</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL INPUT MANUAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter">Input Manual</h2>
                <button onClick={() => setIsManualModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500"><X /></button>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-5">
                <input required value={manualForm.orderId} onChange={(e) => setManualForm({...manualForm, orderId: e.target.value})} placeholder="Nomor Pesanan (ID)" className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-[#0047AB]" />
                <div className="grid grid-cols-3 gap-4">
                  <input required value={manualForm.sku} onChange={(e) => setManualForm({...manualForm, sku: e.target.value})} placeholder="SKU" className="col-span-2 bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm" />
                  <input type="number" min="1" required value={manualForm.qty} onChange={(e) => setManualForm({...manualForm, qty: e.target.value})} className="bg-blue-50/50 border-none rounded-[20px] text-center font-black text-[#0047AB]" />
                </div>
                <div className="flex justify-center py-2">
                   <button type="button" onClick={() => setUseCatalogPrice(!useCatalogPrice)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase transition-all border-2 ${useCatalogPrice ? "bg-[#0047AB] text-white" : "text-slate-400"}`}>
                    <ArrowLeftRight size={12} className="inline mr-2" />
                    {useCatalogPrice ? "Harga Katalog" : "Harga Manual"}
                  </button>
                </div>
                {!useCatalogPrice && (
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Jual Unit" value={manualForm.manualPrice} onChange={(e) => setManualForm({...manualForm, manualPrice: e.target.value})} className="bg-slate-50 border-none rounded-xl py-3 px-4 font-bold text-sm" />
                    <input type="number" placeholder="Modal Unit" value={manualForm.manualCost} onChange={(e) => setManualForm({...manualForm, manualCost: e.target.value})} className="bg-slate-50 border-none rounded-xl py-3 px-4 font-bold text-sm" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <select value={manualForm.source} onChange={(e) => setManualForm({...manualForm, source: e.target.value})} className="bg-slate-50 rounded-xl py-3 px-4 font-bold text-sm">
                    <option>Shopee</option><option>Tiktok</option><option>Lazada</option><option>Offline</option>
                  </select>
                  <select value={manualForm.status} onChange={(e) => setManualForm({...manualForm, status: e.target.value})} className="bg-slate-50 rounded-xl py-3 px-4 font-bold text-sm">
                    <option value="Proses">Proses</option><option value="Selesai">Selesai</option><option value="Retur">Retur</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-[#0047AB] text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-blue-200">
                  Simpan & Potong Stok
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}