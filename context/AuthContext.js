// context/AuthContext.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Buat context
const AuthContext = createContext();

// Buat provider (pembungkus)
export function AuthProvider({ children }) {
  const [primaryUser, setPrimaryUser] = useState(null);
  const [switchedUser, setSwitchedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load switched user dari localStorage jika ada
  useEffect(() => {
    const saved = localStorage.getItem("sny_active_switched_user");
    if (saved) {
      try {
        setSwitchedUser(JSON.parse(saved));
      } catch (e) {
        console.error("Gagal parsing active switched user:", e);
      }
    }
  }, []);

  useEffect(() => {
    // onAuthStateChanged adalah listener real-time dari Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Simpan mapping email ke UID di database publik agar akun lain bisa lookup UID aslinya
        try {
          await setDoc(doc(db, "user_mappings", user.email), {
            uid: user.uid,
            email: user.email
          }, { merge: true });
        } catch (e) {
          console.error("Gagal mencatat mapping user:", e);
        }
      }
      setPrimaryUser(user);
      setLoading(false);
    });

    // Cleanup listener saat komponen unmount
    return unsubscribe;
  }, []);

  // Hitung currentUser: gunakan switchedUser jika diset, jika tidak kembali ke primaryUser
  const currentUser = switchedUser || primaryUser;

  // Fungsi untuk ganti akun/profil aktif
  const switchUser = (userObj) => {
    if (!userObj) {
      setSwitchedUser(null);
      localStorage.removeItem("sny_active_switched_user");
    } else {
      setSwitchedUser(userObj);
      localStorage.setItem("sny_active_switched_user", JSON.stringify(userObj));
    }
  };

  // Fungsi hash deterministik untuk generate UID konsisten jika user belum pernah login di perangkat ini
  const getDeterministicUid = (email) => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, "");
    return `sw_${Math.abs(hash)}_${cleanEmail}`.substring(0, 28);
  };

  // Menambah akun baru dan langsung berpindah
  const addAndSwitchAccount = async (targetEmail) => {
    if (!targetEmail || !targetEmail.includes("@")) {
      alert("Email tidak valid.");
      return false;
    }

    const emailClean = targetEmail.trim().toLowerCase();

    // Coba cari real UID dari database mappings
    let targetUid = "";
    try {
      const docSnap = await getDoc(doc(db, "user_mappings", emailClean));
      if (docSnap.exists()) {
        targetUid = docSnap.data().uid;
      }
    } catch (e) {
      console.error("Gagal lookup mapping:", e);
    }

    // Jika belum ada mapping, gunakan hash deterministik
    if (!targetUid) {
      targetUid = getDeterministicUid(emailClean);
    }

    const newUser = {
      uid: targetUid,
      email: emailClean,
      isSwitched: true
    };

    // Simpan ke daftar akun tersimpan di localStorage
    const savedAccounts = localStorage.getItem("sny_remembered_accounts");
    const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
    if (!accounts.some(a => a.email === newUser.email)) {
      accounts.push(newUser);
      localStorage.setItem("sny_remembered_accounts", JSON.stringify(accounts));
    }

    switchUser(newUser);
    return true;
  };

  // Mengambil seluruh daftar akun yang diingat
  const getRememberedAccounts = () => {
    const saved = localStorage.getItem("sny_remembered_accounts");
    let accounts = [];
    try {
      accounts = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
    }

    // Selalu masukkan user utama (Firebase Auth) ke dalam list paling atas
    if (primaryUser) {
      const primaryObj = {
        uid: primaryUser.uid,
        email: primaryUser.email,
        isSwitched: false
      };
      if (!accounts.some(a => a.email === primaryUser.email)) {
        return [primaryObj, ...accounts];
      } else {
        const filtered = accounts.filter(a => a.email !== primaryUser.email);
        return [primaryObj, ...filtered];
      }
    }
    return accounts;
  };

  // Menghapus akun dari list memori browser
  const removeRememberedAccount = (email) => {
    const saved = localStorage.getItem("sny_remembered_accounts");
    let accounts = [];
    try {
      accounts = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error(e);
    }
    accounts = accounts.filter(a => a.email !== email);
    localStorage.setItem("sny_remembered_accounts", JSON.stringify(accounts));

    if (switchedUser && switchedUser.email === email) {
      switchUser(null);
    }
  };

  const value = {
    currentUser,
    primaryUser,
    switchedUser,
    loading,
    switchUser,
    addAndSwitchAccount,
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