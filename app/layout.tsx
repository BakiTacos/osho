// app/layout.tsx
"use client";

import "./globals.css"; 
import { Inter } from "next/font/google";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import AuthComponent from "../components/AuthComponent";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation"; // 🚀 SUNTIKKAN FITUR PEMBACA JALUR URL
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

function AppContent({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const pathname = usePathname(); // Ambil alamat URL aktif (misal: "/inventaris/mapping")

  // 🚀 LOGIKA DINAMIS MENGUBAH JUDUL TAB BROWSER SECARA OTOMATIS (MANFAATKAN RAM LOKAL)
  useEffect(() => {
    // 1. Jika pengguna belum masuk atau data sedang dimuat
    if (loading || !currentUser) {
      document.title = "Simple and Yours | Manajemen";
      return;
    }

    // 2. Pecah alamat URL berdasarkan tanda garis miring "/"
    const segments = pathname.split("/").filter(Boolean);

    // 3. Jika murni di halaman beranda utama ("/")
    if (segments.length === 0) {
      document.title = "Beranda | Simple and Yours";
      return;
    }

    // 4. Ambil kata kunci terakhir di URL untuk dijadikan judul utama
    // Contoh: "/inventaris/mapping" -> diambil kata "mapping"
    const lastSegment = segments[segments.length - 1];

    // 5. Kamus terjemahan otomatis agar judul tab berbahasa Indonesia rapi & estetik
    const pageTitles: Record<string, string> = {
      "inventaris": "Katalog Inventaris Gudang",
      "tambah": "Tambah Produk Baru",
      "edit": "Ubah Data Produk",
      "mapping": "Hubungan SKU Jualan",
      "penjualan": "Catatan Transaksi Penjualan",
      "pembayaran": "Rekonsiliasi Pembayaran",
      "retur": "Manajemen Retur Barang",
      "laporan": "Laporan Laba Rugi Toko",
      "pengaturan": "Pengaturan Sistem Ruko"
    };

    // 6. Cari kecocokan kata kunci di dalam kamus di atas
    const dynamicTitle = pageTitles[lastSegment.toLowerCase()];

    if (dynamicTitle) {
      document.title = `${dynamicTitle} | SNY & PARATA`;
    } else {
      // Fallback cadangan jika nama folder belum didaftarkan di kamus: 
      // Mengubah huruf pertama menjadi besar (Contoh: "stok" -> "Stok | SNY & PARATA")
      const formattedFallback = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      document.title = `${formattedFallback} | SNY & PARATA`;
    }

  }, [pathname, loading, currentUser]); // Efek ini otomatis memicu ulang setiap kali rute halaman berganti!

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FB]">
        <Loader2 className="animate-spin text-[#0047AB]" size={40} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F9FB] p-6">
        <AuthComponent />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />
      {children}
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}