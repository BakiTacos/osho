"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase"; 
import { useAuth } from "../../context/AuthContext";
import AuthComponent from "../../components/AuthComponent"; // Sesuaikan path
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp, writeBatch 
} from "firebase/firestore";
import { 
  Search, Bell, HelpCircle, Plus, Package, 
  AlertTriangle, Slash, MoreVertical, ChevronLeft, ChevronRight,
  Edit2, Trash2, Check, ArrowUpDown, Download, Loader2
} from "lucide-react";

import Link from "next/link";
import * as XLSX from 'xlsx'; // Pastikan sudah install: npm install xlsx

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  imageUrl: string;
  isMapping?: boolean;
  linkedSku?: string;
  multiplier?: number;
}

// --- UTILITY FUNCTIONS ---
const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <span className="group relative inline-flex items-center">
    {children}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-[100] pointer-events-none">
      <span className="relative w-max max-w-[200px] bg-[#0F172A] text-white text-[10px] font-medium py-1.5 px-3 rounded-lg shadow-2xl text-center leading-relaxed whitespace-nowrap">
        {text}
      </span>
      <span className="w-2.5 h-2.5 bg-[#0F172A] rotate-45 -mt-1.5"></span>
    </span>
  </span>
);

const calculateNetProfit = (product: Product) => {
  const price = product.price || 0;
  const unitCost = product.costPrice || 0;
  const multiplier = product.isMapping ? (product.multiplier || 1) : 1;
  const totalCost = unitCost * multiplier;

  const adminMarketplace = price * 0.10; 
  const adminLayanan = price * 0.06;    
  const biayaTetap = 1250;              
  
  return price - totalCost - adminMarketplace - adminLayanan - biayaTetap;
};

const calculateNetMargin = (product: Product) => {
  if (!product.price || product.price === 0) return 0;
  const netProfit = calculateNetProfit(product);
  return (netProfit / product.price) * 100;
};

