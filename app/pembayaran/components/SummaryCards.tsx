// app/pembayaran/components/SummaryCards.tsx
"use client";

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt } from "lucide-react";

interface SummaryCardsProps {
  stats: {
    totalWithdrawal: number;
    totalPaidInvoices: number;
    totalUnpaidInvoices: number;
    totalOpex: number;
  };
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-4 sm:px-10 mt-4 sm:mt-6 animate-in fade-in duration-300">
      
      {/* CARD 1: PENARIKAN DANA */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[28px] border border-slate-100 shadow-2xs flex flex-col justify-between group hover:border-slate-200 hover:shadow-xs transition-all min-w-0">
        {/* 🚀 FIXED: Ganti sm:flex-col menjadi formasi block/flex terarah agar aman dari luberan teks desktop */}
        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full gap-2 min-w-0">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 sm:mb-3">
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </div>
          {/* 🎯 KUNCI ANTI-MELUBER: Ukuran teks adaptif, kebal dari risiko menjebol box luar */}
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black text-[#0F172A] tracking-tight break-words whitespace-normal text-right sm:text-left flex-1 min-w-0 leading-tight">
            Rp {stats.totalWithdrawal.toLocaleString('id-ID')}
          </h3>
        </div>
        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 sm:mt-4 border-t border-slate-50 sm:border-none pt-1.5 sm:pt-0 shrink-0">
          Total Tarik Saldo
        </p>
      </div>

      {/* CARD 2: BIAYA OPEX */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[28px] border border-slate-100 shadow-2xs flex flex-col justify-between group hover:border-slate-200 hover:shadow-xs transition-all min-w-0">
        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full gap-2 min-w-0">
          <div className="p-2 bg-orange-50 text-orange-500 rounded-xl shrink-0 sm:mb-3">
            <ArrowDownRight size={16} strokeWidth={2.5} />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black text-[#0F172A] tracking-tight break-words whitespace-normal text-right sm:text-left flex-1 min-w-0 leading-tight">
            -Rp {stats.totalOpex.toLocaleString('id-ID')}
          </h3>
        </div>
        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 sm:mt-4 border-t border-slate-50 sm:border-none pt-1.5 sm:pt-0 shrink-0">
          Biaya Operasional
        </p>
      </div>

      {/* CARD 3: NOTA SUPPLIER LUNAS */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[28px] border border-slate-100 shadow-2xs flex flex-col justify-between group hover:border-slate-200 hover:shadow-xs transition-all min-w-0">
        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full gap-2 min-w-0">
          <div className="p-2 bg-blue-50 text-[#0047AB] rounded-xl shrink-0 sm:mb-3">
            <Wallet size={16} />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black text-[#0F172A] tracking-tight break-words whitespace-normal text-right sm:text-left flex-1 min-w-0 leading-tight">
            Rp {stats.totalPaidInvoices.toLocaleString('id-ID')}
          </h3>
        </div>
        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 sm:mt-4 border-t border-slate-50 sm:border-none pt-1.5 sm:pt-0 shrink-0">
          Nominal Nota Dibayar
        </p>
      </div>

      {/* CARD 4: UTANG SUPPLIER PENDING */}
      <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-[22px] sm:rounded-[28px] border border-slate-100 shadow-2xs flex flex-col justify-between border-b-4 border-b-red-500 group hover:border-slate-200 hover:shadow-xs transition-all min-w-0">
        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full gap-2 min-w-0">
          <div className="p-2 bg-red-50 text-red-500 rounded-xl shrink-0 sm:mb-3">
            <Receipt size={16} />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black text-red-600 tracking-tight break-words whitespace-normal text-right sm:text-left flex-1 min-w-0 leading-tight">
            Rp {stats.totalUnpaidInvoices.toLocaleString('id-ID')}
          </h3>
        </div>
        <p className="text-[8px] sm:text-[10px] font-black text-red-400 uppercase tracking-widest mt-2 sm:mt-4 border-t border-slate-50 sm:border-none pt-1.5 sm:pt-0 shrink-0">
          Nota Belum Bayar
        </p>
      </div>

    </div>
  );
}