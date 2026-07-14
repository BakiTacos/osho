// context/AuthContext.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import Cookies from "js-cookie";

// Buat context
const AuthContext = createContext();

// Buat provider (pembungkus)
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged adalah listener real-time dari Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Segarkan kuki sesi dengan token baru
        try {
          const token = await user.getIdToken();
          const secureCookie = typeof window !== 'undefined' && window.location.protocol === 'https:';
          Cookies.set('session_token', token, { 
            expires: 30, 
            secure: secureCookie, 
            sameSite: 'strict'
          });
        } catch (e) {
          console.error("Gagal memperbarui kuki sesi:", e);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup listener saat komponen unmount
    return unsubscribe;
  }, []);

  // Menambah akun baru dengan mengautentikasi kata sandinya
  const addAndSwitchAccount = async (email, password) => {
    if (!email || !password) {
      throw new Error("Email dan kata sandi wajib diisi.");
    }
    
    const emailClean = email.trim().toLowerCase();
    
    // Coba sign-in ke Firebase Auth dengan credentials tersebut
    const userCredential = await signInWithEmailAndPassword(auth, emailClean, password);
    const user = userCredential.user;
    
    // Simpan credentials terenkripsi base64 di localStorage
    const saved = localStorage.getItem("sny_remembered_credentials");
    let credentialsList = [];
    try {
      credentialsList = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
    }
    
    // Hapus duplikat email jika sudah ada
    credentialsList = credentialsList.filter(c => c.email !== emailClean);
    credentialsList.push({
      email: emailClean,
      password: btoa(password)
    });
    
    localStorage.setItem("sny_remembered_credentials", JSON.stringify(credentialsList));
    return user;
  };

  // Berpindah akun secara cepat dengan login ulang di background
  const switchAccount = async (email) => {
    const saved = localStorage.getItem("sny_remembered_credentials");
    let credentialsList = [];
    try {
      credentialsList = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
    }
    
    const target = credentialsList.find(c => c.email === email.trim().toLowerCase());
    if (!target) {
      throw new Error("Kredensial untuk akun ini tidak ditemukan di memori.");
    }
    
    const password = atob(target.password);
    const userCredential = await signInWithEmailAndPassword(auth, target.email, password);
    return userCredential.user;
  };

  // Mengambil seluruh daftar email akun yang tersimpan
  const getRememberedAccounts = () => {
    const saved = localStorage.getItem("sny_remembered_credentials");
    let credentialsList = [];
    try {
      credentialsList = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
    }
    
    const list = credentialsList.map(c => c.email);
    
    // Selalu masukkan user aktif ke dalam list
    if (currentUser?.email) {
      const activeEmail = currentUser.email.toLowerCase();
      if (!list.includes(activeEmail)) {
        list.unshift(activeEmail);
      } else {
        // pindahkan user aktif ke depan
        const filtered = list.filter(e => e !== activeEmail);
        filtered.unshift(activeEmail);
        return filtered;
      }
    }
    return list;
  };

  // Menghapus akun dari memori browser
  const removeRememberedAccount = (email) => {
    const emailClean = email.trim().toLowerCase();
    const saved = localStorage.getItem("sny_remembered_credentials");
    let credentialsList = [];
    try {
      credentialsList = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
    }
    
    credentialsList = credentialsList.filter(c => c.email !== emailClean);
    localStorage.setItem("sny_remembered_credentials", JSON.stringify(credentialsList));
  };

  const value = {
    currentUser,
    loading,
    addAndSwitchAccount,
    switchAccount,
    getRememberedAccounts,
    removeRememberedAccount
  };

  // Kirim "value" ke semua komponen "children"
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Buat hook kustom untuk gampang dipakai
export const useAuth = () => {
  return useContext(AuthContext);
};