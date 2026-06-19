// app/page.tsx
"use client";

import React from 'react';
import { useDashboard } from "./hooks/useDashboard";
import { DesktopGrid } from "./components/DesktopGrid";
import { MobileAppGrid } from "./components/MobileAppGrid";
import { MemoBoard } from "./components/MemoBoard"; // 🚀 Import Papan Catatan Baru
import { Loader2 } from "lucide-react";

export default function Home() {
  const { currentUser, shortcuts } = useDashboard();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <Loader2 className="animate-spin text-[#0047AB]" size={32} />
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER UTAMA */}
      <div className="px-4 sm:px-10 pt-10 pb-4">
        <h2 className="text-3xl sm:text-[42px] font-black text-[#0F172A] tracking-tighter leading-none">Beranda</h2>
        <p className="text-[#64748B] mt-2 text-xs sm:text-sm font-medium">Selamat datang kembali. Silakan pilih modul kerja operasional harian Anda.</p>
      </div>

      {/* RESPONSIVE RENDERING INTERFACE PINTASAN */}
      {/* Tampilan HP: Model Lingkaran Bulat App-Style */}
      <MobileAppGrid shortcuts={shortcuts} />

      {/* Tampilan Desktop/Laptop: Model Kotak Card Lebar */}
      <DesktopGrid shortcuts={shortcuts} />

      {/* 🚀 PAPAN AGENDARIS MANAJEMEN GUDANG (DI BAWAH) */}
      <MemoBoard />

    </div>
  );
}