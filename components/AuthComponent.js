"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../lib/firebase"; // Sesuaikan path
import { useAuth } from "../context/AuthContext"; // Impor hook kita

export default function AuthComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true); // Ganti antara login/signup

  const { currentUser } = useAuth(); // Dapatkan user yg sedang login

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Jika sudah login, tunjukkan tombol logout
  if (currentUser) {
    return (
      <div className="text-center p-4">
        <p className="dark:text-white mb-4">
          Login sebagai: {currentUser.email}
        </p>
        <button
          onClick={() => signOut(auth)}
          className="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    );
  }

  // Jika belum login, tunjukkan form
  return (
    <div className="w-full max-w-md rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
      <h2 className="mb-4 text-center text-2xl font-bold dark:text-white">
        {isLogin ? "Login" : "Sign Up"}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 6 karakter)"
          required
          className="rounded-lg border p-3 text-black dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>
        {error && <p className="text-center text-red-500">{error}</p>}
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 w-full text-center text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        {isLogin ? "Belum punya akun? Sign Up" : "Sudah punya akun? Login"}
      </button>
    </div>
  );
}