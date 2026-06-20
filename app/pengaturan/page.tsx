// app/penjualan/settings/page.tsx
"use client";

import React from 'react';
import { useAuth } from "../../context/AuthContext";
import { useSettingsPage } from "./hooks/useSettingsPage";
import { Save, Loader2, CheckSquare, Square, Settings2, Percent } from "lucide-react";

export default function SettingsPage() {
  const { currentUser } = useAuth();
  
  // Ambil data kontrol murni dari Custom Hook Taktis Lokal Modul
  const {
    feeSettings,
    fetching,
    isSaving,
    toggleProgram,
    handleBaseFeeChange,
    calculateTotalFee,
    saveConfiguration
  } = useSettingsPage(currentUser);

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] ml-0 lg:ml-72 text-slate-400 gap-3">
        <Loader2 className="animate-spin text-[#0047AB]" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest">Memuat Konfigurasi Ruko...</p>
      </div>
    );
  }

  if (!feeSettings) return null;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] pb-20 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-10 pt-8">
        
        {/* KEPALA HALAMAN */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#0F172A] leading-none uppercase">Pengaturan Biaya</h1>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1">
            <Settings2 size={12} className="text-[#0047AB]" /> Persentase Potongan Komisi Program Marketplace
          </p>
        </div>

        {/* FLUID GRID LAYOUT: MAKSIMAL 2 KOLOM DI MOBILE ( grid-cols-2 ) */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6">
          {Object.keys(feeSettings).filter(k => k !== 'updatedAt').map((mp) => (
            <div 
              key={mp} 
              className="bg-white p-4 sm:p-6 rounded-[22px] sm:rounded-[32px] border border-slate-100 shadow-2xs flex flex-col justify-between group hover:border-slate-200 transition-all"
            >
              <div>
                {/* RINGKASAN PERSENTASE KARTU */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
                  <h3 className="text-sm sm:text-base font-black uppercase text-[#0F172A] tracking-tight truncate">{mp} Program</h3>
                  <div className="bg-blue-50/70 px-2 sm:px-3 py-1 rounded-xl self-start sm:self-auto shrink-0">
                     <span className="text-[8px] sm:text-[10px] font-black text-[#0047AB] uppercase flex items-center gap-0.5">
                       <Percent size={10} /> {calculateTotalFee(mp)}%
                     </span>
                  </div>
                </div>

                {/* AREA UTAMA INPUT & OPSI BUTTON */}
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Base Admin (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={feeSettings[mp].baseFee}
                      onChange={(e) => handleBaseFeeChange(mp, e.target.value)}
                      className="w-full bg-slate-50 border border-transparent rounded-xl sm:rounded-2xl py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-xs sm:text-sm outline-none focus:bg-white focus:border-slate-200 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Opsi Sub-Program</label>
                    <div className="space-y-1.5 max-h-[180px] sm:max-h-none overflow-y-auto no-scrollbar">
                      {feeSettings[mp].programs.map((prog: any, idx: number) => (
                        <button 
                          type="button"
                          key={idx} 
                          onClick={() => toggleProgram(mp, idx)}
                          className={`w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 transition-all min-w-0 ${
                            prog.enabled 
                              ? "border-[#0047AB] bg-blue-50/30" 
                              : "border-slate-50 bg-white hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
                            <div className="shrink-0">
                              {prog.enabled 
                                ? <CheckSquare size={16} className="text-[#0047AB]" /> 
                                : <Square size={16} className="text-slate-200" />
                              }
                            </div>
                            <div className="text-left min-w-0 w-full">
                              <p className={`text-[10px] sm:text-xs font-black truncate ${prog.enabled ? "text-[#0047AB]" : "text-slate-500"}`}>
                                {prog.name}
                              </p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 shrink-0">
                                +{prog.percent}%
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BUTTON AKSI UTAMA */}
        <div className="mt-8">
          <button 
            type="button"
            disabled={isSaving}
            onClick={saveConfiguration}
            className="w-full bg-[#0F172A] hover:bg-slate-800 text-white py-4 sm:py-5 rounded-[22px] sm:rounded-[32px] font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>SIMPAN KONFIGURASI PROGRAM</span>
          </button>
        </div>

      </div>
    </div>
  );
}