export default function InventarisPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "netProfit" | "netMargin">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);

  const categories = ["Semua", "Dapur", "Kamar Mandi", "Kebersihan", "Penyimpanan", "Ruang Tamu", "Kamar Tidur", "Lainnya"];

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, `users/${currentUser.uid}/products`), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(productData);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // --- LOGIKA IMPOR MASSAL ---
  const handleMassImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];
        
        const rawRows = data.slice(1); // Skip Header
        const latestDataMap: Record<string, any> = {};

        rawRows.forEach((row) => {
          const rawSku = String(row[0] || "").trim().replace(/\s+/g, '').toUpperCase();
          if (!rawSku || rawSku === "UNDEFINED") return;

          // Parsing Tanggal (Kolom E / Index 4)
          const dateValue = row[4]; 
          const currentDate = dateValue ? new Date(dateValue) : new Date(0);

          // Logika: Jika SKU belum ada di map ATAU tanggal baris ini lebih baru dari yang di map
          if (!latestDataMap[rawSku] || currentDate > latestDataMap[rawSku].date) {
            latestDataMap[rawSku] = {
              sku: rawSku,
              name: String(row[1] || "Tanpa Nama").toUpperCase(),
              price: Number(String(row[2] || "0").replace(/[^0-9.-]+/g, "")),
              costPrice: Number(String(row[3] || "0").replace(/[^0-9.-]+/g, "")),
              date: currentDate
            };
          }
        });

        // Upload hasil filter ke Firestore menggunakan setDoc (ID = SKU)
        const uploadPromises = Object.values(latestDataMap).map((item) => {
          const docRef = doc(db, `users/${currentUser.uid}/products`, item.sku); // ID disetel ke SKU
          return setDoc(docRef, {
            sku: item.sku,
            name: item.name,
            price: item.price,
            costPrice: item.costPrice,
            stock: 0, // Default stok awal
            category: "Lainnya",
            imageUrl: "",
            isMapping: false,
            updatedAt: serverTimestamp()
          }, { merge: true }); // Merge true agar field lain (seperti stok) tidak terhapus jika sudah ada
        });

        await Promise.all(uploadPromises);
        alert(`Impor selesai. ${Object.keys(latestDataMap).length} SKU unik berhasil diproses.`);
      } catch (err) {
        console.error(err);
        alert("Format file tidak didukung atau kolom salah.");
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteAll = async () => {
    const confirmDelete = window.confirm("PERINGATAN: Semua data inventaris akan dihapus permanen. Lanjutkan?");
    if (!confirmDelete || !currentUser) return;

    setIsImporting(true);
    try {
      const batch = writeBatch(db);
      products.forEach((p) => {
        const docRef = doc(db, `users/${currentUser.uid}/products`, p.id);
        batch.delete(docRef);
      });
      await batch.commit();
      alert("Semua data berhasil dibersihkan.");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus data.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus produk ini dari inventaris?")) {
      await deleteDoc(doc(db, `users/${currentUser?.uid}/products`, id));
      setActiveMenuId(null);
    }
  };

  const handleUpdateStock = async (id: string) => {
    await updateDoc(doc(db, `users/${currentUser?.uid}/products`, id), { stock: Number(tempStock) });
    setEditingStockId(null);
  };

  const processedProducts = products
    .filter(p => 
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === "Semua" || p.category === selectedCategory)
    )
    .sort((a, b) => {
      let valA: any;
      let valB: any;

      // Logika pengurutan untuk nilai hasil kalkulasi
      if (sortBy === "netProfit") {
        valA = calculateNetProfit(a);
        valB = calculateNetProfit(b);
      } else if (sortBy === "netMargin") {
        valA = calculateNetMargin(a);
        valB = calculateNetMargin(b);
      } else {
        // Logika pengurutan untuk field standar
        valA = a[sortBy as keyof Product] || 0;
        valB = b[sortBy as keyof Product] || 0;
      }

      if (sortOrder === "asc") return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;


  if (!currentUser) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 dark:bg-black">
        <div className="w-full max-w-2xl text-center">
          <h1 className="mb-8 text-4xl font-bold dark:text-white">My Lists</h1>
          <p className="mb-8 dark:text-gray-300">
            Silakan login atau daftar untuk membuat daftar kustom.
          </p>
          <AuthComponent />
          <Link href="/" className="mt-12 inline-block text-blue-600 hover:underline dark:text-blue-400">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-10">
      
      {/* HEADER */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-4">
        <div className="relative flex-1 lg:flex-none lg:w-96 ml-16 lg:ml-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input 
            type="text" placeholder="Cari produk atau SKU..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#EDF2F7] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-[#0047AB]"
          />
        </div>
        <div className="flex items-center space-x-6">
          <Bell size={20} className="hidden sm:block cursor-pointer text-[#64748B] hover:text-[#0047AB]" />
          <div className="flex items-center space-x-3 border-l pl-6">
            <span className="hidden md:block text-sm font-bold text-[#0F172A]">KIA</span>
            <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center text-xs font-black">K</div>
          </div>
        </div>
      </div>

      {/* TITLE BAR & ACTIONS */}
      <div className="px-4 sm:px-10 mt-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter leading-tight">Inventaris</h1>
          <p className="text-[#64748B] mt-2 text-sm font-medium">Manajemen stok dan performa margin produk secara massal.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          
          
          {/* TOMBOL IMPOR MASSAL (Excel) */}
          <div className="relative">
            <input 
              type="file" accept=".xlsx, .xls" 
              onChange={handleMassImport} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isImporting}
            />
            <button className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center space-x-2">
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} strokeWidth={3} />}
              <span>{isImporting ? "Memproses..." : "Impor Excel"}</span>
            </button>
          </div>

          <Link href="/inventaris/tambah">
            <button className="bg-[#0047AB] text-white px-5 py-3 rounded-xl font-black text-xs shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center space-x-2">
              <Plus size={16} strokeWidth={3} />
              <span>Tambah Produk</span>
            </button>
          </Link>

          <Link href="/inventaris/mapping">
            <button className="bg-white text-[#0047AB] border-2 border-[#0047AB] px-5 py-3 rounded-xl font-black text-xs hover:bg-blue-50 transition-all flex items-center space-x-2">
              <ArrowUpDown size={16} strokeWidth={3} />
              <span>Mapping SKU</span>
            </button>
          </Link>

          {/* Tombol Baru: Edit Massal */}
          <Link href="/inventaris/multi-edit">
            <button className="bg-white text-emerald-600 border-2 border-emerald-600 px-5 py-3 rounded-xl font-black text-xs hover:bg-emerald-50 transition-all flex items-center space-x-2">
              <Edit2 size={16} strokeWidth={3} />
              <span>Edit Massal</span>
            </button>
          </Link>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="px-4 sm:px-10 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[28px] border border-[#F1F5F9] shadow-sm relative">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-[#F0F7FF] text-[#0047AB] rounded-2xl"><Package size={22} /></div>
            <Tooltip text="Total variasi produk terdaftar."><HelpCircle size={14} className="opacity-20 cursor-help" /></Tooltip>
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Total SKU</p>
          <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{products.length}</h3>
          <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-[#0047AB] rounded-tr-full rounded-bl-[28px]"></div>
        </div>

        <div className="bg-white p-7 rounded-[28px] border border-[#F1F5F9] shadow-sm relative">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-[#FFF1F2] text-[#E11D48] rounded-2xl"><AlertTriangle size={22} /></div>
            <Tooltip text="Stok menipis (di bawah 10 unit)."><HelpCircle size={14} className="opacity-20 cursor-help" /></Tooltip>
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Stok Rendah</p>
          <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{lowStockCount}</h3>
          <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-[#E11D48] rounded-tr-full rounded-bl-[28px]"></div>
        </div>

        <div className="bg-white p-7 rounded-[28px] border border-[#F1F5F9] shadow-sm relative">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl"><Slash size={22} /></div>
            <Tooltip text="Produk yang stoknya benar-benar habis."><HelpCircle size={14} className="opacity-20 cursor-help" /></Tooltip>
          </div>
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Kosong</p>
          <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">{outOfStockCount}</h3>
          <div className="absolute bottom-0 left-0 w-32 h-[6px] bg-slate-200 rounded-tr-full rounded-bl-[28px]"></div>
        </div>
      </div>

      {/* FILTER & SORT */}
      <div className="px-4 sm:px-10 mt-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-sm overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat ? "bg-[#0047AB] text-white shadow-md" : "text-[#64748B] hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex bg-white rounded-xl border border-[#E2E8F0] p-1 shadow-sm items-center">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-[10px] font-black text-[#0F172A] uppercase tracking-wider focus:ring-0 px-3"
          >
            <option value="name">Urut: Nama</option>
            <option value="stock">Urut: Stok</option>
            <option value="price">Urut: Harga Jual</option>
            <option value="netProfit">Urut: Keuntungan (Rp)</option>
            <option value="netMargin">Urut: Margin (%)</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-[#0047AB]"
          >
            <ArrowUpDown size={14} />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="px-4 sm:px-10 py-8">
        <div className="bg-white rounded-[28px] border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FB] border-b border-[#F1F5F9]">
                <tr className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">
                  <th className="px-8 py-5">Produk</th>
                  <th className="px-6 py-5">SKU</th>
                  <th className="px-6 py-5 text-right">HPP (Modal)</th>
                  <th className="px-6 py-5 text-right">Jual</th>
                  <th className="px-6 py-5 text-right">Margin (%)</th>
                  <th className="px-6 py-5 text-right">Net Profit</th>
                  <th className="px-6 py-5 text-center">Stok</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F9FB]">
                {processedProducts.map((p) => {
                  const netProfit = calculateNetProfit(p);
                  const netMargin = calculateNetMargin(p);
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-100 overflow-hidden">
                            {p.imageUrl ? <img src={p.imageUrl} alt="" className="object-cover w-full h-full" /> : <Package size={18} className="text-slate-300" />}
                          </div>
                          <span className="text-sm font-black text-[#0F172A] uppercase leading-tight">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-[#64748B] uppercase">{p.sku}</td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-[#94A3B8]">
                        Rp {p.costPrice?.toLocaleString('id-ID') || 0}
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-black text-[#0F172A]">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-[11px] font-black px-2 py-1 rounded-lg ${
                          netMargin >= 15 ? "bg-emerald-50 text-emerald-600" : 
                          netMargin >= 5 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                        }`}>
                          {netMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`text-sm font-black ${netProfit > 0 ? "text-[#0047AB]" : "text-red-600"}`}>
                          Rp {netProfit.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {editingStockId === p.id ? (
                          <div className="flex items-center justify-center space-x-1">
                            <input autoFocus type="number" 
                              className="w-16 p-1 border border-[#0047AB] rounded text-center text-xs font-black"
                              value={tempStock} onChange={(e) => setTempStock(Number(e.target.value))}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateStock(p.id)}
                            />
                            <button onClick={() => handleUpdateStock(p.id)} className="text-green-600"><Check size={16}/></button>
                          </div>
                        ) : (
                          <div onClick={() => { setEditingStockId(p.id); setTempStock(p.stock); }}
                            className={`cursor-pointer inline-block text-sm font-black p-1 px-3 rounded-md transition-all ${p.stock <= 10 ? "text-red-600 bg-red-50" : "text-[#0F172A] hover:bg-slate-100"}`}
                          >
                            {p.stock}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right relative">
                        <button onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-[#94A3B8]"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {activeMenuId === p.id && (
                          <div className="absolute right-10 top-12 w-40 bg-white border border-[#F1F5F9] rounded-xl shadow-2xl z-[110] py-1">
                            <Link href={`/inventaris/edit/${p.id}`} className="flex items-center space-x-3 px-4 py-3 text-xs font-black text-[#64748B] hover:bg-blue-50 hover:text-[#0047AB]">
                              <Edit2 size={14} /> <span>Edit Produk</span>
                            </Link>
                            <button onClick={() => handleDelete(p.id)}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={14} /> <span>Hapus</span>
                            </button>
                            
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}