import React from 'react';
import { StatCard } from './StatCard';
import { Wallet, TrendingUp, TrendingDown, Banknote, PackageMinus, PackagePlus, BadgeDollarSign, AlertTriangle, Trophy, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const FinanceView = ({ summary, chartData }: any) => (
  <div className="px-4 sm:px-10 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="TOTAL OMSET" value={`IDR ${summary.totalOmset.toLocaleString('id-ID')}`} icon={<Wallet size={20}/>} color="blue" trend="12.5%" isUp={true} />
      <StatCard title="TOTAL KERUGIAN" value={`IDR ${summary.totalKerugian.toLocaleString('id-ID')}`} icon={<TrendingDown size={20}/>} color="red" trend="2.1%" isUp={false} />
      <StatCard title="PROFIT BERSIH" value={`IDR ${summary.netProfit.toLocaleString('id-ID')}`} icon={<TrendingUp size={20}/>} color="emerald" trend="8.2%" isUp={true} subtitle="Laba - Opex" />
      <StatCard title="PROFIT FINAL" value={`IDR ${summary.profitFinal.toLocaleString('id-ID')}`} icon={<Banknote size={20}/>} color="emerald" trend="5.4%" isUp={summary.profitFinal > 0} subtitle="Cuan Bersih Akhir" highlight={true} />
    </div>

    <div className="mt-8 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-lg font-black tracking-tight text-[#0F172A]">Tren Laba Rugi</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.15em]">Performa Pemasukan vs Laba Bersih</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400"><div className="w-3 h-3 rounded-full bg-[#0047AB]"></div> Pemasukan</div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400"><div className="w-3 h-3 rounded-full bg-[#10B981]"></div> Laba Bersih</div>
        </div>
      </div>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94A3B8'}} dy={10} />
            <YAxis hide />
            <Tooltip cursor={{fill: '#F8F9FB'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} itemStyle={{fontSize: '11px', fontWeight: 900, textTransform: 'uppercase'}} />
            <Bar dataKey="pemasukan" fill="#0047AB" radius={[4, 4, 0, 0]} barSize={32} />
            <Bar dataKey="laba" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export const StockView = ({ stockStats, financials, currentMonthName }: any) => (
  <div className="px-4 sm:px-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="STOK KELUAR" value={`${stockStats.unitOut} Unit`} icon={<PackageMinus size={20}/>} color="red" trend="Penjualan" isUp={false} />
      <StatCard title="STOK MASUK" value={`${stockStats.unitIn} Unit`} icon={<PackagePlus size={20}/>} color="blue" trend="Restock" isUp={true} />
      <StatCard title="VALUASI KELUAR" value={`Rp ${stockStats.valuationOut.toLocaleString('id-ID')}`} icon={<BadgeDollarSign size={20}/>} color="red" trend="Total HPP" isUp={false} />
      <StatCard title="VALUASI MASUK" value={`Rp ${stockStats.valuationIn.toLocaleString('id-ID')}`} icon={<Banknote size={20}/>} color="blue" trend="Modal Belanja" isUp={true} />
      <StatCard title={`VALUASI ASET`} value={`Rp ${financials.totalValuation.toLocaleString('id-ID')}`} icon={<Wallet size={20}/>} color="blue" trend={currentMonthName} isUp={true} subtitle="Posisi Modal" />
      <StatCard title={`POTENSI CUAN`} value={`Rp ${financials.totalEstProfit.toLocaleString('id-ID')}`} icon={<TrendingUp size={20}/>} color="emerald" trend={currentMonthName} isUp={true} highlight={true} subtitle="Sisa Margin" />
      <StatCard title="MARGIN < 10%" value={`${financials.lowMarginCount} Produk`} icon={<AlertTriangle size={20}/>} color="red" trend="Evaluasi" isUp={false} subtitle="Profit Tipis" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-center mb-6"><div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Trophy size={24}/></div><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Top Performance</span></div> 
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Keluar Terbanyak (Bulan Ini)</p>
        <h3 className="text-2xl font-black text-[#0F172A] uppercase leading-tight mb-2">{stockStats.mostSold[0]}</h3>
        <div className="flex items-center gap-2"><span className="px-3 py-1 bg-orange-500 text-white text-[11px] font-black rounded-lg">{stockStats.mostSold[1]} Unit Sold</span><span className="text-[10px] font-bold text-slate-400">Total Outgoing</span></div>
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-all duration-500"><PackageMinus size={150} /></div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-center mb-6"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Package size={24}/></div><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Inventory Asset</span></div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Stok Terbanyak (Gudang)</p>
        <h3 className="text-2xl font-black text-[#0F172A] uppercase leading-tight mb-2">{stockStats.topInventory.name}</h3>
        <div className="flex items-center gap-2"><span className="px-3 py-1 bg-[#0047AB] text-white text-[11px] font-black rounded-lg">{stockStats.topInventory.stock} Unit Ready</span><span className="text-[10px] font-bold text-slate-400">Current Balance</span></div>
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-all duration-500"><Package size={150} /></div>
      </div>
    </div>
  </div>
);