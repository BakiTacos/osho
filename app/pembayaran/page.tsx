"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  collection, onSnapshot, query, addDoc, 
  serverTimestamp, orderBy, doc, updateDoc, increment, deleteDoc
} from "firebase/firestore";
import { 
  Search, Bell, HelpCircle, PlusCircle, Wallet, 
  Filter, FileText, MoreVertical, Landmark, Trash2, 
  Plus, History, Edit3, X, CheckCircle2, AlertCircle, 
  Pencil, Calendar, Receipt, TrendingDown, ChevronRight,
  Banknote, CreditCard
} from "lucide-react";

export default function PembayaranPage() {
  const { currentUser } = useAuth();
  
  // Data States
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Filter States
  const [timeFilter, setTimeFilter] = useState("Hari Ini"); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal & UI States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form States
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editWithdrawId, setEditWithdrawId] = useState<string | null>(null);
  
  const [withdrawForm, setWithdrawForm] = useState({ platform: 'Shopee', amount: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Listrik/Air', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [invoiceForm, setInvoiceForm] = useState({ noNota: '', supplier: '', dueDate: '', status: 'BELUM BAYAR' });
  const [invoiceItems, setInvoiceItems] = useState([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]);

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = [2024, 2025, 2026];

  useEffect(() => {
    if (!currentUser) return;

    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubWithdraw = onSnapshot(query(collection(db, `users/${currentUser.uid}/withdrawals`), orderBy("createdAt", "desc")), (snap) => {
      setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInvoices = onSnapshot(query(collection(db, `users/${currentUser.uid}/supplier_invoices`), orderBy("createdAt", "desc")), (snap) => {
      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubExpenses = onSnapshot(query(collection(db, `users/${currentUser.uid}/expenses`), orderBy("createdAt", "desc")), (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    

    return () => { unsubProd(); unsubWithdraw(); unsubInvoices(); unsubExpenses(); };
  }, [currentUser]);

  // --- LOGIKA FILTER WAKTU ---
  const filterByTime = (data: any[]) => {
    const now = new Date();
    return data.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = item.createdAt.toDate();
      const diffInMs = now.getTime() - itemDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (timeFilter === "Hari Ini") return itemDate.toDateString() === now.toDateString();
      if (timeFilter === "3 Hari") return diffInDays <= 3;
      if (timeFilter === "Bulan") return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
      return true;
    });
  };

  const filteredInvoices = filterByTime(invoices);
  const filteredWithdrawals = filterByTime(withdrawals);
  const filteredExpenses = filterByTime(expenses);

  // --- KALKULASI STATISTIK ---
  const platformStats: Record<string, number> = filteredWithdrawals.reduce((acc: any, curr) => {
    acc[curr.platform] = (acc[curr.platform] || 0) + curr.amount;
    return acc;
  }, {});

  const totalWithdrawal = (Object.values(platformStats) as number[]).reduce((a, b) => a + b, 0);
  const totalPaidInvoices = filteredInvoices.filter(inv => inv.status === 'TERBAYAR').reduce((acc, curr) => acc + curr.amount, 0);
  const totalUnpaidInvoices = filteredInvoices.filter(inv => inv.status === 'BELUM BAYAR').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOpex = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // --- HANDLERS ---
  const handleSaveWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(withdrawForm.amount) <= 0) return alert("Jumlah harus > 0");
    if (editWithdrawId) {
      const target = withdrawals.find(w => w.id === editWithdrawId);
      if (target?.editCount >= 1) return alert("Maksimal 1x ubah!");
      await updateDoc(doc(db, `users/${currentUser?.uid}/withdrawals`, editWithdrawId), {
        platform: withdrawForm.platform, amount: Number(withdrawForm.amount), editCount: increment(1)
      });
    } else {
      await addDoc(collection(db, `users/${currentUser?.uid}/withdrawals`), {
        ...withdrawForm, amount: Number(withdrawForm.amount), status: 'Berhasil', editCount: 0, createdAt: serverTimestamp()
      });
    }
    setIsWithdrawModalOpen(false);
    setEditWithdrawId(null);
    setWithdrawForm({ platform: 'Shopee', amount: '' });
  };

  const openEditWithdraw = (w: any) => {
    if (w.editCount >= 1) return alert("Sudah pernah diubah.");
    setEditWithdrawId(w.id);
    setWithdrawForm({ platform: w.platform, amount: w.amount.toString() });
    setIsWithdrawModalOpen(true);
    setIsHistoryModalOpen(false);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasInvalid = invoiceItems.some(i => Number(i.qty) <= 0 || Number(i.price) <= 0);
    if (hasInvalid) return alert("Qty/Harga harus > 0");

    const total = invoiceItems.reduce((a, b) => a + (b.qty * b.price), 0);
    if (editingInvoiceId) {
      await updateDoc(doc(db, `users/${currentUser?.uid}/supplier_invoices`, editingInvoiceId), { ...invoiceForm, items: invoiceItems, amount: total });
    } else {
      await addDoc(collection(db, `users/${currentUser?.uid}/supplier_invoices`), { ...invoiceForm, items: invoiceItems, amount: total, createdAt: serverTimestamp() });
      for (const item of invoiceItems) {
        const matched = products.find(p => p.sku === item.sku.toUpperCase());
        if (matched) {
          const qtyToInc = item.unit === 'lusin' ? Number(item.qty) * 12 : Number(item.qty);
          await updateDoc(doc(db, `users/${currentUser?.uid}/products`, matched.id), { stock: increment(qtyToInc) });
        }
      }
    }
    resetInvoiceForm();
  };

  const handleDeleteInvoice = async (inv: any) => {
    if (!confirm("Hapus nota? Stok akan ditarik kembali.")) return;
    for (const item of inv.items) {
      const matched = products.find(p => p.sku === item.sku.toUpperCase());
      if (matched) {
        const qtyToDec = item.unit === 'lusin' ? Number(item.qty) * 12 : Number(item.qty);
        await updateDoc(doc(db, `users/${currentUser?.uid}/products`, matched.id), { stock: increment(-qtyToDec) });
      }
    }
    await deleteDoc(doc(db, `users/${currentUser?.uid}/supplier_invoices`, inv.id));
    setActiveMenuId(null);
  };

  const resetInvoiceForm = () => {
    setIsInvoiceModalOpen(false);
    setEditingInvoiceId(null);
    setInvoiceForm({ noNota: '', supplier: '', dueDate: '', status: 'BELUM BAYAR' });
    setInvoiceItems([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(expenseForm.amount) <= 0) return alert("Jumlah harus > 0");
    await addDoc(collection(db, `users/${currentUser?.uid}/expenses`), {
      ...expenseForm, amount: Number(expenseForm.amount), createdAt: serverTimestamp()
    });
    setIsExpenseModalOpen(false);
    setExpenseForm({ category: 'Listrik/Air', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER & FILTER */}
      <div className="px-4 sm:px-10 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-tight">Manajemen Pembayaran</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Pantau Kewajiban & Arus Kas Keluar</p>
        </div>

        <div className="flex flex-wrap items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm gap-1">
          {["Hari Ini", "3 Hari", "Bulan"].map((opt) => (
            <button key={opt} onClick={() => setTimeFilter(opt)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeFilter === opt ? "bg-[#0047AB] text-white shadow-md" : "text-slate-400 hover:text-[#0047AB]"}`}>
              {opt}
            </button>
          ))}
          {timeFilter === "Bulan" && (
            <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-100">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-2 py-2 text-[#0047AB]">
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-2 py-2 text-[#0047AB]">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="px-4 sm:px-10 mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        
        {/* Card 1: Nota Dibayar */}
        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3">Total Nota Dibayar</p>
          <h3 className="text-xl font-black text-emerald-600">Rp {totalPaidInvoices.toLocaleString('id-ID')}</h3>
          <p className="text-[9px] font-bold text-slate-300 mt-2">Arus Kas Keluar Lunas</p>
        </div>

        {/* Card 2: Nota Belum Bayar */}
        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-red-500">
          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3">Nota Belum Bayar</p>
          <h3 className="text-xl font-black text-red-600">Rp {totalUnpaidInvoices.toLocaleString('id-ID')}</h3>
          <p className="text-[9px] font-bold text-slate-300 mt-2">Kewajiban Mendatang</p>
        </div>

        {/* Card 3: Saldo Ditarik */}
        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm relative group">
          <button onClick={() => setIsHistoryModalOpen(true)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-[#0047AB] transition-all"><History size={16} /></button>
          <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">Saldo Ditarik</p>
          <h3 className="text-xl font-black text-[#0F172A]">Rp {totalWithdrawal.toLocaleString('id-ID')}</h3>
          <div className="mt-3 space-y-1">
            {Object.keys(platformStats).map(p => (
              <div key={p} className="flex justify-between text-[9px] font-bold">
                <span className="text-slate-400">{p}</span>
                <span className="text-[#0047AB]">Rp {platformStats[p].toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Opex */}
        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-orange-500">
          <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-3">Biaya Opex</p>
          <h3 className="text-xl font-black text-orange-600">Rp {totalOpex.toLocaleString('id-ID')}</h3>
          <p className="text-[9px] font-bold text-slate-300 mt-2">Operasional Usaha</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-2">
          <button onClick={() => setIsWithdrawModalOpen(true)} className="flex-1 bg-white border-2 border-slate-50 text-[#0047AB] rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase shadow-sm hover:bg-blue-50 transition-all">
            <Wallet size={14} /> Tarik Saldo
          </button>
          <button onClick={() => setIsInvoiceModalOpen(true)} className="flex-1 bg-[#0047AB] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:scale-[1.02] transition-all">
            <PlusCircle size={14} /> Nota Baru
          </button>
          <button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 bg-orange-500 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase shadow-lg shadow-orange-100 hover:scale-[1.02] transition-all">
            <TrendingDown size={14} /> Input Opex
          </button>
        </div>
      </div>

      {/* TABLES SECTION */}
      <div className="px-4 sm:px-10 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Table Invoices */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center text-xs font-black uppercase text-[#94A3B8] tracking-widest">
            Riwayat Tagihan Supplier
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FB] text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Nomor Nota / Supplier</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Tagihan</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all text-sm font-bold">
                    <td className="px-8 py-5">
                      <p className="text-[#0047AB] font-black">#{inv.noNota}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{inv.supplier}</p>
                    </td>
                    <td className="px-6 py-5">
                      <button 
                        onClick={async () => {
                          const next = inv.status === 'TERBAYAR' ? 'BELUM BAYAR' : 'TERBAYAR';
                          await updateDoc(doc(db, `users/${currentUser?.uid}/supplier_invoices`, inv.id), { status: next });
                        }}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${inv.status === 'TERBAYAR' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {inv.status}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right font-black">Rp {inv.amount.toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5 text-right relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)} className="p-2 text-slate-300 hover:text-slate-600"><MoreVertical size={18}/></button>
                      {activeMenuId === inv.id && (
                        <div className="absolute right-10 top-12 w-36 bg-white border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                          <button onClick={() => {
                             setEditingInvoiceId(inv.id);
                             setInvoiceForm({ noNota: inv.noNota, supplier: inv.supplier, dueDate: inv.dueDate || '', status: inv.status });
                             setInvoiceItems(inv.items);
                             setIsInvoiceModalOpen(true);
                             setActiveMenuId(null);
                          }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-slate-600 hover:bg-slate-50"><Edit3 size={14}/> EDIT</button>
                          <button onClick={() => handleDeleteInvoice(inv)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-50"><Trash2 size={14}/> HAPUS</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* List Opex */}
        <div className="bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm p-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#94A3B8] mb-6 flex items-center gap-2">
            <TrendingDown size={14}/> Biaya Opex Periode Ini
          </h4>
          <div className="space-y-3">
            {filteredExpenses.map((exp) => (
              <div key={exp.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm"><Receipt size={16}/></div>
                  <div>
                    <p className="text-[11px] font-black text-[#0F172A] leading-tight">{exp.category}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{exp.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-red-500">-Rp {exp.amount.toLocaleString('id-ID')}</p>
                  <button onClick={async () => { if(confirm("Hapus?")) await deleteDoc(doc(db, `users/${currentUser?.uid}/expenses`, exp.id)); }} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- MODALS (REMAIN THE SAME AS PREVIOUS CODE) --- */}
      {/* Tarik Saldo Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black tracking-tighter">Tarik Saldo</h2>
               <button onClick={() => setIsWithdrawModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X/></button>
            </div>
            <form onSubmit={handleSaveWithdraw} className="space-y-4">
              <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" value={withdrawForm.platform} onChange={e => setWithdrawForm({...withdrawForm, platform: e.target.value})}>
                <option>Shopee</option><option>TikTok Shop</option><option>Lazada</option><option>Offline</option>
              </select>
              <input type="number" required placeholder="Nominal Rp" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" value={withdrawForm.amount} onChange={e => setWithdrawForm({...withdrawForm, amount: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-[#0047AB] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Konfirmasi Penarikan</button>
            </form>
          </div>
        </div>
      )}

      {/* Opex Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black tracking-tighter text-orange-500">Input Opex</h2>
               <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X/></button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                <option>Listrik/Air</option><option>Gaji Karyawan</option><option>Iklan/Ads</option><option>Sewa Tempat</option><option>Packaging</option><option>Lainnya</option>
              </select>
              <input required className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" placeholder="Deskripsi" onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
              <input type="number" required placeholder="Jumlah Rp" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
              <button type="submit" className="w-full mt-4 py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Simpan Pengeluaran</button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative no-scrollbar">
            <h2 className="text-2xl font-black mb-8 tracking-tighter">{editingInvoiceId ? "Edit Nota" : "Tambah Nota & Restock"}</h2>
            <form onSubmit={handleSaveInvoice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required value={invoiceForm.noNota} className="bg-slate-50 rounded-2xl py-4 px-6 font-bold" placeholder="Nomor Nota" onChange={e => setInvoiceForm({...invoiceForm, noNota: e.target.value})} />
                <input required value={invoiceForm.supplier} className="bg-slate-50 rounded-2xl py-4 px-6 font-bold" placeholder="Nama Supplier" onChange={e => setInvoiceForm({...invoiceForm, supplier: e.target.value})} />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h5 className="text-[10px] font-black uppercase text-[#0047AB] tracking-widest">Detail Item Belanja</h5>
                  <button type="button" onClick={() => setInvoiceItems([...invoiceItems, {sku:'', name:'', qty:1, price:0, unit:'lusin'}])} className="flex items-center gap-2 text-[9px] font-black bg-blue-50 text-[#0047AB] px-4 py-2 rounded-xl transition-all"><Plus size={12}/> TAMBAH ITEM</button>
                </div>
                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50/50 p-3 rounded-2xl items-center border border-slate-100">
                    <input required className="col-span-2 bg-white py-2.5 px-4 rounded-xl text-xs font-bold border-none" placeholder="SKU" value={item.sku} onChange={e => {
                      const newItems = [...invoiceItems];
                      newItems[idx].sku = e.target.value;
                      const matched = products.find(p => p.sku === e.target.value.toUpperCase());
                      if(matched) newItems[idx].name = matched.name;
                      setInvoiceItems(newItems);
                    }}/>
                    <input className="col-span-4 bg-transparent py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 border-none" placeholder="Otomatis" value={item.name} readOnly/>
                    <select className="col-span-2 bg-white py-2.5 px-2 rounded-xl text-xs font-black text-[#0047AB] border-none" value={item.unit} onChange={e => { const newItems = [...invoiceItems]; newItems[idx].unit = e.target.value; setInvoiceItems(newItems); }}>
                      <option value="lusin">Lusin (x12)</option><option value="pcs">Pcs</option>
                    </select>
                    <input type="number" required className="col-span-2 bg-white py-2.5 px-4 rounded-xl text-xs font-bold text-center border-none" value={item.qty} onChange={e => { const newItems = [...invoiceItems]; newItems[idx].qty = Number(e.target.value); setInvoiceItems(newItems); }}/>
                    <button type="button" onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== idx))} className="col-span-2 text-red-300 hover:text-red-500 transition-all flex justify-center"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                <div className="text-xl font-black">Rp {invoiceItems.reduce((a,b) => a + (b.qty * b.price), 0).toLocaleString('id-ID')}</div>
                <button type="submit" className="px-8 py-3.5 bg-[#0047AB] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Simpan Nota</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black tracking-tighter">Riwayat Penarikan</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X/></button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
              {withdrawals.map(w => (
                <div key={w.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg text-[#0047AB] shadow-sm"><Landmark size={16}/></div>
                    <div><p className="text-[11px] font-black">{w.platform}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{w.createdAt?.toDate().toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-[#0F172A]">Rp {w.amount.toLocaleString('id-ID')}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEditWithdraw(w)} className="p-1.5 text-slate-400 hover:text-[#0047AB] bg-white rounded-lg shadow-sm"><Pencil size={12}/></button>
                      <button onClick={async () => { if(confirm("Hapus?")) await deleteDoc(doc(db, `users/${currentUser?.uid}/withdrawals`, w.id)); }} className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg shadow-sm"><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}