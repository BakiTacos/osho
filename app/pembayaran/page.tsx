"use client";

import React, { useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import { Wallet, PlusCircle, MoreVertical, Trash2, Edit3, TrendingDown, Receipt, History } from "lucide-react";

// IMPORT CLEAN ARCHITECTURE
import { usePaymentData } from "../hooks/usePaymentData";
import { PaymentService } from "../../lib/services/PaymentService";
import { WithdrawModal, ExpenseModal, InvoiceModal, HistoryModal } from "../../components/payment/PaymentModals";

export default function PembayaranPage() {
  const { currentUser } = useAuth();
  
  // Custom Hook & Service
  const { withdrawals, invoices, expenses, products } = usePaymentData(currentUser);
  const paymentService = new PaymentService(currentUser, products);

  // States for Filtering
  const [timeFilter, setTimeFilter] = useState("Hari Ini"); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal & Menus States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form States
  const [withdrawForm, setWithdrawForm] = useState({ platform: 'Shopee', amount: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Listrik/Air', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [invoiceForm, setInvoiceForm] = useState({ noNota: '', supplier: '', dueDate: '', status: 'BELUM BAYAR' });
  const [invoiceItems, setInvoiceItems] = useState([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]);

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];

  // Derived Data via Service
  const filteredInvoices = paymentService.filterByTime(invoices, timeFilter, selectedMonth, selectedYear);
  const filteredWithdrawals = paymentService.filterByTime(withdrawals, timeFilter, selectedMonth, selectedYear);
  const filteredExpenses = paymentService.filterByTime(expenses, timeFilter, selectedMonth, selectedYear);
  
  const { platformStats, totalWithdrawal, totalPaidInvoices, totalUnpaidInvoices, totalOpex } = paymentService.calculateStats(filteredWithdrawals, filteredInvoices, filteredExpenses);

  // Handlers
  const resetInvoice = () => { setIsInvoiceModalOpen(false); setInvoiceForm({ noNota: '', supplier: '', dueDate: '', status: 'BELUM BAYAR' }); setInvoiceItems([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]); };

  if (!currentUser) return <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]"><p className="font-black text-[#0047AB] animate-pulse">MEMUAT DATA ANALISIS...</p></div>;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER & FILTER */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div><h1 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-tight">Manajemen Pembayaran</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Pantau Kewajiban & Arus Kas Keluar</p></div>
        <div className="flex flex-wrap items-center bg-white p-1.5 rounded-2xl border shadow-sm gap-1">
          {["Hari Ini", "3 Hari", "Bulan"].map((opt) => (
            <button key={opt} onClick={() => setTimeFilter(opt)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeFilter === opt ? "bg-[#0047AB] text-white shadow-md" : "text-slate-400 hover:text-[#0047AB]"}`}>{opt}</button>
          ))}
          {timeFilter === "Bulan" && (
            <div className="flex items-center gap-1 ml-1 pl-1 border-l">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-2 py-2 text-[#0047AB]">{months.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-2 py-2 text-[#0047AB]">{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
            </div>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="px-4 sm:px-10 mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-[28px] border shadow-sm border-l-4 border-l-emerald-500"><p className="text-[9px] font-black text-emerald-600 uppercase mb-3">Total Nota Dibayar</p><h3 className="text-xl font-black text-emerald-600">Rp {totalPaidInvoices.toLocaleString('id-ID')}</h3><p className="text-[9px] font-bold text-slate-300 mt-2">Arus Kas Keluar Lunas</p></div>
        <div className="bg-white p-6 rounded-[28px] border shadow-sm border-l-4 border-l-red-500"><p className="text-[9px] font-black text-red-500 uppercase mb-3">Nota Belum Bayar</p><h3 className="text-xl font-black text-red-600">Rp {totalUnpaidInvoices.toLocaleString('id-ID')}</h3><p className="text-[9px] font-bold text-slate-300 mt-2">Kewajiban Mendatang</p></div>
        <div className="bg-white p-6 rounded-[28px] border shadow-sm relative group"><button onClick={() => setIsHistoryModalOpen(true)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-[#0047AB]"><History size={16} /></button><p className="text-[9px] font-black text-[#94A3B8] uppercase mb-3">Saldo Ditarik</p><h3 className="text-xl font-black">Rp {totalWithdrawal.toLocaleString('id-ID')}</h3><div className="mt-3 space-y-1">{Object.keys(platformStats).map(p => <div key={p} className="flex justify-between text-[9px] font-bold text-slate-400"><span>{p}</span><span className="text-[#0047AB]">Rp {platformStats[p].toLocaleString('id-ID')}</span></div>)}</div></div>
        <div className="bg-white p-6 rounded-[28px] border shadow-sm border-l-4 border-l-orange-500"><p className="text-[9px] font-black text-orange-400 uppercase mb-3">Biaya Opex</p><h3 className="text-xl font-black text-orange-600">Rp {totalOpex.toLocaleString('id-ID')}</h3><p className="text-[9px] font-bold text-slate-300 mt-2">Operasional Usaha</p></div>
        <div className="flex flex-col gap-2">
          <button onClick={() => setIsWithdrawModalOpen(true)} className="flex-1 bg-white border-2 border-slate-50 text-[#0047AB] rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase hover:bg-blue-50"><Wallet size={14} /> Tarik Saldo</button>
          <button onClick={() => setIsInvoiceModalOpen(true)} className="flex-1 bg-[#0047AB] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:scale-[1.02]"><PlusCircle size={14} /> Nota Baru</button>
          <button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 bg-orange-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase shadow-lg shadow-orange-100 hover:scale-[1.02]"><TrendingDown size={14} /> Input Opex</button>
        </div>
      </div>

      {/* TABLES SECTION */}
      <div className="px-4 sm:px-10 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[32px] border shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center text-xs font-black uppercase text-[#94A3B8] tracking-widest">Riwayat Tagihan Supplier</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FB] text-[9px] font-black text-[#94A3B8] uppercase"><tr><th className="px-8 py-5">Nomor Nota / Supplier</th><th className="px-6 py-5">Status</th><th className="px-6 py-5 text-right">Tagihan</th><th className="px-8 py-5 text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all text-sm font-bold">
                    <td className="px-8 py-5"><p className="text-[#0047AB] font-black">#{inv.noNota}</p><p className="text-[10px] text-slate-400 uppercase">{inv.supplier}</p></td>
                    <td className="px-6 py-5"><button onClick={() => paymentService.toggleInvoiceStatus(inv)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${inv.status === 'TERBAYAR' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{inv.status}</button></td>
                    <td className="px-6 py-5 text-right font-black">Rp {inv.amount.toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5 text-right relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)} className="p-2 text-slate-300 hover:text-slate-600"><MoreVertical size={18}/></button>
                      {activeMenuId === inv.id && (
                        <div className="absolute right-10 top-12 w-36 bg-white border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                          <button onClick={() => { setInvoiceForm({ noNota: inv.noNota, supplier: inv.supplier, dueDate: inv.dueDate || '', status: inv.status }); setInvoiceItems(inv.items); setIsInvoiceModalOpen(true); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-slate-600 hover:bg-slate-50"><Edit3 size={14}/> EDIT</button>
                          <button onClick={async () => { if(confirm("Hapus nota? Stok akan dikurangi.")) { await paymentService.deleteInvoice(inv); setActiveMenuId(null); } }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-50"><Trash2 size={14}/> HAPUS</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border shadow-sm p-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#94A3B8] mb-6 flex items-center gap-2"><TrendingDown size={14}/> Biaya Opex</h4>
          <div className="space-y-3">
            {filteredExpenses.map((exp) => (
              <div key={exp.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all">
                <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm"><Receipt size={16}/></div><div><p className="text-[11px] font-black text-[#0F172A] leading-tight">{exp.category}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{exp.description}</p></div></div>
                <div className="flex items-center gap-2"><p className="text-xs font-black text-red-500">-Rp {exp.amount.toLocaleString('id-ID')}</p><button onClick={async () => { if(confirm("Hapus?")) await paymentService.deleteDocument("expenses", exp.id); }} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={12}/></button></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} form={withdrawForm} setForm={setWithdrawForm} onSubmit={async (e: any) => { e.preventDefault(); try { await paymentService.saveWithdraw(withdrawForm); setIsWithdrawModalOpen(false); setWithdrawForm({ platform: 'Shopee', amount: '' }); } catch (err: any) { alert(err.message); } }} />
      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} form={expenseForm} setForm={setExpenseForm} onSubmit={async (e: any) => { e.preventDefault(); try { await paymentService.saveExpense(expenseForm); setIsExpenseModalOpen(false); setExpenseForm({ category: 'Listrik/Air', description: '', amount: '', date: new Date().toISOString().split('T')[0] }); } catch (err: any) { alert(err.message); } }} />
      <InvoiceModal isOpen={isInvoiceModalOpen} onClose={resetInvoice} form={invoiceForm} setForm={setInvoiceForm} items={invoiceItems} setItems={setInvoiceItems} products={products} onSubmit={async (e: any) => { e.preventDefault(); try { await paymentService.saveInvoice(invoiceForm, invoiceItems); resetInvoice(); } catch (err: any) { alert(err.message); } }} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} withdrawals={withdrawals} onDelete={async (id: string) => { if(confirm("Hapus?")) await paymentService.deleteDocument("withdrawals", id); }} onEdit={(w: any) => { if (w.editCount >= 1) return alert("Sudah diubah."); setWithdrawForm({ platform: w.platform, amount: w.amount.toString() }); setIsWithdrawModalOpen(true); setIsHistoryModalOpen(false); }} />

    </div>
  );
}