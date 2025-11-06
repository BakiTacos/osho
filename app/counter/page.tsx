"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "../../lib/firebase"; // Tetap impor db
import { useAuth } from "../../context/AuthContext"; // <-- Impor hook auth
import AuthComponent from "../../components/AuthComponent"; // <-- Impor komponen login
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

export default function CounterPage() {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [counters, setCounters] = useState([]);
  
  // Dapatkan status auth dari Context
  const { currentUser, loading: authLoading } = useAuth();

  // 1. MEMBACA DATA (Listener Real-time)
  useEffect(() => {
    // Jangan lakukan apa-apa jika user belum login
    if (!currentUser) {
      setCounters([]); // Kosongkan data jika logout
      return;
    }

    // Ini adalah PATH BARU yang aman
    // "users" -> "ID_USER_YG_LOGIN" -> "counters"
    const collectionPath = `users/${currentUser.uid}/counters`;
    const q = query(collection(db, collectionPath), orderBy("name"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let countersArray = [];
      querySnapshot.forEach((doc) => {
        countersArray.push({ ...doc.data(), id: doc.id });
      });
      setCounters(countersArray);
    });

    // Cleanup listener
    return () => unsubscribe();
  }, [currentUser]); // <-- Jalankan ulang useEffect ini jika 'currentUser' berubah

  // 2. MEMBUAT KATEGORI BARU
  const handleCreateCounter = async (e) => {
    e.preventDefault();
    if (newCategoryName.trim() === "" || !currentUser) return;

    // PATH BARU untuk 'addDoc'
    const collectionPath = `users/${currentUser.uid}/counters`;
    await addDoc(collection(db, collectionPath), {
      name: newCategoryName,
      count: 0,
      // Kita tidak perlu menyimpan UID di sini karena datanya
      // sudah "tersimpan" di bawah folder UID pengguna
    });
    setNewCategoryName("");
  };

  // 3. UPDATE COUNTER
  const updateCount = async (counterId, amount) => {
    if (!currentUser) return;
    
    // PATH BARU untuk 'doc'
    const docPath = `users/${currentUser.uid}/counters/${counterId}`;
    const counterRef = doc(db, docPath);
    
    await updateDoc(counterRef, {
      count: increment(amount),
    });
  };

  // 4. MENGHAPUS COUNTER
  const handleDelete = async (counterId) => {
    if (!currentUser) return;
    if (window.confirm("Yakin ingin menghapus kategori ini?")) {
      // PATH BARU untuk 'doc'
      const docPath = `users/${currentUser.uid}/counters/${counterId}`;
      const counterRef = doc(db, docPath);
      await deleteDoc(counterRef);
    }
  };

  // --- RENDER ---

  // Tampilkan loading saat status auth dicek
  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 dark:bg-black">
        <p className="dark:text-white">Memuat sesi...</p>
      </main>
    );
  }

  // Jika tidak loading DAN tidak ada user, tampilkan komponen login
  if (!currentUser) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 dark:bg-black">
        <div className="w-full max-w-2xl text-center">
          <h1 className="mb-8 text-4xl font-bold dark:text-white">
            Selamat Datang
          </h1>
          <p className="mb-8 dark:text-gray-300">
            Silakan login atau daftar untuk menggunakan aplikasi counter.
          </p>
          <AuthComponent /> {/* <-- Tampilkan form login/signup */}
          <Link
            href="/"
            className="mt-12 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to Home
        </Link>
        </div>
      </main>
    );
  }

  // Jika SUDAH LOGIN, tampilkan halaman counter
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 dark:bg-black">
      <div className="w-full max-w-2xl text-center">
        
        {/* Tampilkan info user & tombol logout di atas */}
        <div className="mb-8">
          <AuthComponent />
        </div>

        <h1 className="mb-8 text-4xl font-bold dark:text-white">
          Firestore Counters (Pribadi)
        </h1>

        <form
          onSubmit={handleCreateCounter}
          className="mb-10 flex gap-2 rounded-lg bg-gray-100 p-4 dark:bg-gray-800"
        >
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nama Kategori Baru"
            className="flex-grow rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Buat
          </button>
        </form>

        <div className="space-y-6">
          {counters.length === 0 ? (
            <p className="dark:text-gray-400">Anda belum punya kategori. Silakan buat satu.</p>
          ) : (
            counters.map((counter) => (
              <div
                key={counter.id}
                className="flex flex-col items-center justify-between gap-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 sm:flex-row"
              >
                <div className="flex-grow text-left">
                  <h2 className="text-2xl font-semibold dark:text-white">
                    {counter.name}
                  </h2>
                  <button
                    onClick={() => handleDelete(counter.id)}
                    className="text-sm text-red-500 hover:underline dark:text-red-400"
                  >
                    Hapus
                  </button>
                </div>

                <div className="flex w-full items-center justify-center gap-4 sm:w-auto">
                  <button
                    onClick={() => updateCount(counter.id, -1)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-2xl font-semibold text-white transition-colors hover:bg-red-600"
                  >
                    -
                  </button>
                  <p className="w-20 text-center text-5xl font-mono dark:text-white">
                    {counter.count}
                  </p>
                  <button
                    onClick={() => updateCount(counter.id, 1)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl font-semibold text-white transition-colors hover:bg-green-600"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <Link
          href="/"
          className="mt-12 inline-block text-blue-600 hover:underline dark:text-blue-400"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}