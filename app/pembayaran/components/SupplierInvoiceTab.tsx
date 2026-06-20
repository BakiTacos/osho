// app/pembayaran/components/SupplierInvoiceTab.tsx
"use client";

import React from 'react';
import { PlusCircle, MoreVertical, Edit3, Trash2, Receipt, Calendar, FileText } from "lucide-react";

export function SupplierInvoiceTab({ 
  items, 
  onOpenAdd, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  activeMenuId, 
  setActiveMenuId 
}: any) {
  return (
    <div className="mt-6 sm:mt-8 animate-in fade-in duration-200">
      
      {/* 🚀 TOMBOL TAMBAH NOTA BARU (ADAPTIF TAMPILAN HP) */}
      <div className="mb-4 sm:mb-6">
        <button 
          type="button"
          onClick={onOpenAdd} 
          className="cursor-pointer w-full sm:w-auto px-6 py-4 bg-[#0047AB] hover:bg-blue-800 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-blue-100 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all"
        >
          <PlusCircle size={16} strokeWidth={3} /> 
          <span>Tambah Nota Baru</span>
        </button>
      </div>

      {/* 🚀 BOX UTAMA DAFTAR TAGIHAN SUPPLIER */}
      <div className="bg-white rounded-[22px] sm:rounded-[32px] border border-slate-100 shadow-xs overflow-hidden">
        
        {/* VIEW 1: DESKTOP TABLE MODE (Hanya muncul di layar Lebar / md:block) */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-[#F8F9FB] text-[8px] sm:text-[9px] font-black text-[#94A3B8] uppercase border-b tracking-widest">
              <tr>
                <th className="px-6 py-4 sm:px-8">Nomor Nota / Supplier</th>
                <th className="px-4 py-4 sm:px-6">Status Pembayaran</th>
                <th className="px-4 py-4 sm:px-6 text-right">Total Tagihan</th>
                <th className="px-6 py-4 sm:px-8 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50/30 text-xs sm:text-sm font-bold text-slate-600 transition-all">
                  <td className="px-6 py-4 sm:px-8">
                    <p className="text-[#0F172A] font-black">#{inv.noNota}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase mt-0.5">{inv.supplier}</p>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <button 
                      type="button"
                      onClick={() => onToggleStatus(inv)} 
                      className={`cursor-pointer px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tight transition-all ${
                        inv.status === 'TERBAYAR' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {inv.status}
                    </button>
                  </td>
                  <td className="px-4 py-4 sm:px-6 text-right font-black text-[#0F172A]">Rp {inv.amount.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 sm:px-8 text-right relative">
                    <button type="button" onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)} className="cursor-pointer p-2 text-slate-300 hover:text-slate-500 transition-colors"><MoreVertical size={16}/></button>
                    {activeMenuId === inv.id && (
                      <div className="absolute right-8 top-10 w-32 bg-white border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                        <button type="button" onClick={() => { onEdit(inv); setActiveMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black text-[#0F172A] hover:bg-slate-50"><Edit3 size={12} className="text-[#0047AB]"/> EDIT</button>
                        <button type="button" onClick={() => { onDelete(inv); setActiveMenuId(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-50"><Trash2 size={12}/> HAPUS</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🚀 VIEW 2: SMART MOBILE CARD MODE (Otomatis Aktif di Layar HP / md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-100 max-h-[60vh] overflow-y-auto no-scrollbar">
          {items.map((inv: any) => (
            <div key={inv.id} className="p-4 flex flex-col gap-3 bg-white active:bg-slate-50/50 transition-all">
              
              {/* Baris Atas: Pengenal Nota & Tombol Status Gede Lapang */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-slate-50 text-[#0047AB] rounded-xl shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#0F172A] uppercase truncate leading-tight">#{inv.noNota}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate max-w-[160px]">{inv.supplier}</p>
                  </div>
                </div>
                
                {/* Tombol Status dengan padding empuk untuk jempol HP */}
                <button 
                  type="button"
                  onClick={() => onToggleStatus(inv)} 
                  className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shrink-0 transition-all active:scale-95 ${
                    inv.status === 'TERBAYAR' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  {inv.status}
                </button>
              </div>

              {/* Baris Bawah: Total Rupiah & Kontrol Tombol Menu Terbuka */}
              <div className="flex items-center justify-between border-t border-dashed border-slate-50 pt-2.5 mt-0.5">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Total Tagihan</span>
                  <span className="text-sm font-black text-[#0F172A]">Rp {inv.amount.toLocaleString('id-ID')}</span>
                </div>

                {/* Tombol Aksi Langsung Sebaris khusus Mobile (Tanpa Dropdown Terpotong) */}
                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={() => onEdit(inv)} 
                    className="p-2 text-[#0047AB] bg-blue-50/50 rounded-lg active:bg-blue-100 flex items-center justify-center"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => onDelete(inv)} 
                    className="p-2 text-red-500 bg-red-50/50 rounded-lg active:bg-red-100 flex items-center justify-center"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* FALLBACK TAMPILAN JIKA DATA ZONK KOSONG */}
        {items.length === 0 && (
          <div className="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2">
            <Receipt size={32} className="text-slate-200 mb-1" />
            <span>Belum Ada Tagihan Supplier</span>
          </div>
        )}

      </div>
    </div>
  );
}