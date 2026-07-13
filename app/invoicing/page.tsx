// app/invoicing/page.tsx
"use client";

import React from 'react';
import { useAuth } from "../../context/AuthContext";
import { useInvoicingPage } from "./hooks/useInvoicingPage";
import { CustomerInvoicePdfService } from "./services/CustomerInvoicePdfService";
import { InvoicingSummary } from "./components/InvoicingSummary";
import { InvoicingFilters } from "./components/InvoicingFilters";
import { InvoicingTable } from "./components/InvoicingTable";
import { InvoiceModal } from "./components/InvoiceModal";
import { PlusCircle, Loader2, FileSpreadsheet } from "lucide-react";

export default function InvoicingPage() {
  const { currentUser } = useAuth();
  const state = useInvoicingPage(currentUser);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <p className="font-black text-[#0047AB] animate-pulse uppercase text-xs tracking-widest">
          Mengotentikasi Sesi Anda...
        </p>
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20 transition-all duration-300">
      
      {/* 1. HEADER SECTION */}
      <div className="px-4 sm:px-10 pt-10 sm:pt-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
            Penagihan & Invoice
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#0F172A] tracking-tighter leading-none uppercase">
            Invoicing Klien
          </h1>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={state.openCreateModal}
          className="cursor-pointer px-6 py-4 bg-[#0047AB] hover:bg-blue-800 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-blue-100 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all w-full sm:w-auto"
        >
          <PlusCircle size={16} strokeWidth={3} />
          <span>Buat Invoice Baru</span>
        </button>
      </div>

      {/* 2. LOADER SHIELD */}
      {state.loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-2">
          <Loader2 className="animate-spin text-[#0047AB]" size={28} />
          <p className="text-[9px] font-black uppercase tracking-widest">Memuat Data Invoice...</p>
        </div>
      ) : (
        <>
          {/* 3. METRICS SUMMARY CARDS */}
          <InvoicingSummary stats={state.statistics} />

          {/* 4. SEARCH & STATUS FILTERS */}
          <InvoicingFilters
            searchQuery={state.searchQuery}
            setSearchQuery={state.setSearchQuery}
            statusFilter={state.statusFilter}
            setStatusFilter={state.setStatusFilter}
            timeFilter={state.timeFilter}
            setTimeFilter={state.setTimeFilter}
            invoiceCount={state.invoices.length}
          />

          {/* 5. INVOICE LIST TABLE */}
          <div className="px-4 sm:px-10">
            <InvoicingTable
              items={state.invoices}
              onEdit={state.openEditModal}
              onDelete={state.handleDeleteInvoice}
              onToggleStatus={state.toggleInvoiceStatus}
              onDownloadPdf={CustomerInvoicePdfService.generatePdf}
            />
          </div>
        </>
      )}

      {/* 6. CREATE / EDIT DIALOG MODAL */}
      <InvoiceModal
        isOpen={state.isModalOpen}
        onClose={() => state.setIsModalOpen(false)}
        mode={state.modalMode}
        form={state.form}
        setForm={state.setForm}
        items={state.formItems}
        setItems={state.setFormItems}
        products={state.products}
        calculatedValues={state.calculatedValues}
        onSubmit={state.handleSaveInvoice}
      />

    </div>
  );
}
