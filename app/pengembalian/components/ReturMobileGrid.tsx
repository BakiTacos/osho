import React from 'react';
import { ReturOrder } from "../types/retur";

interface ReturMobileGridProps {
  items: ReturOrder[];
  onStatusChange: (order: ReturOrder, status: string) => void;
}

export const ReturMobileGrid = ({ items, onStatusChange }: ReturMobileGridProps) => (
  <div className="md:hidden space-y-3">
    {items.map((order) => (
      <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3 font-bold">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#0047AB]">#{order.orderId}</span>
            <span className="text-xs font-black text-[#0F172A] uppercase mt-0.5 truncate max-w-[180px]">{order.product}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
            order.marketplace.includes('Shopee') ? 'bg-orange-50 text-orange-600' : 'bg-slate-900 text-white'
          }`}>{order.marketplace}</span>
        </div>

        <div className="flex justify-between items-center border-t border-b border-slate-50 py-2 text-[10px]">
          <span className="text-slate-400 uppercase">SKU / Qty:</span>
          <span className="text-[#0F172A] uppercase">{order.sku} (x{order.qty})</span>
        </div>

        <div className="flex justify-between items-center pt-1">
          <select 
            disabled={order.returFinal} 
            value={order.penanganan || "Proses"} 
            onChange={(e) => onStatusChange(order, e.target.value)}
            className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg border-2 ${
              order.penanganan === 'Selesai' ? "border-emerald-100 bg-emerald-50 text-emerald-600" :
              order.penanganan === 'Pending SKU' ? "border-amber-200 bg-amber-50 text-amber-600" :
              ['Rusak', 'Tidak Kembali', 'Afkir'].includes(order.penanganan) ? "border-red-100 bg-red-50 text-red-600" : "border-blue-100 bg-blue-50 text-blue-600"
            }`}
          >
            <option value="Proses">🔄 Proses</option>
            <option value="Pending SKU" disabled>⚠️ Pending</option>
            <option value="Selesai">✅ OK</option>
            <option value="Rusak">❌ Rusak</option>
          </select>
          <span className={`text-xs font-black ${['Rusak', 'Tidak Kembali', 'Afkir'].includes(order.penanganan) ? 'text-red-500' : 'text-slate-400'}`}>
            Rp {(order.hpp || 0).toLocaleString('id-ID')}
          </span>
        </div>
        {order.catatan && <p className="text-[8px] bg-red-50 text-red-500 p-2 rounded-lg uppercase tracking-wider">{order.catatan}</p>}
      </div>
    ))}
  </div>
);