"use client";

import React, { useState } from 'react';
import { 
  Search, Bell, HelpCircle, ShoppingBag, 
  Wallet, Info, Upload, MoreHorizontal,
  ChevronRight, Download, Filter,
  Plus, // Pastikan Plus sudah di-import
  TrendingUp as TrendingUpIcon // Alias jika diperlukan
} from "lucide-react";
import * as XLSX from 'xlsx';

// --- KOMPONEN TOOLTIP KUSTOM (Perbaikan Hydration & Centering) ---
const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <span className="group relative inline-flex items-center">
    {children}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-[100] pointer-events-none">
      <span className="relative w-max max-w-[200px] bg-[#0F172A] text-white text-[10px] font-medium py-1.5 px-3 rounded-lg shadow-2xl text-center leading-relaxed whitespace-nowrap">
        {text}
      </span>
      <span className="w-2.5 h-2.5 bg-[#0F172A] rotate-45 -mt-1.5"></span>
    </span>
  </span>
);

export default function PenjualanPage() {
  const [selectedMarketplace, setSelectedMarketplace] = useState("shopee");
  const [filterDate, setFilterDate] = useState("Hari Ini");

  const [transactions, setTransactions] = useState([
    // Data dummy awal
    { id: "#ORD-992120", product: "Meja Kerja Kayu", variant: "Oak Brown", marketplace: "SHOPEE", total: 1250000, status: "Selesai", statusColor: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      /* 
         Mengambil data sebagai array of arrays.
         TikTok Shop seringkali memiliki:
         Row 1: Headers (Order ID, etc)
         Row 2: Description (Platform unique order ID, etc) -> Harus dilewati
         Row 3+: Data Transaksi
      */
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // Ambil Baris 1 sebagai referensi Header
      const headers = data[0];

      // Mulai dari Baris 2 (Indeks 2 jika Row 2 adalah data, atau Indeks 3 jika Row 2 adalah deskripsi)
      // Karena user menyebutkan "Mulai Row 2 itu isi", kita filter baris yang memiliki Order ID valid.
      const rawRows = data.slice(1); 

      const formattedData = rawRows
        .filter(row => row[0] && row[0] !== "Platform unique order ID.") // Skip deskripsi & baris kosong
        .map(row => {
          // Mapping berdasarkan urutan kolom di gambar TikTok Shop
          // 0: Order ID, 1: Order Status, 6: Seller SKU, 7: Product Name, dsb.
          return {
            id: `#${row[0]}`,
            product: row[7] || "Produk Tanpa Nama",
            variant: row[6] || "-", // Menggunakan Seller SKU sebagai varian sementara
            marketplace: "TIKTOK SHOP",
            total: 0, // TikTok biasanya menaruh total di kolom yang lebih jauh ke kanan (misal index 15-20)
            status: mapStatus(row[1]),
            statusColor: row[1] === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
          };
        });

      setTransactions(prev => [...formattedData, ...prev]);
      alert(`${formattedData.length} Transaksi TikTok Shop berhasil diimpor!`);
    };
    reader.readAsBinaryString(file);
  };

  // Helper untuk merapikan status dari bahasa Inggris Excel ke UI
  const mapStatus = (status: string) => {
    if (status === "Completed") return "Selesai";
    if (status === "Awaiting Shipment") return "Diproses";
    return status;
  };

  return (
    /* 
       FIX OVERLAP: 
       - ml-0 di mobile
       - lg:ml-72 di desktop (untuk mengimbangi sidebar)
    */
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300">
      
      {/* --- KONTROL ATAS (HEADER) --- */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-4">
        {/* ml-16 di mobile agar tidak tertutup tombol Hamburger Sidebar */}
        <div className="relative flex-1 lg:flex-none lg:w-96 ml-16 lg:ml-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input 
            type="text" 
            placeholder="Cari analisis..." 
            className="w-full bg-[#EDF2F7] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#0047AB]"
          />
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-4 text-[#64748B]">
            <Bell size={20} className="cursor-pointer hover:text-[#0F172A]" />
            <HelpCircle size={20} className="cursor-pointer hover:text-[#0F172A]" />
          </div>
          <div className="flex items-center space-x-3 border-l pl-6">
            <span className="hidden md:block text-sm font-bold text-[#0F172A]">KIA</span>
            <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center text-xs font-black">K</div>
          </div>
        </div>
      </div>

      {/* --- PAGE TITLE & FILTER --- */}
      <div className="px-4 sm:px-10 mt-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Penjualan</h1>
            <p className="text-[#64748B] mt-1 text-sm font-medium leading-tight">
              Pantau arus kas dan performa transaksi marketplace Anda secara real-time.
            </p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-sm self-start lg:self-center">
            {["Hari Ini", "3 Hari", "Bulan Ini"].map((item) => (
              <button
                key={item}
                onClick={() => setFilterDate(item)}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                  filterDate === item ? "bg-[#0047AB] text-white shadow-md" : "text-[#64748B] hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Total Omset */}
        <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm relative overflow-visible group">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center">
                Total Omset 
                <Tooltip text="Total nilai transaksi kotor sebelum dipotong modal.">
                  <Info size={12} className="ml-1 opacity-40" />
                </Tooltip>
              </p>
              <h3 className="text-[38px] font-black text-[#0F172A] tracking-tight">Rp 428.590.000</h3>
            </div>
            <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><ShoppingBag size={20} /></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-lg text-[10px] font-black italic">
               +12.4%
            </div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-tighter">vs bulan lalu</span>
          </div>
          <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-[#0047AB] rounded-tr-full rounded-bl-[28px]"></div>
        </div>

        {/* Total Modal */}
        <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm relative overflow-visible group">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center">
                Total Modal Keluar
                <Tooltip text="Akumulasi biaya HPP dan biaya operasional.">
                  <Info size={12} className="ml-1 opacity-40" />
                </Tooltip>
              </p>
              <h3 className="text-[38px] font-black text-[#0F172A] tracking-tight">Rp 328.590.000</h3>
            </div>
            <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><Wallet size={20} /></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-[#0047AB] bg-[#F0F7FF] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase italic">
              Stabil
            </div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-tighter">Arus kas lancar</span>
          </div>
          <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-[#E2E8F0] rounded-tr-full rounded-bl-[28px]"></div>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="px-4 sm:px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: IMPORT DATA */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[28px] border border-[#F1F5F9] shadow-sm">
            <h4 className="text-xl font-black text-[#0F172A] tracking-tight">Impor Data Marketplace</h4>
            <p className="text-xs text-[#94A3B8] font-medium mt-2 leading-relaxed">
              Sinkronisasi data transaksi otomatis dari kanal penjualan Anda untuk laporan yang lebih akurat.
            </p>

            {/* Marketplace Selectors */}
            <div className="mt-8 space-y-3">
              {[
                { id: 'shopee', name: 'Shopee', color: 'border-[#EE4D2D] text-[#EE4D2D]' },
                { id: 'tiktok', name: 'TikTok Shop', color: 'border-black text-black' },
                { id: 'lazada', name: 'Lazada', color: 'border-[#00008F] text-[#00008F]' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMarketplace(m.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all font-bold text-sm ${
                    selectedMarketplace === m.id ? `${m.color} bg-slate-50 shadow-inner` : "border-[#F1F5F9] text-[#64748B] hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-4 ${selectedMarketplace === m.id ? m.color : "border-slate-200"}`}></div>
                    <ShoppingBag size={18} />
                    <span>{m.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* --- DROPZONE DENGAN INPUT FILE ASLI --- */}
            <div className="relative mt-6 group">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-[#E2E8F0] rounded-2xl p-10 flex flex-col items-center justify-center text-center group-hover:bg-slate-50 transition-all">
                <div className="w-12 h-12 bg-[#F0F7FF] text-[#0047AB] rounded-xl flex items-center justify-center mb-4">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-black text-[#0F172A]">Klik atau seret file Excel</p>
                <p className="text-[10px] font-bold text-[#94A3B8] mt-1 uppercase tracking-tighter">Khusus Format TikTok Shop</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: RECENT TRANSACTIONS */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[28px] border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 flex items-center justify-between border-b border-[#F8F9FB]">
              <h4 className="text-xl font-black text-[#0F172A] tracking-tight">Transaksi Terbaru</h4>
              <button className="text-[#0047AB] text-sm font-black uppercase tracking-wider hover:underline flex items-center transition-all">
                Lihat Semua <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F8F9FB]">
                  <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                    <th className="px-8 py-5">ID Pesanan</th>
                    <th className="px-6 py-5">Produk</th>
                    <th className="px-6 py-5">Marketplace</th>
                    <th className="px-6 py-5">Total Bayar</th>
                    <th className="px-6 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F9FB]">
                  {transactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6 text-sm font-black text-[#0047AB] cursor-pointer hover:underline">{t.id}</td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#0F172A] leading-tight">{t.product}</span>
                          <span className="text-[10px] font-bold text-[#94A3B8] mt-1">Varian: {t.variant}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-md border ${
                          t.marketplace === 'SHOPEE' ? "bg-orange-50 text-orange-600 border-orange-100" :
                          t.marketplace === 'TIKTOK SHOP' ? "bg-slate-100 text-slate-800 border-slate-200" :
                          "bg-blue-50 text-blue-800 border-blue-100"
                        }`}>
                          {t.marketplace}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-sm font-black text-[#0F172A]">
                        Rp {t.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end space-x-3">
                           <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black flex items-center ${t.statusColor}`}>
                             <div className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse"></div>
                             {t.status}
                           </div>
                           <button className="p-2 text-[#94A3B8] hover:text-[#0F172A] opacity-0 group-hover:opacity-100 transition-opacity">
                             <MoreHorizontal size={18} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-[#F8F9FB] text-center mt-auto">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Menampilkan 3 dari 1,284 Transaksi</p>
            </div>
          </div>
        </div>

      </div>

      {/* --- FLOATING ACTION BUTTON --- */}
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-[#0047AB] text-white rounded-2xl shadow-[0_15px_35px_rgba(0,71,171,0.3)] flex items-center justify-center hover:scale-105 transition-all active:scale-95 z-30 group">
        <Plus 
          className="w-8 h-8 group-hover:rotate-90 transition-transform" 
          strokeWidth={3} 
        />
      </button>

    </div>
  );
}