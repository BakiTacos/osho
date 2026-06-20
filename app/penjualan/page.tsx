// app/penjualan/page.tsx
"use client";

import React from 'react';
import { useAuth } from "../../context/AuthContext";
import { useSalesPage } from "./hooks/useSalesPage"; 
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// Components Global / Lokal
import SalesHeader from "./components/SalesHeader";
import SalesFilters from "./components/SalesFilters";
import SalesStats from "./components/SalesStats";
import SalesTable from "./components/SalesTable";
import ImportCard from "./components/ImportCard";
import { ManualInputModal } from "./components/SalesModals";
import { ManualEditModal } from "./components/ManualEditModal"; 

export default function PenjualanPage() {
  const { currentUser } = useAuth();
  
  // Ambil data kontrol dari kustom hook taktis jualan ruko
  const {
    isProcessing, useCatalogPrice, setUseCatalogPrice, isManualModalOpen, setIsManualModalOpen,
    selectedMarketplace, setSelectedMarketplace, timeFilter, setTimeFilter, statusTab, setStatusTab,
    searchSales, setSearchSales, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
    isEditModalOpen, setIsEditModalOpen, editForm, setEditForm, selectedIds, setSelectedIds,
    manualForm, setManualForm, filteredTransactions, transactions, salesService,
    handleEditPendingSubmit, handleDirectDatabaseCleanup, handleFileUpload, handleManualSubmit
  } = useSalesPage(currentUser);

  if (!currentUser) return null;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-10 space-y-4">
      
      {/* 1. HEADER (Suntikkan fungsi pembersih database ganda langsung ke dalam header) */}
      <SalesHeader 
        onOpenManual={() => setIsManualModalOpen(true)} 
        onDirectCleanup={handleDirectDatabaseCleanup}
        isProcessing={isProcessing}
      />
      
      {/* 2. FILTERS PENYARING OMSET */}
      <SalesFilters 
        timeFilter={timeFilter} setTimeFilter={setTimeFilter}
        selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        searchSales={searchSales} setSearchSales={setSearchSales}
        statusTab={statusTab} setStatusTab={setStatusTab}
        pendingCount={transactions.filter(t => t.product === "Produk Luar Katalog").length}
      />

      {/* BANNER REKONSILIASI ROBUST LAMA RESMI DIHAPUS UTUH DARI SINI AGAR DESAIN RAMPING */}

      {/* 3. STATS SUMMARY REKAP FINANSIAL */}
      {/* 3. STATS SUMMARY REKAP FINANSIAL */}
      <SalesStats transactions={filteredTransactions} label={timeFilter} />

      {/* 🚀 PERBAIKAN STRUKTUR LAYOUT KEVIN: STACK VERTIKAL (ATAS - BAWAH) */}
      <div className="px-4 sm:px-10 py-2 flex flex-col gap-6">
        
        {/* 📥 SEKTOR ATAS: Kartu Impor Excel Marketplace (Hanya muncul di Desktop, lebar penuh) */}
        <div className="hidden md:block w-full">
          <ImportCard 
            selectedMarketplace={selectedMarketplace}
            setSelectedMarketplace={setSelectedMarketplace}
            isProcessing={isProcessing}
            onUpload={handleFileUpload}
          />
        </div>

        {/* 📊 SEKTOR BAWAH: Tabel Riwayat Transaksi Jualan Utama (Lebar penuh, sangat lega!) */}
        <div className="w-full">
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
                id: t.id, orderId: t.orderId || '', resi: t.resi || '', sku: t.sku || '',
                product: t.product || '', qty: t.qty || 1, total: t.total || 0, marketplace: t.marketplace || 'Shopee'
              });
              setIsEditModalOpen(true);
            }}
          />
        </div>  
      </div>


      {/* 5. MODAL PENJUALAN MANUAL MULTI-PRODUCT */}
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

      {/* 6. MODAL EDIT PENDING LOKAL SINKRON SKU MAP */}
      <ManualEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        isProcessing={isProcessing}
        onSubmit={handleEditPendingSubmit}
      />
    </div>
  );
}