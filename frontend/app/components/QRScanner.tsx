"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera, RefreshCw } from "lucide-react";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState("");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // console.warn(errorMessage);
      }
    );

    return () => {
      scanner.clear().catch(err => console.error("Error clearing scanner", err));
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-[#1a1a1a] border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3 font-bold tracking-tight">
            <Camera className="text-green-500" size={20} />
            QR Kodunu Tara
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 bg-black min-h-[350px] flex items-center justify-center relative">
          <div id="reader" className="w-full border-none"></div>
          
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50"></div>
        </div>

        <div className="p-6 bg-[#1a1a1a] text-center space-y-4">
          <p className="text-sm text-gray-400 font-medium">
            Cihazın üzerindeki etikette bulunan QR'ı <br /> kameraya yaklaştırın.
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            <RefreshCw size={12} className="animate-spin" /> Sesnor ID Okunuyor...
          </div>
        </div>
      </div>

      <style jsx global>{`
        #reader { border: none !important; }
        #reader__scan_region { background: black !important; border: none !important; }
        #reader__dashboard_section_csr button {
          background: #22c55e !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-weight: bold !important;
          margin-top: 10px !important;
        }
      `}</style>
    </div>
  );
}
