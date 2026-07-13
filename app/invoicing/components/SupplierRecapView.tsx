// app/invoicing/components/SupplierRecapView.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Calendar, User, FileDown, Layers, DollarSign, Wallet } from "lucide-react";
import { CustomerInvoice, CustomerInvoicePdfService } from "../services/CustomerInvoicePdfService";

interface SupplierRecapViewProps {
  invoices: CustomerInvoice[];
}

export function SupplierRecapView({ invoices }: SupplierRecapViewProps) {
  const getLocalDateString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
  };

  const getStartOfMonthString = () => {
    const d = new Date();
    const tzoffset = d.getTimezoneOffset() * 60000;
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    return (new Date(start.getTime() - tzoffset)).toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getStartOfMonthString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  const [selectedSupplier, setSelectedSupplier] = useState("");

  // Extract all unique suppliers from invoice items (only for suparta invoices that have it)
  const uniqueSuppliers = useMemo(() => {
    const suppliersSet = new Set<string>();
    invoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        if (item.supplier && item.supplier.trim()) {
          suppliersSet.add(item.supplier.trim());
        }
      });
    });
    return Array.from(suppliersSet).sort();
  }, [invoices]);

  // Filter items matching supplier and date range
  const filteredRecapItems = useMemo(() => {
    const list: any[] = [];
    invoices.forEach((inv) => {
      const invDate = inv.date; // YYYY-MM-DD
      if (invDate >= startDate && invDate <= endDate) {
        (inv.items || []).forEach((item) => {
          const itemSupplier = (item.supplier || "").trim();
          if (
            selectedSupplier === "" ||
            itemSupplier.toLowerCase() === selectedSupplier.toLowerCase()
          ) {
            list.push({
              invoiceNumber: inv.invoiceNumber,
              date: inv.date,
              recipient: inv.recipient,
              productName: item.productName,
              sku: item.sku,
              qty: item.qty,
              price: item.price,
              commission: item.commission || 0,
              supplier: item.supplier || "-",
            });
          }
        });
      }
    });
    return list;
  }, [invoices, startDate, endDate, selectedSupplier]);

  // Metrics summary
  const totals = useMemo(() => {
    let totalSales = 0;
    let totalCommission = 0;
    filteredRecapItems.forEach((item) => {
      totalSales += item.price * item.qty;
      totalCommission += item.commission * item.qty;
    });
    const totalSetor = totalSales - totalCommission;
    return { totalSales, totalCommission, totalSetor };
  }, [filteredRecapItems]);

  const handleDownloadPdf = () => {
    if (filteredRecapItems.length === 0) {
      alert("Tidak ada item data rekap yang dapat diunduh.");
      return;
    }
    const supplierTitle = selectedSupplier || "Semua Supplier";
    CustomerInvoicePdfService.generateSupplierRecapPdf(
      supplierTitle,
      startDate,
      endDate,
      filteredRecapItems
    );
  };

  return (
    <div className="space-y-6 px-4 sm:px-10 mt-6 animate-in fade-in duration-300">
      
      {/* FILTER PANEL */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5 col-span-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block ml-1">
            Tanggal Awal
          </label>
          <div className="relative flex items-center">
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5 col-span-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block ml-1">
            Tanggal Akhir
          </label>
          <div className="relative flex items-center">
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5 col-span-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block ml-1">
            Pilih Supplier
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-600 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="">-- Semua Supplier --</option>
            {uniqueSuppliers.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          className="cursor-pointer py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-95 w-full"
        >
          <FileDown size={14} />
          <span>Unduh PDF Rekap</span>
        </button>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Omset Supplier */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
              Total Penjualan Supplier
            </span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              Rp {Math.round(totals.totalSales).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0047AB] flex items-center justify-center shrink-0">
            <DollarSign size={18} />
          </div>
        </div>

        {/* Card 2: Total Komisi Ruko */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
              Total Komisi Bersih (Hak Kami)
            </span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">
              Rp {Math.round(totals.totalCommission).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet size={18} />
          </div>
        </div>

        {/* Card 3: Total Bersih Setor ke Supplier */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
              Total Setor Bersih ke Supplier
            </span>
            <span className="text-xl font-black text-indigo-600 mt-1 block">
              Rp {Math.round(totals.totalSetor).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers size={18} />
          </div>
        </div>
      </div>

      {/* ITEMS RECAP TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xs font-black uppercase text-[#0F172A] tracking-wider">
              Daftar Rincian Penjualan Barang
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Rincian komisi dan sisa setor per item ruko suparta
            </p>
          </div>
          <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
            {filteredRecapItems.length} Baris
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredRecapItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-1">
              <Layers size={28} className="mx-auto text-slate-300" />
              <p className="text-[9px] font-black uppercase tracking-widest">
                Tidak ada data transaksi supplier
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="py-3.5 px-6 text-center w-12">No</th>
                  <th className="py-3.5 px-4">Invoice</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Produk</th>
                  <th className="py-3.5 px-4 text-center">Qty</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 text-right">Komisi / Pcs</th>
                  <th className="py-3.5 px-6 text-right">Total Setor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {filteredRecapItems.map((item, idx) => {
                  const subtotal = item.price * item.qty;
                  const itemTotalCommission = item.commission * item.qty;
                  const totalSetor = subtotal - itemTotalCommission;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6 text-center text-slate-400 text-[10px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-black text-[#0047AB]">
                        {item.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-[10px] text-slate-400">
                        {item.date}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 uppercase">
                        {item.recipient}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
                          {item.supplier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {item.productName}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-slate-800">
                        {item.qty} Pcs
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-700">
                        Rp {Math.round(item.price).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600">
                        Rp {Math.round(item.commission).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-6 text-right font-black text-indigo-600">
                        Rp {Math.round(totalSetor).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
