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
    <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      <div className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-[#F1F5F9] shadow-sm">
        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Omset {label}</p>
        <h3 className="text-2xl sm:text-4xl font-black text-[#0F172A]">Rp {stats.omset.toLocaleString('id-ID')}</h3>
      </div>
      <div className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-emerald-500">
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Profit Bersih {label}</p>
        <h3 className="text-2xl sm:text-4xl font-black text-emerald-600">Rp {stats.profit.toLocaleString('id-ID')}</h3>
      </div>
    </div>
  );
}