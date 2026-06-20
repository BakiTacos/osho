// app/pembayaran/page.tsx
"use client";

import React from 'react';
import { useAuth } from "../../context/AuthContext";
import { usePaymentPage } from "./hooks/usePaymentPage";
import { usePaymentData } from "./hooks/usePaymentData"; // Import hook penarik data dasar ruko Kakak

// COMPONENTS SUB-MODUL LOKAL
import { FilterSection } from "./components/FilterSection";
import { SummaryCards } from "./components/SummaryCards";
import { SupplierInvoiceTab } from "./components/SupplierInvoiceTab";
import { OperationalExpenseTab } from "./components/OperationalExpenseTab"; 
import { BalanceWithdrawalTab } from "./components/BalanceWithdrawalTab"; 
import { MasterSupplierTab } from "./components/MasterSupplierTab";       

import { WithdrawModal, ExpenseModal, InvoiceModal, HistoryModal } from "./components/PaymentModals";

export default function PembayaranPage() {
  const { currentUser } = useAuth();
  
  // 🚀 INJECT DEPENDENSI: Ambil seluruh kontrol kemudi data kas ruko
  const state = usePaymentPage(currentUser, usePaymentData);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <p className="font-black text-[#0047AB] animate-pulse uppercase text-xs tracking-widest">Memuat Data Keuangan Ruko...</p>
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20 transition-all duration-300">
      
      {/* 1. KEPALA DOKUMEN ARUS KAS */}
      <div className="px-4 sm:px-10 pt-10 sm:pt-14">
        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Manajemen Keuangan</p>
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#0F172A] tracking-tighter leading-none uppercase">Arus Kas & Kewajiban</h1>
      </div>

      {/* 2. AREA FILTERING WAKTU */}
      {/* 🚀 PERBAIKAN 1: Sambungkan fungsi selector langsung ke laci state induknya */}
      <FilterSection 
        timeFilter={state.timeFilter} 
        setTimeFilter={state.setTimeFilter}
        selectedMonth={state.selectedMonth} 
        setSelectedMonth={state.setSelectedMonth}
        selectedYear={state.selectedYear} 
        setSelectedYear={state.setSelectedYear}
      />

      {/* 3. KARTU SUMMARY DASBOR KAS */}
      <SummaryCards stats={state.stats} />

      {/* 4. TABS NAVIGASI NOTA / OPEX / WITHDRAWAL */}
      <div className="px-4 sm:px-10 mt-8 sm:mt-12">
        <div className="flex space-x-6 sm:space-x-10 border-b border-slate-200 overflow-x-auto no-scrollbar">
          {[
            { id: "nota", label: "Nota Supplier" },
            { id: "opex", label: "Biaya Operasional" },
            { id: "tarik", label: "Penarikan Dana" },
            { id: "supplier", label: "Master Supplier" }
          ].map(tab => (
            <button
              key={tab.id} type="button"
              onClick={() => state.setActiveTab(tab.id as any)}
              className={`pb-3 text-sm sm:text-base whitespace-nowrap font-black uppercase transition-all tracking-tight cursor-pointer ${
                state.activeTab === tab.id ? "text-[#0047AB] border-b-[3px] border-[#0047AB]" : "text-slate-400 border-b-[3px] border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. SEKTOR BADAN KONTEN UTAMA ADAPTIF */}
      <div className="px-4 sm:px-10">
        {state.activeTab === "nota" && (
          <SupplierInvoiceTab 
            items={state.filteredInvoices}
            totalPaid={state.stats.totalPaidInvoices}
            totalUnpaid={state.stats.totalUnpaidInvoices}
            activeMenuId={state.activeMenuId}
            setActiveMenuId={state.setActiveMenuId}
            onOpenAdd={() => { state.resetInvoice(); state.setIsInvoiceModalOpen(true); }}
            onToggleStatus={(inv: any) => state.paymentService.toggleInvoiceStatus(inv)}
            onDelete={async (inv: any) => { if(confirm("Hapus nota? Stok rak otomatis dikurangi kembali.")) { await state.paymentService.deleteInvoice(inv); state.setActiveMenuId(null); } }}
            onEdit={(inv: any) => { state.setInvoiceForm({ id: inv.id, noNota: inv.noNota, supplier: inv.supplier, dueDate: inv.dueDate || state.getLocalDateString(), status: inv.status }); state.setInvoiceItems(inv.items); state.setIsInvoiceModalOpen(true); state.setActiveMenuId(null); }}
          />
        )}

        {state.activeTab === "opex" && (
          <OperationalExpenseTab 
            filteredExpenses={state.filteredExpenses}
            totalOpex={state.stats.totalOpex}
            payerStats={state.stats.payerStats}
            onOpenAdd={() => { state.setExpenseForm({ id: null, category: '', description: '', amount: '', paidBy: '', date: state.getLocalDateString() }); state.setIsExpenseModalOpen(true); }}
            onEdit={(exp: any) => { state.setExpenseForm({ id: exp.id, category: exp.category, description: exp.description, amount: exp.amount.toString(), paidBy: exp.paidBy || '', date: exp.date || state.getLocalDateString() }); state.setIsExpenseModalOpen(true); }}
            onDelete={async (id: string) => { if(confirm("Hapus catatan opex ini?")) await state.paymentService.deleteDocument("expenses", id); }}
          />
        )}

        {state.activeTab === "tarik" && (
          <BalanceWithdrawalTab 
            totalWithdrawal={state.stats.totalWithdrawal}
            platformStats={state.stats.platformStats}
            onOpenAdd={() => { state.setWithdrawForm({ id: null, platform: 'Shopee', amount: '', date: state.getLocalDateString() }); state.setIsWithdrawModalOpen(true); }}
            onOpenHistory={() => state.setIsHistoryModalOpen(true)}
          />
        )}

        {state.activeTab === "supplier" && (
          <MasterSupplierTab 
            suppliers={state.suppliers}
            newSupplier={state.newSupplier}
            setNewSupplier={state.setNewSupplier}
            isSaving={state.isSavingSupplier}
            onSubmit={state.handleAddSupplier}
            onDelete={(id: string, name: string) => state.handleDeleteSupplier(id, name)}
          />
        )}
      </div>

      {/* 6. GUDANG MODAL DIALOG POP-UP */}
      <WithdrawModal isOpen={state.isWithdrawModalOpen} onClose={() => state.setIsWithdrawModalOpen(false)} form={state.withdrawForm} setForm={state.setWithdrawForm} onSubmit={state.handleWithdrawSubmit} />
      <ExpenseModal isOpen={state.isExpenseModalOpen} onClose={() => state.setIsExpenseModalOpen(false)} form={state.expenseForm} setForm={state.setExpenseForm} onSubmit={state.handleExpenseSubmit} />
      
      <InvoiceModal 
        isOpen={state.isInvoiceModalOpen} onClose={state.resetInvoice} 
        form={state.invoiceForm} setForm={state.setInvoiceForm} 
        items={state.invoiceItems} setItems={state.setInvoiceItems} 
        products={state.products} suppliers={state.suppliers} onSubmit={state.handleInvoiceSubmit} 
      />
      
      {/* 🚀 PERBAIKAN 2: Alihkan properti data penarikan ke penampung state.withdrawals */}
      <HistoryModal 
        isOpen={state.isHistoryModalOpen} onClose={() => state.setIsHistoryModalOpen(false)} 
        withdrawals={state.withdrawals} 
        onDelete={async (id: string) => { if(confirm("Hapus berkas penarikan dana?")) await state.paymentService.deleteDocument("withdrawals", id); }} 
        onEdit={(w: any) => { 
          if (w.editCount >= 1) return alert("❌ Sesuai regulasi ruko, hanya dapat diedit maksimal 1 kali."); 
          state.setWithdrawForm({ id: w.id, date: w.date || state.getLocalDateString(), platform: w.platform, amount: w.amount.toString() }); 
          state.setIsWithdrawModalOpen(true); state.setIsHistoryModalOpen(false); 
        }} 
      />
    </div>
  );
}