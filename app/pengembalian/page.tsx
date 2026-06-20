// app/inventaris/pengembalian/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useReturData } from "./hooks/useReturData";
import { ReturService } from "./services/ReturService";
import { db } from "../../lib/firebase";
import { doc, writeBatch, collection, serverTimestamp, increment } from "firebase/firestore";

import { ReturStats } from "./components/ReturStats";
import { ReturFilters } from "./components/ReturFilters";
import { ReturManualModal } from "./components/ReturManualModal";
import { ReturDesktopTable } from "./components/ReturDesktopTable";
import { ReturMobileGrid } from "./components/ReturMobileGrid";
import BarcodeScanner from "./components/BarcodeScanner"; // 🚀 IMPOR INSTANT SCANNER HP

import { Package, ChevronLeft, ChevronRight, ScanLine, CameraOff } from "lucide-react";
import { ReturOrder, ManualFormState } from "./types/retur";

export default function PengembalianPage() {
  const { currentUser } = useAuth();
  const { products, returOrders, stats, loading } = useReturData(currentUser);
  
  const returService = useMemo(() => new ReturService(currentUser?.uid || ""), [currentUser]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Proses");
  const [isImporting, setIsImporting] = useState(false);
  
  // STATE CAMERA SCANNER CAMERA RESI PWA
  const [isScannerActive, setIsScannerActive] = useState(false);

  // STATE PAGINATION LOKAL RAM (0% READS LEAK)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState<ManualFormState>({ 
    sku: '', qty: 1, reason: '', kondisi: 'Rusak', marketplace: 'Shopee' 
  });

  // 🚀 LOGIKA BARU: INTERSEPSI REAKSI HASIL SCAN KAMERA HP
  const handleBarcodeScanSuccess = (decodedText: string) => {
    setIsScannerActive(false);
    setSearchTerm(decodedText); // Tembak nomor resi hasil scan langsung ke bar pencarian
    setCurrentPage(1);
    alert(`📸 Resi Terbaca: ${decodedText}\nSistem langsung memfilter data tabel.`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, marketplace: "shopee" | "tiktok") => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsImporting(true);
    try {
      const res = await returService.processExcelImport(file, marketplace, products);
      alert(`✅ Impor Selesai!\n- ${res.updated} Transaksi diubah ke Retur.\n- ${res.created} Paket aman.\n- ${res.pending} SKU Misterius masuk Karantina.`);
      setCurrentPage(1);
    } catch (err) {
      alert("❌ Gagal memproses file Excel.");
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.sku === manualForm.sku.toUpperCase().trim());
    if (!prod) return alert("❌ Kode SKU tidak terdaftar!");

    try {
      await returService.processManualSubmit(manualForm, prod);
      setIsManualModalOpen(false);
      setManualForm({ sku: '', qty: 1, reason: '', kondisi: 'Rusak', marketplace: 'Shopee' });
      setCurrentPage(1);
      alert("✅ Sukses memproses mutasi manual barang gudang.");
    } catch (err) {
      alert("❌ Terjadi kesalahan sistem.");
    }
  };

  const handleStatusChange = async (order: ReturOrder, newStatus: string) => {
    if (order.returFinal) return alert("Pesanan ini sudah bersifat final.");
    
    const orderRef = doc(db, `users/${currentUser?.uid}/sales`, order.id);
    const initialProd = products.find(p => p.sku === order.sku?.toUpperCase().trim());
    const batch = writeBatch(db);

    const tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    const todayString = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

    try {
      if (newStatus === "Selesai") {
        if (initialProd) {
          batch.update(doc(db, `users/${currentUser?.uid}/products`, initialProd.id), { stock: increment(order.qty) });
        }
        batch.update(orderRef, { penanganan: newStatus, returFinal: true, profit: 0 });
        await batch.commit();
        alert("✅ Selesai: Barang masuk kembali ke stok aktif.");
      } else if (["Rusak", "Tidak Kembali"].includes(newStatus)) {
        batch.update(orderRef, { penanganan: newStatus, returFinal: true, profit: 0 });
        const expRef = doc(collection(db, `users/${currentUser?.uid}/expenses`));
        batch.set(expRef, {
          category: "Kerugian Retur (HPP)",
          description: `Retur Rusak - #${order.orderId}`,
          amount: order.hpp || 0,
          paidBy: "SISTEM",
          date: todayString,
          createdAt: serverTimestamp()
        });
        await batch.commit();
        alert("⚠️ Dicatat sebagai kerugian operasional.");
      }
    } catch (err) {
      alert("❌ Gagal merubah status penanganan.");
    }
  };

  // 🚀 TAHAP FILTERING UTAMA (DI RAM LOKAL)
  const filteredData = useMemo(() => {
    return returOrders.filter(item => {
      // 🕵️‍♂️ Lacak Nomor Resi kurir, ID pesanan, atau Nama Produk sekaligus!
      const matchSearch = String(item.orderId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(item.resi || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(item.product || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const currentStatus = item.penanganan || "Proses";
      const matchStatus = statusFilter === "Semua" ? true : currentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [returOrders, searchTerm, statusFilter]);

  // 🚀 TAHAP PAGINATION INTELIDEN (Slice Array di RAM Lokal - 100% Anti-Bocor Reads)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredData, currentPage]);

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20 space-y-6">
      
      {/* HEADER UTAMA */}
      <div className="px-4 sm:px-10 pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#0F172A] uppercase leading-none">Manajemen Retur</h1>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Otomatisasi Karantina SKU & Akuntansi Kerugian Riil</p>
        </div>
        
        {/* BUTTON SCANNER KAMERA FLOATING UNTUK TIM GUDANG */}
        <button 
          onClick={() => setIsScannerActive(!isScannerActive)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-xs transition-all ${
            isScannerActive ? "bg-red-50 text-red-600 border border-red-200" : "bg-[#0047AB] text-white hover:bg-blue-700"
          }`}
        >
          {isScannerActive ? <CameraOff size={14} /> : <ScanLine size={14} />}
          <span>{isScannerActive ? "Tutup Kamera" : "Scan Label Resi"}</span>
        </button>
      </div>

      {/* RENDER MODUL KAMERA HP JIKA AKTIF */}
      {isScannerActive && (
        <div className="px-4 sm:px-10 animate-in fade-in duration-200">
          <BarcodeScanner onScanSuccess={handleBarcodeScanSuccess} />
        </div>
      )}

      <div className="px-4 sm:px-10"><ReturStats stats={stats} /></div>
      
      <div className="px-4 sm:px-10">
        <ReturFilters 
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          isImporting={isImporting} onFileUpload={handleFileUpload}
          onOpenManualModal={() => setIsManualModalOpen(true)}
        />
      </div>

      <div className="px-4 sm:px-10">
        {/* RENDER DATA HALAMAN SEKARANG (MAKSIMAL 10 ITEM) */}
        <ReturDesktopTable items={paginatedData} onStatusChange={handleStatusChange} />
        <ReturMobileGrid items={paginatedData} onStatusChange={handleStatusChange} />

        {/* CONTAINER NAVIGASI PAGINATION 10 BARIS */}
        {filteredData.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} Kasus Retur
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button 
                type="button" 
                onClick={() => setCurrentPage(p => p - 1)} 
                disabled={currentPage === 1} 
                className="p-2 border border-slate-200 text-slate-400 hover:text-[#0047AB] rounded-xl disabled:opacity-20 transition-all cursor-pointer bg-white"
              >
                <ChevronLeft size={15} />
              </button>
              <div className="px-4 py-2 border border-slate-100 rounded-xl text-[10px] font-black text-[#0F172A] bg-slate-50 flex items-center justify-center">
                Halaman {currentPage} dari {totalPages || 1}
              </div>
              <button 
                type="button" 
                onClick={() => setCurrentPage(p => p + 1)} 
                disabled={currentPage === totalPages || totalPages === 0} 
                className="p-2 border border-slate-200 text-slate-400 hover:text-[#0047AB] rounded-xl disabled:opacity-20 transition-all cursor-pointer bg-white"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {filteredData.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 uppercase text-[9px] font-black text-slate-400 tracking-widest">
            <Package size={32} className="mx-auto text-slate-200 mb-2" />
            Tidak ada data kasus retur aktif
          </div>
        )}
      </div>

      <ReturManualModal 
        isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)}
        form={manualForm} setForm={setManualForm} onSubmit={handleManualSubmit}
        products={products}
      />
    </div>
  );
}