// components/BarcodeScanner.tsx
"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onScanSuccess: (text: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "full-screen-reader",
      { 
        fps: 20, 
        qrbox: { width: 280, height: 160 }, // Desain kotak target pas memanjang untuk resi
        rememberLastUsedCamera: true
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText.trim());
        scanner.clear().catch(err => console.error(err));
      },
      () => { /* Kamera standby melacak resi... */ }
    );

    return () => {
      scanner.clear().catch(err => console.error("Clear error", err));
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black z-[250] flex flex-col justify-between text-white animate-in fade-in duration-200">
      
      {/* HEADER OVERLAY BAR KILAT */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tighter">Lensa Kamera Pemindai PWA</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Arahkan tepat pada Barcode resi kurir luar</p>
        </div>
        <button type="button" onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 active:scale-90 rounded-full flex items-center justify-center transition-all">
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* VIEWPORT UTAMA KAMERA MEMENUHI LAYAR HP GUDANG */}
      <div className="flex-1 w-full flex items-center justify-center px-4">
        <div id="full-screen-reader" className="w-full max-w-md overflow-hidden rounded-[24px] border-2 border-white/20 bg-slate-900/40"></div>
      </div>

      {/* FOOTER BAR BRANDING KOSMETIK RAMPING */}
      <div className="p-6 bg-gradient-to-t from-black/80 to-transparent text-center z-10">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          ⚡ MURNI SCANNER INTELLIGENT • AUTOMATIC DETECT ⚡
        </p>
      </div>

    </div>
  );
}