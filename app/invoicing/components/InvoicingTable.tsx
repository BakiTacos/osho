// app/invoicing/components/InvoicingTable.tsx
"use client";

import React, { useState } from 'react';
import { MoreVertical, Edit3, Trash2, Receipt, Calendar, FileDown, Copy } from "lucide-react";
import { CustomerInvoice } from '../services/CustomerInvoicePdfService';

interface InvoicingTableProps {
  items: CustomerInvoice[];
  onEdit: (invoice: CustomerInvoice) => void;
  onDelete: (id: string, invoiceNumber: string) => void;
  onDownloadPdf: (invoice: CustomerInvoice) => void;
  isSuparta?: boolean;
}

export function InvoicingTable({
  items,
  onEdit,
  onDelete,
  onDownloadPdf,
  isSuparta = false
}: InvoicingTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleCopyWaRecap = (inv: any, index: number) => {
    // 1. Format the products list
    const itemsText = (inv.items || []).map((it: any) => {
      const formattedPrice = Math.round(it.price).toLocaleString('id-ID');
      return `${it.qty} Set ${it.productName || it.sku}\n${it.qty} × ${formattedPrice}`;
    }).join('\n');

    // 2. Format additional notes / bank info
    const notesText = inv.notes ? `${inv.notes}` : "";

    // 3. Format date
    const dateFormatted = inv.date 
      ? new Date(inv.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
      : "-";

    // 4. Bank account holder/termin first line
    const firstLineBank = inv.bankInfo ? inv.bankInfo.split('\n')[0] : "cv sss";

    // 5. Commission text
    const picName = inv.sellerPic || "Kevin";
    const commissionText = inv.totalCommission 
      ? `Komisi ${picName} ? Rp ${Math.round(inv.totalCommission).toLocaleString('id-ID')}`
      : `Komisi ${picName} ?`;

    // 6. Combine all lines using double-newline or single-newline matching WA format
    let text = `${index + 1}) Jual ke ${inv.recipient} - ${inv.recipientAddress || ""}\n${itemsText}`;
    if (notesText) {
      text += `\n${notesText}`;
    }
    text += `\nTotal ${Math.round(inv.total).toLocaleString('id-ID')} (${firstLineBank})`;
    if (inv.paymentHistory) {
      text += `\n${inv.paymentHistory}`;
    }
    text += `\nDikirim Hari ini ${dateFormatted}\n${commissionText}`;

    navigator.clipboard.writeText(text);
    alert("Rekap WA berhasil disalin ke clipboard!");
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="mt-6 sm:mt-8 animate-in fade-in duration-200">
      <div className="bg-white rounded-[22px] sm:rounded-[32px] border border-slate-100 shadow-xs overflow-hidden">
        
        {/* DESKTOP VIEW */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-[#F8F9FB] text-[8px] sm:text-[9px] font-black text-[#94A3B8] uppercase border-b tracking-widest">
              <tr>
                <th className="px-6 py-4 sm:px-8">Invoice / Pelanggan</th>
                <th className="px-4 py-4 sm:px-6">Tanggal & Jatuh Tempo</th>
                <th className="px-4 py-4 sm:px-6 text-right">Total Tagihan</th>
                <th className="px-6 py-4 sm:px-8 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((inv, idx) => (
                <tr key={inv.id} className="hover:bg-slate-50/30 text-xs sm:text-sm font-bold text-slate-600 transition-all">
                  
                  {/* Invoice ID & Recipient */}
                  <td className="px-6 py-4 sm:px-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white rounded-2xl border border-slate-100 text-[#0047AB] shadow-xs">
                        <Receipt size={18} />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-black text-[#0F172A] uppercase leading-none">
                          #{inv.invoiceNumber}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          {inv.recipient}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Dates */}
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{formatDate(inv.date)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-red-500 font-black mt-1">
                      <Calendar size={12} className="text-red-300" />
                      <span>Jatuh Tempo: {formatDate(inv.dueDate)}</span>
                    </div>
                  </td>

                  {/* Grand Total */}
                  <td className="px-4 py-4 sm:px-6 text-right font-black text-[#0F172A]">
                    Rp {Math.round(inv.total).toLocaleString('id-ID')}
                  </td>

                  {/* Action Menu dropdown */}
                  <td className="px-6 py-4 sm:px-8 text-right relative">
                    <div className="flex justify-end gap-2">
                      {isSuparta && (
                        <button
                          type="button"
                          onClick={() => handleCopyWaRecap(inv, idx)}
                          title="Salin WA"
                          className="cursor-pointer p-2 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-all"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDownloadPdf(inv)}
                        title="Unduh PDF"
                        className="cursor-pointer p-2 text-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 hover:text-[#0047AB] rounded-lg transition-all"
                      >
                        <FileDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id || null)}
                        className="cursor-pointer p-2 text-slate-300 hover:text-slate-500 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {activeMenuId === inv.id && (
                      <div className="absolute right-8 top-10 w-32 bg-white border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => { onEdit(inv); setActiveMenuId(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black text-[#0F172A] hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit3 size={12} className="text-[#0047AB]" /> EDIT
                        </button>
                        <button
                          type="button"
                          onClick={() => { inv.id && onDelete(inv.id, inv.invoiceNumber); setActiveMenuId(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={12} /> HAPUS
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW */}
        <div className="block md:hidden divide-y divide-slate-100 max-h-[60vh] overflow-y-auto no-scrollbar">
          {items.map((inv, idx) => (
            <div key={inv.id} className="p-4 flex flex-col gap-3 bg-white active:bg-slate-50/50 transition-all">
              
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 bg-slate-50 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                    <Receipt size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#0F172A] uppercase truncate leading-tight">
                      #{inv.invoiceNumber}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate max-w-[150px]">
                      {inv.recipient}
                    </p>
                    <span className="text-[8px] text-slate-400 font-bold block mt-1">
                      {inv.items?.length || 0} Item • {inv.items?.reduce((sum, item) => sum + item.qty, 0) || 0} Pcs
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex flex-wrap justify-between items-center text-[9px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1 text-slate-500 font-bold">
                  <Calendar size={10} />
                  <span>Inv: {formatDate(inv.date)}</span>
                </div>
                <div className="flex items-center gap-1 text-red-500 font-black">
                  <Calendar size={10} />
                  <span>Jatuh Tempo: {formatDate(inv.dueDate)}</span>
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between border-t border-dashed border-slate-100 pt-2.5 mt-0.5">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                    Total Tagihan
                  </span>
                  <span className="text-sm font-black text-[#0F172A]">
                    Rp {Math.round(inv.total).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Direct Action buttons */}
                <div className="flex items-center gap-1">
                  {isSuparta && (
                    <button
                      type="button"
                      onClick={() => handleCopyWaRecap(inv, idx)}
                      className="p-2 text-emerald-600 bg-emerald-50/50 rounded-lg active:bg-emerald-100 flex items-center justify-center cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDownloadPdf(inv)}
                    className="p-2 text-indigo-600 bg-indigo-50/50 rounded-lg active:bg-indigo-100 flex items-center justify-center cursor-pointer"
                  >
                    <FileDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(inv)}
                    className="p-2 text-[#0047AB] bg-blue-50/50 rounded-lg active:bg-blue-100 flex items-center justify-center cursor-pointer"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => inv.id && onDelete(inv.id, inv.invoiceNumber)}
                    className="p-2 text-red-500 bg-red-50/50 rounded-lg active:bg-red-100 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {items.length === 0 && (
          <div className="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2">
            <Receipt size={32} className="text-slate-200 mb-1" />
            <span>Belum Ada Invoice Pelanggan</span>
          </div>
        )}

      </div>
    </div>
  );
}
