// components/BarcodeScanner.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Zap, ZapOff } from "lucide-react";

interface BarcodeScannerProps {
  onScanSuccessAction: (text: string) => void;
  onCloseAction: () => void;
}

export function BarcodeScanner({ onScanSuccessAction, onCloseAction }: BarcodeScannerProps) {
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlashSupport, setHasFlashSupport] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    const html5Qrcode = new Html5Qrcode("full-screen-reader");
    scannerRef.current = html5Qrcode;

    const config = {
      fps: 30, 
      qrbox: { width: 280, height: 160 }, 
      aspectRatio: 1.0,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true 
      }
    };

    html5Qrcode
      .start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
          onScanSuccessAction(decodedText.trim());
          handleStopScanner();
        },
        () => { /* Kamera standby... */ }
      )
      .then(() => {
        // Trik Native: Ambil track kamera aktif langsung dari element video di dalam DOM
        setTimeout(() => {
          try {
            const videoElement = document.querySelector("#full-screen-reader video") as HTMLVideoElement;
            if (videoElement && videoElement.srcObject) {
              const stream = videoElement.srcObject as MediaStream;
              const videoTrack = stream.getVideoTracks()[0];
              
              if (videoTrack) {
                trackRef.current = videoTrack;
                const capabilities = videoTrack.getCapabilities() as any;
                
                // Validasi apakah hardware kamera mendukung fitur torch (senter/flash)
                if (capabilities && "torch" in capabilities) {
                  setHasFlashSupport(true);
                }
              }
            }
          } catch (err) {
            console.warn("Gagal membaca hardware capabilities flash:", err);
          }
        }, 1000); // Beri delay 1 detik agar element video selesai di-render oleh library
      })
      .catch((err) => {
        console.error("Gagal memulai sensor kamera:", err);
      });

    return () => {
      handleStopScanner();
    };
  }, [onScanSuccessAction]);

  const handleStopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .catch((err) => console.error("Gagal mematikan kamera secara bersih:", err));
    }
  };

  const toggleFlash = async () => {
    if (!trackRef.current) return;

    try {
      const nextFlashState = !isFlashOn;
      
      await trackRef.current.applyConstraints({
        advanced: [{ torch: nextFlashState }] as any
      });
      
      setIsFlashOn(nextFlashState);
    } catch (err) {
      console.error("Gagal mengubah state hardware flash:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[250] flex flex-col justify-between text-white animate-in fade-in duration-200">
      
      {/* HEADER OVERLAY BAR KILAT */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tighter">Lensa Kamera Pemindai PWA</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Arahkan tepat pada Barcode resi kurir luar</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFlashSupport && (
            <button
              type="button"
              onClick={toggleFlash}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isFlashOn ? "bg-amber-500 text-black animate-pulse" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              {isFlashOn ? <ZapOff size={20} strokeWidth={2.5} /> : <Zap size={20} strokeWidth={2.5} />}
            </button>
          )}
          <button type="button" onClick={onCloseAction} className="w-10 h-10 bg-white/10 hover:bg-white/20 active:scale-90 rounded-full flex items-center justify-center transition-all">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* VIEWPORT UTAMA KAMERA MEMENUHI LAYAR HP GUDANG */}
      <div className="flex-1 w-full flex items-center justify-center px-4">
        <div 
          id="full-screen-reader" 
          className="w-full max-w-md overflow-hidden rounded-[24px] border-2 border-white/20 bg-slate-900/40 [&_video]:filter [&_video]:contrast-[1.3] [&_video]:brightness-[1.1]"
        ></div>
      </div>

      {/* FOOTER BAR BRANDING KOSMETIK RAMPING */}
      <div className="p-6 bg-gradient-to-t from-black/80 to-transparent text-center z-10">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          {isFlashOn ? "LIGHTNING MODE AKTIF • SCAN NOMOR RESI" : "SCAN BARCODE NOMOR RESI / NOMOR PESANAN"}
        </p>
      </div>

    </div>
  );
}

export default BarcodeScanner;