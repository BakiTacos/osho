"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase"; // Sesuaikan path jika perlu

// Buat context
const AuthContext = createContext();

// Buat provider (pembungkus)
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged adalah listener real-time dari Firebase Auth
    // Ini akan berjalan saat user login atau logout
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup listener saat komponen unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
  };

  // Kirim "value" ke semua komponen "children"
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Buat hook kustom untuk gampang dipakai
export const useAuth = () => {
  return useContext(AuthContext);
};