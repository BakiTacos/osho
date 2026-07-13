// app/invoicing/components/InvoicingFilters.tsx
"use client";

import React from 'react';
import { Search } from "lucide-react";

interface InvoicingFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  timeFilter: string;
  setTimeFilter: (time: string) => void;
  invoiceCount: number;
}

export function InvoicingFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  timeFilter,
  setTimeFilter,
  invoiceCount
}: InvoicingFiltersProps) {
  
  const statusOptions = [
    { value: "ALL", label: "Semua" },
    { value: "DRAFT", label: "Draft" },
    { value: "BELUM BAYAR", label: "Belum Bayar" },
    { value: "LUNAS", label: "Lunas" },
    { value: "JATUH TEMPO", label: "Jatuh Tempo" }
  ];

  const timeOptions = [
    { value: "SEMUA", label: "Semua" },
    { value: "HARI INI", label: "Hari Ini" },
    { value: "BULAN INI", label: "Bulan Ini" }
  ];

  return (
    <div className="px-4 sm:px-10 mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* TIME FILTERS */}
        <div className="flex flex-wrap items-center bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm gap-2">
          {timeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimeFilter(opt.value)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                timeFilter === opt.value
                  ? "bg-[#0047AB] text-white shadow-md"
                  : "text-slate-400 hover:text-[#0047AB]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full lg:max-w-xs group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" size={16} />
          <input
            type="text"
            placeholder="Cari Pelanggan atau Invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold shadow-sm focus:ring-2 focus:ring-[#0047AB] outline-none transition-all"
          />
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {statusOptions.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`pb-3 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap flex items-center ${
              statusFilter === tab.value ? "text-[#0047AB]" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span>{tab.label}</span>
            {statusFilter === tab.value && (
              <span className="ml-1.5 bg-slate-100 text-[#0047AB] text-[9px] font-black px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[16px] h-4">
                {invoiceCount}
              </span>
            )}
            {statusFilter === tab.value && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0047AB]"></div>}
          </button>
        ))}
      </div>
    </div>
  );
}
