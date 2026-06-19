// app/inventaris/components/InventoryMobileGrid.tsx
import React from 'react';
import Link from 'next/link';
import { MoreVertical, CheckCircle2 } from 'lucide-react';
import { Product } from '../types/inventory';

interface MobileGridProps {
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

export const InventoryMobileGrid = ({ 
  items, inventoryService, activeMenuId, setActiveMenuId, 
  editingStockId, setEditingStockId, tempStock, setTempStock, 
  onUpdateStock, onDelete, viewMode 
}: MobileGridProps) => {

  const showHarga = viewMode === "semua" || viewMode === "harga";
  const showStok = viewMode === "semua" || viewMode === "stok";

  return (
    <div className="grid grid-cols-2 lg:hidden gap-3">
      {items.map((p) => {
        const estData = inventoryService.getMarketplaceEstimation(p);
        if (!estData) return null;

        return (
          <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between relative min-h-[160px]">
            <div>
              <div className="flex justify-between items-start gap-1">
                <p className="text-[8px] font-black text-[#0047AB] uppercase tracking-tighter truncate max-w-[80%]">SKU: {p.sku}</p>
                <div className="relative shrink-0">
                  <button type="button" onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)} className="p-0.5 text-slate-300 hover:text-slate-600">
                    <MoreVertical size={14} />
                  </button>
                  {activeMenuId === p.id && (
                    <div className="absolute right-0 top-5 w-24 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 text-[9px] font-black">
                      <Link href={`/inventaris/edit/${p.id}`} className="block px-2.5 py-1.5 text-slate-600 hover:bg-slate-50">EDIT</Link>
                      <button type="button" onClick={() => onDelete(p.id)} className="w-full text-left px-2.5 py-1.5 text-red-500 hover:bg-red-50">HAPUS</button>
                    </div>
                  )}
                </div>
              </div>
              <h4 className="text-xs font-black text-[#0F172A] uppercase leading-tight mt-0.5 line-clamp-2">{p.name}</h4>
            </div>

            {/* AREA DATA HARGA (KONDISIONAL) */}
            {showHarga && (
              <div className="mt-2 space-y-1">
                <div className="space-y-1 bg-slate-50/70 p-2 rounded-xl border border-slate-100/50 text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Modal:</span><span className="text-[#0F172A] font-black">Rp {Math.round(estData.actualCost * estData.multiplier).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 font-bold">Jual:</span><span className="text-[#0F172A] font-black">Rp {p.price.toLocaleString('id-ID')}</span></div>
                </div>
                <div className="space-y-1 bg-white border border-slate-100 p-1.5 rounded-xl text-[9px] font-black">
                  {['shopee', 'tiktok', 'lazada'].map((mp) => {
                    const mpData = estData.results[mp];
                    return (
                      <div key={mp} className="flex justify-between items-center gap-1">
                        <span className="text-slate-400 uppercase text-[8px]">{mp}:</span>
                        {mpData ? <span className={mpData.netProfit > 0 ? "text-emerald-600" : "text-red-500"}>Rp {Math.round(mpData.netProfit).toLocaleString('id-ID')}</span> : <span className="text-slate-300 italic">N/A</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AREA DATA STOK (KONDISIONAL) */}
            {showStok && (
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100 text-[10px]">
                <span className="text-[8px] font-black uppercase text-slate-400">Stok</span>
                {editingStockId === p.id ? (
                  <div className="flex items-center space-x-0.5">
                    <input autoFocus type="number" className="w-10 p-0.5 border border-[#0047AB] rounded text-center text-xs font-black" value={tempStock} onChange={(e) => setTempStock(Number(e.target.value))} />
                    <button type="button" onClick={() => onUpdateStock(p.id)} className="text-emerald-600"><CheckCircle2 size={14}/></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setEditingStockId(p.id); setTempStock(p.stock); }} className={`text-[10px] font-black px-2 py-0.5 rounded ${p.stock <= 10 ? "bg-red-50 text-red-500 border border-red-100 animate-pulse" : "bg-slate-100 text-[#0F172A]"}`}>{p.stock} Pcs</button>
                )}
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
};