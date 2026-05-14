import React, { useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight, ShoppingBag, Info } from "lucide-react";

export default function SalesTable({ items, selectedIds, setSelectedIds, onDeleteBulk, onDeleteSingle, onStatusUpdate }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="lg:col-span-8 space-y-4">
      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex justify-between items-center bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-black text-red-600 uppercase">{selectedIds.length} Item Terpilih</p>
          <button onClick={onDeleteBulk} className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase flex items-center gap-2 shadow-lg shadow-red-100 hover:bg-red-700 transition-all">
            <Trash2 size={14} /> Hapus
          </button>
        </div>
      )}

      <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9] text-[9px] sm:text-[10px] font-black text-[#94A3B8] uppercase">
              <tr>
                <th className="px-6 py-5 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded text-[#0047AB] cursor-pointer"
                    checked={selectedIds.length === currentItems.length && currentItems.length > 0}
                    onChange={(e) => setSelectedIds(e.target.checked ? currentItems.map((i:any) => i.id) : [])} 
                  />
                </th>
                <th className="px-4 py-5">Item & Sumber</th>
                <th className="px-4 py-5 text-right">Qty</th>
                <th className="px-6 py-5 text-right">Net Profit</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map((t: any) => {
                // Kalkulasi adminFee secara dinamis untuk Tooltip
                const total = Number(t.total) || 0;
                const hpp = Number(t.hpp) || 0;
                const logistik = Number(t.logisticsFee) || 0;
                const profit = Number(t.profit) || 0;
                const adminFee = Math.round(total - hpp - logistik - profit);

                return (
                  <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors group ${t.product === "Produk Luar Katalog" ? "bg-red-50/30" : ""}`}>
                    <td className="px-6 py-5">
                      <input 
                        type="checkbox" 
                        className="rounded text-[#0047AB] cursor-pointer"
                        checked={selectedIds.includes(t.id)} 
                        onChange={() => setSelectedIds((prev:any) => prev.includes(t.id) ? prev.filter((x:any) => x !== t.id) : [...prev, t.id])} 
                      />
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col max-w-[250px]">
                        <span className={`text-sm font-black leading-tight uppercase truncate ${t.product === "Produk Luar Katalog" ? "text-red-600" : "text-[#0F172A]"}`}>
                          {t.product}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter border ${
                            t.marketplace?.toLowerCase() === 'shopee' ? "bg-orange-50 text-orange-600 border-orange-100" : 
                            t.marketplace?.toLowerCase() === 'tiktok' ? "bg-slate-900 text-white border-slate-800" : 
                            "bg-blue-50 text-blue-600 border-blue-100"
                          }`}>
                            {t.marketplace}
                          </span>
                          <span className="text-[9px] font-bold text-[#0047AB] tracking-tighter">#{t.orderId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right font-black text-xs text-slate-400">{t.qty}</td>
                    
                    {/* TOOLTIP PROFIT SECTION */}
                    <td className="px-6 py-5 text-right relative group/tooltip">
                      <div className="cursor-help inline-flex flex-col items-end">
                        <span className={`text-sm font-black ${t.status === 'Retur' ? 'text-slate-300 line-through' : 'text-emerald-600'}`}>
                          Rp {profit.toLocaleString('id-ID')}
                        </span>
                        <span className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase tracking-widest border-b border-dashed border-slate-300 mt-1">
                          Rincian <Info size={8} />
                        </span>
                      </div>

                      {/* TOOLTIP CONTENT */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 hidden group-hover/tooltip:flex flex-col w-56 bg-[#0F172A] text-white p-4 rounded-2xl shadow-2xl z-[100] text-[10px] pointer-events-none transition-all animate-in fade-in slide-in-from-right-2">
                        <p className="font-black border-b border-slate-700 pb-2 mb-3 text-slate-400 uppercase tracking-[0.2em] text-[9px] text-left">Breakdown Biaya</p>
                        
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">Revenue:</span> 
                          <span className="font-bold text-emerald-400">Rp {total.toLocaleString('id-ID')}</span>
                        </div>
                        
                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">Modal (HPP):</span> 
                          <span className="font-bold text-red-400">-Rp {hpp.toLocaleString('id-ID')}</span>
                        </div>

                        <div className="flex justify-between mb-2">
                          <span className="text-slate-300">Biaya Admin:</span> 
                          <span className="font-bold text-orange-400">-Rp {adminFee.toLocaleString('id-ID')}</span>
                        </div>

                        {logistik > 0 && (
                          <div className="flex justify-between mb-2">
                            <span className="text-slate-300">Logistik:</span> 
                            <span className="font-bold text-orange-400">-Rp {logistik.toLocaleString('id-ID')}</span>
                          </div>
                        )}

                        <div className="flex justify-between mt-2 pt-3 border-t border-slate-700 font-black text-xs">
                          <span>NET PROFIT:</span> 
                          <span className="text-emerald-400">Rp {profit.toLocaleString('id-ID')}</span>
                        </div>
                        
                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-[#0F172A] rotate-45"></div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <select 
                        value={t.status} 
                        onChange={(e) => onStatusUpdate(t.id, e.target.value)} 
                        className={`text-[9px] font-black px-3 py-1.5 rounded-full border bg-transparent outline-none cursor-pointer transition-all ${
                          t.status === 'Selesai' ? "text-emerald-600 border-emerald-100 hover:bg-emerald-50" : 
                          t.status === 'Retur' ? "text-red-500 border-red-100 hover:bg-red-50" : 
                          "text-amber-600 border-amber-100 hover:bg-amber-50"
                        }`}
                      >
                        <option value="Proses">Proses</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Retur">Retur</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => onDeleteSingle(t)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Empty State */}
          {currentItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-200">
              <ShoppingBag size={48} strokeWidth={1.5} className="mb-4 opacity-30" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum Ada Transaksi</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-6 border-t border-[#F8F9FB] flex items-center justify-between mt-auto">
          <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 border border-[#E2E8F0] text-slate-400 hover:text-[#0047AB] rounded-lg disabled:opacity-20 transition-all"><ChevronLeft size={16}/></button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-[#E2E8F0] text-slate-400 hover:text-[#0047AB] rounded-lg disabled:opacity-20 transition-all"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}