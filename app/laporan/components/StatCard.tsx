// app/inventaris/laporan/components/StatCard.tsx
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  bgIcon?: string;
  textColor?: string;
}

export const StatCard = ({ title, value, subtext, icon, bgIcon = "bg-blue-50 text-[#0047AB]", textColor = "text-[#0F172A]" }: StatCardProps) => {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xs flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${textColor}`}>{value}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-normal leading-none">{subtext}</p>
      </div>
      <div className={`p-3 rounded-xl ${bgIcon} shrink-0`}>
        {icon}
      </div>
    </div>
  );
};