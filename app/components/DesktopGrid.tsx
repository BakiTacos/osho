// app/components/DesktopGrid.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface DesktopGridProps {
  shortcuts: any[];
}

export const DesktopGrid = ({ shortcuts }: DesktopGridProps) => {
  return (
    <div className="hidden lg:block px-10 pt-6">
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-6">
        {shortcuts.map((item) => {
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="group bg-white p-6 rounded-2xl border border-[#F1F5F9] shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col items-start hover:-translate-y-1 relative"
            >
              <div className={`p-3 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${item.bg} ${item.color}`}>
                <item.icon size={24} strokeWidth={2.5} />
              </div>
              
              <div className="flex items-center gap-1.5 mb-1">
                <h5 className="text-sm font-black text-[#0F172A] group-hover:text-[#0047AB] transition-colors">{item.name}</h5>
              </div>
              
              <p className="text-[10px] font-bold text-[#94A3B8] leading-snug mb-4">{item.desc}</p>
              
              <div className="mt-auto flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#0047AB] transition-colors">
                Buka <ArrowRight size={12} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};