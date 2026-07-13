// app/invoicing/hooks/useInvoicingPage.ts
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, onSnapshot, doc, deleteDoc, addDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { CustomerInvoice, CustomerInvoiceItem } from "../services/CustomerInvoicePdfService";

export function useInvoicingPage(currentUser: any) {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
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
    recipientAddress: "", // Alamat pelanggan kustom
    recipientPhone: "", // No telp penerima kustom
    date: getLocalDateString(),
    dueDate: getLocalDateString(),
    discount: 0,
    tax: 0,
    notes: "",
    bankInfo: "Bank Central Asia (BCA)\nNo. Rekening: 8830928172\na.n. Simple and Yours",
    logoBase64: "", // Kustom Base64 logo
    sellerName: "Simple and Yours",
    sellerAddress: "Tangerang, Banten, Indonesia",
    sellerContact: "Email: sny.osho@gmail.com",
    sellerPhone: "", // No telp pengirim kustom
    themeColor: "#0047AB", // Default Cobalt Blue
    sellerPic: "", // Penanggung Jawab default
    signatureBase64: "" // Tanda tangan default
  }), [getLocalDateString]);

  const [form, setForm] = useState(initialFormState);
  const [formItems, setFormItems] = useState<CustomerInvoiceItem[]>([
    { sku: "", productName: "", qty: 1, price: 0 }
  ]);

  // Load Invoices, Products, & Seller Settings Real-time
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
            recipientAddress: data.recipientAddress || "",
            recipientPhone: data.recipientPhone || "",
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
            sellerPhone: data.sellerPhone || "",
            themeColor: data.themeColor || "#0047AB",
            sellerPic: data.sellerPic || "",
            signatureBase64: data.signatureBase64 || ""
          } as CustomerInvoice;
        });
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

    // 3. Fetch Seller Settings Document
    const unsubSellerSettings = onSnapshot(
      doc(db, `users/${currentUser.uid}/settings`, "seller_profile"),
      (docSnap) => {
        if (docSnap.exists()) {
          setSellerProfile(docSnap.data());
        }
      },
      (error) => {
        console.error("Gagal memuat profil default penjual:", error);
      }
    );

    return () => {
      unsubInvoices();
      unsubProducts();
      unsubSellerSettings();
    };
  }, [currentUser?.uid]);

  // Generate unique invoice number: INV-YYYYMMDD-random (e.g. INV-20260713-398271)
  const generateInvoiceNumber = useCallback(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}${mm}${dd}`;
    
    // Generate 6-digit random code
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    
    return `INV-${dateStr}-${randomPart}`;
  }, []);

  // Handle Open Create Modal
  const openCreateModal = useCallback(() => {
    setModalMode("ADD");
    setForm({
      ...initialFormState,
      invoiceNumber: generateInvoiceNumber(),
      sellerName: sellerProfile?.sellerName || "Simple and Yours",
      sellerAddress: sellerProfile?.sellerAddress || "Tangerang, Banten, Indonesia",
      sellerContact: sellerProfile?.sellerContact || "Email: sny.osho@gmail.com",
      sellerPhone: sellerProfile?.sellerPhone || "",
      logoBase64: sellerProfile?.logoBase64 || "",
      themeColor: sellerProfile?.themeColor || "#0047AB",
      bankInfo: sellerProfile?.bankInfo || "Bank Central Asia (BCA)\nNo. Rekening: 8830928172\na.n. Simple and Yours",
      notes: sellerProfile?.notes || "",
      tax: typeof sellerProfile?.tax === 'number' ? sellerProfile.tax : 0,
      sellerPic: sellerProfile?.sellerPic || "",
      signatureBase64: sellerProfile?.signatureBase64 || ""
    });
    setFormItems([{ sku: "", productName: "", qty: 1, price: 0, commission: 0, supplier: "" }]);
    setIsModalOpen(true);
  }, [generateInvoiceNumber, initialFormState, sellerProfile]);

  // Handle Open Edit Modal
  const openEditModal = useCallback((invoice: CustomerInvoice) => {
    setModalMode("EDIT");
    setForm({
      id: invoice.id || "",
      invoiceNumber: invoice.invoiceNumber,
      recipient: invoice.recipient,
      recipientAddress: invoice.recipientAddress || "",
      recipientPhone: invoice.recipientPhone || "",
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
      sellerPhone: invoice.sellerPhone || "",
      themeColor: invoice.themeColor || "#0047AB",
      sellerPic: invoice.sellerPic || "",
      signatureBase64: invoice.signatureBase64 || ""
    });
    setFormItems(
      invoice.items && invoice.items.length > 0
        ? invoice.items.map((it: any) => ({
            sku: it.sku || "",
            productName: it.productName || "",
            qty: Number(it.qty) || 0,
            price: Number(it.price) || 0,
            commission: Number(it.commission) || 0,
            supplier: it.supplier || ""
          }))
        : [{ sku: "", productName: "", qty: 1, price: 0, commission: 0, supplier: "" }]
    );
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

  // Save/Update Invoice in Firestore (Safeguarded against undefined values)
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return alert("Sesi pengguna tidak valid.");
    if (!(form.recipient || "").trim()) return alert("Nama pelanggan wajib diisi.");
    if (formItems.some(item => !(item.productName || "").trim() || item.qty <= 0 || item.price < 0)) {
      return alert("Harap isi detail produk dengan benar (Kuantitas > 0 & Harga >= 0).");
    }

    // Hitung HPP dan Profit
    const totalHpp = formItems.reduce((sum, item) => {
      const prod = products.find(
        p => p.sku?.toUpperCase() === item.sku?.toUpperCase() || p.name?.toLowerCase() === item.productName?.toLowerCase()
      );
      const cost = prod ? (Number(prod.costPrice || prod.capitalPrice) || 0) : 0;
      return sum + (cost * item.qty);
    }, 0);

    const revenue = Math.max(0, calculatedValues.subtotal - Number(form.discount));
    const profit = Math.max(0, revenue - totalHpp);

    // Hitung total komisi khusus Suparta
    const isSuparta = currentUser?.email === "suparta.technica@gmail.com";
    const totalCommission = isSuparta
      ? formItems.reduce((sum, item) => sum + ((Number(item.commission) || 0) * item.qty), 0)
      : 0;

    const docData = {
      invoiceNumber: form.invoiceNumber || "",
      recipient: (form.recipient || "").trim(),
      recipientAddress: (form.recipientAddress || "").trim(),
      recipientPhone: (form.recipientPhone || "").trim(),
      date: form.date || "",
      dueDate: form.dueDate || "",
      items: formItems.map(item => ({
        sku: (item.sku || "").trim().toUpperCase(),
        productName: (item.productName || "").trim(),
        qty: Number(item.qty) || 0,
        price: Number(item.price) || 0,
        commission: isSuparta ? (Number(item.commission) || 0) : 0,
        supplier: isSuparta ? (item.supplier || "").trim() : ""
      })),
      discount: Number(form.discount) || 0,
      tax: Number(form.tax) || 0,
      subtotal: Number(calculatedValues.subtotal) || 0,
      total: Number(calculatedValues.total) || 0,
      hpp: totalHpp,
      profit: profit,
      totalCommission: totalCommission,
      notes: (form.notes || "").trim(),
      bankInfo: (form.bankInfo || "").trim(),
      logoBase64: form.logoBase64 || "",
      sellerName: (form.sellerName || "").trim(),
      sellerAddress: (form.sellerAddress || "").trim(),
      sellerContact: (form.sellerContact || "").trim(),
      sellerPhone: (form.sellerPhone || "").trim(),
      themeColor: form.themeColor || "#0047AB",
      sellerPic: (form.sellerPic || "").trim(),
      signatureBase64: form.signatureBase64 || "",
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

      // 🚀 AUTOSAVE DEFAULT SELLER PROFILE (Kecuali items & data pembeli)
      const profileRef = doc(db, `users/${currentUser.uid}/settings`, "seller_profile");
      await setDoc(profileRef, {
        sellerName: docData.sellerName,
        sellerAddress: docData.sellerAddress,
        sellerContact: docData.sellerContact,
        sellerPhone: docData.sellerPhone,
        logoBase64: docData.logoBase64,
        themeColor: docData.themeColor,
        bankInfo: docData.bankInfo,
        notes: docData.notes,
        tax: docData.tax,
        sellerPic: docData.sellerPic,
        signatureBase64: docData.signatureBase64,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Gagal menyimpan invoice:", error);
      alert(`Terjadi kesalahan saat menyimpan invoice: ${error.message || error}`);
    }
  };

  // Save Seller Profile to Settings separately
  const handleSaveSellerProfile = async () => {
    if (!currentUser?.uid) return alert("Sesi pengguna tidak valid.");
    try {
      const docRef = doc(db, `users/${currentUser.uid}/settings`, "seller_profile");
      await setDoc(docRef, {
        sellerName: (form.sellerName || "").trim(),
        sellerAddress: (form.sellerAddress || "").trim(),
        sellerContact: (form.sellerContact || "").trim(),
        sellerPhone: (form.sellerPhone || "").trim(),
        logoBase64: form.logoBase64 || "",
        themeColor: form.themeColor || "#0047AB",
        bankInfo: (form.bankInfo || "").trim(),
        notes: (form.notes || "").trim(),
        tax: Number(form.tax) || 0,
        sellerPic: (form.sellerPic || "").trim(),
        signatureBase64: form.signatureBase64 || "",
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("✅ Profil penjual default berhasil diperbarui!");
    } catch (error) {
      console.error("Gagal menyimpan profil penjual:", error);
      alert("❌ Gagal menyimpan profil penjual.");
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
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.recipient.toLowerCase().includes(searchQuery.toLowerCase());

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
    handleSaveSellerProfile,
    handleDeleteInvoice,
    statistics
  };
}
