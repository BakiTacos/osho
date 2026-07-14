import React from 'react';
import { ReturOrder } from "../types/retur";

interface ReturDesktopTableProps {
  items: ReturOrder[];
  onStatusChange: (order: ReturOrder, status: string) => void;
}

export const ReturDesktopTable = ({ items, onStatusChange }: ReturDesktopTableProps) => (
  <div className="hidden md:block bg-white rounded-[28px] border border-slate-100 shadow-xs overflow-hidden">
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-left min-w-[700px] lg:min-w-0">
        <thead className="bg-[#F8F9FB] border-b border-slate-100">
          <tr className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-6 py-4">Pesanan & Produk</th>
            <th className="px-4 py-4">Asal / Marketplace</th>
            <th className="px-4 py-4 text-center">Penanganan</th>
            <th className="px-6 py-4 text-right">Kerugian (Modal)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 font-bold">
          {items.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50/50 transition-all text-xs sm:text-sm">
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-[#0047AB]">#{order.orderId}</span>
                  <span className="text-xs sm:text-sm font-black text-[#0F172A] uppercase tracking-tight mt-0.5 truncate max-w-[260px]">{order.product}</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-1 uppercase">SKU: {order.sku} • Qty: {order.qty}</span>
                  {!order.returFinal ? (
                    <span className="text-[9px] font-black text-amber-500 mt-1 uppercase">
                      Batas Waktu: Sisa {30 - (order.diffDays || 0) > 0 ? `${30 - (order.diffDays || 0)} Hari` : "0 Hari"}
                    </span>
                  ) : (
                    order.penanganan === "Tidak Kembali" && (
                      <span className="text-[9px] font-black text-rose-500 mt-1 uppercase">
                        Kadaluwarsa (30 Hari), Potong Profit
                      </span>
                    )
                  )}
                  {order.catatan && <span className="mt-1 px-2 py-0.5 bg-red-50 text-red-500 rounded text-[8px] font-black uppercase border border-red-100 w-fit">{order.catatan}</span>}
                </div>
              </td>
              <td className="px-4 py-5">
                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                  order.marketplace.includes('Shopee') ? 'bg-orange-50 text-orange-600' :
                  order.marketplace.includes('Tiktok') ? 'bg-slate-900 text-white' : 'bg-red-50 text-red-600 border border-red-50'
                }`}>{order.marketplace}</span>
              </td>
              <td className="px-4 py-5 text-center">
                <select 
                  disabled={order.returFinal} 
                  value={order.penanganan || "Proses"} 
                  onChange={(e) => onStatusChange(order, e.target.value)}
                  className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border-2 outline-none cursor-pointer ${
                    order.penanganan === 'Selesai' ? "border-emerald-100 bg-emerald-50 text-emerald-600" :
                    order.penanganan === 'Pending SKU' ? "border-amber-200 bg-amber-50 text-amber-600 animate-pulse" :
                    ['Rusak', 'Tidak Kembali', 'Afkir'].includes(order.penanganan) ? "border-red-100 bg-red-50 text-red-600" : "border-blue-100 bg-blue-50 text-blue-600"
                  }`}
                >
                  <option value="Proses">🔄 Sedang Diproses</option>
                  <option value="Pending SKU" disabled>⚠️ Pending SKU (Karantina)</option>
                  <option value="Menunggu Barang">🚚 Menunggu Barang</option>
                  <option value="Selesai">✅ Selesai (Barang OK)</option>
                  <option value="Rusak">❌ Barang Rusak</option>
                  <option value="Tidak Kembali">⚠️ Tidak Kembali</option>
                </select>
              </td>
              <td className={`px-6 py-5 text-right font-black ${['Rusak', 'Tidak Kembali', 'Afkir'].includes(order.penanganan) ? 'text-red-500' : 'text-slate-400'}`}>
                Rp {(order.hpp || 0).toLocaleString('id-ID')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);