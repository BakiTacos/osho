import React from 'react';

export default function SalesStats({ transactions, label }: any) {
  const stats = transactions.reduce((acc: any, curr: any) => {
    if (curr.status !== 'Retur') {
      acc.omset += curr.total || 0;
      acc.profit += curr.profit || 0;
    }
    return acc;
  }, { omset: 0, profit: 0 });

  return (
    <div className="px-4 sm:px-10 mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-8">
      {/* Omset - Lebih Kecil di Mobile */}
      <div className="bg-white p-4 sm:p-8 rounded-[20px] sm:rounded-[32px] border border-[#F1F5F9] shadow-sm flex flex-col justify-between min-h-[100px] sm:min-h-[160px]">
        <p className="text-[8px] sm:text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Omset {label}</p>
        <h3 className="text-sm sm:text-4xl font-black text-[#0F172A] truncate">Rp {stats.omset.toLocaleString('id-ID')}</h3>
      </div>

      {/* Profit - Lebih Kecil di Mobile */}
      <div className="bg-white p-4 sm:p-8 rounded-[20px] sm:rounded-[32px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between min-h-[100px] sm:min-h-[160px]">
        <p className="text-[8px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Profit {label}</p>
        <h3 className="text-sm sm:text-4xl font-black text-emerald-600 truncate">Rp {stats.profit.toLocaleString('id-ID')}</h3>
      </div>
    </div>
  );
}