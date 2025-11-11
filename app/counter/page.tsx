"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import React from 'react';
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import AuthComponent from "../../components/AuthComponent";
// PERBAIKI TYPO: "CounterItems" -> "CounterItem"
import CounterItem from "../../components/CounterItems"; 
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  query,
  orderBy,
} from "firebase/firestore";

// --- INTERFACE (Tipe Data) ---
// (Tidak berubah)
interface CategoryData {
  name: string;
}
interface Category extends CategoryData {
  id: string;
}
interface CounterData {
  name: string;
  count: number;
  categoryId: string;
}
interface Counter extends CounterData {
  id: string;
}

// --- KOMPONEN UTAMA ---

export default function CounterPage() {
  // State (Tidak berubah)
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCounterName, setNewCounterName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [counters, setCounters] = useState<Counter[]>([]);
  const [activeInputTab, setActiveInputTab] = useState<'counter' | 'category'>('counter');
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const { currentUser, loading: authLoading } = useAuth();

  // --- EFEK (Membaca Data) ---
  // (Tidak berubah)
  useEffect(() => {
    if (!currentUser) {
      setCategories([]);
      return;
    }
    const catPath = `users/${currentUser.uid}/categories`;
    const q = query(collection(db, catPath), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let catsArray: Category[] = [];
      querySnapshot.forEach((doc) => {
        catsArray.push({ ...(doc.data() as CategoryData), id: doc.id });
      });
      setCategories(catsArray);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setCounters([]);
      return;
    }
    const counterPath = `users/${currentUser.uid}/counters`;
    const q = query(collection(db, counterPath), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let countersArray: Counter[] = [];
      querySnapshot.forEach((doc) => {
        countersArray.push({ ...(doc.data() as CounterData), id: doc.id });
      });
      setCounters(countersArray);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // --- FUNGSI CRUD ---
  // (Tidak berubah, kecuali penambahan resetCount)

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim() === "" || !currentUser) return;
    const collectionPath = `users/${currentUser.uid}/categories`;
    await addDoc(collection(db, collectionPath), { name: newCategoryName });
    setNewCategoryName("");
    setActiveInputTab('counter');
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!currentUser) return;
    if (window.confirm("Hapus kategori ini? (Counter di dalamnya akan 'yatim')")) {
      const docPath = `users/${currentUser.uid}/categories/${categoryId}`;
      await deleteDoc(doc(db, docPath));
    }
  };
  
  const handleCreateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCounterName.trim() === "" || !selectedCategoryId || !currentUser) {
      alert("Harap pilih kategori dan isi nama counter.");
      return;
    }
    const collectionPath = `users/${currentUser.uid}/counters`;
    const newCounter: CounterData = {
      name: newCounterName,
      count: 0,
      categoryId: selectedCategoryId,
    };
    await addDoc(collection(db, collectionPath), newCounter);
    setNewCounterName("");
  };

  const updateCount = async (counterId: string, amount: number) => {
    if (!currentUser) return;
    const docPath = `users/${currentUser.uid}/counters/${counterId}`;
    await updateDoc(doc(db, docPath), { count: increment(amount) });
  };
  
  // ==========================================================
  // --- PERUBAHAN 1: Fungsi Reset Baru ---
  // ==========================================================
  const resetCount = async (counterId: string) => {
    if (!currentUser) return;
    const docPath = `users/${currentUser.uid}/counters/${counterId}`;
    const counterRef = doc(db, docPath);
    try {
      // Set count langsung ke 0, bukan increment
      await updateDoc(counterRef, { count: 0 });
    } catch (error) {
      console.error("Gagal mereset counter:", error);
    }
  };

  const handleDeleteCounter = async (counterId: string) => {
    if (!currentUser) return;
    if (window.confirm("Yakin ingin menghapus counter ini?")) {
      const docPath = `users/${currentUser.uid}/counters/${counterId}`;
      await deleteDoc(doc(db, docPath));
    }
  };

  // --- FUNGSI RENDER HELPER ---
  // (Tidak berubah)
  const categoriesToDisplay = filterCategoryId
    ? categories.filter(c => c.id === filterCategoryId)
    : categories;

  const showUncategorized = !filterCategoryId || filterCategoryId === "--UNCATEGORIZED--";
  
  const getUncategorizedCounters = () => {
    const categoryIds = new Set(categories.map(c => c.id));
    return counters.filter(counter => !categoryIds.has(counter.categoryId));
  };
  
  const uncategorizedCounters = getUncategorizedCounters();

  // --- RENDER (Loading & Auth) ---
  // (Tidak berubah)
  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 dark:bg-black">
        <p className="dark:text-white">Memuat sesi...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 dark:bg-black">
        <div className="w-full max-w-2xl text-center">
          <h1 className="mb-8 text-4xl font-bold dark:text-white">Selamat Datang</h1>
          <p className="mb-8 dark:text-gray-300">
            Silakan login atau daftar untuk menggunakan aplikasi counter.
          </p>
          <AuthComponent />
          <Link href="/" className="mt-12 inline-block text-blue-600 hover:underline dark:text-blue-400">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  // --- TAMPILAN UTAMA (Sudah Login) ---
  return (
    // Kurangi padding di mobile (p-8 -> p-4) agar kartu lebih pas
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 dark:bg-black">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <AuthComponent />
        </div>
        
        <h1 className="mb-8 text-center text-4xl font-bold dark:text-white">
          My Counters
        </h1>

        {/* --- Form Input Model Tab (Hemat Ruang) --- */}
        {/* (Tidak berubah) */}
        <div className="mb-12 rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
          <div className="mb-4 flex border-b border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setActiveInputTab('counter')}
              className={`py-2 px-4 font-semibold ${
                activeInputTab === 'counter'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Buat Counter Baru
            </button>
            <button
              onClick={() => setActiveInputTab('category')}
              className={`py-2 px-4 font-semibold ${
                activeInputTab === 'category'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Buat Kategori Baru
            </button>
          </div>

          {activeInputTab === 'counter' && (
            <form onSubmit={handleCreateCounter} className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold dark:text-white">Buat Counter Baru</h2>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={newCounterName}
                onChange={(e) => setNewCounterName(e.target.value)}
                placeholder="Mis: Push-up, Email Terkirim"
                className="rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={!selectedCategoryId}
                className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                Simpan Counter
              </button>
            </form>
          )}

          {activeInputTab === 'category' && (
            <form onSubmit={handleCreateCategory} className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold dark:text-white">Buat Kategori Baru</h2>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Mis: Kesehatan, Pekerjaan"
                className="rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Simpan Kategori
              </button>
            </form>
          )}
        </div>

        {/* --- Dropdown Filter --- */}
        {/* (Tidak berubah) */}
        <div className="mb-8 max-w-sm">
          <label htmlFor="categoryFilter" className="block text-sm font-medium dark:text-gray-300">
            Tampilkan Kategori
          </label>
          <select
            id="categoryFilter"
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="mt-1 block w-full rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Semua Kategori</option>
            <option value="--UNCATEGORIZED--">Tanpa Kategori</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* --- Area Daftar Counter (Tergrup) --- */}
        <div className="space-y-12">
          
          {categoriesToDisplay.map(category => {
            const countersForThisCategory = counters.filter(
              c => c.categoryId === category.id
            );
            
            return (
              <section key={category.id}>
                <div className="mb-4 flex items-center justify-between border-b border-gray-600 pb-2">
                  <h2 className="text-3xl font-bold dark:text-white">
                    {category.name}
                  </h2>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-sm text-red-500 hover:underline dark:text-red-400"
                  >
                    Hapus Kategori
                  </button>
                </div>

                {/* ========================================================== */}
                {/* --- PERUBAHAN 2: Layout Grid 2 Kolom Mobile --- */}
                {/* ========================================================== */}
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {countersForThisCategory.length > 0 ? (
                    countersForThisCategory.map(counter => (
                      <CounterItem
                        key={counter.id}
                        counter={counter}
                        onUpdate={updateCount}
                        onDelete={handleDeleteCounter}
                        onReset={resetCount} // <-- Kirim prop baru
                      />
                    ))
                  ) : (
                    // Letakkan 'pesan kosong' di luar grid agar tidak jadi 1 kolom
                    <p className="col-span-2 dark:text-gray-400">Belum ada counter di kategori ini.</p>
                  )}
                </div>
              </section>
            );
          })}

          {/* Loop 2: Render counter "Yatim" */}
          {showUncategorized && uncategorizedCounters.length > 0 && (
            <section>
              <h2 className="mb-4 border-b border-gray-600 pb-2 text-3xl font-bold dark:text-gray-500">
                Tanpa Kategori
              </h2>
              {/* ========================================================== */}
              {/* --- PERUBAHAN 2: Layout Grid 2 Kolom Mobile --- */}
              {/* ========================================================== */}
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {uncategorizedCounters.map(counter => (
                  <CounterItem
                    key={counter.id}
                    counter={counter}
                    onUpdate={updateCount}
                    onDelete={handleDeleteCounter}
                    onReset={resetCount} // <-- Kirim prop baru
                  />
                ))}
              </div>
            </section>
          )}

          {/* Pesan jika tidak ada data sama sekali */}
          {categories.length === 0 && counters.length === 0 && (
             <p className="text-center text-lg dark:text-gray-400">
                Anda belum memiliki kategori atau counter.
             </p>
          )}

          {/* Pesan jika filter tidak menemukan apa-apa */}
          {filterCategoryId && categoriesToDisplay.length === 0 && !(filterCategoryId === '--UNCATEGORIZED--' && uncategorizedCounters.length > 0) && (
             <p className="text-center text-lg dark:text-gray-400">
                Tidak ada counter untuk filter yang dipilih.
             </p>
          )}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/" className="inline-block text-blue-600 hover:underline dark:text-blue-400">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}