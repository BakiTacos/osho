"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import React from 'react';
import { db } from "../../lib/firebase"; // Sesuaikan path
import { useAuth } from "../../context/AuthContext"; // Sesuaikan path
import AuthComponent from "../../components/AuthComponent"; // Sesuaikan path
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

// --- INTERFACE (Tipe Data) ---

interface LinkData {
  title: string;
  url: string;
  createdAt: Timestamp;
}

interface LinkItem extends LinkData {
  id: string;
}

// --- KOMPONEN UTAMA ---

export default function LinksPage() {
  const { currentUser, loading: authLoading } = useAuth();

  // State (Tidak berubah)
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // --- EFEK (Membaca Data) ---
  useEffect(() => {
    if (!currentUser) {
      setLinks([]);
      return;
    }
    const collectionPath = `users/${currentUser.uid}/links`;
    const q = query(collection(db, collectionPath), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let linksArray: LinkItem[] = [];
      querySnapshot.forEach((doc) => {
        linksArray.push({ ...(doc.data() as LinkData), id: doc.id });
      });
      setLinks(linksArray);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // --- FUNGSI CRUD ---
  // (Tidak berubah)

  const formatUrl = (url: string): string => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() === "" || newUrl.trim() === "" || !currentUser) return;
    const collectionPath = `users/${currentUser.uid}/links`;
    await addDoc(collection(db, collectionPath), {
      title: newTitle,
      url: formatUrl(newUrl),
      createdAt: serverTimestamp(),
    });
    setNewTitle("");
    setNewUrl("");
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!currentUser) return;
    if (window.confirm("Yakin ingin menghapus link ini?")) {
      const docPath = `users/${currentUser.uid}/links/${linkId}`;
      await deleteDoc(doc(db, docPath));
    }
  };

  const handleUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink || !currentUser) return;
    const docPath = `users/${currentUser.uid}/links/${editingLink.id}`;
    const docRef = doc(db, docPath);
    await updateDoc(docRef, {
      title: editingLink.title,
      url: formatUrl(editingLink.url),
    });
    setEditingLink(null);
  };

  // --- FUNGSI UI (Untuk modal) ---
  // (Tidak berubah)
  const startEdit = (link: LinkItem) => {
    setEditingLink({ ...link });
  };
  const cancelEdit = () => {
    setEditingLink(null);
  };

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
          <h1 className="mb-8 text-4xl font-bold dark:text-white">My Links</h1>
          <p className="mb-8 dark:text-gray-300">
            Silakan login atau daftar untuk menyimpan link.
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
          My Links
        </h1>

        {/* Form Buat Link Baru (Tidak berubah) */}
        <form
          onSubmit={handleCreateLink}
          className="mb-12 rounded-lg bg-gray-100 p-6 dark:bg-gray-800"
        >
          <h2 className="mb-4 text-2xl font-semibold dark:text-white">Simpan Link Baru</h2>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Judul (mis: Dokumentasi React)"
              className="w-full rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (mis: reactjs.org)"
              className="w-full rounded-lg border p-3 font-mono text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Simpan Link
            </button>
          </div>
        </form>

        <hr className="mb-12 border-gray-600" />

        {/* --- Daftar Link Tersimpan --- */}
        <h2 className="mb-6 text-3xl font-bold dark:text-white">Daftar Tersimpan</h2>
        <div className="space-y-6">
          {links.length === 0 ? (
            <p className="dark:text-gray-400">Anda belum menyimpan link apapun.</p>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
              >
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  
                  {/* --- PERUBAHAN DI SINI --- */}
                  <div className="flex-1 overflow-hidden">
                    {/* Judul (sudah bisa diklik) */}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-2xl font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {link.title}
                    </a>
                    
                    {/* URL (sekarang juga bisa diklik) */}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate pt-1 font-mono text-sm text-gray-500 hover:underline dark:text-gray-400"
                    >
                      {link.url}
                    </a>
                  </div>
                  {/* --- AKHIR PERUBAHAN --- */}
                  
                  <div className="flex shrink-0 gap-3">
                    <button
                      onClick={() => startEdit(link)}
                      className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <p className="mt-4 text-xs text-gray-400">
                  Dibuat: {link.createdAt?.toDate().toLocaleString()}
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
      
      {/* Modal Edit (Tidak berubah) */}
      {editingLink && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
        >
          <div className="flex w-full max-w-2xl flex-col rounded-lg bg-white p-6 dark:bg-gray-800 max-h-[90vh]">
            <h2 className="mb-4 shrink-0 text-3xl font-bold dark:text-white">Edit Link</h2>
            
            <form onSubmit={handleUpdateLink} className="flex flex-1 flex-col gap-4 overflow-y-auto">
              <input
                type="text"
                value={editingLink.title}
                onChange={(e) =>
                  setEditingLink({ ...editingLink, title: e.target.value })
                }
                placeholder="Judul"
                className="w-full rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="url"
                value={editingLink.url}
                onChange={(e) =>
                  setEditingLink({ ...editingLink, url: e.target.value })
                }
                placeholder="URL"
                className="w-full rounded-lg border p-3 font-mono text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              
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