// components/Navbar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
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
  FileText,
  Bell,
  AlertTriangle,
  X,
  ShieldCheck
} from "lucide-react";

export default function Sidebar() {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);

  // listen to products stock in real-time
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      const alerts: any[] = [];
      snap.docs.forEach((doc) => {
        const data = doc.data();
        const stock = Number(data.stock) || 0;
        const name = data.name || "Produk Tanpa Nama";
        const sku = data.sku || "CUSTOM";
        
        if (stock < 0) {
          alerts.push({
            id: doc.id,
            type: "danger",
            sku,
            name,
            msg: `Stok minus kritis! Stok saat ini: ${stock} Pcs.`,
            stock
          });
        } else if (stock <= 10) {
          alerts.push({
            id: doc.id,
            type: "warning",
            sku,
            name,
            msg: `Stok menipis. Sisa stok: ${stock} Pcs.`,
            stock
          });
        }
      });

      // Sort: danger/critical first, then warning
      alerts.sort((a, b) => {
        if (a.type === "danger" && b.type !== "danger") return -1;
        if (a.type !== "danger" && b.type === "danger") return 1;
        return a.name.localeCompare(b.name);
      });

      setNotifications(alerts);
    }, (err) => {
      console.error("Gagal mendengarkan data produk untuk notifikasi:", err);
    });

    return () => unsub();
  }, [currentUser?.uid]);

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
        {/* Logo & Bell Notification Section */}
        <div className="p-8 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight tracking-tight">
            Simple and Yours<br />
            <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">Manajemen</span>
          </h1>
          
          <button 
            type="button"
            onClick={() => setIsOpenDrawer(true)}
            className="relative p-2 text-slate-400 hover:text-[#0047AB] bg-slate-50 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
            title="Buka Notifikasi Stok"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>
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
              <button onClick={handleLogout} className="p-2 text-[#94A3B8] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer">
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
      {/* 📱 STICKY BOTTOM NAVBAR APP-STYLE (HP) */}
      {/* ========================================= */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 w-full z-50 bg-white border-t border-[#E2E8F0] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] flex items-center justify-between px-4 py-2 pb-safe">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive 
                  ? "text-[#0047AB] bg-[#F1F5F9]" 
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <item.icon 
                size={18} 
                strokeWidth={isActive ? 2.5 : 2} 
                className="mb-1" 
              />
              <span className={`text-[9px] tracking-widest uppercase ${isActive ? "font-black" : "font-bold"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Floating Bell Button */}
      <div className="lg:hidden fixed top-4 right-4 z-[95]">
        <button
          type="button"
          onClick={() => setIsOpenDrawer(true)}
          className="relative p-2.5 bg-white border border-[#E2E8F0] text-slate-600 rounded-full shadow-md flex items-center justify-center cursor-pointer active:scale-90 transition-all"
        >
          <Bell size={18} />
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Sliding Drawer for Stock Notifications */}
      {isOpenDrawer && (
        <div className="fixed inset-0 z-[300] flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            onClick={() => setIsOpenDrawer(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
          />
          
          {/* Drawer Body */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-[#0F172A] tracking-tighter">NOTIFIKASI STOK</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  Peringatan stok gudang real-time
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsOpenDrawer(false)}
                className="p-1.5 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List of Alerts */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300 text-[10px] font-black uppercase tracking-widest gap-2">
                  <ShieldCheck size={32} className="text-emerald-500" />
                  <span>Kondisi Stok Gudang Aman</span>
                </div>
              ) : (
                notifications.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                      alert.type === "danger" 
                        ? "bg-red-50/80 border-red-100 text-red-800" 
                        : "bg-amber-50/80 border-amber-100 text-amber-800"
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      alert.type === "danger" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    }`}>
                      <AlertTriangle size={14} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wider truncate">
                        [{alert.sku}]
                      </p>
                      <h4 className="text-xs font-black uppercase mt-0.5 truncate leading-tight">
                        {alert.name}
                      </h4>
                      <p className="text-[10px] font-bold mt-1.5 text-slate-600 leading-normal">
                        {alert.msg}
                      </p>
                      
                      <div className="mt-3 flex gap-2">
                        <Link 
                          href="/inventaris" 
                          onClick={() => setIsOpenDrawer(false)}
                          className={`text-[8px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                            alert.type === "danger" 
                              ? "bg-red-200/50 hover:bg-red-200 text-red-700" 
                              : "bg-amber-200/50 hover:bg-amber-200 text-amber-700"
                          }`}
                        >
                          Cek Gudang
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t mt-4 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsOpenDrawer(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}