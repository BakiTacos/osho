"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  Wallet, PlusCircle, MoreVertical, Trash2, Edit3, 
  TrendingDown, Receipt, History, Pencil, Landmark, Truck, Save
} from "lucide-react";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

import { usePaymentData } from "../hooks/usePaymentData";
import { PaymentService } from "../../lib/services/PaymentService";
import { WithdrawModal, ExpenseModal, InvoiceModal, HistoryModal } from "../../components/payment/PaymentModals";

export default function PembayaranPage() {
  const { currentUser } = useAuth();
  
  const [timeFilter, setTimeFilter] = useState("Hari Ini"); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [activeTab, setActiveTab] = useState<"nota" | "opex" | "tarik" | "supplier">("nota");

  const { withdrawals, invoices, expenses, products } = usePaymentData(currentUser, selectedMonth, selectedYear);
  const paymentService = new PaymentService(currentUser, products);

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [newSupplier, setNewSupplier] = useState({ name: '', code: '' });
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getLocalDateString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  };

  const [withdrawForm, setWithdrawForm] = useState<any>({ 
    id: null, platform: 'Shopee', amount: '', date: getLocalDateString()
  });
  
  const [expenseForm, setExpenseForm] = useState<any>({ 
    id: null, category: '', description: '', amount: '', paidBy: '', date: getLocalDateString()
  });
  
  const [invoiceForm, setInvoiceForm] = useState<any>({ 
    id: null, noNota: '', supplier: '', dueDate: getLocalDateString(), status: 'BELUM BAYAR' 
  });
  const [invoiceItems, setInvoiceItems] = useState([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]);

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];

  // 🚀 PERBAIKAN: SORTING FILTERED INVOICES
  // 🚀 LOGIKA FILTER & SORTING KHUSUS NOTA (Membaca Tanggal dari Nomor)
  const getInvoiceDate = (inv: any) => {
    // Cari pola 8 digit YYYYMMDD di dalam noNota (contoh: SUPARTA-20260613-001)
    const match = inv.noNota?.match(/-(\d{4})(\d{2})(\d{2})-/);
    if (match) {
      const yyyy = parseInt(match[1]);
      const mm = parseInt(match[2]) - 1; // Bulan di JavaScript dimulai dari 0
      const dd = parseInt(match[3]);
      return new Date(yyyy, mm, dd);
    }
    // Sekoci penyelamat jika nota diinput manual tanpa format tanggal
    if (inv.createdAt) {
      return inv.createdAt.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
    }
    return new Date();
  };

  const filteredInvoices = invoices.filter((inv) => {
    const invDate = getInvoiceDate(inv);
    const now = new Date();
    
    // Set waktu ke 00:00:00 untuk perbandingan hari yang akurat
    const todayStr = now.toDateString();
    const invStr = invDate.toDateString();
    
    const diffInDays = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));

    if (timeFilter === "Hari Ini") return invStr === todayStr;
    if (timeFilter === "3 Hari") return diffInDays >= 0 && diffInDays <= 3;
    if (timeFilter === "Bulan") return invDate.getMonth() === selectedMonth && invDate.getFullYear() === selectedYear;
    
    return true;
  }).sort((a, b) => {
    // Descending: Tanggal terbaru selalu berada di urutan paling atas tabel
    return getInvoiceDate(b).getTime() - getInvoiceDate(a).getTime();
  });

  // (Filter untuk Withdrawal dan Expense tetap menggunakan bawaan PaymentService)
  const filteredWithdrawals = paymentService.filterByTime(withdrawals, timeFilter, selectedMonth, selectedYear);
  const filteredExpenses = paymentService.filterByTime(expenses, timeFilter, selectedMonth, selectedYear);
  
  const { 
    platformStats, payerStats, totalWithdrawal, 
    totalPaidInvoices, totalUnpaidInvoices, totalOpex 
  } = paymentService.calculateStats(filteredWithdrawals, filteredInvoices, filteredExpenses);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, `users/${currentUser.uid}/suppliers`), (snap) => {
      setSuppliers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim() || !newSupplier.code.trim()) return alert("Nama dan Kode wajib diisi!");
    
    setIsSavingSupplier(true);
    try {
      await addDoc(collection(db, `users/${currentUser?.uid}/suppliers`), {
        name: newSupplier.name.toUpperCase(),
        code: newSupplier.code.toUpperCase().replace(/\s+/g, ''),
        createdAt: serverTimestamp()
      });
      setNewSupplier({ name: '', code: '' });
      alert("Supplier berhasil ditambahkan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan supplier.");
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus supplier ${name}?`)) {
      try {
        await deleteDoc(doc(db, `users/${currentUser?.uid}/suppliers`, id));
      } catch (err) {
        alert("Gagal menghapus.");
      }
    }
  };

  const adjustFilterToTargetDate = (targetDateString: string) => {
    if (!targetDateString) return;
    const targetDate = new Date(targetDateString);
    if (!isNaN(targetDate.getTime())) {
      setTimeFilter("Bulan");
      setSelectedMonth(targetDate.getMonth());
      setSelectedYear(targetDate.getFullYear());
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentService.saveWithdraw(withdrawForm);
      adjustFilterToTargetDate(withdrawForm.date);
      setIsWithdrawModalOpen(false);
      setWithdrawForm({ id: null, platform: 'Shopee', amount: '', date: getLocalDateString() }); 
    } catch (err: any) { alert(err.message); }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentService.saveExpense(expenseForm);
      adjustFilterToTargetDate(expenseForm.date);
      setIsExpenseModalOpen(false);
      setExpenseForm({ id: null, category: '', description: '', amount: '', paidBy: '', date: getLocalDateString() }); 
    } catch (err: any) { alert(err.message); }
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentService.saveInvoice(invoiceForm, invoiceItems);
      adjustFilterToTargetDate(invoiceForm.dueDate);
      resetInvoice(); 
    } catch (err: any) { alert(err.message); }
  };

  const resetInvoice = () => { 
    setIsInvoiceModalOpen(false); 
    setInvoiceForm({ id: null, noNota: '', supplier: '', dueDate: getLocalDateString(), status: 'BELUM BAYAR' }); 
    setInvoiceItems([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]); 
  };

  if (!currentUser) return <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]"><p className="font-black text-[#0047AB] animate-pulse">MEMUAT DATA KEUANGAN...</p></div>;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      <div className="px-4 sm:px-10 pt-10 sm:pt-14">
        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
          Manajemen Keuangan
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#0F172A] tracking-tighter leading-none">
          Arus Kas & Kewajiban
        </h1>
      </div>

      <div className="px-4 sm:px-10 mt-6 sm:mt-8">
        <div className="inline-flex flex-col sm:flex-row sm:items-center bg-white p-1.5 sm:p-2 rounded-[24px] sm:rounded-full shadow-sm border border-slate-100 max-w-full overflow-hidden">
          <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-1 mb-2 sm:mb-0">
            {["Hari Ini", "3 Hari", "Bulan"].map((opt) => (
              <button 
                key={opt} 
                onClick={() => setTimeFilter(opt)} 
                className={`flex-1 sm:flex-none px-5 py-2.5 sm:py-3 rounded-[20px] sm:rounded-full text-[10px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${
                  timeFilter === opt 
                    ? "bg-[#0047AB] text-white shadow-md" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {timeFilter === "Bulan" && (
            <div className="flex items-center w-full sm:w-auto pl-1 sm:pl-2">
              <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block shrink-0"></div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="flex-1 sm:flex-none bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase px-3 py-2 sm:py-2.5 text-[#0047AB] outline-none hover:bg-slate-100 cursor-pointer transition-colors">
                  {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="flex-1 sm:flex-none bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase px-3 py-2 sm:py-2.5 text-[#0047AB] outline-none hover:bg-slate-100 cursor-pointer transition-colors">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-10 mt-8 sm:mt-12">
        <div className="flex space-x-6 sm:space-x-10 border-b border-slate-200 overflow-x-auto no-scrollbar">
          {[
            { id: "nota", label: "Nota Supplier" },
            { id: "opex", label: "Biaya Operasional" },
            { id: "tarik", label: "Penarikan Dana" },
            { id: "supplier", label: "Master Supplier" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm sm:text-base whitespace-nowrap transition-all tracking-tight ${
                activeTab === tab.id
                  ? "text-[#0047AB] font-black border-b-[3px] sm:border-b-4 border-[#0047AB]"
                  : "text-slate-400 font-bold hover:text-slate-600 border-b-[3px] sm:border-b-4 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "nota" && (
        <div className="px-4 sm:px-10 mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div><p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Total Nota Dibayar</p><h3 className="text-2xl font-black text-[#0F172A] truncate">Rp {totalPaidInvoices.toLocaleString('id-ID')}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div><p className="text-[10px] font-black text-red-500 uppercase mb-2">Nota Belum Bayar</p><h3 className="text-2xl font-black text-[#0F172A] truncate">Rp {totalUnpaidInvoices.toLocaleString('id-ID')}</h3></div>
            </div>
            <div className="flex items-center">
              <button onClick={() => { resetInvoice(); setIsInvoiceModalOpen(true); }} className="w-full h-full min-h-[100px] flex flex-col items-center justify-center gap-2 bg-[#0047AB] text-white rounded-[24px] sm:rounded-[32px] font-black text-xs uppercase shadow-md shadow-blue-100 hover:scale-[1.02] transition-all">
                <PlusCircle size={24} /> <span>Tambah Nota Baru</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[350px]">
            <div className="p-5 sm:p-8 border-b border-slate-50 flex justify-between items-center text-[10px] sm:text-xs font-black uppercase text-[#94A3B8] tracking-widest">Daftar Tagihan Supplier</div>
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
                      <td className="px-5 py-4 sm:px-8 sm:py-5"><p className="text-[#0F172A] font-black">#{inv.noNota}</p><p className="text-[9px] sm:text-[10px] text-slate-400 uppercase mt-0.5">{inv.supplier}</p></td>
                      <td className="px-4 py-4 sm:px-6 sm:py-5"><button onClick={() => paymentService.toggleInvoiceStatus(inv)} className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tight ${inv.status === 'TERBAYAR' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{inv.status}</button></td>
                      <td className="px-4 py-4 sm:px-6 sm:py-5 text-right font-black text-[#0F172A]">Rp {inv.amount.toLocaleString('id-ID')}</td>
                      <td className="px-5 py-4 sm:px-8 sm:py-5 text-right relative">
                        <button onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)} className="p-1.5 sm:p-2 text-slate-300 hover:text-slate-600 transition-colors"><MoreVertical size={16}/></button>
                        {activeMenuId === inv.id && (
                          <div className="absolute right-8 top-10 w-32 bg-white border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                            <button onClick={() => { setInvoiceForm({ id: inv.id, noNota: inv.noNota, supplier: inv.supplier, dueDate: inv.dueDate || getLocalDateString(), status: inv.status }); setInvoiceItems(inv.items); setIsInvoiceModalOpen(true); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-[9px] sm:text-[10px] font-black text-[#0F172A] hover:bg-slate-50"><Edit3 size={12} className="text-[#0047AB]"/> EDIT</button>
                            <button onClick={async () => { if(confirm("Hapus nota? Stok akan dikurangi.")) { await paymentService.deleteInvoice(inv); setActiveMenuId(null); } }} className="w-full flex items-center gap-2.5 px-4 py-3 text-[9px] sm:text-[10px] font-black text-red-500 hover:bg-red-50"><Trash2 size={12}/> HAPUS</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredInvoices.length === 0 && <div className="py-20 text-center text-slate-300"><p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Tagihan Supplier</p></div>}
          </div>
        </div>
      )}

      {activeTab === "opex" && (
        <div className="px-4 sm:px-10 mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div><p className="text-[10px] font-black text-orange-400 uppercase mb-2">Total Biaya Operasional</p><h3 className="text-2xl font-black text-[#0F172A] truncate">Rp {totalOpex.toLocaleString('id-ID')}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
               <p className="text-[8px] font-black text-slate-400 uppercase mb-3 border-b pb-2">Distribusi Pembayar</p>
               <div className="space-y-2 max-h-[80px] overflow-y-auto no-scrollbar">
                {Object.entries(payerStats).map(([payer, amount]) => (
                  <div key={payer} className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span className="truncate mr-2">{payer}</span><span className="text-[#0F172A] shrink-0 font-black">Rp {(amount as number).toLocaleString('id-ID')}</span></div>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button onClick={() => { setExpenseForm({ id: null, category: '', description: '', amount: '', paidBy: '', date: getLocalDateString() }); setIsExpenseModalOpen(true); }} className="w-full h-full min-h-[100px] flex flex-col items-center justify-center gap-2 bg-orange-500 text-white rounded-[24px] sm:rounded-[32px] font-black text-xs uppercase shadow-md shadow-orange-100 hover:scale-[1.02] transition-all">
                <TrendingDown size={24} /> <span>Input Biaya Operasional</span>
              </button>
            </div>
          </div>
          <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm p-6 sm:p-8 min-h-[350px]">
             <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#94A3B8] mb-6 sm:mb-8 flex items-center gap-2">Daftar Riwayat Pengeluaran</h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
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
                  <div key={exp.id} className="flex justify-between items-center p-4 sm:p-5 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 group transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl text-orange-500 shadow-sm shrink-0"><Receipt size={18}/></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1"><p className="text-sm sm:text-base font-black text-[#0F172A] leading-tight truncate">{exp.category}</p><span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[8px] font-black text-slate-400 uppercase tracking-tighter shrink-0">{exp.paidBy || 'KEVIN'}</span>{displayDate && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">• {displayDate}</span>}</div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">{exp.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 ml-4">
                      <p className="text-base sm:text-lg font-black text-[#0F172A]">-Rp {exp.amount.toLocaleString('id-ID')}</p>
                      <div className="flex items-center mt-2 gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setExpenseForm({ id: exp.id, category: exp.category, description: exp.description, amount: exp.amount.toString(), paidBy: exp.paidBy || '', date: exp.date || getLocalDateString() }); setIsExpenseModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0047AB] flex items-center gap-1.5"><Pencil size={14}/> <span className="text-[9px] font-black uppercase hidden sm:block">Edit</span></button>
                        <button onClick={async () => { if(confirm("Hapus catatan opex ini?")) await paymentService.deleteDocument("expenses", exp.id); }} className="p-1.5 text-slate-400 hover:text-red-500 flex items-center gap-1.5"><Trash2 size={14}/> <span className="text-[9px] font-black uppercase hidden sm:block">Hapus</span></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredExpenses.length === 0 && <div className="py-20 text-center text-slate-300"><p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Pengeluaran</p></div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "tarik" && (
        <div className="px-4 sm:px-10 mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div><p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Total Saldo Ditarik</p><h3 className="text-2xl font-black text-[#0F172A] truncate">Rp {totalWithdrawal.toLocaleString('id-ID')}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
               <p className="text-[8px] font-black text-slate-400 uppercase mb-3 border-b pb-2">Rincian per Marketplace</p>
               <div className="space-y-2 max-h-[80px] overflow-y-auto no-scrollbar">
                {Object.keys(platformStats).map(p => (
                  <div key={p} className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span className="truncate mr-2">{p}</span><span className="text-[#0047AB] shrink-0 font-black">Rp {platformStats[p].toLocaleString('id-ID')}</span></div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setWithdrawForm({ id: null, platform: 'Shopee', amount: '', date: getLocalDateString() }); setIsWithdrawModalOpen(true); }} className="w-full flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-[16px] sm:rounded-[20px] font-black text-xs uppercase shadow-md shadow-emerald-100 hover:scale-[1.02] transition-all"><Wallet size={18} /> <span>Tarik Saldo Baru</span></button>
              <button onClick={() => setIsHistoryModalOpen(true)} className="w-full flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-[16px] sm:rounded-[20px] font-black text-xs uppercase hover:bg-slate-50 transition-all"><History size={18} /> <span>Lihat Riwayat Lengkap</span></button>
            </div>
          </div>
          <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[350px]">
            <Landmark size={56} className="mb-4 text-emerald-100" />
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-300">Gunakan tombol "Riwayat Lengkap" di atas untuk melihat detail penarikan.</p>
          </div>
        </div>
      )}

      {activeTab === "supplier" && (
        <div className="px-4 sm:px-10 mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm h-fit">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-3 bg-blue-50 text-[#0047AB] rounded-2xl"><Truck size={20}/></div>
                <div>
                  <h3 className="font-black text-[#0F172A] tracking-tight">Tambah Supplier</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Basis Data & Kode Nota</p>
                </div>
              </div>
              <form onSubmit={handleAddSupplier} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nama Lengkap Toko</label>
                  <input required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] rounded-2xl py-3 px-4 font-black text-[#0F172A] text-sm mt-1 outline-none transition-all" placeholder="Contoh: PT Sumber Makmur"/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Kode Singkat (Prefix)</label>
                  <input required value={newSupplier.code} onChange={e => setNewSupplier({...newSupplier, code: e.target.value})} className="w-full bg-slate-50 border border-slate-100 focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] rounded-2xl py-3 px-4 font-black text-[#0047AB] text-sm mt-1 outline-none transition-all uppercase" placeholder="Contoh: SMKMUR"/>
                  <p className="text-[8px] font-bold text-slate-400 mt-2 px-2">Akan digunakan sebagai awalan otomatis di nomor nota. (Contoh: SMKMUR-2026...)</p>
                </div>
                <button type="submit" disabled={isSavingSupplier} className="w-full mt-4 bg-[#0F172A] text-white py-4 rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                  <Save size={16}/> SIMPAN SUPPLIER
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[350px]">
              <div className="p-6 border-b border-slate-50">
                <h3 className="text-sm font-black text-[#0F172A] tracking-tight">Daftar Mitra Terdaftar ({suppliers.length})</h3>
              </div>
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-[#F8F9FB] text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Nama Supplier</th>
                      <th className="px-6 py-4">Kode Prefix</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-6 py-4 text-xs sm:text-sm font-black text-[#0F172A] uppercase">{sup.name}</td>
                        <td className="px-6 py-4"><span className="bg-blue-50 text-[#0047AB] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">{sup.code}</span></td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDeleteSupplier(sup.id, sup.name)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {suppliers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-20 text-center">
                          <Truck size={32} className="mx-auto mb-3 text-slate-200" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Belum ada data supplier</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} form={withdrawForm} setForm={setWithdrawForm} onSubmit={handleWithdrawSubmit} />
      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} form={expenseForm} setForm={setExpenseForm} onSubmit={handleExpenseSubmit} />
      
      <InvoiceModal 
        isOpen={isInvoiceModalOpen} 
        onClose={resetInvoice} 
        form={invoiceForm} 
        setForm={setInvoiceForm} 
        items={invoiceItems} 
        setItems={setInvoiceItems} 
        products={products} 
        suppliers={suppliers}
        onSubmit={handleInvoiceSubmit} 
      />
      
      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        withdrawals={withdrawals} 
        onDelete={async (id: string) => { if(confirm("Hapus penarikan ini?")) await paymentService.deleteDocument("withdrawals", id); }} 
        onEdit={(w: any) => { 
          if (w.editCount >= 1) return alert("Hanya dapat diedit 1 kali."); 
          setWithdrawForm({ 
            id: w.id, 
            date: w.date || (w.createdAt?.toDate ? w.createdAt.toDate().toISOString().split('T')[0] : getLocalDateString()),
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