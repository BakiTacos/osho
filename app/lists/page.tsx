"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "../../lib/firebase"; 
import { useAuth } from "../../context/AuthContext"; 
import AuthComponent from "../../components/AuthComponent"; 
import ListItemCard from "../../components/ListItemCard"; 
import { PlusCircle, ListTodo, ChevronLeft, LayoutList } from "lucide-react";

import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
  where,
  getDocs
} from "firebase/firestore";

interface List {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export default function ListsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  
  const [lists, setLists] = useState<List[]>([]); 
  const [newListName, setNewListName] = useState(""); 

  useEffect(() => {
    if (!currentUser) {
      setLists([]);
      return;
    }
    
    const collectionPath = `users/${currentUser.uid}/lists`;
    const q = query(collection(db, collectionPath), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let listsArray: List[] = [];
      querySnapshot.forEach((doc) => {
        listsArray.push({ ...(doc.data() as any), id: doc.id });
      });
      setLists(listsArray);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim() === "" || !currentUser) return;

    const collectionPath = `users/${currentUser.uid}/lists`;
    await addDoc(collection(db, collectionPath), {
      name: newListName,
      createdAt: serverTimestamp(),
    });
    setNewListName(""); 
  };
  
  const handleDeleteList = async (listId: string) => {
    if (!currentUser) return;
    
    const listToDelete = lists.find(l => l.id === listId);
    if (!listToDelete) return;
    
    if (window.confirm(`Yakin ingin menghapus list "${listToDelete.name}" beserta SEMUA isinya?`)) {
      try {
        const batch = writeBatch(db);

        const listDocRef = doc(db, `users/${currentUser.uid}/lists`, listId);
        batch.delete(listDocRef);

        const itemsPath = `users/${currentUser.uid}/listItems`;
        const q = query(collection(db, itemsPath), where("listId", "==", listId));
        
        const itemsSnapshot = await getDocs(q); 
        itemsSnapshot.forEach(doc => {
          batch.delete(doc.ref); 
        });

        await batch.commit();

      } catch (error) {
        console.error("Gagal menghapus list dan itemnya:", error);
        alert("Terjadi kesalahan saat menghapus list.");
      }
    }
  };

  // --- STATE: LOADING ---
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <p className="font-black text-[#0047AB] animate-pulse uppercase tracking-widest text-xs">Memuat Sesi...</p>
      </div>
    );
  }

  // --- STATE: BELUM LOGIN ---
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] p-6">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[32px] border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 text-[#0047AB] rounded-full flex items-center justify-center mx-auto mb-6">
            <LayoutList size={32} />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] mb-2 tracking-tight">Akses Terbatas</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            Silakan login untuk mengelola daftar.
          </p>
          <AuthComponent />
          <Link href="/" className="mt-8 inline-flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-[#0047AB] uppercase transition-colors">
            <ChevronLeft size={16} /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // --- TAMPILAN UTAMA (SUDAH LOGIN) ---
  return (
    <div className="text-[#1E293B] ml-0 lg:ml-72 min-h-screen bg-[#F8F9FB] transition-all duration-300 pb-20">
      
      {/* 🚀 HEADER SECTION */}
      <div className="px-4 sm:px-10 pt-10 sm:pt-14">
        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
          Personalisasi & Catatan
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#0F172A] tracking-tighter leading-none flex items-center gap-3">
          <ListTodo className="text-[#0047AB] hidden sm:block" size={36} strokeWidth={2.5} />
          Custom Lists
        </h1>
      </div>

      {/* 🚀 FORM BUAT LIST (Desain Floating Pill) */}
      <div className="px-4 sm:px-10 mt-8">
        <form
          onSubmit={handleCreateList}
          className="flex flex-col sm:flex-row items-center bg-white p-2 rounded-[20px] sm:rounded-full shadow-sm border border-slate-200 max-w-2xl transition-all focus-within:border-[#0047AB] focus-within:shadow-md"
        >
          <div className="flex-1 w-full px-4 py-2 sm:py-0">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Tulis nama daftar baru (mis: Belanja, Film)..."
              className="w-full bg-transparent text-sm sm:text-base font-bold text-[#0F172A] outline-none placeholder:text-slate-300 placeholder:font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={!newListName.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0047AB] text-white px-6 py-3 sm:py-2.5 rounded-xl sm:rounded-full font-black text-[10px] sm:text-xs uppercase shadow-md shadow-blue-100 hover:bg-blue-800 disabled:opacity-50 transition-all shrink-0"
          >
            <PlusCircle size={16} /> <span className="tracking-widest">Buat List</span>
          </button>
        </form>
      </div>

      {/* 🚀 TAB MENU VISUAL (Pemisah Garis Sederhana) */}
      <div className="px-4 sm:px-10 mt-10 sm:mt-12">
        <div className="flex border-b border-slate-200">
          <div className="pb-3 text-sm sm:text-base text-[#0F172A] font-black border-b-[3px] sm:border-b-4 border-[#0F172A] tracking-tight flex items-center gap-2">
            <LayoutList size={18} /> Koleksi Daftar
          </div>
        </div>
      </div>

      {/* 🚀 DAFTAR TERSIMPAN (GRID) */}
      <div className="px-4 sm:px-10 mt-8">
        {lists.length === 0 ? (
          <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <ListTodo size={56} className="mb-4 text-slate-200" strokeWidth={1.5} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-300">Belum ada daftar yang dibuat.</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Gunakan kolom di atas untuk mulai membuat list.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {lists.map((list) => (
              <ListItemCard 
                key={list.id} 
                list={list}
                onDeleteList={handleDeleteList} 
              />
            ))}
          </div>
        )}
      </div>

      {/* 🚀 FOOTER ACTION */}
      <div className="px-4 sm:px-10 mt-12 text-center lg:text-left">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-black text-slate-400 hover:text-[#0047AB] uppercase transition-colors tracking-widest">
          <ChevronLeft size={16} /> Kembali ke Beranda
        </Link>
      </div>
      
    </div>
  );
}