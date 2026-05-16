"use client";

import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useSalesData } from "../hooks/useSalesData";
import { doc, updateDoc, collection, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import * as XLSX from 'xlsx';
import { SalesService } from "../../lib/services/SalesService";
import { MARKETPLACE_CONFIG } from "../../lib/constants/sales";

// IMPORT SUB-COMPONENTS
import SalesHeader from "../../components/sales/SalesHeader";
import SalesFilters from "../../components/sales/SalesFilters";
import SalesStats from "../../components/sales/SalesStats";
import SalesTable from "../../components/sales/SalesTable";
import ImportCard from "../../components/sales/ImportCard";
import { ManualInputModal } from "../../components/sales/SalesModals";

export default function PenjualanPage() {
  const { currentUser } = useAuth();

  // States Utama
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCatalogPrice, setUseCatalogPrice] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState("shopee");
  const [timeFilter, setTimeFilter] = useState("Hari Ini");
  const [statusTab, setStatusTab] = useState("Semua");
  const [searchSales, setSearchSales] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // 🔧 STATES BARU: PENGELOLAAN EDIT TRANSAKSI PENDING
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '', orderId: '', sku: '', product: '', qty: 1, total: 0, marketplace: ''
  });

  const { catalog, transactions, shopeeWarehouse, activeFees } = useSalesData(
    currentUser, 
    timeFilter, 
    selectedMonth, 
    selectedYear
  );
  
  const salesService = new SalesService(currentUser, catalog, shopeeWarehouse, activeFees);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualForm, setManualForm] = useState({
    orderId: '', source: 'Shopee', status: 'Proses', tiktokProvince: '', 
    tiktokWeight: 1, tiktokType: 'Standard',
    items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }]
  });

  // Logic Filter Tabel Utama
  const filteredTransactions = transactions.filter((t) => {
    if (!t.createdAt) return false;
    const txDate = t.createdAt.toDate();
    const now = new Date();
    const diffInDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);

    let timeMatch = timeFilter === "Hari Ini" ? txDate.toDateString() === now.toDateString() :
                    timeFilter === "3 Hari" ? diffInDays <= 3 :
                    txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;

    let statusMatch = statusTab === "Semua" ? true : 
                      statusTab === "Pending" ? t.product === "Produk Luar Katalog" : t.status === statusTab;

    const searchTerm = searchSales.toLowerCase();
    const searchMatch = 
      (t.orderId && t.orderId.toLowerCase().includes(searchTerm)) ||
      (t.product && t.product.toLowerCase().includes(searchTerm)) ||
      (t.sku && t.sku.toLowerCase().includes(searchTerm)) ||
      (t.marketplace && t.marketplace.toLowerCase().includes(searchTerm));
      
    return timeMatch && statusMatch && searchMatch;
  });

  // --- HANDLERS ---

  // 🔧 HANDLER BARU: SUBMIT PERBAIKAN PRODUK PENDING & KOREKSI STOK
  const handleEditPendingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Cari SKU baru yang diinput di dalam Katalog Inventaris
      const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === editForm.sku);
      
      if (!matched) {
        alert("❌ SKU tidak ditemukan di katalog inventaris! Silakan buat produknya dulu di menu Katalog atau periksa typo.");
        setIsProcessing(false);
        return;
      }

      // 2. Hitung ulang HPP berdasarkan harga modal terupdate di katalog
      let unitCost = Number(matched.costPrice) || 0;
      let multiplier = 1;

      if (matched.isMapping && matched.linkedSku) {
        const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
        unitCost = main ? Number(main.costPrice) : Number(matched.costPrice);
        multiplier = Number(matched.multiplier) || 1;
      }

      const totalHpp = (unitCost * multiplier) * editForm.qty;
      
      // Ambil transaksi lama untuk membaca ongkir logistik aslinya
      const oldTx = transactions.find(t => t.id === editForm.id);
      const logisticsFee = oldTx?.logisticsFee || 0;
      const marketplaceKey = String(editForm.marketplace).toLowerCase();

      // Hitung profit bersih baru yang valid
      const netProfit = salesService.calculateNetProfitEntry(editForm.total, totalHpp, marketplaceKey, logisticsFee);

      // 3. Update dokumen di Firestore
      const salesDocRef = doc(db, `users/${currentUser.uid}/sales`, editForm.id);
      await updateDoc(salesDocRef, {
        sku: editForm.sku,
        product: matched.name, // Berubah dari "Produk Luar Katalog" menjadi nama barang asli
        hpp: totalHpp,
        profit: netProfit,
        status: 'Proses' // Kembalikan ke status proses normal
      });

      // 4. Koreksi Alur Stok Barang
      if (oldTx && oldTx.sku) {
        // Balikkan stok SKU ngaco yang lama (+qty)
        await salesService.updateProductStock(String(oldTx.sku).replace(/\s+/g, '').toUpperCase(), oldTx.qty, editForm.orderId);
      }
      // Potong stok real dari SKU katalog baru yang valid (-qty)
      await salesService.updateProductStock(editForm.sku, -editForm.qty, editForm.orderId);

      alert("✅ Sukses memetakan produk! Angka profit dan kuantitas stok gudang berhasil diperbarui.");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui data pending.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectDatabaseCleanup = async () => {
    if (transactions.length === 0) return alert("Tidak ada data transaksi yang termuat.");
    setIsProcessing(true);

    try {
      const seenEntries = new Set<string>();
      const duplicatesToDelete: any[] = [];

      [...transactions].reverse().forEach((t) => {
        const cleanOrderId = String(t.orderId || "").trim().replace(/^#/, "").toLowerCase();
        const cleanSku = String(t.sku || "").replace(/\s+/g, "").toUpperCase();
        const uniqueKey = `${cleanOrderId}_${cleanSku}`;

        if (seenEntries.has(uniqueKey)) {
          duplicatesToDelete.push(t);
        } else {
          seenEntries.add(uniqueKey);
        }
      });

      if (duplicatesToDelete.length === 0) {
        alert("✨ Mantap, Kev! Database bersih. Tidak terdeteksi data transaksi ganda pada filter bulan ini.");
        setIsProcessing(false);
        return;
      }

      const konfirmasi = window.confirm(
        `⚠️ Duplikat Terdeteksi!\nSistem menemukan ${duplicatesToDelete.length} data transaksi BARU yang duplikat.\n\nSistem akan otomatis:\n1. Menghapus data duplikat BARU tersebut dari Firestore (Data lama tetap aman).\n2. Mengembalikan STOK produk (+qty) yang telanjur terpotong ganda.\n\nLanjutkan pembersihan?`
      );
      
      if (!konfirmasi) {
        setIsProcessing(false);
        return;
      }

      let successCleanedCount = 0;
      for (const tx of duplicatesToDelete) {
        await salesService.deleteTransaction(tx);
        const cleanSku = String(tx.sku || "").replace(/\s+/g, "").toUpperCase();
        const restoreQty = Number(tx.qty) || 1;
        await salesService.updateProductStock(cleanSku, restoreQty, tx.orderId);
        successCleanedCount++;
      }
      alert(`✅ Sukses Besar! ${successCleanedCount} data duplikat BARU berhasil disapu bersih.`);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan teknis saat mencoba membersihkan database.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !currentUser) return;
  setIsProcessing(true);
  const reader = new FileReader();
  const config = MARKETPLACE_CONFIG[selectedMarketplace];

  reader.onload = async (evt) => {
    try {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
      const headers = data[0];
      const finalSkuIdx = (config.cols.sku !== undefined) ? config.cols.sku : headers.findIndex((h: any) => String(h).toUpperCase().includes("SKU"));
      const rawRows = data.slice(config.dataStartRow);

      const TIKTOK_SHIPPING_MAP: Record<string, string> = {
        "PENGIRIMAN STANDAR": "STANDARD", "EKONOMI": "ECONOMY", "KARGO": "CARGO", "STANDARD": "STANDARD", "SAVER": "SAVER"
      };
      
      let addedCount = 0;
      for (const row of rawRows) {
        const resiValue = String(row[config.cols.resi] || "").trim();
        const orderIdLama = String(row[config.cols.orderId] || "").trim();
        const finalId = resiValue || orderIdLama;
        if (!finalId) continue;

        const cleanOrderId = finalId.replace(/^#/, "").trim();

        let rawSku = String(row[finalSkuIdx] || "").trim();
        if (selectedMarketplace === 'shopee' && !rawSku) rawSku = String(row[12] || "").trim(); 
        const sku = rawSku.replace(/\s+/g, '').toUpperCase();
        
        const isAlreadyInState = transactions.some(t => 
          String(t.orderId).trim().replace(/^#/, "").toLowerCase() === cleanOrderId.toLowerCase() && 
          String(t.sku).replace(/\s+/g, '').toUpperCase() === sku
        );
        if (isAlreadyInState) continue;

        let qty = Number(row[config.cols.qty]) || 1;
        const matched = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === sku);
        
        let unitPrice = 0, unitCost = 0, multiplier = 1, productName = "Produk Luar Katalog";
        if (matched) {
          productName = matched.name;
          let catalogPrice = Number(matched.price) || 0;
          if (selectedMarketplace === 'tiktok' && matched.useMarketplacePrices) {
            catalogPrice = (matched.priceTiktok && Number(matched.priceTiktok) > 0) ? Number(matched.priceTiktok) : catalogPrice;
          }
          const excelPrice = (Number(row[config.cols.total]) / qty) || 0;
          unitPrice = catalogPrice > 0 ? catalogPrice : excelPrice;

          if (matched.isMapping && matched.linkedSku) {
            const main = catalog.find(p => p.sku.replace(/\s+/g, '').toUpperCase() === matched.linkedSku.replace(/\s+/g, '').toUpperCase());
            unitCost = main ? Number(main.costPrice) : Number(matched.costPrice);
            multiplier = Number(matched.multiplier) || 1;
          } else { 
            unitCost = Number(matched.costPrice) || 0; 
          }
        } else {
          unitPrice = (Number(row[config.cols.total]) / qty) || 0;
        }

        const totalRevenue = unitPrice * qty;
        const totalHpp = (unitCost * multiplier) * qty;

        let logisticsFee = 0;
        if (selectedMarketplace === 'tiktok') {
          const rawShippingType = String(row[config.cols.shippingType] || "").trim().toUpperCase();
          const rawProvince = String(row[config.cols.province] || "").trim().toUpperCase();
          const parcelWeight = Number(row[config.cols.weight]) || 0;
          const finalShippingType = TIKTOK_SHIPPING_MAP[rawShippingType] || "STANDARD";
          logisticsFee = salesService.calculateTikTokLogistics(finalShippingType, rawProvince, parcelWeight);
        }

        const netProfit = salesService.calculateNetProfitEntry(totalRevenue, totalHpp, selectedMarketplace, logisticsFee);

        // 🔒 PERBAIKAN UTAMA: SISTEM PARSING TANGGAL ANTI-INVALID
        const rawExcelDate = config.cols.createdAt !== undefined ? row[config.cols.createdAt] : null; 
        let transactionDate = new Date(); // Default awal ke waktu sekarang

        if (rawExcelDate !== null && rawExcelDate !== undefined && rawExcelDate !== "") {
          // Kasus A: Jika berupa Angka Serial Excel (misal: 45678)
          if (typeof rawExcelDate === 'number') {
            transactionDate = new Date((rawExcelDate - 25569) * 86400 * 1000);
          } 
          // Kasus B: Jika berupa String teks biasa
          else {
            const parsedDate = new Date(rawExcelDate);
            // Cek apakah hasil parse string-nya valid
            if (!isNaN(parsedDate.getTime())) {
              transactionDate = parsedDate;
            }
          }
        }

        // 🔒 FAIL-SAFE AKHIR: Jika karena alasan apa pun tanggal masih Invalid, paksa jadi Date saat ini
        if (isNaN(transactionDate.getTime())) {
          transactionDate = new Date();
        }

        const customDocId = `${cleanOrderId}_${sku}`;
        const salesDocRef = doc(db, `users/${currentUser.uid}/sales`, customDocId);

        await setDoc(salesDocRef, {
          orderId: finalId, 
          sku, 
          product: productName, 
          total: totalRevenue, 
          hpp: totalHpp, 
          qty, 
          profit: netProfit, 
          logisticsFee, 
          marketplace: config.name, 
          status: 'Proses', 
          createdAt: transactionDate 
        }, { merge: true });

        await salesService.updateProductStock(sku, -qty, finalId);
        addedCount++;
      }
      alert(`Berhasil impor ${addedCount} data.`);
    } catch (err) { alert("Gagal memproses file."); console.error(err); } 
    finally { setIsProcessing(false); e.target.value = ''; }
  };
  reader.readAsBinaryString(file);
};

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeFees || isProcessing) return alert("Sistem belum siap.");
    setIsProcessing(true);
    try {
      await salesService.processMultiProductManual(manualForm, useCatalogPrice);
      setIsManualModalOpen(false);
      setManualForm({ 
        orderId: '', source: 'Shopee', status: 'Proses', tiktokProvince: '', tiktokWeight: 1, tiktokType: 'Standard',
        items: [{ sku: '', qty: 1, manualPrice: '', manualCost: '' }] 
      });
      alert("Pesanan tersimpan!");
    } catch (err) { alert("Terjadi kesalahan."); } 
    finally { setIsProcessing(false); }
  };

  if (!currentUser) return null;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-10">
      <SalesHeader onOpenManual={() => setIsManualModalOpen(true)} />
      
      <SalesFilters 
        timeFilter={timeFilter} setTimeFilter={setTimeFilter}
        selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        searchSales={searchSales} setSearchSales={setSearchSales}
        statusTab={statusTab} setStatusTab={setStatusTab}
        pendingCount={transactions.filter(t => t.product === "Produk Luar Katalog").length}
      />

      <div className="mx-4 sm:mx-10 my-4 bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h4 className="text-sm font-black text-rose-900 uppercase tracking-wider">Sistem Pembersihan Riwayat Transaksi Ganda</h4>
          <p className="text-xs text-rose-700 mt-0.5">
            Klik tombol di samping untuk memindai database, menghapus data kembar instan, dan mengembalikan kuantitas stok yang bocor.
          </p>
        </div>
        <button
          disabled={isProcessing}
          onClick={handleDirectDatabaseCleanup}
          className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
        >
          {isProcessing ? "Sedang Memproses..." : "🔥 HAPUS DUPLIKASI & PULIHKAN STOK NOW"}
        </button>
      </div>

      <SalesStats transactions={filteredTransactions} label={timeFilter} />

      <div className="px-4 sm:px-10 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ImportCard 
          selectedMarketplace={selectedMarketplace}
          setSelectedMarketplace={setSelectedMarketplace}
          isProcessing={isProcessing}
          onUpload={handleFileUpload}
        />

        {/* 🔧 DISUNTIKKAN ACTION ONEDIT PADA TABLE */}
        <SalesTable 
          items={filteredTransactions}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onDeleteBulk={() => {
            salesService.bulkDeleteTransactions(transactions, selectedIds);
            setSelectedIds([]);
          }}
          onDeleteSingle={(t: any) => salesService.deleteTransaction(t)}
          onStatusUpdate={async (id: string, status: string) => {
            await updateDoc(doc(db, `users/${currentUser?.uid}/sales`, id), { status });
          }}
          onEdit={(t: any) => {
            setEditForm({
              id: t.id,
              orderId: t.orderId || '',
              sku: t.sku || '',
              product: t.product || '',
              qty: t.qty || 1,
              total: t.total || 0,
              marketplace: t.marketplace || 'Shopee'
            });
            setIsEditModalOpen(true);
          }}
        />
      </div>

      <ManualInputModal 
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        manualForm={manualForm}
        setManualForm={setManualForm}
        useCatalogPrice={useCatalogPrice}
        setUseCatalogPrice={setUseCatalogPrice}
        isProcessing={isProcessing}
        onSubmit={handleManualSubmit}
        addManualItem={() => setManualForm({...manualForm, items: [...manualForm.items, { sku: '', qty: 1, manualPrice: '', manualCost: '' }]})} 
        removeManualItem={(index: number) => setManualForm({...manualForm, items: manualForm.items.filter((_, i) => i !== index)})} 
        updateManualItem={(index: number, field: string, value: any) => { 
          const newItems = [...manualForm.items]; 
          newItems[index] = { ...newItems[index], [field]: value }; 
          setManualForm({ ...manualForm, items: newItems }); 
        }} 
      />

      {/* 🔧 MODAL BARU: FORM EDIT & MAP PRODUK PENDING LOKAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">🔧 Petakan Produk Pending</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>
            
            <form onSubmit={handleEditPendingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-bold">ID Pesanan:</span>
                  <span className="font-black text-slate-700">{editForm.orderId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Marketplace:</span>
                  <span className="font-black text-slate-700 uppercase">{editForm.marketplace}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 block mb-1">Nama Barang Luar Katalog (Dari Nota)</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 italic">
                  {editForm.product}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Masukkan SKU Katalog yang Benar</label>
                <input 
                  type="text" 
                  required 
                  placeholder="CONTOH: SMBL-MRH-1LNS"
                  className="w-full border border-slate-200 bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none transition-all shadow-xs" 
                  value={editForm.sku} 
                  onChange={(e) => setEditForm({...editForm, sku: e.target.value.toUpperCase().replace(/\s+/g, '')})}
                />
                <p className="text-[10px] text-slate-400 mt-1">Sistem akan otomatis menghitung ulang HPP, margin keuntungan, dan memotong stok di katalog asli.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1">Kuantitas (Qty)</label>
                  <input type="number" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500" value={editForm.qty} />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1">Omset Penjualan</label>
                  <input type="text" disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500" value={`Rp ${editForm.total.toLocaleString('id-ID')}`} />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black py-3 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isProcessing ? "Menyimpan..." : "Simpan & Hubungkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}