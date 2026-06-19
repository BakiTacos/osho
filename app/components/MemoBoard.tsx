// app/components/MemoBoard.tsx
import React, { useState, useEffect } from 'react';
import { ListTodo, Plus, Trash2, CheckCircle } from 'lucide-react';

export const MemoBoard = () => {
  const [memos, setMemos] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const savedMemos = localStorage.getItem('suparta_gudang_memos');
    if (savedMemos) {
      setMemos(JSON.parse(savedMemos));
    }
  }, []);

  const saveToLocalStorage = (newMemos: string[]) => {
    setMemos(newMemos);
    localStorage.setItem('suparta_gudang_memos', JSON.stringify(newMemos));
  };

  const handleAddMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const updatedMemos = [...memos, inputValue.trim()];
    saveToLocalStorage(updatedMemos);
    setInputValue("");
  };

  const handleDeleteMemo = (index: number) => {
    const updatedMemos = memos.filter((_, i) => i !== index);
    saveToLocalStorage(updatedMemos);
  };

  return (
    <div className="px-4 sm:px-10 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white p-5 sm:p-7 rounded-[28px] border border-[#F1F5F9] shadow-xs">
        
        {/* 1. HEADER PAPAN AGENDA (NAVY & SLATE TIMELISS STYLE) */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-[#F0F7FF] text-[#0047AB] rounded-xl shrink-0">
            <ListTodo size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-[#0F172A] uppercase tracking-wider">Catatan & Agenda Gudang</h4>
            <p className="text-[9px] sm:text-[10px] text-[#94A3B8] font-black uppercase tracking-widest mt-0.5">Koordinasi internal mandiri harian</p>
          </div>
        </div>

        {/* 2. FORM ENTRY MEMO (MONOCHROME & FOCUS ACTIVE) */}
        <form onSubmit={handleAddMemo} className="flex gap-2 mb-5">
          <input 
            type="text" 
            placeholder="Tulis agenda atau memo operasional baru di sini..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-[#F8F9FB] border-none rounded-xl py-3.5 px-4 text-xs sm:text-sm font-bold text-[#0F172A] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#0047AB] transition-all"
          />
          <button 
            type="submit" 
            className="bg-[#0047AB] text-white px-4 rounded-xl hover:bg-[#003580] transition-all flex items-center justify-center shadow-sm shrink-0 active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </form>

        {/* 3. BARIS DAFTAR CATATAN (HITAM-PUTIH-NAVY-CLEAN) */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
          {memos.map((memo, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between bg-white border border-[#F1F5F9] p-3.5 rounded-xl gap-4 group hover:border-slate-200 transition-all"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <CheckCircle size={14} className="text-[#0047AB] mt-0.5 shrink-0" />
                <p className="text-xs font-black text-[#0F172A] uppercase tracking-tight leading-normal break-words">
                  {memo}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => handleDeleteMemo(idx)}
                className="text-slate-300 hover:text-[#0F172A] sm:opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-slate-50 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* KONDISI BLANK STATE */}
          {memos.length === 0 && (
            <div className="py-10 text-center text-[#94A3B8] text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">
              Belum ada catatan internal tertulis untuk hari ini
            </div>
          )}
        </div>

      </div>
    </div>
  );
};