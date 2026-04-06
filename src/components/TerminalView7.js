"use client";
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Home, 
  FolderOpen, 
  Fingerprint, 
  Scan, 
  Barcode as BarcodeIcon, 
  ClipboardType, 
  Activity,
  Signature,
  RotateCcw,
  Save
} from 'lucide-react';

// Import Komponen Modular
import TerminalShell from './terminal/TerminalShell';
import FingerprintModule from './terminal/FingerprintModule3';
import ThermalPrinterModule from './terminal/ThermalPrinterModule';
import BarcodeScannerModule from './terminal/BarcodeScannerModule';
import OCRScannerModule from './terminal/OCRScannerModule'; 
import SignPadModule from './terminal/SignPadModule'; 

/**
 * TerminalView
 * Komponen induk yang mengelola sidebar visual dan routing modul.
 * Sidebar kiri dioptimalkan untuk menjadi area tanda tangan interaktif (SignPad).
 */
const TerminalView = (props) => {
  // --- 1. IDENTIFIKASI MODUL & INISIALISASI STATE ---
  const isSignPad = props.data?.short?.includes("SIGN");
  const isPrinter = props.data?.short?.includes("PRINTER");
  const isBarcode = props.data?.short?.includes("BARCODE");
  const isOCR = props.data?.short?.includes("OCR");
  const isFingerprint = props.data?.short?.includes("FINGERPRINT");

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSignPadReady, setIsSignPadReady] = useState(false); 
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  // Konfigurasi Tab sesuai konteks modul
  const tabs = isOCR
    ? [{ id: 'ocr_scanner', label: 'OCR Scanner', type: 'enroll' }]
    : isBarcode
      ? [{ id: 'barcode_scanner', label: 'Barcode Scanner', type: 'enroll' }]
      : isSignPad
        ? [{ id: 'sign_pad', label: 'Signature Pad', type: 'enroll' }]
        : isPrinter 
          ? [{ id: 'text_barcode', label: 'Text & Barcode', type: 'enroll' }, { id: 'sample', label: 'Sample', type: 'verify' }]
          : [{ id: 'enrollment', label: 'Enrollment', type: 'enroll' }, { id: 'verification', label: 'Verification', type: 'verify' }];

  // Pastikan activeTab didefinisikan setelah tabs tersedia
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");
  const shortTitle = props.data?.short?.split(' ')[0] || "SYSTEM";

  // --- 2. LOGIKA EVENT BUS (SINKRONISASI DENGAN SIGNPADMODULE) ---
  useEffect(() => {
    console.log("[DEBUG] TerminalView: Listener Aliran Data Aktif.");

    const handlePreviewUpdate = (event) => setPreviewUrl(event.detail);

    // Saat tombol 'Simpan Data' di modul diklik
    const handleSignPadReady = () => {
      console.log("[LOGIC] Sinyal 'signpad:data-ready' diterima. Mengaktifkan Kanvas Sidebar.");
      setIsSignPadReady(true);
      // Inisialisasi latar putih canvas setelah render
      setTimeout(() => initCanvasBackground(), 50);
    };

    // Saat modul melakukan reset
    const handleSignPadReset = () => {
      console.log("[LOGIC] Sinyal 'signpad:data-reset' diterima. Menutup Kanvas.");
      setIsSignPadReady(false);
      setPreviewUrl(null);
    };

    window.addEventListener('terminal:update-preview', handlePreviewUpdate);
    window.addEventListener('signpad:data-ready', handleSignPadReady);
    window.addEventListener('signpad:data-reset', handleSignPadReset);

    return () => {
      window.removeEventListener('terminal:update-preview', handlePreviewUpdate);
      window.removeEventListener('signpad:data-ready', handleSignPadReady);
      window.removeEventListener('signpad:data-reset', handleSignPadReset);
    };
  }, []);

  // --- 3. LOGIKA MENGGAMBAR (SIDEBAR CANVAS) ---
  const initCanvasBackground = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    console.log("[DEBUG] Kanvas Sidebar diinisialisasi dengan latar PUTIH.");
  };

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: (clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (clientY - rect.top) * (canvasRef.current.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    if (!isSignPadReady) return;
    const coords = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !isSignPadReady) return;
    const coords = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = '#000000'; // Pena Hitam (Biometrik)
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    console.log("[ACTION] Kanvas dibersihkan.");
  };

  const saveSignature = () => {
    if (!isSignPadReady || !canvasRef.current) return;
    
    // Ambil data gambar dari canvas
    const dataUrl = canvasRef.current.toDataURL("image/png");
    console.log("[ACTION] Menangkap tanda tangan. Mengirim ke modul...");
    
    // KIRIM DATA KE SIGNPADMODULE.JS VIA EVENT
    window.dispatchEvent(new CustomEvent('signpad:capture-complete', { detail: dataUrl }));
  };

  // --- 4. RENDER UI SIDEBAR (LEFT COLUMN) ---
  const LeftColumn = (
    <div className="w-[500px] flex flex-col items-start shrink-0">
      {/* AREA VISUAL UTAMA */}
      <div className="relative w-full aspect-square border-2 border-[#00ffff]/40 bg-black overflow-hidden rounded-sm group mb-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        
        {!isSignPadReady ? (
          // MODE STANDBY: Menampilkan Gambar Default atau Preview File
          <img 
            src={previewUrl || props.data?.image} 
            alt="Standby Visual" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000 scale-110" 
          />
        ) : (
          // MODE AKTIF: Kanvas Putih Interaktif
          <div className="w-full h-full bg-white animate-in zoom-in-95 duration-500">
             <canvas 
                ref={canvasRef}
                width={800}
                height={800}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onMouseOut={() => setIsDrawing(false)}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={() => setIsDrawing(false)}
                className="w-full h-full touch-none cursor-crosshair"
             />
          </div>
        )}
        
        {/* TOMBOL AKSI FLOATING (SAVE & CLEAR) - HANYA AKTIF SAAT IS_SIGN_PAD_READY */}
        {isSignPad && (
          <div className="absolute bottom-6 right-6 flex gap-2 z-[100] animate-in fade-in slide-in-from-right-4 duration-500">
             <button 
               disabled={!isSignPadReady}
               onClick={saveSignature}
               className={`flex items-center gap-2 px-5 py-2.5 border-2 text-[10px] font-black uppercase transition-all rounded-sm shadow-2xl active:scale-95 ${isSignPadReady ? 'bg-[#00ffff]/20 border-[#00ffff]/60 text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-700 cursor-not-allowed opacity-30'}`}
             >
               <Save size={14} /> SAVE
             </button>
             <button 
               disabled={!isSignPadReady}
               onClick={clearCanvas}
               className={`flex items-center gap-2 px-5 py-2.5 border-2 text-[10px] font-black uppercase transition-all rounded-sm shadow-2xl active:scale-95 ${isSignPadReady ? 'bg-red-500/20 border-red-500/60 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-zinc-900/50 border-zinc-800 text-zinc-700 cursor-not-allowed opacity-30'}`}
             >
               <RotateCcw size={14} /> CLEAR
             </button>
          </div>
        )}

        {/* Elemen Dekoratif Cyber */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff]/50 animate-pixel-scan z-20 pointer-events-none" />
        <div className={`absolute bottom-6 left-6 flex flex-col z-30 font-pixel text-left pointer-events-none transition-opacity duration-500 ${isSignPadReady ? 'opacity-0' : 'opacity-100'}`}>
          <span className="text-[11px] bg-[#00ffff] text-black px-2 py-0.5 font-black uppercase tracking-tighter w-fit">ID: {shortTitle}</span>
          <span className="text-[8px] text-white/60 font-mono mt-1 tracking-widest uppercase bg-black/60 px-2 py-0.5 w-fit">Encryption_Level: RSA-4096</span>
        </div>
        
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#00ffff]/80 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#00ffff]/80 pointer-events-none" />
      </div>
      
      {/* Warna Spektrum Navigasi */}
      <div className="flex h-5 w-full border-2 border-[#00ffff]/40 overflow-hidden mb-4 shadow-lg">
         {['#082e2e', '#0d4a4a', '#126666', '#178282', '#00ffff', '#ff00ff', '#cc00cc', '#990099', '#ffffff', '#999999', '#444444', '#222222'].map((color, i) => (
           <div key={i} className="flex-1" style={{ backgroundColor: color }} />
         ))}
      </div>

      {/* Breadcrumbs Navigasi */}
      <div className="flex h-8 w-fit font-mono text-[9px] uppercase tracking-tighter items-stretch mb-6">
          <div className="flex items-center px-4 pr-8 bg-[#178282] text-white relative z-10 path-arrow-start shadow-lg"><Home size={12} strokeWidth={2.5} /></div>
          <div className="flex items-center pl-9 pr-8 bg-[#0d4a4a] text-zinc-300 relative z-20 -ml-[18px] path-arrow-nested"><span className="font-black">vault</span></div>
          <div className="flex items-center pl-9 pr-10 bg-[#082e2e] text-[#00ffff]/90 relative z-30 -ml-[18px] path-arrow-end border-y border-[#00ffff]/10"><FolderOpen size={10} className="mr-2 opacity-60" /><span className="whitespace-nowrap tracking-widest uppercase">{shortTitle.toLowerCase()}</span></div>
      </div>

      {isSignPad && (
        <div className="w-full border-2 border-[#00ffff]/20 bg-zinc-950 p-6 flex flex-col items-center justify-center rounded-sm text-center">
           <Signature size={48} className={`text-[#00ffff]/10 mb-4 ${isSignPadReady ? 'animate-pulse text-[#00ffff]/30' : ''}`} />
           <span className="text-[10px] text-[#00ffff]/40 font-black uppercase tracking-[0.2em]">Signature_Vault_Ready</span>
        </div>
      )}
      
      <style jsx global>{`
        .path-arrow-start { clip-path: polygon(0% 0%, calc(100% - 18px) 0%, 100% 50%, calc(100% - 18px) 100%, 0% 100%); }
        .path-arrow-nested, .path-arrow-end { clip-path: polygon(0% 0%, 18px 50%, 0% 100%, calc(100% - 18px) 100%, 100% 50%, calc(100% - 18px) 0%); }
      `}</style>
    </div>
  );

  return (
    <TerminalShell {...props} activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} leftColumn={LeftColumn}>
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab} 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -20 }} 
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* ROUTING MODUL BERDASARKAN SHORT TITLE */}
          {isOCR ? <OCRScannerModule data={props.data} logs={[]} setLogs={() => {}} />
            : isBarcode ? <BarcodeScannerModule {...props} />
            : isSignPad ? <SignPadModule {...props} />
            : isPrinter ? <ThermalPrinterModule {...props} activeTab={activeTab} />
            : <FingerprintModule {...props} activeTab={activeTab} />
          }
        </motion.div>
      </AnimatePresence>
    </TerminalShell>
  );
};

export default TerminalView;