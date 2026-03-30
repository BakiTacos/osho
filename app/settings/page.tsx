"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  Settings, Truck, Check, Save, Loader2, Info, AlertCircle 
} from "lucide-react";

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State Pengaturan
  const [config, setConfig] = useState({
    isGratisOngkirActive: true, // Default aktif (6%)
    marketplaceAdmin: 10,        // Default 10%
    fixedFee: 1250               // Default Rp 1.250
  });

  // Load Data Settings dari Firebase
  useEffect(() => {
    async function loadSettings() {
      if (!currentUser) return;
      const docRef = doc(db, `users/${currentUser.uid}/settings`, "marketplace");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setConfig(docSnap.data() as any);
      }
      setLoading(false);
    }
    loadSettings();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, `users/${currentUser.uid}/settings`, "marketplace"), config);
      alert("Pengaturan biaya berhasil disimpan!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan pengaturan.");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F8F9FB]">
      <Loader2 className="animate-spin text-[#0047AB]" size={40} />
    </div>
  );

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] p-4 sm:p-10 transition-all duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center space-x-4 mb-10">
          <div className="p-3 bg-[#0047AB] text-white rounded-2xl shadow-lg">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter">Pengaturan</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Konfigurasi Biaya Marketplace</p>
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="p-10 space-y-8">
            
            {/* TOGGLE GRATIS ONGKIR */}
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[30px] border border-slate-100">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white text-[#0047AB] rounded-2xl shadow-sm">
                  <Truck size={24} />
                </div>
                <div>
                  <h4 className="font-black text-[#0F172A]">Program Gratis Ongkir</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mt-1">
                    Aktifkan jika toko Anda mengikuti program Gratis Ongkir Extra (Dikenakan tambahan biaya 6%).
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setConfig({...config, isGratisOngkirActive: !config.isGratisOngkirActive})}
                className={`w-16 h-8 rounded-full transition-all flex items-center px-1 ${
                  config.isGratisOngkirActive ? "bg-[#0047AB]" : "bg-slate-300"
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  config.isGratisOngkirActive ? "translate-x-8" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* DETAIL BIAYA */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Preview Struktur Biaya</h5>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between p-4 border-b border-slate-50">
                  <span className="text-sm font-bold text-slate-600">Admin Dasar Marketplace</span>
                  <span className="text-sm font-black text-[#0F172A]">{config.marketplaceAdmin}%</span>
                </div>
                <div className="flex justify-between p-4 border-b border-slate-50">
                  <span className="text-sm font-bold text-slate-600">Biaya Gratis Ongkir (Extra)</span>
                  <span className={`text-sm font-black ${config.isGratisOngkirActive ? "text-red-500" : "text-slate-300"}`}>
                    {config.isGratisOngkirActive ? "6%" : "0% (Non-aktif)"}
                  </span>
                </div>
                <div className="flex justify-between p-4">
                  <span className="text-sm font-bold text-slate-600">Biaya Tetap (Per Pesanan)</span>
                  <span className="text-sm font-black text-[#0F172A]">Rp {config.fixedFee}</span>
                </div>
              </div>
            </div>

            {/* TOTAL ESTIMASI POTONGAN */}
            <div className="bg-blue-50/50 p-6 rounded-[30px] border border-blue-100 flex items-center space-x-4">
              <Info className="text-[#0047AB]" size={20} />
              <p className="text-xs font-bold text-[#0047AB] leading-relaxed">
                Total estimasi potongan setiap transaksi Anda adalah <span className="underline font-black">
                {config.marketplaceAdmin + (config.isGratisOngkirActive ? 6 : 0)}% + Rp{config.fixedFee}</span>. 
                Data ini akan digunakan otomatis pada halaman Penjualan.
              </p>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#0F172A] text-white py-5 rounded-[24px] font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
              <span>Simpan Perubahan</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}