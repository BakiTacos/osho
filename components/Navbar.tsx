"use client";

import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, 
  Calculator, 
  Link as LinkIcon, 
  ListTodo, 
  LogOut, 
  User,
  BoxIcon,
  MapIcon,
  Settings,
  Home,
  FileText
} from "lucide-react";

export default function Sidebar() {
  const { currentUser } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    const confirm = window.confirm("Apakah Kakak yakin ingin keluar dari sistem?");
    if (!confirm) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // 1. DATA MENU UTAMA UNTUK DESKTOP (LENGKAP 8 MENU)
  const desktopItems = [
    { name: "Beranda", icon: LayoutDashboard, href: "/" },
    { name: "Inventaris", icon: Calculator, href: "/inventaris" },
    { name: "Penjualan", icon: LinkIcon, href: "/penjualan" },
    { name: "Invoicing", icon: FileText, href: "/invoicing" },
    { name: "Pembayaran", icon: ListTodo, href: "/pembayaran" },
    { name: "Retur", icon: BoxIcon, href: "/pengembalian" }, 
    { name: "Laporan", icon: MapIcon, href: "/laporan" },
    { name: "Pengaturan", icon: Settings, href: "/pengaturan" },
  ];

  // 2. DATA SELEKSI UNTUK MOBILE (4 MENU UTAMA OPERASIONAL GUDANG)
  const mobileNavItems = [
    { icon: Home, href: "/", name: "Beranda" },
    { icon: Calculator, href: "/inventaris", name: "Stok" },
    { icon: LinkIcon, href: "/penjualan", name: "Penjualan" },
    { icon: BoxIcon, href: "/pengembalian", name: "Retur" },
  ];

  return (
    <>
      {/* ========================================= */}
      {/* 💻 SIDEBAR DESKTOP (Mulai ukuran Layar lg) */}
      {/* ========================================= */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-[#E2E8F0] flex-col fixed h-full z-40">
        {/* Logo Section */}
        <div className="p-8">
          <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight tracking-tight">
            Simple and Yours<br />
            <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Manajemen</span>
          </h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          {desktopItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-[#F1F5F9] text-[#0047AB] font-bold shadow-sm" 
                    : "text-[#64748B] hover:bg-[#F8F9FB] hover:text-[#0F172A]"
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[15px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth Section Desktop */}
        <div className="p-4 border-t border-[#F1F5F9]">
          {currentUser ? (
            <div className="flex items-center space-x-3 p-3 bg-[#F8F9FB] rounded-2xl border border-[#F1F5F9]">
              <div className="w-11 h-11 rounded-xl bg-[#CBD5E1] flex items-center justify-center overflow-hidden shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`} alt="avatar" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0F172A] uppercase truncate">
                  {currentUser.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Admin</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-[#94A3B8] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link 
              href="/counter" 
              className="flex items-center justify-center space-x-2 w-full py-3 bg-[#0047AB] text-white rounded-xl font-bold shadow-lg shadow-blue-100"
            >
              <User size={18} />
              <span>Login Akun</span>
            </Link>
          )}
        </div>
      </aside>

      {/* ========================================= */}
      {/* 📱 🚀 REVISI KOKOH: STICKY BOTTOM NAVBAR APP-STYLE (ANTI-MENIMPA KONTEN) */}
      {/* ========================================= */}
      {/* Menggunakan w-full, bottom-0, inset-x-0 agar menempel mati dan presisi di dasar HP */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 w-full z-50 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] flex items-center justify-between px-4 py-2 pb-safe">
        
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive 
                  ? "text-[#0047AB] bg-[#F1F5F9]" // Blok abu terang khas sidebar desktop saat aktif
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {/* Ikon Menu */}
              <item.icon 
                size={18} 
                strokeWidth={isActive ? 2.5 : 2} 
                className="mb-1" 
              />

              {/* Label Singkat */}
              <span className={`text-[9px] tracking-widest uppercase ${isActive ? "font-black" : "font-bold"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}

      </nav>
    </>
  );
}