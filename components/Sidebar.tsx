"use client";

import React, { useState } from 'react';
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
  MessageSquare, 
  LogOut, 
  User,
  Menu, // Ikon Hamburger
  X     // Ikon Tutup
} from "lucide-react";

export default function Sidebar() {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // State untuk buka/tutup di mobile

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  const sidebarItems = [
    { name: "Dasbor", icon: LayoutDashboard, href: "/" },
    { name: "Inventaris", icon: Calculator, href: "/inventaris" },
    { name: "Penjualan", icon: LinkIcon, href: "/links" },
    { name: "Pembayaran", icon: ListTodo, href: "/lists" },
    { name: "Pengaturan", icon: MessageSquare, href: "/prompts" },
    { name: "Counter (Old)", icon: Calculator, href: "/counter" },
  ];

  return (
    <>
      {/* --- TOMBOL HAMBURGER (Hanya muncul di Mobile) --- */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed top-6 left-6 z-50 p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-sm text-[#0047AB] hover:bg-slate-50 transition-all"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* --- OVERLAY / BACKDROP (Hanya muncul saat menu terbuka di mobile) --- */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* --- SIDEBAR ASIDE --- */}
      <aside className={`
        w-72 bg-white border-r border-[#E2E8F0] flex flex-col fixed h-full z-40 
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0
      `}>
        {/* Logo Section */}
        <div className="p-8">
          <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight tracking-tight">
            Simple and Yours<br />
            <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Manajemen</span>
          </h1>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsOpen(false)} // Tutup sidebar otomatis saat link diklik (mobile)
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

        {/* Auth Section */}
        <div className="p-4 border-t border-[#F1F5F9]">
          {currentUser ? (
            <div className="flex items-center space-x-3 p-3 bg-[#F8F9FB] rounded-2xl border border-[#F1F5F9]">
              <div className="w-11 h-11 rounded-xl bg-[#CBD5E1] flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`} alt="avatar" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0F172A] uppercase truncate">
                  {currentUser.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Admin</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-[#94A3B8] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link 
              href="/counter" 
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center space-x-2 w-full py-3 bg-[#0047AB] text-white rounded-xl font-bold shadow-lg shadow-blue-100"
            >
              <User size={18} />
              <span>Login Akun</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}