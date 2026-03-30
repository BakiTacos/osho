"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  collection, onSnapshot, query, addDoc, 
  serverTimestamp, orderBy, doc, updateDoc, increment, deleteDoc
} from "firebase/firestore";
import { 
  Search, Bell, HelpCircle, PlusCircle, Wallet, 
  Filter, FileText, MoreVertical, Landmark, Trash2, 
  Plus, History, Edit3, X, CheckCircle2, AlertCircle, Pencil
} from "lucide-react";

export default function PembayaranPage() {
  const { currentUser } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWithdrawId, setEditWithdrawId] = useState<string | null>(null);
  const [withdrawForm, setWithdrawForm] = useState({ platform: 'Shopee', amount: '' });
  const [invoiceForm, setInvoiceForm] = useState({ 
    noNota: '', supplier: '', dueDate: '', status: 'BELUM BAYAR' 
  });

  const openEditWithdraw = (w: any) => {
    if (w.editCount >= 1) {
        alert("Saldo ini sudah pernah diubah dan tidak bisa diubah lagi.");
        return;
    }
    setEditWithdrawId(w.id);
    setWithdrawForm({ 
        platform: w.platform, 
        amount: w.amount.toString() 
    });
    setIsWithdrawModalOpen(true);
    setIsHistoryModalOpen(false); // Tutup modal riwayat saat buka modal edit
    };

  // State Item Nota dengan tambahan field 'unit' (default: lusin)
  const [invoiceItems, setInvoiceItems] = useState([
    { sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }
  ]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubProd = onSnapshot(collection(db, `users/${currentUser.uid}/products`), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubWithdraw = onSnapshot(query(collection(db, `users/${currentUser.uid}/withdrawals`), orderBy("createdAt", "desc")), (snap) => {
      setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubInvoices = onSnapshot(query(collection(db, `users/${currentUser.uid}/supplier_invoices`), orderBy("createdAt", "desc")), (snap) => {
      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubProd(); unsubWithdraw(); unsubInvoices(); };
  }, [currentUser]);

  const platformStats: Record<string, number> = withdrawals.reduce((acc: any, curr) => {
    acc[curr.platform] = (acc[curr.platform] || 0) + curr.amount;
    return acc;
    }, {});

  const totalUnpaid = invoices.filter(inv => inv.status === 'BELUM BAYAR').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'TERBAYAR').reduce((acc, curr) => acc + curr.amount, 0);

  // --- HANDLER SIMPAN NOTA DENGAN LOGIKA SATUAN ---
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasInvalidItem = invoiceItems.some(item => Number(item.qty) <= 0 || Number(item.price) <= 0);
    if (hasInvalidItem) {
      alert("Qty dan Harga Beli harus lebih besar dari 0!");
      return;
    }

    const totalAmount = invoiceItems.reduce((acc, item) => acc + (item.qty * item.price), 0);

    if (editingId) {
      await updateDoc(doc(db, `users/${currentUser?.uid}/supplier_invoices`, editingId), {
        ...invoiceForm, items: invoiceItems, amount: totalAmount
      });
    } else {
      await addDoc(collection(db, `users/${currentUser?.uid}/supplier_invoices`), {
        ...invoiceForm, items: invoiceItems, amount: totalAmount, createdAt: serverTimestamp()
      });

      // Update Stok: Jika lusin maka qty * 12
      for (const item of invoiceItems) {
        const matched = products.find(p => p.sku === item.sku.toUpperCase());
        if (matched) {
          const qtyToIncrement = item.unit === 'lusin' ? Number(item.qty) * 12 : Number(item.qty);
          await updateDoc(doc(db, `users/${currentUser?.uid}/products`, matched.id), {
            stock: increment(qtyToIncrement)
          });
        }
      }
    }
    resetInvoiceForm();
  };

  const handleDeleteInvoice = async (inv: any) => {
    if (!confirm("Hapus nota ini? Stok akan ditarik kembali sesuai satuan saat input.")) return;
    for (const item of inv.items) {
      const matched = products.find(p => p.sku === item.sku.toUpperCase());
      if (matched) {
        const qtyToDecrement = item.unit === 'lusin' ? Number(item.qty) * 12 : Number(item.qty);
        await updateDoc(doc(db, `users/${currentUser?.uid}/products`, matched.id), {
          stock: increment(-qtyToDecrement)
        });
      }
    }
    await deleteDoc(doc(db, `users/${currentUser?.uid}/supplier_invoices`, inv.id));
    setActiveMenuId(null);
  };

  const resetInvoiceForm = () => {
    setIsInvoiceModalOpen(false);
    setEditingId(null);
    setInvoiceForm({ noNota: '', supplier: '', dueDate: '', status: 'BELUM BAYAR' });
    setInvoiceItems([{ sku: '', name: '', qty: 1, price: 0, unit: 'lusin' }]);
  };

  // --- WITHDRAWAL HANDLERS ---
  const handleSaveWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(withdrawForm.amount) <= 0) return alert("Jumlah harus > 0");
    if (editWithdrawId) {
      await updateDoc(doc(db, `users/${currentUser?.uid}/withdrawals`, editWithdrawId), {
        platform: withdrawForm.platform, amount: Number(withdrawForm.amount), editCount: increment(1)
      });
    } else {
      await addDoc(collection(db, `users/${currentUser?.uid}/withdrawals`), {
        ...withdrawForm, amount: Number(withdrawForm.amount), status: 'Berhasil', editCount: 0, createdAt: serverTimestamp()
      });
    }
    setIsWithdrawModalOpen(false);
    setEditWithdrawId(null);
    setWithdrawForm({ platform: 'Shopee', amount: '' });
  };

  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* HEADER & STATS (Tetap sama seperti sebelumnya) */}
      <div className="px-4 sm:px-10 pt-8 flex items-center justify-between">
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-tight">Manajemen<br/>Pembayaran</h1>
        <div className="w-10 h-10 rounded-xl bg-[#0047AB] text-white flex items-center justify-center font-black shadow-lg">K</div>
      </div>

      <div className="px-4 sm:px-10 mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm relative group">
          <button onClick={() => setIsHistoryModalOpen(true)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-[#0047AB] transition-all"><History size={16} /></button>
          <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">Total Saldo Ditarik</p>
          <h3 className="text-xl font-black text-[#0F172A]">Rp {Object.values(platformStats).reduce((a: any, b: any) => a + b, 0).toLocaleString('id-ID')}</h3>
          <div className="mt-4 space-y-1">
            {Object.keys(platformStats).map(p => (
              <div key={p} className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">{p}</span>
                <span className="text-[#0047AB]">Rp {platformStats[p].toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-red-500">
          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-3">Hutang Belum Bayar</p>
          <h3 className="text-xl font-black text-red-600">Rp {totalUnpaid.toLocaleString('id-ID')}</h3>
          <p className="text-[10px] font-bold text-slate-300 mt-2">{invoices.filter(i => i.status === 'BELUM BAYAR').length} Nota Tertunda</p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3">Pembayaran Selesai</p>
          <h3 className="text-xl font-black text-emerald-600">Rp {totalPaid.toLocaleString('id-ID')}</h3>
          <p className="text-[10px] font-bold text-slate-300 mt-2">Arus Kas Keluar</p>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={() => setIsInvoiceModalOpen(true)} className="flex-1 bg-[#0047AB] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-blue-100 hover:scale-[1.02] transition-all"><PlusCircle size={16} /> Nota Baru</button>
          <button onClick={() => { setEditWithdrawId(null); setWithdrawForm({ platform:'Shopee', amount:'' }); setIsWithdrawModalOpen(true); }} className="flex-1 bg-white border-2 border-slate-50 rounded-2xl flex items-center justify-center gap-2 font-black text-xs text-[#0047AB] hover:bg-blue-50 transition-all"><Wallet size={16} /> Tarik Saldo</button>
        </div>
      </div>

      {/* TABLE INVOICES */}
      <div className="px-4 sm:px-10 mt-10">
        <div className="bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8F9FB] text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Nomor Nota / Supplier</th>
                  <th className="px-6 py-5">Status Bayar</th>
                  <th className="px-6 py-5 text-right">Total Tagihan</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-[#0047AB]">#{inv.noNota}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{inv.supplier}</p>
                    </td>
                    <td className="px-6 py-5">
                      <button 
                        onClick={async () => {
                          const nextStatus = inv.status === 'TERBAYAR' ? 'BELUM BAYAR' : 'TERBAYAR';
                          await updateDoc(doc(db, `users/${currentUser?.uid}/supplier_invoices`, inv.id), { status: nextStatus });
                        }}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          inv.status === 'TERBAYAR' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {inv.status}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right text-sm font-black">Rp {inv.amount.toLocaleString('id-ID')}</td>
                    <td className="px-8 py-5 text-right relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)} className="p-2 text-slate-300 hover:text-slate-600 transition-all"><MoreVertical size={18}/></button>
                      {activeMenuId === inv.id && (
                        <div className="absolute right-10 top-12 w-36 bg-white border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                          <button onClick={() => {
                             setEditingId(inv.id);
                             setInvoiceForm({ noNota: inv.noNota, supplier: inv.supplier, dueDate: inv.dueDate || '', status: inv.status });
                             setInvoiceItems(inv.items);
                             setIsInvoiceModalOpen(true);
                             setActiveMenuId(null);
                          }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-slate-600 hover:bg-slate-50"><Edit3 size={14}/> EDIT</button>
                          <button onClick={() => handleDeleteInvoice(inv)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-red-500 hover:bg-red-50"><Trash2 size={14}/> HAPUS</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: NOTA & RESTOCK (With Unit Selection) */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative no-scrollbar">
            <h2 className="text-2xl font-black mb-8 tracking-tighter">{editingId ? "Edit Nota" : "Tambah Nota & Restock"}</h2>
            <form onSubmit={handleSaveInvoice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required value={invoiceForm.noNota} className="bg-slate-50 rounded-2xl py-4 px-6 font-bold" placeholder="Nomor Nota" onChange={e => setInvoiceForm({...invoiceForm, noNota: e.target.value})} />
                <input required value={invoiceForm.supplier} className="bg-slate-50 rounded-2xl py-4 px-6 font-bold" placeholder="Nama Supplier" onChange={e => setInvoiceForm({...invoiceForm, supplier: e.target.value})} />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h5 className="text-[10px] font-black uppercase text-[#0047AB] tracking-widest">Detail Item Belanja</h5>
                  <button type="button" onClick={() => setInvoiceItems([...invoiceItems, {sku:'', name:'', qty:1, price:0, unit:'lusin'}])} className="flex items-center gap-2 text-[9px] font-black bg-blue-50 text-[#0047AB] px-4 py-2 rounded-xl"><Plus size={12}/> TAMBAH ITEM</button>
                </div>
                
                {/* --- TABLE HEADERS --- */}
                <div className="grid grid-cols-12 gap-2 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="col-span-2">SKU Produk</div>
                  <div className="col-span-3">Nama Barang</div>
                  <div className="col-span-2 text-center">Satuan</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2">Harga Beli</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-2">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50/50 p-3 rounded-2xl items-center border border-slate-100">
                      <input required className="col-span-2 bg-white py-2.5 px-4 rounded-xl text-xs font-bold border-none shadow-sm" placeholder="SKU" value={item.sku} onChange={e => {
                        const newItems = [...invoiceItems];
                        newItems[idx].sku = e.target.value;
                        const matched = products.find(p => p.sku === e.target.value.toUpperCase());
                        if(matched) newItems[idx].name = matched.name;
                        setInvoiceItems(newItems);
                      }}/>
                      <input className="col-span-3 bg-transparent py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 border-none" placeholder="Otomatis" value={item.name} readOnly/>
                      
                      {/* --- PILIHAN SATUAN --- */}
                      <select 
                        className="col-span-2 bg-white py-2.5 px-2 rounded-xl text-xs font-black text-[#0047AB] border-none shadow-sm cursor-pointer"
                        value={item.unit}
                        onChange={e => {
                          const newItems = [...invoiceItems];
                          newItems[idx].unit = e.target.value;
                          setInvoiceItems(newItems);
                        }}
                      >
                        <option value="lusin">Lusin (x12)</option>
                        <option value="pcs">Pcs (Satuan)</option>
                      </select>

                      <input type="number" required min="1" className="col-span-2 bg-white py-2.5 px-4 rounded-xl text-xs font-bold text-center border-none shadow-sm" value={item.qty} onChange={e => {
                        const newItems = [...invoiceItems];
                        newItems[idx].qty = Number(e.target.value);
                        setInvoiceItems(newItems);
                      }}/>
                      
                      <input type="number" required min="1" className="col-span-2 bg-white py-2.5 px-4 rounded-xl text-xs font-bold border-none shadow-sm" placeholder="Harga" value={item.price} onChange={e => {
                        const newItems = [...invoiceItems];
                        newItems[idx].price = Number(e.target.value);
                        setInvoiceItems(newItems);
                      }}/>
                      
                      <button type="button" onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== idx))} className="col-span-1 text-red-300 hover:text-red-500 transition-all flex justify-center"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
                  <div className="text-xl font-black">Rp {invoiceItems.reduce((a,b) => a + (b.qty * b.price), 0).toLocaleString('id-ID')}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={resetInvoiceForm} className="px-6 py-3.5 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Batal</button>
                  <button type="submit" className="px-8 py-3.5 bg-[#0047AB] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-100">Simpan Nota</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTORY & WITHDRAW (Tetap sama seperti sebelumnya) */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black tracking-tighter">Riwayat Penarikan</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X/></button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
              {withdrawals.map(w => (
                <div key={w.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg text-[#0047AB] shadow-sm"><Landmark size={16}/></div>
                    <div>
                      <p className="text-[11px] font-black">{w.platform}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{w.createdAt?.toDate().toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-[#0F172A]">Rp {w.amount.toLocaleString('id-ID')}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEditWithdraw(w)} className="p-1.5 text-slate-400 hover:text-[#0047AB] bg-white rounded-lg shadow-sm"><Pencil size={12}/></button>
                      <button onClick={async () => { if(confirm("Hapus?")) await deleteDoc(doc(db, `users/${currentUser?.uid}/withdrawals`, w.id)); }} className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg shadow-sm"><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-8 tracking-tighter">{editWithdrawId ? "Ubah Saldo" : "Tarik Saldo Marketplace"}</h2>
            <form onSubmit={handleSaveWithdraw} className="space-y-4">
              <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" value={withdrawForm.platform} onChange={(e) => setWithdrawForm({...withdrawForm, platform: e.target.value})}>
                <option value="Shopee">Shopee</option><option value="TikTok Shop">TikTok Shop</option><option value="Lazada">Lazada</option>
              </select>
              <input type="number" required min="1" placeholder="Jumlah (Rp)" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-sm" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})} />
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => {setIsWithdrawModalOpen(false); setEditWithdrawId(null);}} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-[#0047AB] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-100">{editWithdrawId ? "Simpan Perubahan" : "Konfirmasi Tarik"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}