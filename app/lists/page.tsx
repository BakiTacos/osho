"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import React from 'react';
import { db } from "../../lib/firebase"; // Sesuaikan path
import { useAuth } from "../../context/AuthContext"; // Sesuaikan path
import AuthComponent from "../../components/AuthComponent"; // Sesuaikan path
import ListItemCard from "../../components/ListItemCard"; // <-- Impor komponen kartu baru kita
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch, // Diperlukan untuk menghapus list & itemnya
  where, // Diperlukan untuk menghapus list & itemnya
  getDocs
} from "firebase/firestore";

// --- Interface ---
// Ini adalah "Daftar" induk
interface List {
  id: string;
  name: string;
  createdAt: Timestamp;
}

// --- Komponen Halaman Utama ---
export default function ListsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  
  const [lists, setLists] = useState<List[]>([]); // State untuk SEMUA daftar
  const [newListName, setNewListName] = useState(""); // State untuk input "buat list"

  // Efek: Mendengarkan koleksi "lists"
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

  // --- Fungsi CRUD Halaman ---

  // Membuat "Daftar" (kartu) baru
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim() === "" || !currentUser) return;

    const collectionPath = `users/${currentUser.uid}/lists`;
    await addDoc(collection(db, collectionPath), {
      name: newListName,
      createdAt: serverTimestamp(),
    });
    setNewListName(""); // Kosongkan input
  };
  
  // Menghapus "Daftar" (kartu) BESERTA semua item di dalamnya
  const handleDeleteList = async (listId: string) => {
    if (!currentUser) return;
    
    // Konfirmasi dulu
    const listToDelete = lists.find(l => l.id === listId);
    if (!listToDelete) return;
    
    if (window.confirm(`Yakin ingin menghapus list "${listToDelete.name}" beserta SEMUA isinya?`)) {
      try {
        const batch = writeBatch(db);

        // 1. Hapus Dokumen List Induk
        const listDocRef = doc(db, `users/${currentUser.uid}/lists`, listId);
        batch.delete(listDocRef);

        // 2. Temukan dan Hapus semua item di dalamnya
        const itemsPath = `users/${currentUser.uid}/listItems`;
        const q = query(collection(db, itemsPath), where("listId", "==", listId));
        
        // Dapatkan snapshot dari item yang akan dihapus (perlu query)
        const itemsSnapshot = await getDocs(q); // getDocs, bukan onSnapshot
        itemsSnapshot.forEach(doc => {
          batch.delete(doc.ref); // Tambahkan setiap item ke batch
        });

        // 3. Eksekusi semua penghapusan
        await batch.commit();

      } catch (error) {
        console.error("Gagal menghapus list dan itemnya:", error);
        alert("Terjadi kesalahan saat menghapus list.");
      }
    }
  };
  
  // Impor getDocs jika belum ada di atas
  // import { ..., getDocs } from "firebase/firestore";
  // Note: Jika getDocs error, pastikan sudah diimpor dari 'firebase/firestore'

  // --- Render (Loading & Auth) ---
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

  // --- Tampilan Utama (Sudah Login) ---
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 dark:bg-black">
      <div className="w-full max-w-6xl"> {/* Dibuat lebih lebar (max-w-6xl) */}
        <div className="mb-8 text-center">
          <AuthComponent />
        </div>
        
        <h1 className="mb-8 text-center text-4xl font-bold dark:text-white">
          My Custom Lists
        </h1>

        {/* --- Form Buat List Baru --- */}
        <form
          onSubmit={handleCreateList}
          className="mx-auto mb-12 max-w-lg rounded-lg bg-gray-100 p-6 dark:bg-gray-800"
        >
          <h2 className="mb-4 text-2xl font-semibold dark:text-white">Buat Daftar Baru</h2>
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nama Daftar (mis: Belanjaan, Film)"
              className="flex-grow rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Buat List
            </button>
          </div>
        </form>

        <hr className="mb-12 border-gray-600" />

        {/* --- Grid untuk Kartu Daftar --- */}
        <h2 className="mb-6 text-3xl font-bold dark:text-white">Daftar Tersimpan</h2>
        {lists.length === 0 ? (
          <p className="dark:text-gray-400">Anda belum membuat daftar apapun.</p>
        ) : (
          // Ini adalah layout grid 2 kolom
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {lists.map((list) => (
              <ListItemCard 
                key={list.id} 
                list={list}
                onDeleteList={handleDeleteList} // Kirim fungsi delete sebagai prop
              />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/" className="inline-block text-blue-600 hover:underline dark:text-blue-400">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

// PASTIKAN Anda mengimpor 'getDocs' di atas
// import { ..., getDocs } from "firebase/firestore";