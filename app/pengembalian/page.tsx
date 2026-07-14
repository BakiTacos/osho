// app/inventaris/pengembalian/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useAuth } from "../../context/AuthContext";
import { useReturData } from "./hooks/useReturData";
import { ReturService } from "./services/ReturService";

import { ReturStats } from "./components/ReturStats";
import { ReturFilters } from "./components/ReturFilters";
import { ReturManualModal } from "./components/ReturManualModal";
import { MysteriousReturnModal } from "./components/MysteriousReturnModal"; 
import { ReturDesktopTable } from "./components/ReturDesktopTable";
import { ReturMobileGrid } from "./components/ReturMobileGrid";
import BarcodeScanner from "./components/BarcodeScanner"; 

import { Package, ChevronLeft, ChevronRight, ScanLine, Loader2 } from "lucide-react";
import { ReturOrder, AfkirFormState, MysteriousReturnFormState } from "./types/retur";

export default function PengembalianPage() {
  const { currentUser } = useAuth();
  const { products, returOrders, stats, loading } = useReturData(currentUser);
  const returService = useMemo(() => new ReturService(currentUser?.uid || ""), [currentUser]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Proses");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isAfkirModalOpen, setIsAfkirModalOpen] = useState(false);
  const [isMysteriousModalOpen, setIsMysteriousModalOpen] = useState(false);

  const [afkirForm, setAfkirForm] = useState<AfkirFormState>({ 
    sku: '', qty: 1, reason: '', kondisi: 'Rusak', marketplace: 'Gudang Offline' 
  });
  
  const [mysteriousForm, setMysteriousForm] = useState<MysteriousReturnFormState>({
    orderIdOrResi: '', sku: '', qty: 1, marketplace: 'Shopee', reason: '', penanganan: 'Proses'
  });

  // 🚀 KUNCI PERBAIKAN: PENERAPAN INTEGRASI HYPER-SANITIZED HASIL SCAN BARCODE
  const handleBarcodeScanSuccess = (decodedText: string) => {
    setIsScannerActive(false);

    // 🌟 STERILISASI TOTAL: Kikis habis semua spasi biasa, spasi gaib Excel (\u00A0), dan paksa kapitalisasi murni
    const hasilScanSteril = String(decodedText || "")
      .replace(/[\s\u00A0]+/g, '')
      .toUpperCase()
      .trim();

    if (!hasilScanSteril) return alert("❌ Barcode tidak terbaca dengan jelas. Silakan coba lagi.");

    // Lakukan pencarian silang di RAM lokal dengan format string yang sudah sama-sama steril
    const matchFound = returOrders.find((order) => {
      const cleanOrderId = String(order.orderId || "").replace(/[\s\u00A0]+/g, '').toUpperCase().trim();
      const cleanResi = String(order.resi || "").replace(/[\s\u00A0]+/g, '').toUpperCase().trim();

      return cleanOrderId === hasilScanSteril || cleanResi === hasilScanSteril;
    });

    if (matchFound) {
      setSearchTerm(hasilScanSteril); // Isi filter pencarian dengan string steril
      setCurrentPage(1);
      alert(`📦 DATA COCOK!\nPaket terdaftar atas nama produk:\n"${matchFound.product}".\nSilakan tentukan keputusan akhir penanganan.`);
    } else {
      // Jika zonk, lempar string steril langsung sebagai ID paket misterius baru
      setMysteriousForm({
        orderIdOrResi: hasilScanSteril,
        sku: '',
        qty: 1,
        marketplace: 'Shopee',
        reason: 'Paket retur fisik datang namun nomor resi pengiriman tidak ditemukan di data jualan ruko.',
        penanganan: 'Pending SKU' 
      });
      setIsMysteriousModalOpen(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, marketplace: "shopee" | "tiktok") => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsImporting(true);
    try {
      const res = await returService.processExcelImport(file, marketplace, products);
      alert(`✅ Impor Selesai!\n- ${res.updated} Transaksi diubah ke Retur.\n- ${res.created} Paket aman.\n- ${res.pending} SKU Misterius masuk Karantina.`);
      setCurrentPage(1);
    } catch (err) { alert("❌ Gagal memproses file Excel."); } 
    finally { setIsImporting(false); e.target.value = ''; }
  };

  const handleAfkirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.sku === afkirForm.sku.toUpperCase().trim());
    if (!prod) return alert("❌ Kode SKU tidak terdaftar!");
    try {
      await returService.processManualSubmit(afkirForm, prod);
      setIsAfkirModalOpen(false);
      setAfkirForm({ sku: '', qty: 1, reason: '', kondisi: 'Rusak', marketplace: 'Gudang Offline' });
      setCurrentPage(1);
      alert("✅ Sukses mencatat data penyusutan internal gudang.");
    } catch (err) { alert("❌ Gagal memproses data."); }
  };

  const handleMysteriousSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.sku === mysteriousForm.sku.toUpperCase().trim());
    if (!prod) return alert("❌ Kode SKU tidak terdaftar!");
    try {
      await returService.processMysteriousReturn(mysteriousForm, prod);
      setIsMysteriousModalOpen(false);
      setSearchTerm(mysteriousForm.orderIdOrResi); 
      setCurrentPage(1);
      alert(`✅ Sukses mendaftarkan paket misterius #${mysteriousForm.orderIdOrResi} ke barisan Karantina.`);
    } catch (err) { alert("❌ Gagal mendaftarkan paket."); }
  };

  // --- LOGIKA FILTERING ---
  const filteredData = useMemo(() => {
    return returOrders.filter(item => {
      const matchSearch = String(item.orderId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(item.resi || "").toLowerCase().includes(searchTerm.toLowerCase()) || // Ikut membaca nomor resi di filter list tabel
                          String(item.product || "").toLowerCase().includes(searchTerm.toLowerCase());
      const currentStatus = item.penanganan || "Proses";
      const matchStatus = statusFilter === "Semua" ? true : currentStatus === statusFilter;

      const createdDate = item.createdAt?.toDate ? item.createdAt.toDate() : (item.date ? new Date(item.date) : null);
      let matchTime = true;
      if (createdDate) {
        matchTime = createdDate.getMonth() === selectedMonth && createdDate.getFullYear() === selectedYear;
      }

      return matchSearch && matchStatus && matchTime;
    });
  }, [returOrders, searchTerm, statusFilter, selectedMonth, selectedYear]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredData, currentPage]);

  const handleStatusChange = async (order: ReturOrder, newStatus: string) => {
    try {
      await returService.handleStatusChangeBatch(order, newStatus);
      alert(`✅ Status penanganan berhasil diubah menjadi ${newStatus}`);
    } catch (err) {
      alert("❌ Gagal memperbarui status penanganan retur.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <Loader2 className="animate-spin text-[#0047AB]" size={32} />
      </div>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20 space-y-6">
      
      {/* HEADER BAR INDAH */}
      <div className="px-4 sm:px-10 pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#0F172A] uppercase leading-none">Manajemen Retur</h1>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Otomatisasi Karantina SKU & Akuntansi Kerugian Riil</p>
        </div>
        
        <button 
          type="button"
          onClick={() => setIsScannerActive(true)}
          className="flex items-center gap-2 bg-[#0047AB] text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
        >
          <ScanLine size={14} />
          <span>Buka Kamera Scanner</span>
        </button>
      </div>

      {/* 📸 FULL SCREEN CAMERA INTERFACE TRIGGER */}
      {isScannerActive && (
        <BarcodeScanner 
          onScanSuccessAction={handleBarcodeScanSuccess} 
          onCloseAction={() => setIsScannerActive(false)} 
        />
      )}

      <div className="px-4 sm:px-10"><ReturStats stats={stats} /></div>
      
      <div className="px-4 sm:px-10">
        <ReturFilters 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} 
          setStatusFilter={setStatusFilter}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          isImporting={isImporting} 
          onFileUpload={handleFileUpload}
          onOpenManualModal={() => setIsAfkirModalOpen(true)} 
          onOpenMysteriousModal={() => {
            setMysteriousForm({
              orderIdOrResi: '',
              sku: '',
              qty: 1,
              marketplace: 'Shopee',
              reason: 'Input manual langsung dari gudang operasional ruko.',
              penanganan: 'Pending SKU' 
            });
            setIsMysteriousModalOpen(true);
          }}
        />
      </div>

      <div className="px-4 sm:px-10">
        <ReturDesktopTable items={paginatedData} onStatusChange={handleStatusChange} />
        <ReturMobileGrid items={paginatedData} onStatusChange={handleStatusChange} />

        {/* CONTAINER NAVIGATION PAGINATION */}
        {filteredData.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} Kasus Retur
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button type="button" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 border border-slate-200 text-slate-400 hover:text-[#0047AB] rounded-xl disabled:opacity-20 bg-white"><ChevronLeft size={15} /></button>
              <div className="px-4 py-2 border border-slate-100 rounded-xl text-[10px] font-black text-[#0F172A] bg-slate-50 flex items-center justify-center">Halaman {currentPage} dari {totalPages || 1}</div>
              <button type="button" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-200 text-slate-400 hover:text-[#0047AB] rounded-xl disabled:opacity-20 bg-white"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}

        {filteredData.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 uppercase text-[9px] font-black text-slate-400 tracking-widest"><Package size={32} className="mx-auto text-slate-200 mb-2" />Tidak ada data retur sesuai filter</div>
        )}
      </div>

      <ReturManualModal 
        isOpen={isAfkirModalOpen} onClose={() => setIsAfkirModalOpen(false)}
        form={afkirForm} setForm={setAfkirForm} onSubmit={handleAfkirSubmit}
        products={products}
      />

      <MysteriousReturnModal
        isOpen={isMysteriousModalOpen} onClose={() => setIsMysteriousModalOpen(false)}
        form={mysteriousForm} setForm={setMysteriousForm} onSubmit={handleMysteriousSubmit}
        products={products}
      />

    </div>
  );
}