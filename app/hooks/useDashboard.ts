// app/hooks/useDashboard.ts
"use client";

import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Calculator, Link as LinkIcon, ListTodo, BoxIcon, MapIcon, Settings, FileText } from "lucide-react";

export function useDashboard() {
  const { currentUser } = useAuth();
  const [activeModules, setActiveModules] = useState<any>({
    home: {
      inventaris: true,
      penjualan: true,
      invoicing: true,
      pembayaran: true,
      retur: true,
      laporan: true
    }
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = onSnapshot(doc(db, `users/${currentUser.uid}/settings`, "modules"), (docSnap) => {
      if (docSnap.exists()) {
        setActiveModules(docSnap.data());
      }
    }, (err) => {
      console.error("Gagal memuat pengaturan modul aktif:", err);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  const rawShortcuts = [
    { key: "inventaris", name: "Inventaris", desc: "Kelola produk, stok & harga", icon: Calculator, href: "/inventaris", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { key: "penjualan", name: "Penjualan", desc: "Transaksi harian", icon: LinkIcon, href: "/penjualan", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { key: "invoicing", name: "Invoicing", desc: "Kelola & Cetak Invoice Klien", icon: FileText, href: "/invoicing", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
    { key: "pembayaran", name: "Pembayaran", desc: "Cek Nota, Biaya Operasional, dan Alur Dana", icon: ListTodo, href: "/pembayaran", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { key: "retur", name: "Retur", desc: "Pesanan Retur & Gagal Kirim", icon: BoxIcon, href: "/pengembalian", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { key: "laporan", name: "Laporan", desc: "Laporan Keuangan & Stok", icon: MapIcon, href: "/laporan", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { key: "pengaturan", name: "Pengaturan", desc: "Konfigurasi Akun", icon: Settings, href: "/pengaturan", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
  ];

  const shortcuts = rawShortcuts.filter(item => {
    if (item.key === "pengaturan") return true;
    return activeModules?.home?.[item.key] !== false;
  });

  return { currentUser, shortcuts };
}