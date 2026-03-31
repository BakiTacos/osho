"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { 
  Settings, Percent, ShieldCheck, Zap, 
  Info, Save, CheckCircle2, HelpCircle,
  Store, Smartphone, Globe
} from "lucide-react";

export default function BiayaPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State Konfigurasi Biaya
  const [config, setConfig] = useState({
    baseAdmin: 16, // Default 16%
    fixedFee: 1250,
    programs: [
      { id: 'free_ongkir', name: 'Program Gratis Ongkir Ekstra', percent: 6, active: false, desc: 'Biaya tambahan untuk layanan gratis ongkir' },
      { id: 'cashback', name: 'Program Cashback Ekstra', percent: 2, active: false, desc: 'Meningkatkan daya tarik pembeli dengan koin' },
      { id: 'star_seller', name: 'Biaya Star Seller / Mall', percent: 1, active: false, desc: 'Potongan tambahan untuk badge penjual terpilih' }
    ]
  });

  useEffect(() => {
    if (!currentUser) return;
    
    // Ambil settingan dari Firestore
    const unsub = onSnapshot(doc(db, `users/${currentUser.uid}/settings`, "fees"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as any);
      }
      setLoading(true);
    });

    return () => unsub();
  }, [currentUser]);

  const toggleProgram = (id: string) => {
    const newPrograms = config.programs.map(p => 
      p.id === id ? { ...p, active: !p.active } : p
    );
    setConfig({ ...config, programs: newPrograms });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, `users/${currentUser.uid}/settings`, "fees"), config);
      alert("Pengaturan biaya berhasil diperbarui!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Kalkulasi Total Persentase Saat Ini
  const totalPercent = config.baseAdmin + config.programs
    .filter(p => p.active)
    .reduce((acc, curr) => acc + curr.percent, 0);

  if (!currentUser) return null;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#0F172A]">Pengaturan Biaya Admin</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Potongan Marketplace & Program</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#0047AB] text-white px-6 py-3 rounded-2xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          {isSaving ? "Menyimpan..." : <><Save size={16}/> SIMPAN PERUBAHAN</>}
        </button>
      </div>

      <div className="px-4 sm:px-10 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: KONFIGURASI UTAMA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-[#0F172A] mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Percent size={18} className="text-[#0047AB]"/> Biaya Admin Dasar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Persentase Dasar (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={config.baseAdmin}
                    onChange={(e) => setConfig({...config, baseAdmin: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-lg focus:ring-2 focus:ring-[#0047AB]"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Biaya Tetap per Transaksi (Rp)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                  <input 
                    type="number" 
                    value={config.fixedFee}
                    onChange={(e) => setConfig({...config, fixedFee: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-lg pl-14 focus:ring-2 focus:ring-[#0047AB]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DAFTAR PROGRAM OPSIONAL */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-[#0F172A] mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Zap size={18} className="text-amber-500"/> Program Marketplace (Opsional)
            </h3>
            
            <div className="space-y-4">
              {config.programs.map((prog) => (
                <div 
                  key={prog.id}
                  onClick={() => toggleProgram(prog.id)}
                  className={`p-6 rounded-[24px] border-2 transition-all cursor-pointer flex items-center justify-between ${
                    prog.active ? 'border-[#0047AB] bg-blue-50/50' : 'border-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${prog.active ? 'bg-[#0047AB] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <ShieldCheck size={20}/>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#0F172A]">{prog.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{prog.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black ${prog.active ? 'text-[#0047AB]' : 'text-slate-300'}`}>+{prog.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: RINGKASAN */}
        <div className="space-y-6">
          <div className="bg-[#0047AB] p-8 rounded-[32px] shadow-xl shadow-blue-200 text-white relative overflow-hidden">
            <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-2">Total Potongan Admin</p>
            <h2 className="text-5xl font-black tracking-tighter">{totalPercent}%</h2>
            <div className="mt-6 space-y-2 border-t border-white/10 pt-6">
              <div className="flex justify-between text-[11px] font-bold opacity-80">
                <span>Admin Dasar</span>
                <span>{config.baseAdmin}%</span>
              </div>
              {config.programs.filter(p => p.active).map(p => (
                <div key={p.id} className="flex justify-between text-[11px] font-bold opacity-80">
                  <span>{p.name}</span>
                  <span>+{p.percent}%</span>
                </div>
              ))}
              <div className="flex justify-between text-[11px] font-black border-t border-white/20 pt-2 mt-2">
                <span>Biaya Tetap / Pesanan</span>
                <span>Rp {config.fixedFee.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <Globe className="absolute -right-10 -bottom-10 opacity-10" size={200} />
          </div>

          <div className="bg-amber-50 p-6 rounded-[28px] border border-amber-100 flex gap-4">
             <Info className="text-amber-600 shrink-0" size={20}/>
             <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                Perubahan persentase ini akan otomatis mempengaruhi kalkulasi **Profit Bersih** pada setiap transaksi baru yang Anda masukkan di halaman Penjualan.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}