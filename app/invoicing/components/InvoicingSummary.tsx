// app/invoicing/components/InvoicingSummary.tsx
"use client";

import React from 'react';
import { CreditCard, ShieldCheck, Clock, AlertTriangle } from "lucide-react";

interface InvoicingSummaryProps {
  stats: {
    totalInvoiced: number;
    totalPaid: number;
    paidCount: number;
    totalUnpaid: number;
    unpaidCount: number;
    totalOverdue: number;
    overdueCount: number;
  };
}

export function InvoicingSummary({ stats }: InvoicingSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-4 sm:px-10 mt-4 sm:mt-6 animate-in fade-in duration-300">
      
      {/* CARD 1: TOTAL INVOICED */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[28px] border border-slate-100 shadow-2xs flex flex-col justify-between group hover:border-slate-200 hover:shadow-xs transition-all min-w-0">
        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full gap-2 min-w-0">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 sm:mb-3">
            <CreditCard size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black text-[#0F172A] tracking-tight break-words whitespace-normal text-right sm:text-left flex-1 min-w-0 leading-tight">
            Rp {stats.totalInvoiced.toLocaleString('id-ID')}
          </h3>
        </div>
        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 sm:mt-4 border-t border-slate-50 pt-1.5 sm:pt-0 shrink-0">
          Total Tagihan
        </p>
      </div>

      {/* CARD 2: LUNAS */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[28px] border border-slate-100 shadow-2xs flex flex-col justify-between border-b-4 border-b-emerald-500 group hover:border-slate-200 hover:shadow-xs transition-all min-w-0">
        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full gap-2 min-w-0">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 sm:mb-3">
            <ShieldCheck size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black text-emerald-600 tracking-tight break-words whitespace-normal text-right sm:text-left flex-1 min-w-0 leading-tight">
            Rp {stats.totalPaid.toLocaleString('id-ID')}
          </h3>
        </div>
        <p className="text-[8px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2 sm:mt-4 border-t border-slate-50 pt-1.5 sm:pt-0 shrink-0">
          Lunas ({stats.paidCount} Invoice)
        </p>
      </div>

      {/* CARD 3: BELUM BAYAR */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[28px] border border-slate-100 shadow-2xs flex flex-col justify-between border-b-4 border-b-amber-500 group hover:border-slate-200 hover:shadow-xs transition-all min-w-0">
        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full gap-2 min-w-0">
          <div className="p-2 bg-amber-50 text-amber-500 rounded-xl shrink-0 sm:mb-3">
            <Clock size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black text-amber-600 tracking-tight break-words whitespace-normal text-right sm:text-left flex-1 min-w-0 leading-tight">
            Rp {stats.totalUnpaid.toLocaleString('id-ID')}
          </h3>
        </div>
        <p className="text-[8px] sm:text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2 sm:mt-4 border-t border-slate-50 pt-1.5 sm:pt-0 shrink-0">
          Belum Bayar ({stats.unpaidCount} Invoice)
        </p>
      </div>

      {/* CARD 4: JATUH TEMPO */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[28px] border border-slate-100 shadow-2xs flex flex-col justify-between border-b-4 border-b-red-500 group hover:border-slate-200 hover:shadow-xs transition-all min-w-0">
        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full gap-2 min-w-0">
          <div className="p-2 bg-red-50 text-red-500 rounded-xl shrink-0 sm:mb-3">
            <AlertTriangle size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black text-red-600 tracking-tight break-words whitespace-normal text-right sm:text-left flex-1 min-w-0 leading-tight">
            Rp {stats.totalOverdue.toLocaleString('id-ID')}
          </h3>
        </div>
        <p className="text-[8px] sm:text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 sm:mt-4 border-t border-slate-50 pt-1.5 sm:pt-0 shrink-0">
          Jatuh Tempo ({stats.overdueCount} Invoice)
        </p>
      </div>

    </div>
  );
}
