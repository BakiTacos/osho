"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Save, Loader2, CheckSquare, Square, Settings2 } from "lucide-react";

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [feeSettings, setFeeSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, `users/${currentUser.uid}/settings`, "admin_fees"));
      if (snap.exists()) setFeeSettings(snap.data());
    };
    fetchSettings();
  }, [currentUser]);

  const toggleProgram = (marketplace: string, index: number) => {
    const newData = { ...feeSettings };
    newData[marketplace].programs[index].enabled = !newData[marketplace].programs[index].enabled;
    setFeeSettings(newData);
  };

  const calculateTotal = (mp: string) => {
    const base = Number(feeSettings[mp].baseFee) || 0;
    const programs = feeSettings[mp].programs
      .filter((p: any) => p.enabled)
      .reduce((acc: number, curr: any) => acc + Number(curr.percent), 0);
    return base + programs;
  };

  

  if (!feeSettings) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-300">Loading Configuration...</div>;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black tracking-tighter text-[#0F172A] mb-8">Admin Program Settings</h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {Object.keys(feeSettings).filter(k => k !== 'updatedAt').map((mp) => (
            <div key={mp} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase text-[#0047AB] tracking-tight">{mp} Fees</h3>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl">
                   <span className="text-[10px] font-black text-[#0047AB] uppercase">Total Fee: {calculateTotal(mp)}%</span>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Base Admin Fee (%)</label>
                  <input 
                    type="number" 
                    value={feeSettings[mp].baseFee}
                    onChange={(e) => setFeeSettings({...feeSettings, [mp]: {...feeSettings[mp], baseFee: e.target.value}})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Program Yang Diikuti</label>
                  {feeSettings[mp].programs.map((prog: any, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => toggleProgram(mp, idx)}
                      className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${prog.enabled ? "border-[#0047AB] bg-blue-50/50" : "border-slate-50 bg-white hover:border-slate-200"}`}
                    >
                      <div className="flex items-center gap-4">
                        {prog.enabled ? <CheckSquare className="text-[#0047AB]" /> : <Square className="text-slate-200" />}
                        <div className="text-left">
                          <p className={`text-sm font-black ${prog.enabled ? "text-[#0047AB]" : "text-slate-400"}`}>{prog.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Biaya Tambahan: {prog.percent}%</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={async () => {
            setIsSaving(true);
            await setDoc(doc(db, `users/${currentUser?.uid}/settings`, "admin_fees"), { ...feeSettings, updatedAt: serverTimestamp() });
            setIsSaving(false);
            alert("Pengaturan Biaya Program Berhasil Disimpan!");
          }}
          className="mt-12 w-full bg-[#0F172A] text-white py-6 rounded-[32px] font-black text-sm shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.01] transition-all"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          SIMPAN KONFIGURASI PROGRAM
        </button>
      </div>
    </div>
  );
}