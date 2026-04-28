"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  collection, onSnapshot, query, addDoc, 
  serverTimestamp, deleteDoc, doc, updateDoc, orderBy, increment, 
  writeBatch
} from "firebase/firestore";
import { 
  Search, Bell, ShoppingBag, Wallet, Info, 
  Upload, MoreHorizontal, ChevronRight, ChevronLeft, Plus, 
  X, Check, Loader2, Trash2, ArrowLeftRight, Hash,
  AlertCircle, Edit2
} from "lucide-react";
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

const MARKETPLACE_CONFIG: any = {
  shopee: { name: "Shopee", dataStartRow: 1, cols: { orderId: 0, resi: 4, sku: 14, name: 13, total: 20, qty: 18 } },
  tiktok: { name: "Tiktok", dataStartRow: 2, cols: { orderId: 0, sku: 6, total: 13, qty: 9 } },
  lazada: { name: "Lazada", dataStartRow: 1, cols: { orderId: 0, sku: 6, name: 4, total: 15, qty: 9 } }
};

const ADMIN_PERCENT = 0.16; 
const FIXED_FEE = 1250;     

export default function PenjualanPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [selectedMarketplace, setSelectedMarketplace] = useState("shopee");
  const [catalog, setCatalog] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [shopeeWarehouse, setShopeeWarehouse] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState("Hari Ini");
  
  // PAGINATION & VIEW STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState("Semua"); // "Semua" | "Pending"
  const itemsPerPage = 20;

  const [useCatalogPrice, setUseCatalogPrice] = useState(true);
  const [manualForm, setManualForm] = useState({
    orderId: '', sku: '', qty: '1', manualPrice: '', manualCost: '', source: 'Shopee', status: 'Proses'
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map(t => t.id));
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const unsubProd = onSnapshot(query(collection(db, `users/${currentUser.uid}/products`)), (snap) => {
      setCatalog(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSales = onSnapshot(query(collection(db, `users/${currentUser.uid}/sales`), orderBy("createdAt", "desc")), (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubWarehouse = onSnapshot(collection(db, `users/${currentUser.uid}/shopee_warehouse`), (snap) => {
      setShopeeWarehouse(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubProd(); unsubSales(); unsubWarehouse(); };
  }, [currentUser]);

  // RESET PAGINATION ON FILTER CHANGE
  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, timeFilter, selectedMarketplace]);

  // LOGIKA PROFIT BERSIH (FIXED: Menghindari Double Multiplication)
  const calculateNetProfitEntry = (totalRevenue: number, totalHpp: number) => {
    const adminFees = totalRevenue * ADMIN_PERCENT; 
    return totalRevenue - totalHpp - adminFees - FIXED_FEE;
  };

  // LOGIKA UPDATE STOK & WAREHOUSE
  const updateProductStock = async (skuInput: string, change: number, resiInput?: string) => {
    const sku = skuInput.replace(/\s+/g, '').toUpperCase();
    const resi = resiInput?.trim() || "";
    const product = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
    
    if (product) {
      let targetSku = product.sku;
      let productId = product.id;
      let finalChange = change;

      if (product.isMapping && product.linkedSku) {
        const mainProd = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === product.linkedSku.replace(/\s+/g, '').toUpperCase());
        if (mainProd) {
          targetSku = mainProd.sku;
          productId = mainProd.id;
          finalChange = change * (product.multiplier || 1);
        }
      }

      if (resi !== "") {
        const warehouseMatch = shopeeWarehouse.find(w => 
          w.resi.trim() === resi && w.sku.replace(/\s+/g, '').toUpperCase() === targetSku.toUpperCase() && !w.isUsed
        );
        if (warehouseMatch) {
          await updateDoc(doc(db, `users/${currentUser?.uid}/shopee_warehouse`, warehouseMatch.id), {
            isUsed: true, usedAt: serverTimestamp()
          });
          return; 
        }
      }
      await updateDoc(doc(db, `users/${currentUser?.uid}/products`, productId), { stock: increment(finalChange) });
    }
  };

  // FILE UPLOAD HANDLER (Force Pending on Unmatch)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);
    const reader = new FileReader();
    const config = MARKETPLACE_CONFIG[selectedMarketplace];
    const existingOrderIds = new Set(transactions.map(t => String(t.orderId).trim()));

    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
      const headers = data[0];
      const autoSkuIdx = headers.findIndex((h: any) => String(h).toUpperCase().includes("SKU") || String(h).toUpperCase().includes("REFERENSI"));
      const finalSkuIdx = (config.cols.sku !== undefined) 
        ? config.cols.sku 
        : headers.findIndex((h: any) => 
            String(h).toUpperCase().includes("SKU") || 
            String(h).toUpperCase().includes("REFERENSI")
          );
      const rawRows = data.slice(config.dataStartRow);
      
      let addedCount = 0;
      for (const row of rawRows) {
        const resiValue = String(row[config.cols.resi] || "").trim();
        const orderIdLama = String(row[config.cols.orderId] || "").trim();
        const finalId = resiValue || orderIdLama;
        if (!finalId || existingOrderIds.has(finalId)) continue;

        const sku = String(row[finalSkuIdx] || "").replace(/\s+/g, '').toUpperCase();
        const qty = Number(row[config.cols.qty]) || 1;
        const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
        
        let unitPrice = 0, unitCost = 0, multiplier = 1;
        let productName = "Produk Luar Katalog"; // Default: Force Pending

        if (matched) {
          productName = matched.name;
          unitPrice = matched.price || (Number(row[config.cols.total]) / qty);
          if (matched.isMapping && matched.linkedSku) {
            const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
            unitCost = main ? (main.costPrice || 0) : (matched.costPrice || 0);
            multiplier = matched.multiplier || 1;
          } else {
            unitCost = matched.costPrice || 0;
          }
        } else {
          unitPrice = (Number(row[config.cols.total]) / qty || 0);
        }

        const totalRevenue = unitPrice * qty;
        const totalHpp = (unitCost * multiplier) * qty;
        const netProfit = calculateNetProfitEntry(totalRevenue, totalHpp);

        await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
          orderId: finalId, sku, product: productName, total: totalRevenue,
          hpp: totalHpp, qty, profit: netProfit, marketplace: config.name,
          status: 'Proses', createdAt: serverTimestamp()
        });

        await updateProductStock(sku, -qty, finalId);
        addedCount++;
      }
      setIsProcessing(false);
      e.target.value = '';
      alert(`Berhasil impor ${addedCount} data.`);
    };
    reader.readAsBinaryString(file);
  };

  // MANUAL SUBMIT HANDLER (Force Pending on Unmatch)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const sku = manualForm.sku.replace(/\s+/g, '').toUpperCase();
    const qty = Number(manualForm.qty);
    const orderId = manualForm.orderId.trim() || `MAN-${Date.now()}`;
    const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
    
    let unitPrice = 0, unitCost = 0, multiplier = 1;
    let productName = "Produk Luar Katalog"; // Force Pending

    if (matched) {
      productName = matched.name;
      unitPrice = useCatalogPrice ? (matched.price || 0) : Number(manualForm.manualPrice);
      if (matched.isMapping && matched.linkedSku) {
        const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
        unitCost = main ? (main.costPrice || 0) : (matched.costPrice || 0);
        multiplier = matched.multiplier || 1;
      } else {
        unitCost = matched.costPrice || 0;
      }
    } else {
      unitPrice = Number(manualForm.manualPrice) || 0;
      unitCost = Number(manualForm.manualCost) || 0;
    }

    const totalRevenue = unitPrice * qty;
    const totalHpp = (unitCost * multiplier) * qty;
    const netProfit = calculateNetProfitEntry(totalRevenue, totalHpp);

    await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
      orderId, sku, product: productName, total: totalRevenue, hpp: totalHpp,
      qty, profit: netProfit, marketplace: manualForm.source, status: manualForm.status, createdAt: serverTimestamp()
    });

    await updateProductStock(sku, -qty, orderId);
    setIsManualModalOpen(false);
    setManualForm({ orderId: '', sku: '', qty: '1', manualPrice: '', manualCost: '', source: 'Shopee', status: 'Proses' });
  };

  // EDIT PENDING HANDLER
  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedTx) return;

    // 1. Bersihkan SKU & Cari di Katalog (Sumber Kebenaran)
    const newSku = selectedTx.sku.replace(/\s+/g, '').toUpperCase();
    const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === newSku);

    if (!matched) return alert("SKU tetap tidak ditemukan di katalog!");

    // 2. AMBIL DATA HARGA DARI KATALOG (Jangan pakai data dari selectedTx)
    // Ini kunci supaya profit nggak minus lagi
    const unitPrice = Number(matched.price) || 0;
    const qty = Number(selectedTx.qty) || 1;
    const finalTotalRevenue = unitPrice * qty;

    // 3. HITUNG HPP & MULTIPLIER
    let unitCost = Number(matched.costPrice) || 0;
    let multiplier = 1;

    if (matched.isMapping && matched.linkedSku) {
      const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
      if (main) {
        unitCost = Number(main.costPrice) || 0;
        multiplier = Number(matched.multiplier) || 1;
      }
    }

    const finalTotalHpp = unitCost * multiplier * qty;
    
    // 4. HITUNG ULANG PROFIT (Pakai Revenue yang baru ditarik dari katalog)
    const finalNetProfit = calculateNetProfitEntry(finalTotalRevenue, finalTotalHpp);

    // LOG DEBUG (Cek di Console F12 buat mastiin angkanya jalan)
    console.log("--- DEBUG EDIT PENJUALAN ---");
    console.log("SKU:", newSku);
    console.log("Revenue (Jual):", finalTotalRevenue);
    console.log("HPP (Modal):", finalTotalHpp);
    console.log("Hasil Profit:", finalNetProfit);

    // 5. UPDATE FIREBASE
    try {
      await updateDoc(doc(db, `users/${currentUser.uid}/sales`, selectedTx.id), {
        sku: newSku,
        product: matched.name,
        total: finalTotalRevenue, // Update total revenue agar tidak 0
        hpp: finalTotalHpp,       // Update HPP agar akurat
        profit: finalNetProfit    // Update Profit
      });

      // 6. POTONG STOK (Karena sebelumnya statusnya Pending/Gagal potong)
      await updateProductStock(newSku, -qty, selectedTx.orderId);

      setIsEditTxModalOpen(false);
      setSelectedTx(null);
      alert("Data berhasil disinkronkan dengan Katalog!");
    } catch (err) {
      console.error(err);
      alert("Gagal update data.");
    }
  };

  const handleStatusChange = async (t: any, newStatus: string) => {
    if (!currentUser) return;
    await updateDoc(doc(db, `users/${currentUser.uid}/sales`, t.id), { status: newStatus });
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (!confirm(`Hapus ${count} transaksi terpilih? Stok akan dikembalikan otomatis.`)) return;

    setIsProcessing(true);
    try {
      const batch = writeBatch(db); // Gunakan writeBatch untuk performa
      
      // Cari data transaksi yang dipilih untuk mengembalikan stok
      for (const id of selectedIds) {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
          // Kembalikan stok
          await updateProductStock(tx.sku, tx.qty);
          // Tambahkan ke antrian hapus
          const docRef = doc(db, `users/${currentUser?.uid}/sales`, id);
          batch.delete(docRef);
        }
      }

      await batch.commit();
      setSelectedIds([]);
      alert(`Berhasil menghapus ${count} transaksi.`);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus beberapa data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (t: any) => {
    if (!confirm("Hapus transaksi? Stok akan dikembalikan.")) return;
    await deleteDoc(doc(db, `users/${currentUser?.uid}/sales`, t.id));
    await updateProductStock(t.sku, t.qty);
  };

  // LOGIKA FILTERING & PAGINATION
  const filteredTransactions = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const txDate = t.createdAt.toDate();
    const now = new Date();
    const diffInDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
    if (timeFilter === "Hari Ini") return txDate.toDateString() === now.toDateString();
    if (timeFilter === "3 Hari") return diffInDays <= 3;
    if (timeFilter === "1 Bulan") return diffInDays <= 30;
    return true;
  });

  const pendingTransactions = filteredTransactions.filter(t => t.product === "Produk Luar Katalog");
  const listToDisplay = activeView === "Pending" ? pendingTransactions : filteredTransactions;

  const totalPages = Math.ceil(listToDisplay.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = listToDisplay.slice(indexOfFirstItem, indexOfLastItem);

  const stats = filteredTransactions.reduce((acc, curr) => {
    if (curr.status !== 'Retur') {
      acc.omset += curr.total;
      acc.profit += curr.profit;
    }
    return acc;
  }, { omset: 0, profit: 0 });

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-10">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-none">Penjualan</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center">
            <Check size={12} className="mr-1 text-emerald-500" /> Stock synced with Return System
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

        {/* HAPUS tag <button> di dalamnya, pindahkan semua styling ke <Link> */}
          <button 
          onClick={() => router.push('/penjualan/advanced')}
          className="bg-[#0047AB] text-white px-5 py-3 rounded-2xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Advance Shipment</span>
        </button>
      </div>

      {/* STATS */}
      <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-[#F1F5F9] shadow-sm">
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Omset {timeFilter}</p>
          <h3 className="text-4xl font-black text-[#0F172A]">Rp {stats.omset.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-white p-8 rounded-[32px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Profit Bersih {timeFilter}</p>
          <h3 className="text-4xl font-black text-emerald-600">Rp {stats.profit.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="px-4 sm:px-10 mt-6 flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-black text-red-600 uppercase tracking-widest">
            {selectedIds.length} Transaksi Terpilih
          </p>
          <button 
            onClick={handleBulkDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100"
          >
            <Trash2 size={14} />
            Hapus Terpilih
          </button>
        </div>
      )}

      {/* MONITORING TABS */}
      <div className="px-4 sm:px-10 mt-10 flex gap-8 border-b border-slate-200">
        <button onClick={() => setActiveView("Semua")}
          className={`pb-4 text-sm font-bold transition-all relative ${activeView === "Semua" ? "text-[#0047AB]" : "text-slate-400 hover:text-slate-600"}`}>
          Semua Transaksi
          {activeView === "Semua" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0047AB]"></div>}
        </button>
        <button onClick={() => setActiveView("Pending")}
          className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${activeView === "Pending" ? "text-red-500" : "text-slate-400 hover:text-red-500"}`}>
          Pending Monitoring
          {pendingTransactions.length > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse font-black">
              {pendingTransactions.length}
            </span>
          )}
          {activeView === "Pending" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500"></div>}
        </button>
      </div>

      <div className="px-4 sm:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Headers auto-detected</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                  <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                    <th className="px-8 py-5 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-[#0047AB] focus:ring-[#0047AB] cursor-pointer"
                        checked={selectedIds.length === currentItems.length && currentItems.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-5 text-left">Item</th>
                    <th className="px-6 py-5 text-right">Qty</th>
                    <th className="px-6 py-5 text-right">Net Profit</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentItems.map((t) => (
                    <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors group ${t.product === "Produk Luar Katalog" ? "bg-red-50/40" : ""}`}>
                      <td className="px-6 py-5 text-right font-black text-xs text-slate-400">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-[#0047AB] focus:ring-[#0047AB] cursor-pointer"
                          checked={selectedIds.includes(t.id)}
                          onChange={() => toggleSelect(t.id)}
                        />
                      </td>
                      <td className="px-8 py-5">
                        
                        <div className="flex flex-col">
                          <span className={`text-sm font-black leading-tight uppercase ${t.product === "Produk Luar Katalog" ? "text-red-600" : "text-[#0F172A]"}`}>
                            {t.product}
                          </span>
                          <span className="text-[9px] font-bold text-[#0047AB] mt-1 tracking-tighter">#{t.orderId} • {t.sku}</span>
                          {t.product === "Produk Luar Katalog" && (
                             <span className="text-[8px] font-black text-red-400 uppercase mt-1 italic flex items-center">
                               <AlertCircle size={10} className="mr-1" /> SKU not found in Catalog
                             </span>
                          )}
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
                      <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                        {t.product === "Produk Luar Katalog" && (
                          <button onClick={() => { setSelectedTx(t); setIsEditTxModalOpen(true); }} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all">
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(t)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            <div className="p-8 border-t border-[#F8F9FB] flex items-center justify-between bg-white">
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, listToDisplay.length)} of {listToDisplay.length}
              </p>
              <div className="flex items-center space-x-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 border border-[#E2E8F0] rounded-lg text-[#94A3B8] disabled:opacity-20"><ChevronLeft size={16}/></button>
                <div className="flex items-center gap-1">
                  {totalPages > 0 && [...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i + 1 ? "bg-[#0047AB] text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}>{i + 1}</button>
                  )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                </div>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 border border-[#E2E8F0] rounded-lg text-[#94A3B8] disabled:opacity-20"><ChevronRight size={16}/></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL INPUT MANUAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter">Input Manual</h2>
              <button onClick={() => setIsManualModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <input required value={manualForm.orderId} onChange={(e) => setManualForm({...manualForm, orderId: e.target.value})} placeholder="Nomor Pesanan (ID)" className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm" />
              <div className="grid grid-cols-3 gap-4">
                <input required value={manualForm.sku} onChange={(e) => setManualForm({...manualForm, sku: e.target.value})} placeholder="SKU" className="col-span-2 bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm" />
                <input type="number" min="1" required value={manualForm.qty} onChange={(e) => setManualForm({...manualForm, qty: e.target.value})} className="bg-blue-50/50 border-none rounded-[20px] text-center font-black text-[#0047AB]" />
              </div>
              <div className="flex justify-center py-2">
                 <button type="button" onClick={() => setUseCatalogPrice(!useCatalogPrice)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase transition-all border-2 ${useCatalogPrice ? "bg-[#0047AB] text-white" : "text-slate-400"}`}>Harga {useCatalogPrice ? "Katalog" : "Manual"}</button>
              </div>
              {!useCatalogPrice && (
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Jual Unit" value={manualForm.manualPrice} onChange={(e) => setManualForm({...manualForm, manualPrice: e.target.value})} className="bg-slate-50 rounded-xl py-3 px-4 font-bold text-sm" />
                  <input type="number" placeholder="Modal Unit" value={manualForm.manualCost} onChange={(e) => setManualForm({...manualForm, manualCost: e.target.value})} className="bg-slate-50 rounded-xl py-3 px-4 font-bold text-sm" />
                </div>
              )}
              <button type="submit" className="w-full bg-[#0047AB] text-white py-5 rounded-[24px] font-black text-sm shadow-xl">Simpan & Potong Stok</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PENDING */}
      {isEditTxModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-[#0F172A]">Perbaiki SKU</h2>
              <button onClick={() => setIsEditTxModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleEditTransaction} className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedTx?.orderId}</p>
              <input required value={selectedTx?.sku || ""} onChange={(e) => setSelectedTx({...selectedTx, sku: e.target.value})} placeholder="Masukkan SKU Katalog yang Benar" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" />
              <button type="submit" className="w-full bg-[#0047AB] text-white py-4 rounded-2xl font-black text-xs">Simpan & Sinkronkan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}