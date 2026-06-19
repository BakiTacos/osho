// app/hooks/useDashboard.ts
import { useAuth } from "../../context/AuthContext";
import { Calculator, Link as LinkIcon, ListTodo, BoxIcon, MapIcon, Settings } from "lucide-react";

export function useDashboard() {
  const { currentUser } = useAuth();

  const shortcuts = [
    { name: "Inventaris", desc: "Kelola produk, stok & harga", icon: Calculator, href: "/inventaris", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { name: "Penjualan", desc: "Transaksi harian", icon: LinkIcon, href: "/penjualan", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { name: "Pembayaran", desc: "Cek Nota, Biaya Operasional, dan Alur Dana", icon: ListTodo, href: "/pembayaran", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { name: "Retur", desc: "Pesanan Retur & Gagal Kirim", icon: BoxIcon, href: "/pengembalian", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { name: "Laporan", desc: "Laporan Keuangan & Stok", icon: MapIcon, href: "/laporan", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { name: "Pengaturan", desc: "Konfigurasi Akun", icon: Settings, href: "/pengaturan", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
  ];

  return { currentUser, shortcuts };
}