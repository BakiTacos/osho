// app/invoicing/components/InvoicingFilters.tsx
"use client";

import React from 'react';
import { Search } from "lucide-react";

interface InvoicingFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  timeFilter: string;
  setTimeFilter: (time: string) => void;
}

export function InvoicingFilters({
  searchQuery,
  setSearchQuery,
  timeFilter,
  setTimeFilter
}: InvoicingFiltersProps) {

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
    </div>
  );
}
