// components/SalesHeader.tsx
"use client";

import React from 'react';
import { Plus, Check, Trash2 } from "lucide-react";
import { useRouter } from 'next/navigation';

interface SalesHeaderProps {
  onOpenManual: () => void;
  onDirectCleanup: () => void; // 🚀 BARU: Jembatan pemicu pembersih data ganda ruko
  isProcessing: boolean;
}

export default function SalesHeader({ onOpenManual, onDirectCleanup, isProcessing }: SalesHeaderProps) {
  const router = useRouter();

  return (
    <div className="px-4 sm:px-10 pt-8 flex flex-col xl:flex-row justify-between gap-6">
      <div>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-none uppercase">Penjualan</h1>
        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center italic uppercase tracking-widest">
          <Check size={12} className="mr-1 text-emerald-500" /> Multi-Product Input Ready
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* 🚀 BARU: RELOKASI TOMBOL PEMBERSIH DATABASE SEPERTI MAU KEVIN (Ramping & Profesional) */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={onDirectCleanup}
          className="bg-rose-50 text-rose-600 border border-rose-100 px-4 py-3 rounded-2xl font-black text-xs hover:bg-rose-100 transition-all flex items-center space-x-1.5 disabled:opacity-40"
        >
          <Trash2 size={15} />
          <span>{isProcessing ? "Cleaning..." : "Sapu Duplikat"}</span>
        </button>

        <button 
          type="button"
          onClick={onOpenManual} 
          className="bg-white text-[#0047AB] border-2 border-[#0047AB] px-4 py-3 rounded-2xl font-black text-xs hover:bg-blue-50 transition-all flex items-center space-x-1.5"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Input Manual</span>
        </button>

        <button 
          type="button"
          onClick={() => router.push('/penjualan/advanced')} 
          className="bg-[#0047AB] text-white px-5 py-3 rounded-2xl font-black text-xs shadow-lg shadow-blue-100 hover:scale-105 transition-all flex items-center space-x-1.5"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Advance Shipment</span>
        </button>
      </div>
    </div>
  );
}