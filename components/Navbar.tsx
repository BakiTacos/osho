"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext'; // Sesuaikan path jika perlu
import { auth } from '../lib/firebase'; // Sesuaikan path jika perlu
import { signOut } from 'firebase/auth';

// Definisikan link navigasi dalam sebuah array agar mudah dikelola
const navLinks = [
  { href: '/counter', label: 'Counters' },
  { href: '/prompts', label: 'Prompts' },
  { href: '/lists', label: 'Lists' },
  { href: '/links', label: 'Links' },
  { href: '/invoices', label: 'Invoices' },
];

export default function Navbar() {
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Anda tidak perlu melakukan redirect, AuthContext akan otomatis update
      // dan halaman akan re-render untuk menampilkan tampilan "tidak login".
      setIsMenuOpen(false); // Tutup menu jika terbuka
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white bg-opacity-80 backdrop-blur-lg dark:border-gray-700 dark:bg-gray-900 dark:bg-opacity-80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* 1. Logo / Brand Name */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Osho Tools
            </Link>
          </div>

          {/* 2. Navigasi Desktop */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {link.label}
                </Link>
              ))}
              {/* Info Pengguna & Logout di Desktop */}
              {currentUser && (
                <div className="flex items-center space-x-4 border-l border-gray-600 pl-4">
                  <span className="text-sm text-gray-500">{currentUser.email}</span>
                  <button
                    onClick={handleLogout}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. Tombol Hamburger Menu (Mobile) */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Buka menu</span>
              {isMenuOpen ? (
                // Ikon 'X' (Close)
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Ikon Hamburger
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Dropdown Menu Mobile */}
      {/* Tampil/Sembunyi berdasarkan state isMenuOpen */}
      {isMenuOpen && (
        <div className="border-t border-gray-700 md:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)} // Tutup menu saat link diklik
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {/* Info Pengguna & Logout di Mobile */}
          {currentUser && (
            <div className="border-t border-gray-700 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  {/* Bisa ditambahkan avatar di sini */}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{currentUser.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}