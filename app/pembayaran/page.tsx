"use client";

import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { Wallet, PlusCircle, MoreVertical, Trash2, Edit3, TrendingDown, Receipt, History, Pencil } from "lucide-react";

// IMPORT CLEAN ARCHITECTURE
import { usePaymentData } from "../hooks/usePaymentData";
import { PaymentService } from "../../lib/services/PaymentService";
import { WithdrawModal, ExpenseModal, InvoiceModal, HistoryModal } from "../../components/payment/PaymentModals";

export default function PembayaranPage() {
  const { currentUser } = useAuth();
  
  // Custom Hook & Service

  // States for Filtering
  const [timeFilter, setTimeFilter] = useState("Bulan"); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Panggil hook dengan parameter waktu
  const { withdrawals, invoices, expenses, products } = usePaymentData(currentUser, selectedMonth, selectedYear);
  const paymentService = new PaymentService(currentUser, products);

  // Modal & Menus States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form States (Dengan field 'id' dan 'date' yang tersusun rapi)
  const [withdrawForm, setWithdrawForm] = useState<any>({ 
    id: null, 
    platform: 'Shopee', 
    amount: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  
  const [expenseForm, setExpenseForm] = useState<any>({ 
    id: null,
    category: '', 
    description: '', 
    amount: '', 
    paidBy: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  
  const [invoiceForm, setInvoiceForm] = useState<any>({ 
    id: null, 
    noNota: '', 
    supplier: '', 
    dueDate: '', 
    status: 'BELUM BAYAR' 
  });
  const [invoiceItems, setInvoiceItems] = useState([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]);

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];

  // Derived Data via Service
  const filteredInvoices = paymentService.filterByTime(invoices, timeFilter, selectedMonth, selectedYear);
  const filteredWithdrawals = paymentService.filterByTime(withdrawals, timeFilter, selectedMonth, selectedYear);
  const filteredExpenses = paymentService.filterByTime(expenses, timeFilter, selectedMonth, selectedYear);
  
  const { 
    platformStats, 
    payerStats, 
    totalWithdrawal, 
    totalPaidInvoices, 
    totalUnpaidInvoices, 
    totalOpex 
  } = paymentService.calculateStats(filteredWithdrawals, filteredInvoices, filteredExpenses);

  // --- SUBMIT HANDLERS (CLEAN ARCHITECTURE) ---
  
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentService.saveWithdraw(withdrawForm);
      setIsWithdrawModalOpen(false);
      setWithdrawForm({ id: null, platform: 'Shopee', amount: '', date: new Date().toISOString().split('T')[0] }); 
    } catch (err: any) { alert(err.message); }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentService.saveExpense(expenseForm);
      setIsExpenseModalOpen(false);
      setExpenseForm({ id: null, category: '', description: '', amount: '', paidBy: '', date: new Date().toISOString().split('T')[0] }); 
    } catch (err: any) { alert(err.message); }
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentService.saveInvoice(invoiceForm, invoiceItems);
      resetInvoice(); 
    } catch (err: any) { alert(err.message); }
  };

  const resetInvoice = () => { 
    setIsInvoiceModalOpen(false); 
    setInvoiceForm({ id: null, noNota: '', supplier: '', dueDate: '', status: 'BELUM BAYAR' }); 
    setInvoiceItems([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]); 
  };

  if (!currentUser) return <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]"><p className="font-black text-[#0047AB] animate-pulse">MEMUAT DATA ANALISIS...</p></div>;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER & FILTER */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tighter leading-tight">Manajemen Pembayaran</h1>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Pantau Kewajiban & Arus Kas Keluar</p>
        </div>
        <div className="flex flex-wrap items-center bg-white p-1 sm:p-1.5 rounded-2xl border shadow-sm gap-1 w-full sm:w-auto">
          {["Hari Ini", "3 Hari", "Bulan"].map((opt) => (
            <button key={opt} onClick={() => setTimeFilter(opt)} className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all ${timeFilter === opt ? "bg-[#0047AB] text-white shadow-md" : "text-slate-400 hover:text-[#0047AB]"}`}>{opt}</button>
          ))}
          {timeFilter === "Bulan" && (
            <div className="flex items-center gap-1 w-full sm:w-auto mt-1 sm:mt-0 sm:ml-1 sm:pl-1 border-t sm:border-t-0 sm:border-l pt-1 sm:pt-0">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-1/2 sm:w-auto bg-slate-50 border-none rounded-xl text-[9px] sm:text-[10px] font-black uppercase px-2 py-2 text-[#0047AB]">{months.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-1/2 sm:w-auto bg-slate-50 border-none rounded-xl text-[9px] sm:text-[10px] font-black uppercase px-2 py-2 text-[#0047AB]">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
            </div>
          )}
        </div>
      </div>

      {/* STAT CARDS - RESPONSIVE */}
      <div className="px-4 sm:px-10 mt-6 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-slate-100 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-emerald-600 uppercase mb-1 sm:mb-3">Total Nota Dibayar</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-emerald-600 truncate">Rp {totalPaidInvoices.toLocaleString('id-ID')}</h3>
          </div>
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-300 mt-2 sm:mt-4">Arus Kas Keluar Lunas</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-slate-100 shadow-sm border-l-4 border-l-red-500 flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase mb-1 sm:mb-3">Nota Belum Bayar</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-red-600 truncate">Rp {totalUnpaidInvoices.toLocaleString('id-ID')}</h3>
          </div>
          <p className="text-[8px] sm:text-[9px] font-bold text-slate-300 mt-2 sm:mt-4">Kewajiban Mendatang</p>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-slate-100 shadow-sm relative group flex flex-col justify-between">
          <button onClick={() => setIsHistoryModalOpen(true)} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:text-[#0047AB] transition-colors"><History size={14} /></button>
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-[#94A3B8] uppercase mb-1 sm:mb-3">Saldo Ditarik</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black truncate">Rp {totalWithdrawal.toLocaleString('id-ID')}</h3>
          </div>
          <div className="mt-2 sm:mt-4 space-y-0.5 max-h-[36px] overflow-y-auto no-scrollbar border-t pt-1.5">
            {Object.keys(platformStats).map(p => (
              <div key={p} className="flex justify-between text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase">
                <span className="truncate mr-1">{p}</span>
                <span className="text-[#0047AB] shrink-0">Rp {platformStats[p].toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-slate-100 shadow-sm border-l-4 border-l-orange-500 flex flex-col justify-between">
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-orange-400 uppercase mb-1 sm:mb-3">Biaya Operasional</p>
            <h3 className="text-sm sm:text-lg xl:text-xl font-black text-orange-600 truncate">Rp {totalOpex.toLocaleString('id-ID')}</h3>
          </div>
          <div className="mt-2 sm:mt-4 space-y-0.5 max-h-[36px] overflow-y-auto no-scrollbar border-t pt-1.5">
            {Object.entries(payerStats).map(([payer, amount]) => (
              <div key={payer} className="flex justify-between text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase">
                <span className="truncate mr-1">{payer}</span>
                <span className="text-[#0F172A] shrink-0">Rp {(amount as number).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 lg:col-span-4 xl:col-span-1 grid grid-cols-3 xl:grid-cols-1 gap-2 w-full">
          <button onClick={() => { setWithdrawForm({ id: null, platform: 'Shopee', amount: '', date: new Date().toISOString().split('T')[0] }); setIsWithdrawModalOpen(true); }} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 xl:py-0 bg-white border border-slate-150 text-[#0047AB] rounded-2xl font-black text-[8px] sm:text-[10px] uppercase hover:bg-blue-50 transition-all">
            <Wallet size={14} className="shrink-0" /> <span className="text-center">Tarik Saldo</span>
          </button>
          <button onClick={() => { resetInvoice(); setIsInvoiceModalOpen(true); }} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 xl:py-0 bg-[#0047AB] text-white rounded-2xl font-black text-[8px] sm:text-[10px] uppercase shadow-md shadow-blue-100 hover:scale-[1.01] transition-all">
            <PlusCircle size={14} className="shrink-0" /> <span className="text-center">Nota Baru</span>
          </button>
          <button onClick={() => { setExpenseForm({ id: null, category: '', description: '', amount: '', paidBy: '', date: new Date().toISOString().split('T')[0] }); setIsExpenseModalOpen(true); }} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 xl:py-0 bg-orange-500 text-white rounded-2xl font-black text-[8px] sm:text-[10px] uppercase shadow-md shadow-orange-100 hover:scale-[1.01] transition-all">
            <TrendingDown size={14} className="shrink-0" /> <span className="text-center">Input Operasional</span>
          </button>
        </div>
      </div>

      {/* TABLES SECTION */}
      <div className="px-4 sm:px-10 mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* INVOICE TABLE */}
        <div className="lg:col-span-2 bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[350px] sm:min-h-[400px]">
          <div className="p-5 sm:p-6 border-b border-slate-50 flex justify-between items-center text-[10px] sm:text-xs font-black uppercase text-[#94A3B8] tracking-widest">
            Riwayat Tagihan Supplier
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[500px] sm:min-w-0">
              <thead className="bg-[#F8F9FB] text-[8px] sm:text-[9px] font-black text-[#94A3B8] uppercase">
                <tr>
                  <th className="px-5 py-4 sm:px-8 sm:py-5">Nomor Nota / Supplier</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-5">Status</th>
                  <th className="px-4 py-4 sm:px-6 sm:py-5 text-right">Tagihan</th>
                  <th className="px-5 py-4 sm:px-8 sm:py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all text-xs sm:text-sm font-bold">
                    <td className="px-5 py-4 sm:px-8 sm:py-5">
                      <p className="text-[#0047AB] font-black">#{inv.noNota}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase">{inv.supplier}</p>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5">
                      <button onClick={() => paymentService.toggleInvoiceStatus(inv)} className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tight ${inv.status === 'TERBAYAR' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {inv.status}
                      </button>
                    </td>
                    <td className="px-4 py-4 sm:px-6 sm:py-5 text-right font-black">Rp {inv.amount.toLocaleString('id-ID')}</td>
                    <td className="px-5 py-4 sm:px-8 sm:py-5 text-right relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)} className="p-1.5 sm:p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <MoreVertical size={16}/>
                      </button>
                      {activeMenuId === inv.id && (
                        <div className="absolute right-8 top-10 w-32 bg-white border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                          <button onClick={() => { 
                            // EDIT NOTA - BAWA ID
                            setInvoiceForm({ id: inv.id, noNota: inv.noNota, supplier: inv.supplier, dueDate: inv.dueDate || '', status: inv.status }); 
                            setInvoiceItems(inv.items); 
                            setIsInvoiceModalOpen(true); 
                            setActiveMenuId(null); 
                          }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[9px] sm:text-[10px] font-black text-slate-600 hover:bg-slate-50"><Edit3 size={12}/> EDIT</button>
                          <button onClick={async () => { if(confirm("Hapus nota? Stok akan dikurangi.")) { await paymentService.deleteInvoice(inv); setActiveMenuId(null); } }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[9px] sm:text-[10px] font-black text-red-500 hover:bg-red-50"><Trash2 size={12}/> HAPUS</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OPEX LIST */}
        <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm p-5 sm:p-6">
          <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#94A3B8] mb-4 sm:mb-6 flex items-center gap-2">
            <TrendingDown size={14}/> Biaya Operasional
          </h4>
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
            {filteredExpenses.map((exp) => {
              let displayDate = "";
              if (exp.date) {
                const d = new Date(exp.date);
                if (!isNaN(d.getTime())) displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
              } else if (exp.createdAt) {
                const d = exp.createdAt.toDate ? exp.createdAt.toDate() : new Date(exp.createdAt);
                if (!isNaN(d.getTime())) displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
              }

              return (
                <div key={exp.id} className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm shrink-0">
                      <Receipt size={14}/>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[10px] sm:text-[11px] font-black text-[#0F172A] leading-tight truncate">
                          {exp.category}
                        </p>
                        <span className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[6px] font-black text-slate-400 uppercase tracking-tighter shrink-0">
                          {exp.paidBy || 'KEVIN'}
                        </span>
                        {displayDate && <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">• {displayDate}</span>}
                      </div>
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-0.5 truncate">
                        {exp.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <p className="text-xs sm:text-sm font-black text-red-500">-Rp {exp.amount.toLocaleString('id-ID')}</p>
                    <div className="flex items-center mt-1 gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {/* EDIT OPEX BUTTON */}
                      <button onClick={() => {
                        setExpenseForm({
                          id: exp.id,
                          category: exp.category,
                          description: exp.description,
                          amount: exp.amount.toString(),
                          paidBy: exp.paidBy || '',
                          date: exp.date || (exp.createdAt?.toDate ? exp.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
                        });
                        setIsExpenseModalOpen(true);
                      }} className="p-1 text-slate-300 hover:text-[#0047AB] flex items-center gap-1">
                        <Pencil size={10}/> <span className="text-[7px] font-black uppercase hidden sm:block">Edit</span>
                      </button>
                      {/* DELETE OPEX BUTTON */}
                      <button onClick={async () => { if(confirm("Hapus catatan opex ini?")) await paymentService.deleteDocument("expenses", exp.id); }} className="p-1 text-slate-300 hover:text-red-500 flex items-center gap-1">
                        <Trash2 size={10}/> <span className="text-[7px] font-black uppercase hidden sm:block">Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredExpenses.length === 0 && <div className="py-10 text-center text-slate-300"><p className="text-[9px] font-black uppercase tracking-widest">Belum Ada Pengeluaran</p></div>}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} form={withdrawForm} setForm={setWithdrawForm} onSubmit={handleWithdrawSubmit} />
      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} form={expenseForm} setForm={setExpenseForm} onSubmit={handleExpenseSubmit} />
      <InvoiceModal isOpen={isInvoiceModalOpen} onClose={resetInvoice} form={invoiceForm} setForm={setInvoiceForm} items={invoiceItems} setItems={setInvoiceItems} products={products} onSubmit={handleInvoiceSubmit} />
      
      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        withdrawals={withdrawals} 
        onDelete={async (id: string) => { if(confirm("Hapus penarikan ini?")) await paymentService.deleteDocument("withdrawals", id); }} 
        onEdit={(w: any) => { 
          // EDIT WITHDRAWAL - BAWA ID & TANGGAL
          if (w.editCount >= 1) return alert("Hanya dapat diedit 1 kali."); 
          setWithdrawForm({ 
            id: w.id, 
            date: w.date || (w.createdAt?.toDate ? w.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            platform: w.platform, 
            amount: w.amount.toString() 
          }); 
          setIsWithdrawModalOpen(true); 
          setIsHistoryModalOpen(false); 
        }} 
      />

    </div>
  );
}