"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  collection, onSnapshot, query, addDoc, 
  serverTimestamp, deleteDoc, doc, updateDoc, orderBy, increment, 
  writeBatch,
  getDoc
} from "firebase/firestore";
import { calculateMarketplaceFee } from "../../lib/calculations";
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
  const [activeView, setActiveView] = useState("Semua"); 
  const itemsPerPage = 20;

  const [useCatalogPrice, setUseCatalogPrice] = useState(true);
  const [activeFees, setActiveFees] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState("Semua"); // Filter Status
  const [searchSales, setSearchSales] = useState(""); // Fitur Search
  const [isCompleting, setIsCompleting] = useState(false); // Loading untuk matching
    
  // --- STATE BARU: MULTI-PRODUCT MANUAL FORM ---
  const [manualForm, setManualForm] = useState({
    orderId: '',
    source: 'Shopee',
    status: 'Proses',
    items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }]
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

  // TAMBAHKAN BLOK INI AGAR DATA MUNCUL
  useEffect(() => {
    if (!currentUser) return;

    // 1. Listen ke Katalog Produk
    const unsubProd = onSnapshot(query(collection(db, `users/${currentUser.uid}/products`)), (snap) => {
      setCatalog(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Listen ke Data Penjualan (Sales)
    const unsubSales = onSnapshot(query(collection(db, `users/${currentUser.uid}/sales`), orderBy("createdAt", "desc")), (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Listen ke Warehouse Shopee
    const unsubWarehouse = onSnapshot(collection(db, `users/${currentUser.uid}/shopee_warehouse`), (snap) => {
      setShopeeWarehouse(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Listen ke Pengaturan Biaya Admin (Kunci Utama activeFees)
    const unsubFees = onSnapshot(doc(db, `users/${currentUser.uid}/settings`, "admin_fees"), (snap) => {
      if (snap.exists()) {
        setActiveFees(snap.data());
        console.log("✅ Admin Fees Sync Berhasil");
      }
    });

    // Cleanup: Pastikan semua listener dimatikan saat komponen unmount
    return () => { 
      unsubProd(); 
      unsubSales(); 
      unsubWarehouse(); 
      unsubFees(); 
    };
  }, [currentUser]);

  const calculateNetProfitEntry = (totalRevenue: number, totalHpp: number, marketplace: string) => {
    if (!activeFees) {
      // Fallback jika data belum terload (16% + 1250 fixed)
      return totalRevenue - totalHpp - (totalRevenue * 0.16) - 1250;
    }

    // Cari key di Firestore yang cocok secara case-insensitive (misal: 'shopee' matches 'Shopee')
    const feeKeys = Object.keys(activeFees);
    const matchedKey = feeKeys.find(key => key.toLowerCase() === marketplace.toLowerCase().trim());
    const mpSettings = matchedKey ? activeFees[matchedKey] : null;
    
    if (!mpSettings) {
      console.warn(`⚠️ Settings untuk marketplace '${marketplace}' tidak ditemukan!`);
      return totalRevenue - totalHpp; // Jika tidak ketemu, hanya profit kotor
    }

    // Hitung biaya admin menggunakan helper dinamis
    const adminFees = calculateMarketplaceFee(totalRevenue, mpSettings);
    
    return totalRevenue - totalHpp - adminFees;
  };

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

  // --- LOGIKA DYNAMIC MANUAL FORM ---
  const addManualItem = () => {
    setManualForm({
      ...manualForm,
      items: [...manualForm.items, { sku: '', qty: 1, manualPrice: '', manualCost: '' }]
    });
  };

  const removeManualItem = (index: number) => {
    if (manualForm.items.length === 1) return;
    setManualForm({
      ...manualForm,
      items: manualForm.items.filter((_, i) => i !== index)
    });
  };

  const updateManualItem = (index: number, field: string, value: any) => {
    const newItems = [...manualForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setManualForm({ ...manualForm, items: newItems });
  };

  // --- HANDLER: EXCEL UPLOAD ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsProcessing(true);
    const reader = new FileReader();
    
    // Ambil config berdasarkan marketplace yang dipilih di UI (shopee/tiktok/lazada)
    const config = MARKETPLACE_CONFIG[selectedMarketplace];
    const existingOrderIds = new Set(transactions.map(t => String(t.orderId).trim()));

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
        const headers = data[0];
        
        // Tentukan index SKU
        const finalSkuIdx = (config.cols.sku !== undefined) 
          ? config.cols.sku 
          : headers.findIndex((h: any) => String(h).toUpperCase().includes("SKU") || String(h).toUpperCase().includes("REFERENSI"));
        
        const rawRows = data.slice(config.dataStartRow);
        let addedCount = 0;

        for (const row of rawRows) {
          const resiValue = String(row[config.cols.resi] || "").trim();
          const orderIdLama = String(row[config.cols.orderId] || "").trim();
          const finalId = resiValue || orderIdLama;
          
          // Skip jika ID kosong atau sudah ada
          if (!finalId || existingOrderIds.has(finalId)) continue;

          // Logika Fallback SKU Shopee
          let rawSku = String(row[finalSkuIdx] || "").trim();
          if (selectedMarketplace === 'shopee' && !rawSku) {
            rawSku = String(row[12] || "").trim(); 
          }
          const sku = rawSku.replace(/\s+/g, '').toUpperCase();

          const qty = Number(row[config.cols.qty]) || 1;
          const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
          
          let unitPrice = 0, unitCost = 0, multiplier = 1, productName = "Produk Luar Katalog";

          if (matched) {
            productName = matched.name;
            // Gunakan harga katalog jika tersedia, jika tidak ambil dari baris Excel
            unitPrice = Number(matched.price) || (Number(row[config.cols.total]) / qty);
            
            if (matched.isMapping && matched.linkedSku) {
              const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
              unitCost = main ? Number(main.costPrice) : Number(matched.costPrice);
              multiplier = Number(matched.multiplier) || 1;
            } else { 
              unitCost = Number(matched.costPrice) || 0; 
            }
          } else { 
            unitPrice = (Number(row[config.cols.total]) / qty || 0); 
          }

          const totalRevenue = unitPrice * qty;
          const totalHpp = (unitCost * multiplier) * qty;

          // PANGGIL HELPER DENGAN MARKETPLACE KEY (shopee/tiktok/lazada)
          const netProfit = calculateNetProfitEntry(totalRevenue, totalHpp, selectedMarketplace);

          await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
            orderId: finalId, 
            sku, 
            product: productName, 
            total: totalRevenue,
            hpp: totalHpp, 
            qty, 
            profit: netProfit, 
            marketplace: config.name, // Nama tampilan (Shopee/Tiktok/Lazada)
            status: 'Proses', 
            createdAt: serverTimestamp()
          });
          
          await updateProductStock(sku, -qty, finalId);
          addedCount++;
        }
        alert(`Berhasil impor ${addedCount} data dengan kalkulasi biaya admin.`);
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

  // --- HANDLER: MANUAL SUBMIT (MULTI-PRODUCT) ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Pastikan data fee sudah terload sebelum memproses
    if (!activeFees) {
      alert("Data pengaturan biaya belum dimuat. Silakan tunggu sebentar atau refresh halaman.");
      return;
    }

    setIsProcessing(true);
    const orderId = manualForm.orderId.trim() || `MAN-${Date.now()}`;

    try {
      for (const item of manualForm.items) {
        const sku = item.sku.replace(/\s+/g, '').toUpperCase();
        const qty = Number(item.qty);
        const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
        
        let unitPrice = 0, unitCost = 0, multiplier = 1, productName = "Produk Luar Katalog";

        if (matched) {
          productName = matched.name;
          unitPrice = useCatalogPrice ? Number(matched.price) : Number(item.manualPrice);
          if (matched.isMapping && matched.linkedSku) {
            const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
            unitCost = main ? Number(main.costPrice) : Number(matched.costPrice);
            multiplier = Number(matched.multiplier) || 1;
          } else { unitCost = Number(matched.costPrice) || 0; }
        } else {
          unitPrice = Number(item.manualPrice) || 0;
          unitCost = Number(item.manualCost) || 0;
        }

        const totalRevenue = unitPrice * qty;
        const totalHpp = (unitCost * multiplier) * qty;

        // PERBAIKAN: Tambahkan parameter ketiga (manualForm.source)
        const netProfit = calculateNetProfitEntry(totalRevenue, totalHpp, manualForm.source);

        await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
          orderId, 
          sku, 
          product: productName, 
          total: totalRevenue, 
          hpp: totalHpp,
          qty, 
          profit: netProfit, 
          marketplace: manualForm.source, 
          status: manualForm.status, 
          createdAt: serverTimestamp()
        });
        
        await updateProductStock(sku, -qty, orderId);
      }

      setIsManualModalOpen(false);
      setManualForm({
        orderId: '', 
        source: 'Shopee', 
        status: 'Proses',
        items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }]
      });
      alert("Pesanan Multi-Produk berhasil disimpan dengan kalkulasi biaya dinamis!");
    } catch (err) { 
      console.error(err); 
      alert("Terjadi kesalahan saat menyimpan pesanan.");
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedTx) return;

    // 1. Bersihkan SKU & Cari di Katalog
    const newSku = selectedTx.sku.replace(/\s+/g, '').toUpperCase();
    const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === newSku);
    
    if (!matched) return alert("SKU tidak ditemukan di katalog!");

    // 2. Ambil data harga dan qty
    const unitPrice = Number(matched.price) || 0;
    const qty = Number(selectedTx.qty) || 1;
    const finalTotalRevenue = unitPrice * qty;

    // 3. Hitung HPP & Multiplier
    let unitCost = Number(matched.costPrice) || 0;
    let multiplier = 1;
    if (matched.isMapping && matched.linkedSku) {
      const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
      unitCost = main ? Number(main.costPrice) : Number(matched.costPrice);
      multiplier = Number(matched.multiplier) || 1;
    }

    const finalTotalHpp = unitCost * multiplier * qty;

    // --- PERBAIKAN DI SINI ---
    // Sertakan selectedTx.marketplace sebagai parameter ketiga
    const finalNetProfit = calculateNetProfitEntry(
      finalTotalRevenue, 
      finalTotalHpp, 
      selectedTx.marketplace
    );

    // 4. Update ke Firestore
    await updateDoc(doc(db, `users/${currentUser.uid}/sales`, selectedTx.id), {
      sku: newSku, 
      product: matched.name, 
      total: finalTotalRevenue, 
      hpp: finalTotalHpp, 
      profit: finalNetProfit
    });

    // 5. Update stok
    await updateProductStock(newSku, -qty, selectedTx.orderId);
    
    setIsEditTxModalOpen(false);
    setSelectedTx(null);
    alert("Data berhasil disinkronkan dengan profit dinamis!");
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (!confirm(`Hapus ${count} transaksi terpilih? Stok akan dikembalikan.`)) return;
    setIsProcessing(true);
    const batch = writeBatch(db);
    for (const id of selectedIds) {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        await updateProductStock(tx.sku, tx.qty);
        batch.delete(doc(db, `users/${currentUser?.uid}/sales`, id));
      }
    }
    await batch.commit();
    setSelectedIds([]);
    setIsProcessing(false);
  };

  const handleDelete = async (t: any) => {
    if (!confirm("Hapus transaksi? Stok akan dikembalikan.")) return;
    await deleteDoc(doc(db, `users/${currentUser?.uid}/sales`, t.id));
    await updateProductStock(t.sku, t.qty);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const txDate = t.createdAt.toDate();
    const now = new Date();
    const diffInDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);

    // 1. Time Filter
    let timeMatch = true;
    if (timeFilter === "Hari Ini") timeMatch = txDate.toDateString() === now.toDateString();
    else if (timeFilter === "3 Hari") timeMatch = diffInDays <= 3;
    else if (timeFilter === "1 Bulan") timeMatch = diffInDays <= 30;

    // 2. Status Filter
    const statusMatch = statusFilter === "Semua" || t.status === statusFilter;

    // 3. Search Match (Order ID, SKU, atau Nama Produk)
    const searchMatch = 
      t.orderId.toLowerCase().includes(searchSales.toLowerCase()) ||
      t.product.toLowerCase().includes(searchSales.toLowerCase()) ||
      t.sku.toLowerCase().includes(searchSales.toLowerCase());

    return timeMatch && statusMatch && searchMatch;
  });

  // Hitung Saldo yang sudah benar-benar "Selesai"
  const completedBalance = filteredTransactions
    .filter(t => t.status === "Selesai")
    .reduce((acc, curr) => acc + curr.profit, 0);

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
            <Check size={12} className="mr-1 text-emerald-500" /> Multi-Product Input Ready
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

        <div className="flex gap-3">
          <button onClick={() => setIsManualModalOpen(true)} className="bg-white text-[#0047AB] border-2 border-[#0047AB] px-5 py-3 rounded-2xl font-black text-xs hover:bg-blue-50 transition-all flex items-center space-x-2">
            <Plus size={18} strokeWidth={3} />
            <span>Multi-Input</span>
          </button>
          <button onClick={() => router.push('/penjualan/advanced')} className="bg-[#0047AB] text-white px-5 py-3 rounded-2xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center space-x-2">
            <Plus size={18} strokeWidth={3} />
            <span>Advance Shipment</span>
          </button>
        </div>
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

      {/* BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="px-4 sm:px-10 mt-6 flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-black text-red-600 uppercase tracking-widest">{selectedIds.length} Item Terpilih</p>
          <button onClick={handleBulkDelete} className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-red-100 transition-all hover:bg-red-700">
            <Trash2 size={14} /> Hapus Terpilih
          </button>
        </div>
      )}

      {/* MONITORING TABS */}
      <div className="px-4 sm:px-10 mt-10 flex gap-8 border-b border-slate-200">
        <button onClick={() => setActiveView("Semua")} className={`pb-4 text-sm font-bold transition-all relative ${activeView === "Semua" ? "text-[#0047AB]" : "text-slate-400 hover:text-slate-600"}`}>
          Semua Transaksi
          {activeView === "Semua" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0047AB]"></div>}
        </button>
        <button onClick={() => setActiveView("Pending")} className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${activeView === "Pending" ? "text-red-500" : "text-slate-400 hover:text-red-500"}`}>
          Pending Monitoring
          {pendingTransactions.length > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse">{pendingTransactions.length}</span>}
          {activeView === "Pending" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500"></div>}
        </button>
      </div>

      <div className="px-4 sm:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: SOURCES */}
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
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter italic">Headers auto-detected</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: TABLE */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                  <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                    <th className="px-8 py-5 w-10">
                      <input type="checkbox" className="rounded text-[#0047AB] cursor-pointer" checked={selectedIds.length === currentItems.length && currentItems.length > 0} onChange={() => {
                        if (selectedIds.length === currentItems.length) setSelectedIds([]);
                        else setSelectedIds(currentItems.map(t => t.id));
                      }} />
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
                      <td className="px-8 py-5">
                        <input type="checkbox" className="rounded text-[#0047AB] cursor-pointer" checked={selectedIds.includes(t.id)} onChange={() => {
                          setSelectedIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]);
                        }} />
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-col">
                          <span className={`text-sm font-black leading-tight uppercase ${t.product === "Produk Luar Katalog" ? "text-red-600" : "text-[#0F172A]"}`}>{t.product}</span>
                          <span className="text-[9px] font-bold text-[#0047AB] mt-1 tracking-tighter">#{t.orderId} • {t.sku}</span>
                          {t.product === "Produk Luar Katalog" && <span className="text-[8px] font-black text-red-400 uppercase mt-1 flex items-center italic"><AlertCircle size={10} className="mr-1" /> SKU not found</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-xs text-slate-400">{t.qty}</td>
                      <td className={`px-6 py-5 text-right text-sm font-black ${t.status === 'Retur' ? 'text-slate-300 line-through' : 'text-emerald-600'}`}>Rp {t.profit.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-5 text-center">
                        <select value={t.status} onChange={(e) => updateDoc(doc(db, `users/${currentUser?.uid}/sales`, t.id), { status: e.target.value })} className={`text-[9px] font-black px-3 py-1.5 rounded-full border bg-transparent outline-none ${t.status === 'Selesai' ? "text-emerald-600 border-emerald-100" : "text-amber-600 border-amber-100"}`}>
                          <option value="Proses">Proses</option><option value="Selesai">Selesai</option><option value="Retur">Retur</option>
                        </select>
                      </td>
                      <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                        {t.product === "Produk Luar Katalog" && <button onClick={() => { setSelectedTx(t); setIsEditTxModalOpen(true); }} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all"><Edit2 size={16} /></button>}
                        <button onClick={async () => { if(confirm("Hapus?")) { await deleteDoc(doc(db, `users/${currentUser?.uid}/sales`, t.id)); await updateProductStock(t.sku, t.qty); } }} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentItems.length === 0 && <div className="flex flex-col items-center justify-center py-32 text-slate-200"><ShoppingBag size={64} strokeWidth={1} className="mb-4 opacity-20" /><p className="text-sm font-bold uppercase tracking-widest text-slate-300">No Transactions Found</p></div>}
            </div>

            <div className="p-8 border-t border-[#F8F9FB] flex items-center justify-between">
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</p>
              <div className="flex items-center space-x-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 border border-[#E2E8F0] rounded-lg text-[#94A3B8] disabled:opacity-20 hover:bg-slate-50"><ChevronLeft size={16}/></button>
                <div className="flex items-center gap-1">
                  {totalPages > 0 && [...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i + 1 ? "bg-[#0047AB] text-white shadow-lg shadow-blue-100" : "text-slate-400 hover:bg-slate-50"}`}>{i + 1}</button>
                  )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                </div>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 border border-[#E2E8F0] rounded-lg text-[#94A3B8] disabled:opacity-20 hover:bg-slate-50"><ChevronRight size={16}/></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL MULTI-PRODUCT MANUAL INPUT */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div><h2 className="text-2xl font-black text-[#0F172A] tracking-tighter">Manual Multi-Input</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Satu Nomor Pesanan untuk Banyak Produk</p></div>
              <button onClick={() => setIsManualModalOpen(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X/></button>
            </div>

            <form onSubmit={handleManualSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nomor Pesanan</label><input required value={manualForm.orderId} onChange={(e) => setManualForm({...manualForm, orderId: e.target.value})} placeholder="ID Pesanan" className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-blue-100" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Sumber</label><select value={manualForm.source} onChange={(e) => setManualForm({...manualForm, source: e.target.value})} className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm"><option>Shopee</option><option>Tiktok</option><option>Lazada</option><option>Offline</option></select></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Status</label><select value={manualForm.status} onChange={(e) => setManualForm({...manualForm, status: e.target.value})} className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm"><option value="Proses">Proses</option><option value="Selesai">Selesai</option></select></div>
              </div>

              <div className="flex items-center justify-between"><h4 className="text-[11px] font-black text-[#0047AB] uppercase tracking-[0.2em]">Daftar Produk ({manualForm.items.length})</h4><button type="button" onClick={() => setUseCatalogPrice(!useCatalogPrice)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all border-2 ${useCatalogPrice ? "bg-[#0047AB] text-white shadow-md shadow-blue-100" : "text-slate-400"}`}>{useCatalogPrice ? "Gunakan Harga Katalog" : "Gunakan Harga Manual"}</button></div>

              <div className="space-y-4">
                {manualForm.items.map((item, index) => (
                  <div key={index} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col gap-4 relative animate-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2"><input required value={item.sku} onChange={(e) => updateManualItem(index, 'sku', e.target.value)} placeholder="SKU Produk" className="w-full bg-white border-none rounded-2xl py-3 px-5 font-bold text-sm shadow-sm focus:ring-2 focus:ring-blue-100" /></div>
                      <div className="flex items-center bg-white rounded-2xl px-3 shadow-sm"><span className="text-[9px] font-black text-slate-300 mr-2 uppercase">Qty</span><input type="number" min="1" required value={item.qty} onChange={(e) => updateManualItem(index, 'qty', e.target.value)} className="w-full border-none font-black text-[#0047AB] text-center" /></div>
                      {manualForm.items.length > 1 && (<button type="button" onClick={() => removeManualItem(index)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all self-center md:self-auto"><Trash2 size={18}/></button>)}
                    </div>
                    {!useCatalogPrice && (<div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300"><div className="flex items-center bg-white rounded-2xl px-5 shadow-sm"><span className="text-[9px] font-black text-slate-300 mr-2">RP</span><input type="number" placeholder="Jual per Unit" value={item.manualPrice} onChange={(e) => updateManualItem(index, 'manualPrice', e.target.value)} className="w-full border-none py-3 font-bold text-sm" /></div><div className="flex items-center bg-white rounded-2xl px-5 shadow-sm"><span className="text-[9px] font-black text-slate-300 mr-2">MODAL</span><input type="number" placeholder="Modal per Unit" value={item.manualCost} onChange={(e) => updateManualItem(index, 'manualCost', e.target.value)} className="w-full border-none py-3 font-bold text-sm" /></div></div>)}
                  </div>
                ))}
              </div>

              <button type="button" onClick={addManualItem} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-[#0047AB] hover:text-[#0047AB] transition-all flex items-center justify-center gap-2 hover:bg-blue-50/30"><Plus size={16}/> Tambah Produk Lagi</button>
            </form>

            <div className="p-10 border-t border-slate-50 bg-white"><button type="submit" onClick={handleManualSubmit} disabled={isProcessing} className="w-full bg-[#0047AB] text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20} strokeWidth={3}/>}{isProcessing ? "MEMPROSES..." : "SIMPAN SEMUA & POTONG STOK"}</button></div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PENDING SKU */}
      {isEditTxModalOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-black text-[#0F172A] tracking-tighter">Perbaiki SKU</h2><button onClick={() => setIsEditTxModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X /></button></div>
            <form onSubmit={handleEditTransaction} className="space-y-6">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nomor Pesanan</label><p className="bg-slate-50 py-3 px-6 rounded-2xl font-black text-xs text-[#0047AB]">#{selectedTx?.orderId}</p></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">SKU Katalog Baru</label><input required value={selectedTx?.sku || ""} onChange={(e) => setSelectedTx({...selectedTx, sku: e.target.value})} placeholder="Masukkan SKU Katalog" className="w-full bg-slate-50 border-none rounded-[20px] py-4 px-6 font-bold text-sm focus:ring-2 focus:ring-blue-100" /></div>
              <button type="submit" className="w-full bg-[#0047AB] text-white py-4 rounded-[20px] font-black text-xs shadow-lg shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95">SIMPAN & SINKRONKAN</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}