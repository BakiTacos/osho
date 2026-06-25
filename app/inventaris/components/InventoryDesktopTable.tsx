// app/inventaris/components/InventoryDesktopTable.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { MoreVertical, CheckCircle2, MapPin } from 'lucide-react';
import { Product } from '../types/inventory';

interface DesktopTableProps {
  items: Product[];
  inventoryService: any;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  editingStockId: string | null;
  setEditingStockId: (id: string | null) => void;
  tempStock: number;
  setTempStock: (num: number) => void;
  onUpdateStock: (id: string) => void;
  onDelete: (id: string) => void;
  viewMode: "semua" | "harga" | "stok";
}

export const InventoryDesktopTable = ({ 
  items, inventoryService, activeMenuId, setActiveMenuId, 
  editingStockId, setEditingStockId, tempStock, setTempStock, 
  onUpdateStock, onDelete, viewMode 
}: DesktopTableProps) => {
  
  const showHarga = viewMode === "semua" || viewMode === "harga";
  const showStok = viewMode === "semua" || viewMode === "stok";

  const renderMargin = (mpData: any) => {
    if (!mpData || typeof mpData.margin === 'undefined' || isNaN(mpData.margin)) {
      return "0%";
    }
    return `${Math.round(mpData.margin)}%`;
  };

  return (
    <div className="hidden lg:block bg-white rounded-[28px] border border-[#F1F5F9] shadow-xs overflow-hidden min-h-[500px]">
      <div className="overflow-x-auto no-scrollbar">
        {/* 🚀 PERBAIKAN MUTLAK: Komentar dipindahkan ke atas div/luar table, tag table murni tanpa spasi/komentar di dalamnya */}
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
            <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
              <th className="px-8 py-5">Nama Barang</th>
              <th className="px-6 py-5">SKU Toko</th>
              <th className="px-6 py-5">Lokasi Rak</th>
              {showHarga && (
                <>
                  <th className="px-6 py-5 text-right">Harga Modal</th>
                  <th className="px-6 py-5 text-right">Harga Jual</th>
                  <th className="px-4 py-5 text-center bg-orange-50/20 border-x border-orange-100/50">Profit Shopee</th>
                  <th className="px-4 py-5 text-center bg-slate-50 border-x border-slate-100">Profit TikTok (Zonasi)</th>
                  <th className="px-4 py-5 text-center bg-blue-50/20 border-x border-blue-100/50">Profit Lazada</th>
                </>
              )}
              {showStok && <th className="px-6 py-5 text-center">Stok Gudang</th>}
              <th className="px-8 py-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F8F9FB]">
            {items.map((p) => {
              const estData = inventoryService.getMarketplaceEstimation(p);
              if (!estData) return null;

              const txLokal = estData.results["tiktok"];

              return (
                <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#0F172A] uppercase leading-tight">{p.name}</span>
                      {p.isMapping && <span className="text-[9px] font-bold text-[#0047AB] mt-1 uppercase">🗂️ Terhubung: {p.linkedSku}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-[#64748B] uppercase">{p.sku}</td>
                  
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wide">
                        {p.location || "-"}
                      </span>
                    </div>
                  </td>
                  
                  {showHarga && (
                    <>
                      <td className="px-6 py-5 text-right font-black text-xs text-[#0F172A]">Rp {(estData.actualCost * estData.multiplier).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-5 text-right font-black text-xs text-[#0F172A]">Rp {p.price.toLocaleString('id-ID')}</td>
                      
                      <td className="px-4 py-5 text-center text-xs font-black">
                        {estData.results["shopee"] ? (
                          <div className="flex flex-col items-center">
                            <span className={estData.results["shopee"].netProfit > 0 ? "text-emerald-600" : "text-red-500"}>
                              Rp {Math.round(estData.results["shopee"].netProfit).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 mt-0.5">({renderMargin(estData.results["shopee"])})</span>
                          </div>
                        ) : <span className="text-slate-300 italic">N/A</span>}
                      </td>

                      <td className="px-4 py-5 text-center bg-slate-50 border-x border-slate-100 relative group/tk">
                        <div className="flex flex-col gap-1.5 justify-center items-center">
                          <div className="flex flex-col items-center text-[11px]">
                            {txLokal ? (
                              <>
                                <span className={txLokal.netProfit > 0 ? "text-emerald-600 font-black" : "text-red-500 font-black"}>
                                  Lokal: Rp {Math.round(txLokal.netProfit).toLocaleString('id-ID')}
                                </span>
                                <span className="text-[9px] font-black text-slate-400">({renderMargin(txLokal)})</span>
                              </>
                            ) : <span className="text-slate-300 italic">Lokal: N/A</span>}
                          </div>

                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/tk:block w-64 bg-[#0F172A] text-white p-4 rounded-2xl shadow-xl z-[120] pointer-events-none text-left">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-700 pb-1 text-center">Rincian Komparasi Regional Lengkap</p>
                            <div className="space-y-1.5">
                              {inventoryService.getTikTokRegionBreakdown(p).map((reg: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-[10px]">
                                  <span className="text-slate-400 uppercase tracking-tight">{reg.regionName}</span>
                                  <span className={`font-black ${reg.netProfit > 0 ? "text-emerald-400" : "text-red-400"}`}>Rp {Math.round(reg.netProfit).toLocaleString('id-ID')}</span>
                                </div>
                              ))}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F172A] rotate-45 -mt-1"></div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5 text-center text-xs font-black">
                        {estData.results["lazada"] ? (
                          <div className="flex flex-col items-center">
                            <span className={estData.results["lazada"].netProfit > 0 ? "text-emerald-600" : "text-red-500"}>
                              Rp {Math.round(estData.results["lazada"].netProfit).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 mt-0.5">({renderMargin(estData.results["lazada"])})</span>
                          </div>
                        ) : <span className="text-slate-300 italic">N/A</span>}
                      </td>
                    </>
                  )}

                  {showStok && (
                    <td className="px-6 py-5 text-center">
                      {editingStockId === p.id ? (
                        <div className="flex items-center justify-center space-x-1">
                          <input autoFocus type="number" className="w-16 p-1 border border-[#0047AB] rounded text-center text-xs font-black" value={tempStock} onChange={(e) => setTempStock(Number(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && onUpdateStock(p.id)} />
                          <button type="button" onClick={() => onUpdateStock(p.id)} className="text-emerald-600 cursor-pointer"><CheckCircle2 size={16}/></button>
                        </div>
                      ) : (
                        <div onClick={() => { setEditingStockId(p.id); setTempStock(p.stock); }} className="cursor-pointer inline-block text-xs font-black px-4 py-1.5 rounded-lg text-[#0F172A] hover:bg-slate-100">{p.stock} Pcs</div>
                      )}
                    </td>
                  )}

                  <td className="px-8 py-5 text-right relative">
                    <button type="button" onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)} className="p-2 text-[#94A3B8] hover:text-slate-600 cursor-pointer"><MoreVertical size={16} /></button>
                    {activeMenuId === p.id && (
                      <div className="absolute right-10 top-12 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-[11px] font-black">
                        <Link href={`/inventaris/edit/${p.id}`} className="block px-4 py-2.5 text-slate-600 hover:bg-slate-50">EDIT BARANG</Link>
                        <button type="button" onClick={() => onDelete(p.id)} className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50 cursor-pointer">HAPUS DATA</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};