// app/pembayaran/hooks/usePaymentPage.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { PaymentService } from "../services/PaymentService";
import { SupplierInvoice, OperationalExpense, BalanceWithdrawal, SupplierMitra } from "../types/payment";

export function usePaymentPage(currentUser: any, usePaymentDataHook: any) {
  const [timeFilter, setTimeFilter] = useState("Hari Ini"); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<"nota" | "opex" | "tarik" | "supplier">("nota");

  const { withdrawals, invoices, expenses, products } = usePaymentDataHook(currentUser, selectedMonth, selectedYear);
  const paymentService = useMemo(() => new PaymentService(currentUser, products), [currentUser, products]);

  const [suppliers, setSuppliers] = useState<SupplierMitra[]>([]);
  const [newSupplier, setNewSupplier] = useState({ name: '', code: '' });
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getLocalDateString = useCallback(() => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  }, []);

  const [withdrawForm, setWithdrawForm] = useState<any>({ 
    id: null, platform: 'Shopee', amount: '', date: getLocalDateString()
  });
  
  const [expenseForm, setExpenseForm] = useState<any>({ 
    id: null, category: '', description: '', amount: '', paidBy: '', date: getLocalDateString()
  });
  
  const [invoiceForm, setInvoiceForm] = useState<any>({ 
    id: null, noNota: '', supplier: '', dueDate: getLocalDateString(), status: 'BELUM BAYAR' 
  });
  const [invoiceItems, setInvoiceItems] = useState<any[]>([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]);

  // Ambil Data Supplier Realtime (Ringan, Hanya Berisi Metadata Nama & Kode)
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(collection(db, `users/${currentUser.uid}/suppliers`), (snap) => {
      setSuppliers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SupplierMitra));
    });
    return () => unsub();
  }, [currentUser?.uid]);

  // Ekstrak tanggal dari noNota (Format: PREFIX-YYYYMMDD-XXX)
  const getInvoiceDate = useCallback((inv: SupplierInvoice) => {
    const match = inv.noNota?.match(/-(\d{4})(\d{2})(\d{2})-/);
    if (match) {
      const yyyy = parseInt(match[1]);
      const mm = parseInt(match[2]) - 1; 
      const dd = parseInt(match[3]);
      return new Date(yyyy, mm, dd);
    }
    if (inv.createdAt) {
      return inv.createdAt.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
    }
    return new Date();
  }, []);

  // Filter & Sorting Nota Melebar Penuh (Descending)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: SupplierInvoice) => {
      const invDate = getInvoiceDate(inv);
      const now = new Date();
      const todayStr = now.toDateString();
      const invStr = invDate.toDateString();
      const diffInDays = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));

      if (timeFilter === "Hari Ini") return invStr === todayStr;
      if (timeFilter === "3 Hari") return diffInDays >= 0 && diffInDays <= 3;
      if (timeFilter === "Bulan") return invDate.getMonth() === selectedMonth && invDate.getFullYear() === selectedYear;
      return true;
    }).sort((a: SupplierInvoice, b: SupplierInvoice) => getInvoiceDate(b).getTime() - getInvoiceDate(a).getTime());
  }, [invoices, timeFilter, selectedMonth, selectedYear, getInvoiceDate]);

  const filteredWithdrawals = useMemo(() => paymentService.filterByTime(withdrawals, timeFilter, selectedMonth, selectedYear), [paymentService, withdrawals, timeFilter, selectedMonth, selectedYear]);
  const filteredExpenses = useMemo(() => paymentService.filterByTime(expenses, timeFilter, selectedMonth, selectedYear), [paymentService, expenses, timeFilter, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    return paymentService.calculateStats(filteredWithdrawals, filteredInvoices, filteredExpenses);
  }, [paymentService, filteredWithdrawals, filteredInvoices, filteredExpenses]);

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
      alert("✅ Supplier berhasil ditambahkan!");
    } catch (err) {
      alert("❌ Gagal menambahkan supplier.");
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus supplier ${name}?`)) {
      await deleteDoc(doc(db, `users/${currentUser?.uid}/suppliers`, id));
    }
  };

  const adjustFilterToTargetDate = useCallback((targetDateString: string) => {
    if (!targetDateString) return;
    const targetDate = new Date(targetDateString);
    if (!isNaN(targetDate.getTime())) {
      setTimeFilter("Bulan");
      setSelectedMonth(targetDate.getMonth());
      setSelectedYear(targetDate.getFullYear());
    }
  }, []);

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

  const resetInvoice = useCallback(() => { 
    setIsInvoiceModalOpen(false); 
    setInvoiceForm({ id: null, noNota: '', supplier: '', dueDate: getLocalDateString(), status: 'BELUM BAYAR' }); 
    setInvoiceItems([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]); 
  }, [getLocalDateString]);

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentService.saveInvoice(invoiceForm, invoiceItems, invoices);
      adjustFilterToTargetDate(invoiceForm.dueDate);
      resetInvoice(); 
    } catch (err: any) { alert(err.message); }
  };

  return {
    timeFilter, setTimeFilter, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
    activeTab, setActiveTab, suppliers, newSupplier, setNewSupplier, isSavingSupplier,
    isWithdrawModalOpen, setIsWithdrawModalOpen, isHistoryModalOpen, setIsHistoryModalOpen,
    isInvoiceModalOpen, setIsInvoiceModalOpen, isExpenseModalOpen, setIsExpenseModalOpen,
    activeMenuId, setActiveMenuId, withdrawForm, setWithdrawForm, expenseForm, setExpenseForm,
    invoiceForm, setInvoiceForm, invoiceItems, setInvoiceItems, filteredInvoices,
    filteredWithdrawals, filteredExpenses, stats, products, paymentService, getLocalDateString,
    handleAddSupplier, handleDeleteSupplier, handleWithdrawSubmit, handleExpenseSubmit, handleInvoiceSubmit, resetInvoice, withdrawals
  };
}