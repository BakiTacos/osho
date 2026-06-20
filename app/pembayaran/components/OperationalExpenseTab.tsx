// app/pembayaran/components/OperationalExpenseTab.tsx
"use client";

import React from 'react';
import { TrendingDown, Receipt, Pencil, Trash2 } from "lucide-react";

export function OperationalExpenseTab({ filteredExpenses, totalOpex, payerStats, onOpenAdd, onEdit, onDelete }: any) {
  return (
    <div className="mt-8 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        
        <div className="bg-white p-5 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xs">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-3 border-b pb-2 tracking-wider">Distribusi Pembayar</p>
          <div className="space-y-2 max-h-[80px] overflow-y-auto no-scrollbar">
            {Object.entries(payerStats).map(([payer, amount]) => (
              <div key={payer} className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span className="truncate mr-2">{payer}</span>
                <span className="text-[#0F172A] font-black">Rp {(amount as number).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={onOpenAdd} className="cursor-pointer flex flex-col items-center justify-center gap-2 bg-orange-500 text-white rounded-[24px] sm:rounded-[32px] font-black text-xs uppercase shadow-md shadow-orange-100 hover:scale-[1.01] transition-all">
          <TrendingDown size={20} /> <span>Input Biaya Operasional</span>
        </button>
      </div>

      <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xs p-5 sm:p-8 min-h-[350px]">
        <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#94A3B8] mb-6">Daftar Riwayat Pengeluaran</h4>
        <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
          {filteredExpenses.map((exp: any) => {
            let displayDate = "";
            if (exp.date) {
              const d = new Date(exp.date);
              if (!isNaN(d.getTime())) displayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            }
            return (
              <div key={exp.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3 bg-white rounded-xl text-orange-500 shadow-2xs shrink-0"><Receipt size={16}/></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-black text-[#0F172A] leading-tight truncate">{exp.category}</p>
                      <span className="px-1.5 py-0.5 bg-white border rounded text-[8px] font-black text-slate-400 uppercase">{exp.paidBy || 'Owner'}</span>
                      {displayDate && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">• {displayDate}</span>}
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">{exp.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-4">
                  <p className="text-sm sm:text-base font-black text-[#0F172A]">-Rp {exp.amount.toLocaleString('id-ID')}</p>
                  <div className="flex items-center mt-1 gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <button type="button" onClick={() => onEdit(exp)} className="p-1 text-slate-400 hover:text-[#0047AB] flex items-center gap-1"><Pencil size={12}/> <span className="text-[8px] font-black uppercase hidden sm:block">Edit</span></button>
                    <button type="button" onClick={() => onDelete(exp.id)} className="p-1 text-slate-400 hover:text-red-500 flex items-center gap-1"><Trash2 size={12}/></button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredExpenses.length === 0 && <div className="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Belum Ada Catatan Pengeluaran</div>}
        </div>
      </div>
    </div>
  );
}