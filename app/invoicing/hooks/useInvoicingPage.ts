// app/invoicing/hooks/useInvoicingPage.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, onSnapshot, doc, deleteDoc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { CustomerInvoice, CustomerInvoiceItem } from "../services/CustomerInvoicePdfService";

export function useInvoicingPage(currentUser: any) {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("SEMUA"); // SEMUA, HARI INI, BULAN INI

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");

  const getLocalDateString = useCallback(() => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  }, []);

  const initialFormState = useMemo(() => ({
    id: "",
    invoiceNumber: "",
    recipient: "",
    date: getLocalDateString(),
    dueDate: getLocalDateString(),
    discount: 0,
    tax: 0,
    notes: "",
    bankInfo: "Bank Central Asia (BCA)\nNo. Rekening: 8830928172\na.n. Simple and Yours",
    logoBase64: "", // Kustom Base64
    sellerName: "Simple and Yours",
    sellerAddress: "Tangerang, Banten, Indonesia",
    sellerContact: "Email: sny.osho@gmail.com",
    themeColor: "#0047AB" // Default Cobalt Blue
  }), [getLocalDateString]);

  const [form, setForm] = useState(initialFormState);
  const [formItems, setFormItems] = useState<CustomerInvoiceItem[]>([
    { sku: "", productName: "", qty: 1, price: 0 }
  ]);

  // Load Invoices & Products Real-time
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);

    // 1. Fetch Customer Invoices
    const unsubInvoices = onSnapshot(
      collection(db, `users/${currentUser.uid}/customer_invoices`),
      (snap) => {
        const list = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            invoiceNumber: data.invoiceNumber || "",
            recipient: data.recipient || "",
            date: data.date || "",
            dueDate: data.dueDate || "",
            items: data.items || [],
            discount: Number(data.discount) || 0,
            tax: Number(data.tax) || 0,
            subtotal: Number(data.subtotal) || 0,
            total: Number(data.total) || 0,
            notes: data.notes || "",
            bankInfo: data.bankInfo || "",
            logoBase64: data.logoBase64 || "",
            sellerName: data.sellerName || "",
            sellerAddress: data.sellerAddress || "",
            sellerContact: data.sellerContact || "",
            themeColor: data.themeColor || "#0047AB"
          } as CustomerInvoice;
        });
        // Sort descending by date, then invoice number
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.invoiceNumber.localeCompare(a.invoiceNumber));
        setInvoices(list);
        setLoading(false);
      },
      (error) => {
        console.error("Gagal memuat invoice pelanggan:", error);
        setLoading(false);
      }
    );

    // 2. Fetch Products for Autocomplete
    const unsubProducts = onSnapshot(
      collection(db, `users/${currentUser.uid}/products`),
      (snap) => {
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        console.error("Gagal memuat katalog produk:", error);
      }
    );

    return () => {
      unsubInvoices();
      unsubProducts();
    };
  }, [currentUser?.uid]);

  // Generate unique invoice number
  const generateInvoiceNumber = useCallback(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}${mm}${dd}`;
    
    // Count invoices made today
    const todayInvoices = invoices.filter(inv => inv.invoiceNumber.startsWith(`INV-${dateStr}-`));
    const runningNum = String(todayInvoices.length + 1).padStart(3, "0");
    return `INV-${dateStr}-${runningNum}`;
  }, [invoices]);

  // Handle Open Create Modal
  const openCreateModal = useCallback(() => {
    setModalMode("ADD");
    setForm({
      ...initialFormState,
      invoiceNumber: generateInvoiceNumber()
    });
    setFormItems([{ sku: "", productName: "", qty: 1, price: 0 }]);
    setIsModalOpen(true);
  }, [generateInvoiceNumber, initialFormState]);

  // Handle Open Edit Modal
  const openEditModal = useCallback((invoice: CustomerInvoice) => {
    setModalMode("EDIT");
    setForm({
      id: invoice.id || "",
      invoiceNumber: invoice.invoiceNumber,
      recipient: invoice.recipient,
      date: invoice.date,
      dueDate: invoice.dueDate,
      discount: invoice.discount,
      tax: invoice.tax,
      notes: invoice.notes || "",
      bankInfo: invoice.bankInfo || "",
      logoBase64: invoice.logoBase64 || "",
      sellerName: invoice.sellerName || "Simple and Yours",
      sellerAddress: invoice.sellerAddress || "Tangerang, Banten, Indonesia",
      sellerContact: invoice.sellerContact || "Email: sny.osho@gmail.com",
      themeColor: invoice.themeColor || "#0047AB"
    });
    setFormItems(invoice.items && invoice.items.length > 0 ? [...invoice.items] : [{ sku: "", productName: "", qty: 1, price: 0 }]);
    setIsModalOpen(true);
  }, []);

  // Form Calculations
  const calculatedValues = useMemo(() => {
    const subtotal = formItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
    const discounted = Math.max(0, subtotal - Number(form.discount));
    const taxAmount = discounted * (Number(form.tax) / 100);
    const total = discounted + taxAmount;
    return { subtotal, total };
  }, [formItems, form.discount, form.tax]);

  // Save/Update Invoice in Firestore
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return alert("Sesi pengguna tidak valid.");
    if (!form.recipient.trim()) return alert("Nama pelanggan wajib diisi.");
    if (formItems.some(item => !item.productName.trim() || item.qty <= 0 || item.price < 0)) {
      return alert("Harap isi detail produk dengan benar (Kuantitas > 0 & Harga >= 0).");
    }

    const docData = {
      invoiceNumber: form.invoiceNumber,
      recipient: form.recipient.trim(),
      date: form.date,
      dueDate: form.dueDate,
      items: formItems.map(item => ({
        sku: item.sku.trim().toUpperCase(),
        productName: item.productName.trim(),
        qty: Number(item.qty),
        price: Number(item.price)
      })),
      discount: Number(form.discount) || 0,
      tax: Number(form.tax) || 0,
      subtotal: calculatedValues.subtotal,
      total: calculatedValues.total,
      notes: form.notes.trim(),
      bankInfo: form.bankInfo.trim(),
      logoBase64: form.logoBase64,
      sellerName: form.sellerName.trim(),
      sellerAddress: form.sellerAddress.trim(),
      sellerContact: form.sellerContact.trim(),
      themeColor: form.themeColor,
      updatedAt: serverTimestamp()
    };

    try {
      if (modalMode === "ADD") {
        await addDoc(collection(db, `users/${currentUser.uid}/customer_invoices`), {
          ...docData,
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, `users/${currentUser.uid}/customer_invoices`, form.id), docData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Gagal menyimpan invoice:", error);
      alert("Terjadi kesalahan saat menyimpan invoice.");
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (!currentUser?.uid) return;
    if (confirm(`Apakah Anda yakin ingin menghapus invoice #${invoiceNumber}?`)) {
      try {
        await deleteDoc(doc(db, `users/${currentUser.uid}/customer_invoices`, id));
      } catch (error) {
        console.error("Gagal menghapus invoice:", error);
        alert("Gagal menghapus invoice.");
      }
    }
  };

  // Filtered Invoices for Rendering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Search Query (invoice number or client name)
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.recipient.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Time Filter
      let matchesTime = true;
      const invDate = new Date(inv.date);
      const today = new Date();

      if (timeFilter === "HARI INI") {
        matchesTime = invDate.toDateString() === today.toDateString();
      } else if (timeFilter === "BULAN INI") {
        matchesTime = invDate.getMonth() === today.getMonth() && invDate.getFullYear() === today.getFullYear();
      }

      return matchesSearch && matchesTime;
    });
  }, [invoices, searchQuery, timeFilter]);

  // Overall Statistics
  const statistics = useMemo(() => {
    let totalInvoiced = 0;
    let totalInvoicesCount = invoices.length;

    invoices.forEach((inv) => {
      totalInvoiced += inv.total;
    });

    const averageInvoiceValue = totalInvoicesCount > 0 ? totalInvoiced / totalInvoicesCount : 0;

    return {
      totalInvoiced,
      totalInvoicesCount,
      averageInvoiceValue
    };
  }, [invoices]);

  return {
    invoices: filteredInvoices,
    products,
    loading,
    searchQuery,
    setSearchQuery,
    timeFilter,
    setTimeFilter,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    openCreateModal,
    openEditModal,
    form,
    setForm,
    formItems,
    setFormItems,
    calculatedValues,
    handleSaveInvoice,
    handleDeleteInvoice,
    statistics
  };
}
