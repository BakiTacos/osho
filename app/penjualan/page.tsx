"use client";

import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useSalesData } from "../hooks/useSalesData";
import { doc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
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

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCatalogPrice, setUseCatalogPrice] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState("shopee");
  const [timeFilter, setTimeFilter] = useState("Hari Ini");
  const [statusTab, setStatusTab] = useState("Semua");
  const [searchSales, setSearchSales] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
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

  // 🔥 PERBAIKAN TOTAL: Proteksi dan Pembersihan Kunci Duplikat secara Radikal
  const handleDirectDatabaseCleanup = async () => {
    if (transactions.length === 0) return alert("Tidak ada data transaksi yang termuat.");
    setIsProcessing(true);

    try {
      const seenEntries = new Set<string>();
      const duplicatesToDelete: any[] = [];

      transactions.forEach((t) => {
        // 🔒 SOLUSI: Hapus paksa karakter '#' di awal ID, bersihkan spasi, dan ubah ke lowercase
        const cleanOrderId = String(t.orderId || "").trim().replace(/^#/, "").toLowerCase();
        
        // Bersihkan spasi pada SKU dan pastikan uppercase agar konsisten
        const cleanSku = String(t.sku || "").replace(/\s+/g, "").toUpperCase();
        
        // Buat kombinasi kunci pencocokan baru yang super steril
        const uniqueKey = `${cleanOrderId}_${cleanSku}`;

        if (seenEntries.has(uniqueKey)) {
          // Jika kunci steril ini sudah pernah dibaca, tandai baris ini sebagai DUPLIKAT REAL
          duplicatesToDelete.push(t);
        } else {
          seenEntries.add(uniqueKey);
        }
      });

      if (duplicatesToDelete.length === 0) {
        alert("Sistem telah memindai ulang dengan pembersihan karakter khusus, namun tidak mendeteksi kunci kembar di database. Pastikan filter rentang waktu/bulan sudah sesuai dengan tanggal nota tersebut berada.");
        setIsProcessing(false);
        return;
      }

      const konfirmasi = window.confirm(
        `⚠️ Duplikat Terdeteksi!\nSistem berhasil mendeteksi ${duplicatesToDelete.length} data transaksi kembar di database.\n\nSistem akan otomatis:\n1. Menghapus langsung data kembar tersebut dari Firestore.\n2. Mengembalikan STOK produk (+qty) ke katalog SNY & PARATA.\n\nKlik OK untuk eksekusi sekarang.`
      );
      
      if (!konfirmasi) {
        setIsProcessing(false);
        return;
      }

      let successCleanedCount = 0;

      // Eksekusi pembersihan aman
      for (const tx of duplicatesToDelete) {
        // 1. Hapus transaksi duplikat dari Firestore
        await salesService.deleteTransaction(tx);

        // 2. Pulihkan nilai kuantitas stok yang telanjur bocor (+qty)
        const cleanSku = String(tx.sku || "").replace(/\s+/g, "").toUpperCase();
        const restoreQty = Number(tx.qty) || 1;
        
        // Masukkan restoreQty bernilai POSITIF untuk menambah balik stok katalog
        await salesService.updateProductStock(cleanSku, restoreQty, tx.orderId);
        
        successCleanedCount++;
      }

      alert(`✅ Berhasil! ${successCleanedCount} data duplikat dihapus langsung dari server, dan stok produk telah dikembalikan ke posisi aman.`);
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

          let logisticsFee = 0;
          if (selectedMarketplace === 'tiktok') {
            const rawShippingType = String(row[config.cols.shippingType] || "").trim().toUpperCase();
            const rawProvince = String(row[config.cols.province] || "").trim().toUpperCase();
            const parcelWeight = Number(row[config.cols.weight]) || 0;
            const finalShippingType = TIKTOK_SHIPPING_MAP[rawShippingType] || "STANDARD";
            logisticsFee = salesService.calculateTikTokLogistics(finalShippingType, rawProvince, parcelWeight);
          }

          let rawSku = String(row[finalSkuIdx] || "").trim();
          if (selectedMarketplace === 'shopee' && !rawSku) rawSku = String(row[12] || "").trim(); 
          const sku = rawSku.replace(/\s+/g, '').toUpperCase();
          const qty = Number(row[config.cols.qty]) || 1;
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
          const netProfit = salesService.calculateNetProfitEntry(totalRevenue, totalHpp, selectedMarketplace, logisticsFee);

          await addDoc(collection(db, `users/${currentUser.uid}/sales`), {
            orderId: finalId, sku, product: productName, total: totalRevenue, hpp: totalHpp, qty, 
            profit: netProfit, logisticsFee, marketplace: config.name, status: 'Proses', createdAt: serverTimestamp()
          });
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

      {/* 🚨 BOX UTAMA: TOMBOL PERMANEN HAPUS DUPLIKASI & PULIHKAN STOK */}
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
    </div>
  );
}