"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase"; // Sesuaikan path config firebase Anda
import { useAuth } from "../../context/AuthContext";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { 
  Search, Bell, HelpCircle, Plus, Package, 
  AlertTriangle, Slash, MoreVertical, ChevronLeft, ChevronRight 
} from "lucide-react";

// --- INTERFACE DATA ---
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
}

// --- KOMPONEN TOOLTIP KUSTOM ---
const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <span className="group relative inline-flex items-center">
    {children}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-[100] pointer-events-none">
      <span className="relative w-max max-w-[200px] bg-[#0F172A] text-white text-[10px] font-medium py-1.5 px-3 rounded-lg shadow-2xl text-center">
        {text}
      </span>
      <span className="w-2.5 h-2.5 bg-[#0F172A] rotate-45 -mt-1.5"></span>
    </span>
  </span>
);

export default function InventarisPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // --- FETCH DATA DARI FIREBASE ---
  useEffect(() => {
    if (!currentUser) return;
    
    // Mengambil data dari sub-koleksi user agar data bersifat privat
    const q = query(
      collection(db, `users/${currentUser.uid}/products`), 
      orderBy("name", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- LOGIKA FILTER & STATISTIK ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300">
      
      {/* --- KONTROL ATAS (HEADER) --- */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-4">
        <div className="relative flex-1 lg:flex-none lg:w-96 ml-16 lg:ml-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input 
            type="text" 
            placeholder="Cari analisis..." 
            className="w-full bg-[#EDF2F7] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#0047AB]"
          />
        </div>
        <div className="flex items-center space-x-6 text-[#64748B]">
          <div className="hidden sm:flex items-center space-x-4">
            <Bell size={20} className="cursor-pointer hover:text-[#0F172A]" />
            <HelpCircle size={20} className="cursor-pointer hover:text-[#0F172A]" />
          </div>
          <div className="flex items-center space-x-3 border-l pl-6">
            <span className="hidden md:block text-sm font-bold text-[#0F172A]">KIA</span>
            <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-100">K</div>
          </div>
        </div>
      </div>

      {/* --- PAGE TITLE --- */}
      <div className="px-4 sm:px-10 mt-10">
        <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Inventaris Produk</h1>
        <p className="text-[#64748B] mt-1 text-sm font-medium">Kelola katalog produk, SKU, dan stok Anda secara efisien.</p>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Produk */}
        <div className="bg-white p-7 rounded-[28px] border border-[#F1F5F9] shadow-sm relative overflow-visible">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><Package size={22} /></div>
            <Tooltip text="Jumlah total variasi produk unik (SKU)."><HelpCircle size={14} className="opacity-20 cursor-help" /></Tooltip>
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mb-1">Total Produk</p>
          <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{products.length.toLocaleString('id-ID')} <span className="text-lg text-[#94A3B8] font-bold">SKU</span></h3>
          <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-[#0047AB] rounded-tr-full rounded-bl-[28px]"></div>
        </div>

        {/* Stok Rendah */}
        <div className="bg-white p-7 rounded-[28px] border border-[#F1F5F9] shadow-sm relative overflow-visible">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-[#FFF1F2] text-[#E11D48] rounded-2xl"><AlertTriangle size={22} /></div>
            <Tooltip text="Produk dengan sisa stok di bawah 10 unit."><HelpCircle size={14} className="opacity-20 cursor-help" /></Tooltip>
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mb-1">Stok Rendah</p>
          <div className="flex items-center space-x-3">
            <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{lowStockCount} <span className="text-lg text-[#94A3B8] font-bold">SKU</span></h3>
            <span className="bg-[#E11D48] text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">Peringatan</span>
          </div>
          <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-[#E11D48] rounded-tr-full rounded-bl-[28px]"></div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-7 rounded-[28px] border border-[#F1F5F9] shadow-sm relative overflow-visible">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl"><Slash size={22} /></div>
            <Tooltip text="Produk yang saat ini tidak memiliki sisa stok."><HelpCircle size={14} className="opacity-20 cursor-help" /></Tooltip>
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mb-1">Out of Stock</p>
          <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{outOfStockCount} <span className="text-lg text-[#94A3B8] font-bold">SKU</span></h3>
          <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-slate-200 rounded-tr-full rounded-bl-[28px]"></div>
        </div>
      </div>

      {/* --- FILTER & SEARCH --- */}
      <div className="px-4 sm:px-10 mt-10 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input 
              type="text" 
              placeholder="Cari Produk atau SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#0047AB]"
            />
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-sm w-full sm:w-auto overflow-x-auto">
            {["Semua", "Elektronik", "Perabot", "Pakaian"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat ? "bg-[#0047AB] text-white shadow-md" : "text-[#64748B] hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button className="w-full lg:w-auto flex items-center justify-center space-x-2 bg-[#0047AB] text-white px-6 py-3 rounded-xl font-black text-sm shadow-xl shadow-blue-100 hover:scale-105 transition-all">
          <Plus size={18} strokeWidth={3} />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* --- TABEL INVENTARIS --- */}
      <div className="px-4 sm:px-10 py-8">
        <div className="bg-white rounded-[28px] border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                  <th className="px-8 py-5 w-10 text-center">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </th>
                  <th className="px-6 py-5">Produk</th>
                  <th className="px-6 py-5">SKU</th>
                  <th className="px-6 py-5">Kategori</th>
                  <th className="px-6 py-5 text-right">Harga (IDR)</th>
                  <th className="px-6 py-5 text-center">Stok</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F9FB]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5 text-center">
                      <input type="checkbox" className="rounded border-slate-300" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                          <img src={p.imageUrl || "https://placehold.co/100"} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-black text-[#0F172A] uppercase leading-tight">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-[#64748B] uppercase tracking-tighter">{p.sku}</td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-[#64748B] text-[9px] font-black rounded-md uppercase">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-sm font-black text-[#0F172A]">
                      {p.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`text-sm font-black ${p.stock <= 10 ? "text-[#E11D48]" : "text-[#0F172A]"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-tighter ${
                        p.stock === 0 ? "text-slate-400" : p.stock <= 10 ? "text-[#E11D48]" : "text-[#10B981]"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          p.stock === 0 ? "bg-slate-300" : p.stock <= 10 ? "bg-[#E11D48] animate-pulse" : "bg-[#10B981]"
                        }`}></div>
                        <span>{p.stock === 0 ? "Habis" : p.stock <= 10 ? "Stok Rendah" : "Tersedia"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-[#94A3B8] hover:text-[#0F172A] transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION --- */}
          <div className="p-8 border-t border-[#F8F9FB] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">
              Menampilkan {filteredProducts.length} dari {products.length} Produk
            </p>
            <div className="flex items-center space-x-2">
              <button className="p-2 border border-[#E2E8F0] rounded-lg text-[#94A3B8] hover:bg-slate-50"><ChevronLeft size={16} /></button>
              {[1, 2, 3].map(n => (
                <button key={n} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  n === 1 ? "bg-[#0047AB] text-white shadow-lg shadow-blue-100" : "text-[#64748B] hover:bg-slate-50 border border-[#E2E8F0]"
                }`}>{n}</button>
              ))}
              <button className="p-2 border border-[#E2E8F0] rounded-lg text-[#94A3B8] hover:bg-slate-50"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}