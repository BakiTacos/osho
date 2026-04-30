"use client";

import "./globals.css"; // 1. PASTIKAN CSS TER-IMPORT
import { Inter } from "next/font/google";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import AuthComponent from "../components/AuthComponent";
import { Loader2 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

function AppContent({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

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
    // Kita hapus class "flex" di sini agar tidak konflik dengan margin-left 
    // yang sudah Kakak pasang di tiap halaman (ml-72).
    <div className="min-h-screen bg-[#F8F9FB]">
      <Sidebar />
      {/* 
         Anak komponen (children) sudah punya margin-left masing-masing 
         seperti ml-0 lg:ml-72, jadi kita biarkan saja tanpa wrapper tambahan.
      */}
      {children}
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}