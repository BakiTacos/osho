// app/components/MobileAppGrid.tsx
import React from 'react';
import Link from 'next/link';

interface MobileAppGridProps {
  shortcuts: any[];
}

export const MobileAppGrid = ({ shortcuts }: MobileAppGridProps) => {
  return (
    <div className="block lg:hidden px-4 pt-4">
      <div className="grid grid-cols-3 gap-y-6 gap-x-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        {shortcuts.map((item) => {
          
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex flex-col items-center text-center active:scale-90 transition-all relative"
            >
              {/* Bulatan Ikon Utama Style Aplikasi */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-xs border relative ${item.bg} ${item.color} ${item.border}`}>
                <item.icon size={22} strokeWidth={2.5} />
              </div>
              
              {/* Nama Menu Ringkas */}
              <span className="text-xs font-black text-[#0F172A] tracking-tight uppercase text-[10px]">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};