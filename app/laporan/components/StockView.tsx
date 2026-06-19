// app/inventaris/laporan/components/StockView.tsx
"use client";

import React, { useMemo } from 'react';
import { Package, CalendarClock, Trophy, Layers, ArrowUpRight, AlertCircle, Coins } from 'lucide-react';

interface StockViewProps {
  stockStats: any;
  financials: any;
  currentMonthName: string;
  products: any[];
  sales: any[]; 
}

export const StockView = ({ stockStats, financials, currentMonthName, products = [] , sales = [] }: StockViewProps) => {

  // 🚀 LOGIKA ANALISIS OPERASIONAL LALU-LINTAS GUDANG (0 READS - 100% RAM LOKAL)
  const { deadStockProducts, restockRecommendations, totalDeadCapital } = useMemo(() => {
    const realSalesTracker: Record<string, number> = {};
    
    sales.forEach(sale => {
      if (Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          if (item.sku) {
            const skuKey = String(item.sku).toUpperCase().trim();
            realSalesTracker[skuKey] = (realSalesTracker[skuKey] || 0) + (Number(item.qty || item.quantity || 1));
          }
        });
      } else if (sale.sku) {
        const skuKey = String(sale.sku).toUpperCase().trim();
        realSalesTracker[skuKey] = (realSalesTracker[skuKey] || 0) + (Number(sale.qty || 1));
      }
    });

    let deadCapitalAccumulator = 0;

    const ledger = products.map(p => {
      const currentStock = Number(p.stock) || 0;
      const cost = Number(p.costPrice || p.capitalPrice || 0);
      const skuUpper = String(p.sku || "").toUpperCase().trim();
      
      const unitsSoldThisMonth = realSalesTracker[skuUpper] || 0; 
      const dailyVelocity = unitsSoldThisMonth / 30; 

      let daysLeftNum = 999; // Default jika tidak berputar
      let daysLeftStr = "Tidak Berputar";
      
      if (dailyVelocity > 0) {
        daysLeftNum = Math.ceil(currentStock / dailyVelocity);
        daysLeftStr = `${daysLeftNum} Hari`;
      } else if (currentStock <= 0) {
        daysLeftNum = 0;
        daysLeftStr = "Habis";
      }

      // Klasifikasi Status Perputaran Akurat
      let velocityStatus = "Slow-Moving";
      if (unitsSoldThisMonth >= 15) velocityStatus = "Fast-Moving";
      
      if (currentStock > 0 && unitsSoldThisMonth === 0) {
        velocityStatus = "Dead Stock";
        deadCapitalAccumulator += (currentStock * cost); // Akumulasikan modal mati ruko
      } 

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        stock: currentStock,
        valuation: currentStock * cost,
        status: velocityStatus,
        durationLeftStr: daysLeftStr,
        durationLeftNum: daysLeftNum,
        unitsSold: unitsSoldThisMonth
      };
    });

    const dead = ledger.filter(item => item.status === "Dead Stock");
    
    // Menyaring barang jualan produktif yang laku minimal 3 unit bulan ini
    const restock = ledger.filter(item => item.unitsSold >= 3);

    return {
      deadStockProducts: dead,
      restockRecommendations: restock,
      totalDeadCapital: deadCapitalAccumulator
    };
  }, [products, sales]);

  return (
    <div className="mt-6 space-y-6 animate-in fade-in duration-300 w-full">
      
      {/* 📱 BARIS 1: KARTU FISIK GUDANG SEJAJAR DI MOBILE */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Keluar</p>
          <h3 className="text-[10px] sm:text-xs md:text-lg lg:text-xl font-black text-orange-600 truncate mt-1">
            {stockStats.unitOut?.toLocaleString('id-ID') || 0} Pcs
          </h3>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Masuk</p>
          <h3 className="text-[10px] sm:text-xs md:text-lg lg:text-xl font-black text-blue-600 truncate mt-1">
            {stockStats.unitIn?.toLocaleString('id-ID') || 0} Pcs
          </h3>
        </div>

        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Stok Kritis</p>
          <h3 className={`text-[10px] sm:text-xs md:text-lg lg:text-xl font-black truncate mt-1 ${stockStats.lowStockCount > 0 ? "text-red-500" : "text-slate-700"}`}>
            {stockStats.lowStockCount || 0} SKU
          </h3>
        </div>
      </div>

      {/* 👑 BARIS 2: DUA KARTU VALUASI UTAMA GUDANG (PONDASI KAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* KARTU LEFT: VALUASI TOTAL ASET */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700"><Package size={18} strokeWidth={2.5} /></div>
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Valuasi Modal Aset Gudang</p>
            <h2 className="text-base sm:text-xl font-black tracking-tight text-slate-800 mt-0.5">
              Rp {Math.round(financials.totalValuation || 0).toLocaleString('id-ID')}
            </h2>
          </div>
        </div>

        {/* 🚀 KARTU RIGHT (METRIK BARU): TOTAL MODAL MATI YANG TERKUNCI DI RAK */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-500"><Coins size={18} strokeWidth={2.5} /></div>
          <div>
            <p className="text-[8px] sm:text-[9px] font-black text-red-400 uppercase tracking-widest">Modal Beku Tertahan di Barang Mati</p>
            <h2 className="text-base sm:text-xl font-black tracking-tight text-red-600 mt-0.5">
              Rp {Math.round(totalDeadCapital).toLocaleString('id-ID')}
            </h2>
          </div>
        </div>
      </div>

      {/* 🎖️ BARIS 3: REKAP KOTAK PEMILIK UNIT TERBANYAK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0"><Trophy size={20} strokeWidth={2.5} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Produk Terlaris ({currentMonthName})</p>
            <h4 className="text-xs sm:text-sm font-black text-[#0047AB] truncate mt-1 uppercase">{stockStats.mostSold?.[0] || "Belum Ada Data"}</h4>
            <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase">Keluar {stockStats.mostSold?.[1] || 0} Unit Bulan Ini</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-[#0047AB] rounded-xl shrink-0"><Layers size={20} strokeWidth={2.5} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Tumpukan Stok Fisik Terbanyak</p>
            <h4 className="text-xs sm:text-sm font-black text-[#0F172A] truncate mt-1 uppercase">{stockStats.topInventory?.name || "Belum Ada Data"}</h4>
            <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase">Tersedia {stockStats.topInventory?.stock || 0} Pcs Ready</p>
          </div>
        </div>
      </div>

      {/* 📋 BARIS 4: TABEL EVALUASI KHUSUS DEAD STOCK */}
      <div className="bg-white p-4 sm:p-6 rounded-[28px] border border-slate-100 shadow-xs w-full">
        <div className="mb-4">
          <h4 className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={14} strokeWidth={2.5} />
            <span>Daftar Evaluasi Umur Barang Macet (Dead Stock Riil)</span>
          </h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Daftar produk ruko yang tersimpan utuh di rak tanpa ada penjualan sama sekali bulan ini</p>
        </div>

        <div className="w-full max-h-60 overflow-y-auto no-scrollbar border border-slate-50 rounded-xl">
          {deadStockProducts.length > 0 ? (
            <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
              <thead className="sticky top-0 bg-white z-10 shadow-xs">
                <tr className="border-b border-slate-100 font-black text-slate-400 uppercase tracking-wider bg-slate-50 rounded-xl">
                  <th className="py-3 px-3">Kode SKU</th>
                  <th className="py-3 px-2">Nama Varian Produk</th>
                  <th className="py-3 px-2 text-center">Stok Rak</th>
                  <th className="py-3 px-3 text-right">Valuasi Modal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 font-bold uppercase text-[#1E293B]">
                {deadStockProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50/20 transition-colors">
                    <td className="py-3.5 px-3 text-red-600 font-black tracking-tight">{item.sku}</td>
                    <td className="py-3.5 px-2 max-w-[160px] truncate text-slate-600">{item.name}</td>
                    <td className="py-3.5 px-2 text-center font-black text-slate-900">{item.stock} Pcs</td>
                    <td className="py-3.5 px-3 text-right font-black text-[#0F172A]">
                      Rp {Math.round(item.valuation).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-emerald-600 bg-emerald-50/20 text-[9px] font-black uppercase tracking-wider rounded-xl">
              🎉 Bagus! Seluruh SKU produk bergerak aktif mencatat penjualan bulan ini.
            </div>
          )}
        </div>
      </div>

      {/* 📋 BARIS 5: TABEL REKOMENDASI KULAKAN (DENGAN CO-DETEKSI OVER-STOCK) */}
      <div className="bg-white p-4 sm:p-6 rounded-[28px] border border-slate-100 shadow-xs w-full">
        <div className="mb-4">
          <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarClock size={14} strokeWidth={2.5} />
            <span>Rekomendasi Order Belanja Ulang & Kontrol Over-Stock</span>
          </h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Analisis aman tanggal kulakan ke supplier berdasarkan daya tahan sisa stok aktif di rak</p>
        </div>

        <div className="w-full max-h-60 overflow-y-auto no-scrollbar border border-slate-50 rounded-xl">
          {restockRecommendations.length > 0 ? (
            <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
              <thead className="sticky top-0 bg-white z-10 shadow-xs">
                <tr className="border-b border-slate-100 font-black text-slate-400 uppercase tracking-wider bg-slate-50 rounded-xl">
                  <th className="py-3 px-3">Kode SKU</th>
                  <th className="py-3 px-2">Nama Barang</th>
                  <th className="py-3 px-2 text-center">Terjual</th>
                  <th className="py-3 px-2 text-center">Sisa Stok</th>
                  <th className="py-3 px-3 text-right">Daya Tahan Rak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 font-bold uppercase text-[#1E293B]">
                {restockRecommendations.map((item) => {
                  // 🚀 LOGIKA INDIKATOR AMAN: Jika stok melimpah ruah di atas 90 hari, tandai aman setop belanja
                  const isOverStock = item.durationLeftNum >= 90;

                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="py-3.5 px-3 text-[#0047AB] font-black tracking-tight">{item.sku}</td>
                      <td className="py-3.5 px-2 max-w-[150px] truncate text-slate-600">{item.name}</td>
                      <td className="py-3.5 px-2 text-center font-black text-emerald-600">{item.unitsSold} Unit</td>
                      <td className={`py-3.5 px-2 text-center font-black ${item.stock < 10 ? "text-red-500" : "text-slate-900"}`}>{item.stock} Pcs</td>
                      <td className="py-3.5 px-3 text-right font-black">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] ${
                          isOverStock ? "bg-blue-50 text-blue-600 font-black" : "text-orange-600"
                        }`}>
                          {isOverStock ? "Over-Stock (Aman)" : item.durationLeftStr}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-slate-400 bg-slate-50/40 text-[9px] font-black uppercase tracking-wider rounded-xl">
              Belum ada produk yang menyentuh angka penjualan 3 unit di bulan berjalan ini.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};