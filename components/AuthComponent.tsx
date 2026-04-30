"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../lib/firebase"; 
import { useAuth } from "../context/AuthContext";
import { 
  Mail, Lock, LogIn, UserPlus, LogOut, 
  ShieldCheck, Loader2, ArrowRight 
} from "lucide-react";

export default function AuthComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- TAMPILAN JIKA SUDAH LOGIN ---
  if (currentUser) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6 text-[#1E293B]">
        <div className="w-full max-w-md bg-white rounded-[48px] p-12 shadow-2xl shadow-blue-100 border border-slate-100 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldCheck size={40} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter mb-2">Sistem Aktif</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">
            {currentUser.email}
          </p>
          
          <button
            onClick={() => signOut(auth)}
            className="w-full bg-[#0F172A] text-white py-5 rounded-[24px] font-black text-sm shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <LogOut size={18} />
            KELUAR SISTEM
          </button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN FORM LOGIN / SIGNUP ---
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6 text-[#1E293B]">
      <div className="w-full max-w-lg bg-white rounded-[48px] p-10 md:p-16 shadow-2xl shadow-blue-100 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* BRANDING */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#0047AB] text-white rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <LogIn size={28} strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter leading-tight">
            {isLogin ? "Selamat Datang" : "Daftar Akun"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* EMAIL INPUT */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Email Bisnis</label>
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sny-online.com"
                required
                className="w-full bg-slate-50 border-none rounded-[22px] py-4 pl-16 pr-6 font-bold text-sm focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Kata Sandi</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047AB] transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border-none rounded-[22px] py-4 pl-16 pr-6 font-bold text-sm focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center border border-red-100">
              {error}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0047AB] text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>{isLogin ? "MASUK SEKARANG" : "BUAT AKUN BARU"}</span>
                <ArrowRight size={18} strokeWidth={3} />
              </>
            )}
          </button>
        </form>

        {/* SWITCH LOGIN/SIGNUP */}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-10 w-full text-center group"
        >
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-[#0047AB] transition-colors">
            {isLogin ? "Belum punya akses?" : "Sudah terdaftar?"} 
            <span className="text-[#0047AB] ml-2 underline decoration-2 underline-offset-4 font-black">
              {isLogin ? "Hubungi Admin / Sign Up" : "Silakan Login"}
            </span>
          </p>
        </button>
      </div>
    </div>
  );
}