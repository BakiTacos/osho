"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import React from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import AuthComponent from "../../components/AuthComponent";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// --- UTILS: Format Rupiah ---
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number || 0);
};

// --- INTERFACE ---
interface InvoiceItem {
  description: string;
  qty: number;
  price: number;
  discount: number;
  discountType: 'nominal' | 'percent'; // Tambahan Opsi Tipe Diskon
}

interface InvoiceData {
  companyName: string;
  invoiceNumber: string;
  clientName: string;
  date: string;
  items: InvoiceItem[];
  ppnRate: number;
  notes: string;
  createdAt: Timestamp;
}

interface Invoice extends InvoiceData {
  id: string;
}

export default function InvoicesPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("OSHO DIGITAL");
  const [clientName, setClientName] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", qty: 1, price: 0, discount: 0, discountType: 'nominal' }
  ]);
  const [ppnEnabled, setPpnEnabled] = useState(true);

  const companies = ["OSHO DIGITAL", "SNY_ONLINESHOP", "MAKMUR JAYA", "PARATA"];

  // Membaca History
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, `users/${currentUser.uid}/invoices`), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ ...doc.data() as InvoiceData, id: doc.id })));
    });
  }, [currentUser]);

  // --- LOGIKA KALKULASI ---

  const getItemDiscountValue = (item: InvoiceItem) => {
    if (item.discountType === 'percent') {
      return (item.qty * item.price) * (item.discount / 100);
    }
    return item.discount;
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    return (item.qty * item.price) - getItemDiscountValue(item);
  };

  const calculateSubtotal = (invItems: InvoiceItem[]) => {
    return invItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // --- HANDLERS ---

  const addItem = () => setItems([...items, { description: "", qty: 1, price: 0, discount: 0, discountType: 'nominal' }]);
  
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    if (field === 'description' || field === 'discountType') {
      newItems[index][field] = value;
    } else {
      const numValue = value === "" ? 0 : parseFloat(value);
      newItems[index][field] = isNaN(numValue) ? 0 : numValue;
    }
    setItems(newItems);
  };

  // --- Fungsi untuk mengosongkan form ---
  const resetForm = () => {
    setClientName("");
    setItems([
      { description: "", qty: 1, price: 0, discount: 0, discountType: 'nominal' }
    ]);
    setPpnEnabled(true);
    // Jika ingin reset nama perusahaan juga, aktifkan baris di bawah:
    // setCompanyName("OSHO DIGITAL");
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || clientName.trim() === "") return;

    // 1. Dapatkan tanggal hari ini (YYYY-MM-DD)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const prefix = `INVOICES-${dateStr}`;

    // 2. Hitung jumlah invoice yang sudah ada dengan prefix tanggal yang sama
    const todayInvoicesCount = invoices.filter(inv => 
      inv.invoiceNumber.startsWith(prefix)
    ).length;

    // 3. Buat nomor urut baru (misal: 001, 002)
    const sequence = String(todayInvoicesCount + 1).padStart(3, '0');
    const finalInvoiceNo = `${prefix}${sequence}`;

    try {
      await addDoc(collection(db, `users/${currentUser.uid}/invoices`), {
        companyName,
        invoiceNumber: finalInvoiceNo, // Format baru tersimpan di sini
        clientName,
        date: today.toLocaleDateString('id-ID'), // Format tampilan di nota
        items,
        ppnRate: ppnEnabled ? 0.11 : 0,
        notes: `Pembayaran ditujukan kepada ${companyName}`,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving invoice:", err);
      alert("Gagal menyimpan rincian invoice.");
    }
  };

  if (authLoading) return <p className="p-24 text-center">Loading...</p>;
  if (!currentUser) return <div className="p-24 text-center"><AuthComponent /></div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-12 dark:bg-black">
      <div className="mx-auto max-w-6xl print:hidden">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold dark:text-white">Invoice Manager</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg">+ Buat Invoice</button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-blue-500 uppercase">{inv.companyName}</span>
                <span className="text-gray-500">{inv.date}</span>
              </div>
              <h3 className="text-xl font-bold dark:text-white truncate">{inv.clientName}</h3>
              <p className="text-2xl font-black text-green-600 mt-1">{formatRupiah(calculateSubtotal(inv.items) * (1 + inv.ppnRate))}</p>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setViewingInvoice(inv)} className="flex-1 rounded-lg bg-gray-100 py-2 font-bold dark:bg-gray-800">Rincian</button>
                <button onClick={() => deleteDoc(doc(db, `users/${currentUser.uid}/invoices`, inv.id))} className="text-red-500 px-3">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL RINCIAN (CLEAN LANDSCAPE VIEW) --- */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 sm:p-4 print:static print:bg-white print:block">
          <div className="w-full max-w-5xl bg-white p-6 sm:rounded-2xl print:p-0 print:shadow-none print:w-full">
            
            <div className="mb-6 flex justify-between print:hidden">
              <button onClick={() => setViewingInvoice(null)} className="font-bold text-blue-600">← Kembali</button>
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold">Print</button>
            </div>

            {/* AREA INVOICE (HANYA INI YANG DIPRINT) */}
            <div className="print-container border p-10 bg-white text-black min-h-[148mm]">
              <div className="flex justify-between border-b-4 border-black pb-6 mb-10">
                <div>
                  <h1 className="text-5xl font-black uppercase tracking-tighter">{viewingInvoice.companyName}</h1>
                  <p className="font-mono text-gray-500">No: {viewingInvoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold uppercase">INVOICES</h2>
                  <p>{viewingInvoice.date}</p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase">KEPADA YTH:</p>
                <h3 className="text-3xl font-bold">{viewingInvoice.clientName}</h3>
              </div>

              <table className="w-full text-left">
                <thead>
                <tr className="border-b-2 border-black bg-gray-100">
                    <th className="p-3">NAMA BARANG</th>
                    <th className="p-3 text-center">BANYAKNYA</th>
                    <th className="p-3 text-right">HARGA</th>
                    <th className="p-3 text-right">POTONGAN</th>
                    <th className="p-3 text-right">JUMLAH</th>
                </tr>
                </thead>
                <tbody>
                  {viewingInvoice.items.map((item, idx) => {
                    const discVal = getItemDiscountValue(item);
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="p-3 font-medium">{item.description}</td>
                        <td className="p-3 text-center">{item.qty}</td>
                        <td className="p-3 text-right">{formatRupiah(item.price)}</td>
                        <td className="p-3 text-right text-red-500">
                          {item.discount > 0 ? (item.discountType === 'percent' ? `${item.discount}%` : `-${formatRupiah(item.discount)}`) : "-"}
                        </td>
                        <td className="p-3 text-right font-bold">{formatRupiah(calculateItemTotal(item))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-8 flex justify-end">
                <div className="w-full max-w-xs space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(calculateSubtotal(viewingInvoice.items))}</span></div>
                  {viewingInvoice.ppnRate > 0 && (
                    <div className="flex justify-between"><span>PPN (11%)</span><span>{formatRupiah(calculateSubtotal(viewingInvoice.items) * 0.11)}</span></div>
                  )}
                  <div className="flex justify-between border-t-4 border-black pt-2 text-3xl font-black">
                    <span>TOTAL</span><span>{formatRupiah(calculateSubtotal(viewingInvoice.items) * (1 + viewingInvoice.ppnRate))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Buat Invoice Baru</h2>
            <form onSubmit={handleSaveInvoice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold dark:text-gray-400">UNIT BISNIS</label>
                  <select className="w-full border rounded-lg p-3 dark:bg-gray-800" value={companyName} onChange={e => setCompanyName(e.target.value)}>
                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold dark:text-gray-400">NAMA PELANGGAN</label>
                  <input className="w-full border rounded-lg p-3 dark:bg-gray-800" value={clientName} onChange={e => setClientName(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-4">
                <p className="font-bold dark:text-white">RINCIAN BARANG</p>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 border-b pb-4 items-end">
                    <div className="md:col-span-4">
                      <input placeholder="Item..." className="w-full border rounded-lg p-2 dark:bg-gray-800" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} required />
                    </div>
                    <div className="md:col-span-1">
                      <input type="number" placeholder="Qty" className="w-full border rounded-lg p-2 dark:bg-gray-800" value={item.qty || ""} onChange={e => updateItem(index, 'qty', e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                      <input type="number" placeholder="Harga" className="w-full border rounded-lg p-2 dark:bg-gray-800" value={item.price || ""} onChange={e => updateItem(index, 'price', e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-1">
                        <input type="number" placeholder="Diskon" className="w-full border rounded-lg p-2 dark:bg-gray-800 text-red-500" value={item.discount || ""} onChange={e => updateItem(index, 'discount', e.target.value)} />
                        {/* Tombol Toggle Tipe Diskon */}
                        <button 
                          type="button" 
                          onClick={() => updateItem(index, 'discountType', item.discountType === 'nominal' ? 'percent' : 'nominal')}
                          className={`px-3 py-2 rounded-lg font-bold text-xs ${item.discountType === 'percent' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-black'}`}
                        >
                          {item.discountType === 'percent' ? '%' : 'Rp'}
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="text-red-500 font-bold p-2">✕</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-blue-600 font-bold text-sm">+ Tambah Baris</button>
              </div>
              <div className="flex items-center gap-2 dark:text-white p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input 
                    type="checkbox" 
                    id="ppn_toggle"
                    checked={ppnEnabled} 
                    onChange={e => setPpnEnabled(e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                />
                <label htmlFor="ppn_toggle" className="font-bold cursor-pointer uppercase text-sm">
                    Aktifkan PPN 11%
                </label>
                </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">SIMPAN INVOICE</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-gray-500 text-sm">BATAL</button>
            </form>
          </div>
        </div>
      )}

      {/* --- CSS KHUSUS CLEAN PRINT LANDSCAPE --- */}
      <style jsx global>{`
        @media print {
          /* 1. Atur Orientasi Kertas dan Hilangkan Header/Footer Browser (URL, Judul, Tgl) */
          @page {
            size: landscape;
            margin: 0; /* Margin 0 menghilangkan default header/footer browser */
          }
          
          /* 2. Sembunyikan semua elemen di luar area nota */
          body * {
            visibility: hidden;
          }
          
          /* 3. Tampilkan hanya container nota */
          .print\:static, .print\:static * {
            visibility: visible;
          }

          /* 4. Atur posisi nota agar memenuhi kertas dengan margin bersih */
          .print\:static {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm; /* Tambahkan padding manual di sini agar nota tidak mepet ke pinggir kertas */
            background: white !important;
          }

          /* 5. Pastikan tombol navigasi modal tetap tersembunyi */
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}