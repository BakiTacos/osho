// app/layout.tsx
"use client";

import "./globals.css"; 
import { Inter } from "next/font/google";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { auth } from "../lib/firebase"; // 🚀 IMPOR INSTANCE AUTH FIREBASE UNTUK FORCE KICK
import { signOut } from "firebase/auth"; // 🚀 IMPOR FUNGSI LOGOUT PAKSA
import Navbar from "../components/Navbar";
import AuthComponent from "../components/AuthComponent";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation"; 
import { useEffect } from "react";
import Cookies from "js-cookie"; // 🚀 IMPOR UTENSIL KUKI UNTUK MEMERIKSA SESI LAMA

const inter = Inter({ subsets: ["latin"] });

function AppContent({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const pathname = usePathname(); 

  // =======================================================
  // 🚀 PERBAIKAN SAKTI: FORCE KICK AKUN YANG TIDAK PUNYA KUKI BARU
  // =======================================================
  useEffect(() => {
    // Ambil token sesi dari penyimpanan kuki browser lokal
    const sessionToken = Cookies.get('session_token');

    // Jika Firebase mendeteksi ada user login, tapi kuki berumur 1 bulannya KOSONG / BELUM ADA,
    // berarti ini adalah perangkat lama yang tersangkut atau masa aktif kukinya sudah habis.
    if (currentUser && !sessionToken) {
      // Tendang paksa detik itu juga dari server cloud Firebase!
      signOut(auth).then(() => {
        // Bersihkan sisa kuki barangkali ada serpihan yang tertinggal
        Cookies.remove('session_token');
        // Segarkan halaman agar UI langsung mengunci ke form login
        window.location.href = "/";
        alert("Sesi masuk Anda telah di-reset demi keamanan sistem. Silakan login kembali.");
      });
    }
  }, [currentUser, pathname]); // Otomatis memeriksa setiap kali user berpindah halaman ruko

  // =======================================================
  // 🚀 LOGIKA DINAMIS MENGUBAH JUDUL TAB BROWSER SECARA OTOMATIS
  // =======================================================
  useEffect(() => {
    if (loading || !currentUser) {
      document.title = "Simple and Yours | Manajemen";
      return;
    }

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      document.title = "Beranda | Simple and Yours";
      return;
    }

    const lastSegment = segments[segments.length - 1];

    const pageTitles: Record<string, string> = {
      "inventaris": "Katalog Inventaris Gudang",
      "tambah": "Tambah Produk Baru",
      "edit": "Ubah Data Produk",
      "mapping": "Hubungan SKU Jualan",
      "penjualan": "Catatan Transaksi Penjualan",
      "invoicing": "Manajemen Invoice Pelanggan",
      "pembayaran": "Rekonsiliasi Pembayaran",
      "retur": "Manajemen Retur Barang",
      "laporan": "Laporan Laba Rugi Toko",
      "pengaturan": "Pengaturan Sistem Ruko"
    };

    const dynamicTitle = pageTitles[lastSegment.toLowerCase()];

    if (dynamicTitle) {
      document.title = `${dynamicTitle} | SNY`;
    } else {
      const formattedFallback = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      document.title = `${formattedFallback} | SNY & PARATA`;
    }

  }, [pathname, loading, currentUser]); 

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