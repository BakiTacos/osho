"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import React from 'react';
import { db } from "../../lib/firebase"; 
import { useAuth } from "../../context/AuthContext"; 
import AuthComponent from "../../components/AuthComponent"; 
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// --- INTERFACE (Tidak berubah) ---
interface PromptData {
  title: string;
  text: string;
  createdAt: Timestamp;
}
interface Prompt extends PromptData {
  id: string;
}

// --- KOMPONEN UTAMA ---
export default function PromptsPage() {
  const { currentUser, loading: authLoading } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // --- State Baru untuk Fitur Copy ---
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- EFEK (Membaca Data) (Tidak berubah) ---
  useEffect(() => {
    if (!currentUser) {
      setPrompts([]);
      return;
    }
    const collectionPath = `users/${currentUser.uid}/prompts`;
    const q = query(collection(db, collectionPath), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let promptsArray: Prompt[] = [];
      querySnapshot.forEach((doc) => {
        promptsArray.push({ ...(doc.data() as PromptData), id: doc.id });
      });
      setPrompts(promptsArray);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // --- FUNGSI CRUD (Create, Update, Delete) (Tidak berubah) ---
  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newText.trim() === "" || newTitle.trim() === "" || !currentUser) return;
    const collectionPath = `users/${currentUser.uid}/prompts`;
    await addDoc(collection(db, collectionPath), {
      title: newTitle,
      text: newText,
      createdAt: serverTimestamp(),
    });
    setNewTitle("");
    setNewText("");
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!currentUser) return;
    if (window.confirm("Yakin ingin menghapus prompt ini?")) {
      const docPath = `users/${currentUser.uid}/prompts/${promptId}`;
      await deleteDoc(doc(db, docPath));
    }
  };

  const handleUpdatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt || !currentUser) return;
    const docPath = `users/${currentUser.uid}/prompts/${editingPrompt.id}`;
    const docRef = doc(db, docPath);
    await updateDoc(docRef, {
      title: editingPrompt.title,
      text: editingPrompt.text,
    });
    setEditingPrompt(null);
  };

  // --- FUNGSI UI ---
  const startEdit = (prompt: Prompt) => {
    setEditingPrompt({ ...prompt });
  };
  
  const cancelEdit = () => {
    setEditingPrompt(null);
  };
  
  // --- Fungsi Baru untuk Fitur Copy ---
  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Set ID prompt yang baru saja di-copy
      setCopiedId(id);
      // Reset state setelah 2 detik
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }).catch(err => {
      console.error('Gagal menyalin teks: ', err);
      alert('Gagal menyalin teks.');
    });
  };

  // --- RENDER (Loading & Auth) (Tidak berubah) ---
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
          <h1 className="mb-8 text-4xl font-bold dark:text-white">My Prompts</h1>
          <p className="mb-8 dark:text-gray-300">
            Silakan login atau daftar untuk menyimpan prompt.
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
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 dark:bg-black">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <AuthComponent />
        </div>
        
        <h1 className="mb-8 text-center text-4xl font-bold dark:text-white">
          My Prompts
        </h1>

        {/* Form Buat Prompt Baru (Tidak berubah) */}
        <form
          onSubmit={handleCreatePrompt}
          className="mb-12 rounded-lg bg-gray-100 p-6 dark:bg-gray-800"
        >
          <h2 className="mb-4 text-2xl font-semibold dark:text-white">Buat Prompt Baru</h2>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Judul Prompt (mis: Resep Nasi Goreng)"
              className="w-full rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Ketik isi prompt Anda di sini..."
              rows={8}
              className="w-full rounded-lg border p-3 font-mono text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Simpan Prompt
            </button>
          </div>
        </form>

        <hr className="mb-12 border-gray-600" />

        {/* --- Daftar Prompt Tersimpan --- */}
        <h2 className="mb-6 text-3xl font-bold dark:text-white">Daftar Tersimpan</h2>
        <div className="space-y-6">
          {prompts.length === 0 ? (
            <p className="dark:text-gray-400">Anda belum menyimpan prompt apapun.</p>
          ) : (
            prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
              >
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <h3 className="text-2xl font-semibold dark:text-white">
                    {prompt.title}
                  </h3>
                  {/* --- PERUBAHAN 1: Tombol Aksi --- */}
                  <div className="flex shrink-0 gap-3">
                    <button
                      onClick={() => handleCopyPrompt(prompt.text, prompt.id)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all
                        ${copiedId === prompt.id 
                          ? 'bg-green-600' // Warna saat berhasil
                          : 'bg-gray-500 hover:bg-gray-600' // Warna normal
                        }`}
                    >
                      {/* Teks berubah saat berhasil */}
                      {copiedId === prompt.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => startEdit(prompt)}
                      className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {/* Teks Prompt (Tidak berubah) */}
                <p className="mt-4 break-words whitespace-pre-wrap rounded-md bg-gray-100 p-4 font-mono text-sm text-black dark:bg-gray-700 dark:text-gray-200">
                  {prompt.text}
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Dibuat: {prompt.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="inline-block text-blue-600 hover:underline dark:text-blue-400">
            Back to Home
          </Link>
        </div>
      </div>
      
      {/* --- PERUBAHAN 2: Modal Edit yang Lebih Interaktif --- */}
      {editingPrompt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
        >
          {/* Konten Modal */}
          {/* max-h-[90vh] membuat tinggi maksimal 90% dari layar */}
          {/* flex flex-col agar layout di dalam vertikal */}
          <div className="flex w-full max-w-2xl flex-col rounded-lg bg-white p-6 dark:bg-gray-800 max-h-[90vh]">
            <h2 className="mb-4 shrink-0 text-3xl font-bold dark:text-white">Edit Prompt</h2>
            
            {/* Form dibuat scrollable jika kontennya panjang */}
            <form onSubmit={handleUpdatePrompt} className="flex flex-1 flex-col gap-4 overflow-y-auto">
              <input
                type="text"
                value={editingPrompt.title}
                onChange={(e) =>
                  setEditingPrompt({ ...editingPrompt, title: e.target.value })
                }
                placeholder="Judul Prompt"
                className="w-full rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <textarea
                value={editingPrompt.text}
                onChange={(e) =>
                  setEditingPrompt({ ...editingPrompt, text: e.target.value })
                }
                placeholder="Isi prompt..."
                // Dibuat flex-grow agar mengisi sisa ruang
                className="w-full flex-grow rounded-lg border p-3 font-mono text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {/* Tombol Aksi Modal */}
              <div className="mt-4 flex shrink-0 justify-end gap-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg bg-gray-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}