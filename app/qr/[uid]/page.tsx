"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, addDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function QRRedirectPage() {
  const params = useParams();
  const uid = typeof params?.uid === 'string' ? params.uid : Array.isArray(params?.uid) ? params.uid[0] : null;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return;
    
    const processScan = async () => {
      try {
        const qrRef = doc(db, `users/${uid}/qrcode`, "main");
        const qrSnap = await getDoc(qrRef);
        
        if (!qrSnap.exists()) {
          setError("QR Code tidak ditemukan atau belum dikonfigurasi.");
          return;
        }

        const data = qrSnap.data();
        const destinationUrl = data.destinationUrl;

        if (!destinationUrl) {
          setError("Tujuan QR Code belum diatur oleh pemilik akun.");
          return;
        }

        // 1. Catat statistik ke koleksi history
        const scansRef = collection(db, `users/${uid}/qrcode/main/scans`);
        // Kita tidak await addDoc dan updateDoc agar redirect bisa lebih cepat tanpa menunggu konfirmasi server
        addDoc(scansRef, {
          scannedAt: serverTimestamp(),
          userAgent: window.navigator.userAgent
        }).catch(err => console.error("Gagal mencatat scan:", err));

        // 2. Update counter di dokumen utama
        updateDoc(qrRef, {
          scanCount: increment(1),
          lastScannedAt: serverTimestamp()
        }).catch(err => console.error("Gagal update counter:", err));

        // 3. Alihkan pengunjung ke URL tujuan
        let finalUrl = destinationUrl;
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = 'https://' + finalUrl;
        }
        
        window.location.href = finalUrl;

      } catch (err) {
        console.error("Gagal memproses QR:", err);
        setError("Terjadi kesalahan saat memproses QR Code.");
      }
    };

    processScan();
  }, [uid]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] p-6 text-center">
        <h1 className="text-xl font-black text-slate-800 uppercase mb-2">Ups!</h1>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] text-slate-400 gap-3">
      <Loader2 className="animate-spin text-[#0047AB]" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest">Meneruskan ke tujuan...</p>
    </div>
  );
}
