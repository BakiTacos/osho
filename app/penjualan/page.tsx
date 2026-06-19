// app/penjualan/page.tsx
"use client";

import React from 'react';
import { useAuth } from "../../context/AuthContext";
import { useSalesPage } from "./hooks/useSalesPage"; // 🚀 Import Logika Baru
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// Components Global / Lokal
import SalesHeader from "./components/SalesHeader";
import SalesFilters from "./components/SalesFilters";
import SalesStats from "./components/SalesStats";
import SalesTable from "./components/SalesTable";
import ImportCard from "./components/ImportCard";
import { ManualInputModal } from "./components/SalesModals";
import { ManualEditModal } from "./components/ManualEditModal"; // 🚀 Modal Lokal

export default function PenjualanPage() {
  const { currentUser } = useAuth();
  
  // 🚀 Panggil Otak Logika Custom Hook
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
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-10">
      
      {/* 1. HEADER */}
      <SalesHeader onOpenManual={() => setIsManualModalOpen(true)} />
      
      {/* 2. FILTERS */}
      <SalesFilters 
        timeFilter={timeFilter} setTimeFilter={setTimeFilter}
        selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear} setSelectedYear={setSelectedYear}
        searchSales={searchSales} setSearchSales={setSearchSales}
        statusTab={statusTab} setStatusTab={setStatusTab}
        pendingCount={transactions.filter(t => t.product === "Produk Luar Katalog").length}
      />

      {/* 3. CLEANUP ANNOUNCEMENT BANNER */}
      <div className="mx-4 sm:mx-10 my-4 bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h4 className="text-sm font-black text-rose-900 uppercase tracking-wider">Sistem Pembersihan Riwayat Transaksi Ganda</h4>
          <p className="text-xs text-rose-700 mt-0.5">Klik tombol di samping untuk memindai database, menghapus data kembar instan, dan mengembalikan kuantitas stok yang bocor.</p>
        </div>
        <button
          disabled={isProcessing}
          onClick={handleDirectDatabaseCleanup}
          className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
        >
          {isProcessing ? "Sedang Memproses..." : "🔥 HAPUS DUPLIKASI & PULIHKAN STOK NOW"}
        </button>
      </div>

      {/* 4. STATS SUMMARY */}
      <SalesStats transactions={filteredTransactions} label={timeFilter} />

      {/* 5. CONTENT CARD GRID */}
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
          onEdit={(t: any) => {
            setEditForm({
              id: t.id, orderId: t.orderId || '', sku: t.sku || '',
              product: t.product || '', qty: t.qty || 1, total: t.total || 0, marketplace: t.marketplace || 'Shopee'
            });
            setIsEditModalOpen(true);
          }}
        />
      </div>

      {/* 6. MODAL PENJUALAN MANUAL */}
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

      {/* 7. MODAL EDIT PENDING LOKAL */}
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