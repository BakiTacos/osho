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
  Settings
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

  const sidebarItems = [
    // 🔧 NAMA MENU DIUBAH MENJADI "Home"
    { name: "Beranda", icon: LayoutDashboard, href: "/" },
    { name: "Inventaris", icon: Calculator, href: "/inventaris" },
    { name: "Penjualan", icon: LinkIcon, href: "/penjualan" },
    { name: "Pembayaran", icon: ListTodo, href: "/pembayaran" },
    { name: "Retur", icon: BoxIcon, href: "/pengembalian" }, 
    { name: "Laporan", icon: MapIcon, href: "/laporan" },
    { name: "Pengaturan", icon: Settings, href: "/settings" },
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
          {sidebarItems.map((item) => {
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
      {/* 📱 FLOATING NAVBAR MOBILE (Ukuran Layar Kecil) */}
      {/* ========================================= */}
      <nav className="lg:hidden fixed bottom-4 inset-x-4 z-50 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl flex items-center overflow-x-auto no-scrollbar px-2 py-2 gap-1 snap-x">
        
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${
                isActive 
                  ? "text-[#0047AB] bg-blue-50/50" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
              <span className={`text-[9px] tracking-tight ${isActive ? "font-black" : "font-bold"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        
        {/* Divider Vertikal */}
        <div className="w-px h-8 bg-slate-200 mx-1 shrink-0"></div>

        {/* Tombol Logout/Login Mobile */}
        {currentUser ? (
          <button 
            onClick={handleLogout}
            className="snap-center flex flex-col items-center justify-center min-w-[64px] px-1 py-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
          >
            <LogOut size={20} className="mb-1" />
            <span className="text-[9px] font-bold tracking-tight">Logout</span>
          </button>
        ) : (
          <Link 
            href="/counter"
            className="snap-center flex flex-col items-center justify-center min-w-[64px] px-1 py-2 rounded-xl text-[#0047AB] bg-blue-50 transition-all shrink-0"
          >
            <User size={20} className="mb-1" />
            <span className="text-[9px] font-black tracking-tight">Login</span>
          </Link>
        )}

      </nav>
    </>
  );
}