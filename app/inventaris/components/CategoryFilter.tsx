// app/inventaris/components/CategoryFilter.tsx
import React from 'react';

interface CategoryProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const CategoryFilter = ({ selectedCategory, setSelectedCategory }: CategoryProps) => {
  const categories = ["Semua", "Dapur", "Kamar Mandi", "Kebersihan", "Penyimpanan", "Ruang Tamu", "Kamar Tidur", "Lainnya"];
  
  return (
    <div className="px-4 sm:px-10 mt-4 flex bg-transparent overflow-x-auto no-scrollbar gap-1.5">
      {categories.map((cat) => (
        <button 
          key={cat} 
          type="button"
          onClick={() => setSelectedCategory(cat)} 
          className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${
            selectedCategory === cat ? "bg-[#0047AB] text-white shadow-sm" : "bg-white text-[#64748B] border border-slate-200 hover:bg-slate-50"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};