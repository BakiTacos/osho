// app/pembayaran/components/MasterSupplierTab.tsx
"use client";

import React from 'react';
import { Truck, Save, Trash2 } from "lucide-react";

export function MasterSupplierTab({ suppliers, newSupplier, setNewSupplier, isSaving, onSubmit, onDelete }: any) {
  return (
    <div className="mt-8 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FORM KIRI: REGISTER SUPPLIER MITRA BARU */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-[24px] border border-slate-100 shadow-xs">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
            <div className="p-2.5 bg-blue-50 text-[#0047AB] rounded-xl"><Truck size={18}/></div>
            <div>
              <h3 className="font-black text-sm text-[#0F172A] tracking-tight">Daftarkan Supplier</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Generator Prefix Nota</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Nama Lengkap Toko</label>
              <input required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-slate-50 border rounded-xl py-2.5 px-4 font-black text-[#0F172A] text-xs sm:text-sm mt-1 outline-none focus:border-[#0047AB] transition-all" placeholder="Contoh: CV SUMBER BOLT"/>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Kode Prefix Singkat</label>
              <input required value={newSupplier.code} onChange={e => setNewSupplier({...newSupplier, code: e.target.value})} className="w-full bg-slate-50 border rounded-xl py-2.5 px-4 font-black text-[#0047AB] text-xs sm:text-sm mt-1 outline-none focus:border-[#0047AB] uppercase" placeholder="Contoh: SBRBLT"/>
              <p className="text-[8px] font-bold text-slate-400 mt-1.5 px-1 leading-normal uppercase italic">Akan menjadi awalan nomor dokumen (SBRBLT-2026...)</p>
            </div>
            <button type="submit" disabled={isSaving} className="cursor-pointer w-full mt-2 bg-[#0F172A] text-white py-3.5 rounded-xl font-black text-[10px] shadow-sm flex items-center justify-center gap-2 disabled:opacity-40 uppercase tracking-wider">
              <Save size={14}/> {isSaving ? "MENYIMPAN..." : "SIMPAN SUPPLIER MITRA"}
            </button>
          </form>
        </div>

        {/* TABEL KANAN: DAFTAR SUPPLIER AKTIF TERSEDIA */}
        <div className="lg:col-span-8 bg-white rounded-[24px] border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-50">
            <h3 className="text-xs font-black text-[#94A3B8] uppercase tracking-wider">Daftar Mitra Terdaftar ({suppliers.length})</h3>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FB] text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-3.5">Nama Toko Supplier</th>
                  <th className="px-6 py-3.5">Kode Prefix</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {suppliers.map((sup: any) => (
                  <tr key={sup.id} className="hover:bg-slate-50/40 text-xs sm:text-sm font-bold">
                    <td className="px-6 py-4 text-[#0F172A] font-black uppercase truncate max-w-[200px]">{sup.name}</td>
                    <td className="px-6 py-4"><span className="bg-blue-50 text-[#0047AB] px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase">{sup.code}</span></td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => onDelete(sup.id, sup.name)} className="cursor-pointer p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 size={15}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {suppliers.length === 0 && (
            <div className="py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2">
              <Truck size={32} className="text-slate-200" />
              <span>Belum Ada Data Supplier Terdaftar</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}