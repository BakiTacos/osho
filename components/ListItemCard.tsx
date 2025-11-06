"use client";

import React, { useState, useEffect } from 'react';
import { db } from "../lib/firebase"; // Sesuaikan path
import { useAuth } from "../context/AuthContext"; // Sesuaikan path
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  writeBatch, // Untuk operasi massal (kosongkan list)
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// --- Interface ---
// Ini adalah "Daftar" induk (kartunya)
interface List {
  id: string;
  name: string;
  createdAt: Timestamp;
}

// Ini adalah "Item" di dalam daftar
interface ListItem {
  id: string;
  text: string;
  listId: string; // Tautan ke induk
  createdAt: Timestamp;
}

// --- Props untuk Komponen ---
interface ListItemCardProps {
  list: List;
  onDeleteList: (listId: string) => void; // Fungsi untuk menghapus seluruh list
}

// --- Komponen Kartu ---
export default function ListItemCard({ list, onDeleteList }: ListItemCardProps) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ListItem[]>([]); // State untuk item di dalam list ini
  const [newItemText, setNewItemText] = useState(""); // State untuk input "tambah item"
  const [copied, setCopied] = useState(false); // State untuk tombol copy

  // Efek: Mendengarkan item HANYA untuk list ini
  useEffect(() => {
    if (!currentUser) return;
    
    const itemsPath = `users/${currentUser.uid}/listItems`;
    const q = query(
      collection(db, itemsPath),
      where("listId", "==", list.id), // <-- Kunci: Hanya item untuk listId ini
      orderBy("createdAt", "asc")     // Item terlama di atas
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let itemsArray: ListItem[] = [];
      snapshot.forEach(doc => {
        itemsArray.push({ ...(doc.data() as any), id: doc.id });
      });
      setItems(itemsArray);
    });
    
    return () => unsubscribe();
  }, [currentUser, list.id]);

  // --- Fungsi Internal Kartu ---

  // Menambah item baru ke list ini
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim() === "" || !currentUser) return;
    
    const itemsPath = `users/${currentUser.uid}/listItems`;
    await addDoc(collection(db, itemsPath), {
      text: newItemText,
      listId: list.id,
      createdAt: serverTimestamp()
    });
    setNewItemText(""); // Kosongkan input
  };

  // Menghapus satu item spesifik
  const handleDeleteItem = async (itemId: string) => {
    if (!currentUser) return;
    const docPath = `users/${currentUser.uid}/listItems/${itemId}`;
    await deleteDoc(doc(db, docPath));
  };
  
  // Mengosongkan SEMUA item di list ini (Batch Delete)
  const handleClearList = async () => {
    if (!currentUser || items.length === 0) return;
    
    if (window.confirm(`Yakin ingin mengosongkan ${items.length} item dari "${list.name}"?`)) {
      const itemsPath = `users/${currentUser.uid}/listItems`;
      const batch = writeBatch(db); // Buat operasi batch
      
      // Tambahkan setiap penghapusan item ke batch
      items.forEach(item => {
        const docRef = doc(db, itemsPath, item.id);
        batch.delete(docRef);
      });
      
      await batch.commit(); // Eksekusi semua penghapusan sekaligus
    }
  };

  // Meng-copy semua item ke clipboard
  const handleCopyList = () => {
    if (items.length === 0) return;
    
    // Ubah array of objects menjadi string, 1 item per baris
    const textToCopy = items.map(item => `- ${item.text}`).join("\n");
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset setelah 2 detik
    }).catch(err => {
      console.error("Gagal menyalin:", err);
      alert("Gagal menyalin list.");
    });
  };

  // --- Render Kartu ---
  return (
    <div className="flex h-full flex-col rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      
      {/* 1. Header Kartu & Tombol Aksi Utama */}
      <div className="mb-4 border-b border-gray-600 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">{list.name}</h2>
          {/* Tombol Hapus List (dari props) */}
          <button
            onClick={() => onDeleteList(list.id)}
            title="Hapus Seluruh List"
            className="text-red-500 hover:text-red-400"
          >
            {/* Ikon X/Trash */}
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        {/* Tombol Aksi Tambahan */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleCopyList}
            disabled={items.length === 0}
            className="flex-1 rounded-md bg-gray-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-600 disabled:opacity-50"
          >
            {copied ? 'Tersalin!' : 'Copy Isi'}
          </button>
          <button
            onClick={handleClearList}
            disabled={items.length === 0}
            className="flex-1 rounded-md bg-yellow-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-yellow-700 disabled:opacity-50"
          >
            Kosongkan List
          </button>
        </div>
      </div>
      
      {/* 2. Form Input Item */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Tambah item baru..."
          className="flex-grow rounded-lg border p-2 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          Add
        </button>
      </form>
      
      {/* 3. Daftar Item (Scrollable) */}
      <div className="mt-4 flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: '300px' }}>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">List ini kosong.</p>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-700"
            >
              <p className="break-words dark:text-white">{item.text}</p>
              {/* Tombol Hapus per Item */}
              <button
                onClick={() => handleDeleteItem(item.id)}
                title="Hapus item"
                className="ml-2 shrink-0 text-gray-400 hover:text-red-500"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}