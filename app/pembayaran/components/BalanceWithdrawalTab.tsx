// app/pembayaran/components/BalanceWithdrawalTab.tsx
"use client";

import React from 'react';
import { Wallet, History, Landmark } from "lucide-react";

export function BalanceWithdrawalTab({ totalWithdrawal, platformStats, onOpenAdd, onOpenHistory }: any) {
  return (
    <div className="mt-8 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-5 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xs">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-3 border-b pb-2 tracking-wider">Rincian per Marketplace</p>
          <div className="space-y-2 max-h-[80px] overflow-y-auto no-scrollbar">
            {Object.keys(platformStats).map(p => (
              <div key={p} className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span className="truncate mr-2">{p}</span>
                <span className="text-[#0047AB] font-black">Rp {platformStats[p].toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" onClick={onOpenAdd} className="cursor-pointer flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-[16px] sm:rounded-[20px] font-black text-xs uppercase shadow-sm shadow-emerald-100 hover:scale-[1.01] transition-all">
            <Wallet size={16} /> <span>Tarik Saldo Baru</span>
          </button>
          <button type="button" onClick={onOpenHistory} className="cursor-pointer flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-[16px] sm:rounded-[20px] font-black text-xs uppercase hover:bg-slate-50 transition-all">
            <History size={16} /> <span>Lihat Riwayat Lengkap</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xs p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[350px]">
        <Landmark size={48} className="mb-3 text-emerald-100" />
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-300 max-w-sm mx-auto">
          Gunakan tombol "Riwayat Lengkap" di atas untuk melihat detail data mutasi rekening penarikan dana bulanan ruko.
        </p>
      </div>
    </div>
  );
}