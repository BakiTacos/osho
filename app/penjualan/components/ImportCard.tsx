import React from 'react';
import { Upload, Check, Loader2 } from "lucide-react";
// Sesuaikan path ini dengan letak file constants kamu
import { MARKETPLACE_CONFIG } from "../../../lib/constants/sales"; 

export default function ImportCard({
  selectedMarketplace,
  setSelectedMarketplace,
  isProcessing,
  onUpload
}: any) {
  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="bg-white p-8 rounded-[32px] border border-[#F1F5F9] shadow-sm">
        <h4 className="text-lg font-black text-[#0F172A] mb-6 uppercase text-[11px] tracking-[0.2em]">Sumber Impor</h4>
        
        <div className="space-y-3">
          {Object.keys(MARKETPLACE_CONFIG).map((key) => (
            <button key={key} onClick={() => setSelectedMarketplace(key)} 
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold text-sm ${selectedMarketplace === key ? "border-[#0047AB] bg-blue-50 text-[#0047AB]" : "border-slate-50 text-slate-400 hover:border-slate-200"}`}>
              <span className="capitalize">{MARKETPLACE_CONFIG[key].name}</span>
              {selectedMarketplace === key && <Check size={18} strokeWidth={3} />}
            </button>
          ))}
        </div>
        
        <div className="mt-8 relative group">
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center rounded-[24px]">
              <Loader2 className="animate-spin text-[#0047AB] mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Memproses...</span>
            </div>
          )}
          
          <input 
            type="file" 
            accept=".xlsx, .csv" 
            onChange={onUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          
          <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-10 text-center group-hover:bg-slate-50 transition-all group-hover:border-[#0047AB]">
            <Upload className="mx-auto text-[#0047AB] mb-4" size={32} />
            <p className="text-sm font-black text-[#0F172A]">Upload Laporan</p>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase italic tracking-tighter">Headers auto-detected</p>
          </div>
        </div>
      </div>
    </div>
  );
}