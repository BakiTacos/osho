// components/BarcodeScanner.tsx
"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface BarcodeScannerProps {
  onScanSuccess: (text: string) => void;
}

export default function BarcodeScanner({ onScanSuccess }: BarcodeScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "retur-reader",
      { 
        fps: 15, 
        qrbox: { width: 260, height: 140 }, // Dimensi memanjang khas barcode resi kurir
        rememberLastUsedCamera: true
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText.trim());
        scanner.clear().catch(err => console.error(err));
      },
      () => { /* Deteksi scan berjalan... */ }
    );

    return () => {
      scanner.clear().catch(err => console.error("Scanner clear error", err));
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full max-w-md mx-auto bg-white p-4 rounded-3xl border border-slate-100 shadow-md">
      <div id="retur-reader" className="overflow-hidden rounded-2xl"></div>
      <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-widest mt-2">
        Arahkan Lensa Kamera HP ke Barcode Resi Label Pengiriman
      </p>
    </div>
  );
}