"use client";
import React, { useState, useEffect } from 'react';
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
 * Komponen utama yang mengoordinasikan navigasi dan visualisasi antar modul biometrik & security.
 */
const TerminalView = (props) => {
  // Identifikasi Modul Aktif berdasarkan data 'short'
  const isPrinter = props.data?.short?.includes("PRINTER");
  const isBarcode = props.data?.short?.includes("BARCODE");
  const isOCR = props.data?.short?.includes("OCR");
  const isSignPad = props.data?.short?.includes("SIGN");
  const isFingerprint = props.data?.short?.includes("FINGERPRINT");
  
  // State untuk pratinjau visual di sidebar kiri
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const handlePreviewUpdate = (event) => {
      setPreviewUrl(event.detail);
    };

    window.addEventListener('terminal:update-preview', handlePreviewUpdate);
    return () => window.removeEventListener('terminal:update-preview', handlePreviewUpdate);
  }, []);

  // Konfigurasi Tab
  const tabs = isOCR
    ? [{ id: 'ocr_scanner', label: 'OCR Scanner', type: 'enroll' }]
    : isBarcode
      ? [{ id: 'barcode_scanner', label: 'Barcode Scanner', type: 'enroll' }]
      : isSignPad
        ? [{ id: 'sign_pad', label: 'Signature Pad', type: 'enroll' }]
        : isPrinter 
          ? [{ id: 'text_barcode', label: 'Text & Barcode', type: 'enroll' }, { id: 'sample', label: 'Sample', type: 'verify' }]
          : [{ id: 'enrollment', label: 'Enrollment', type: 'enroll' }, { id: 'verification', label: 'Verification', type: 'verify' }];

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [ocrLogs, setOcrLogs] = useState([`[SYSTEM] OCR Engine V.2.0 Active.`, `[STATUS] Menunggu ekstraksi teks.`]);
  const shortTitle = props.data?.short?.split(' ')[0] || "SYSTEM";

  /**
   * Fungsi Aksi Sign Pad (dikirim via Event Bus)
   */
  const triggerSignAction = (action) => {
    window.dispatchEvent(new CustomEvent(`signpad:${action}`));
  };

  /**
   * Komponen Kolom Kiri (Visual Sidebar)
   */
  const LeftColumn = (
    <div className="w-[500px] flex flex-col items-start shrink-0">
      {/* Visual Buffer Utama */}
      <div className="relative w-full aspect-square border-2 border-[#00ffff]/40 bg-black overflow-hidden rounded-sm group mb-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        <img 
          src={previewUrl || props.data?.image} 
          alt="Visual Target" 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000 scale-110" 
          style={{ imageRendering: isSignPad ? 'auto' : 'pixelated' }} 
        />
        
        {/* TOMBOL FLOATING KHUSUS SIGN PAD DI POJOK KANAN BAWAH GAMBAR */}
        {isSignPad && (
          <div className="absolute bottom-4 right-4 flex gap-2 z-[100] animate-in fade-in slide-in-from-right-4 duration-500">
             <button 
               onClick={() => triggerSignAction('clear')}
               className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border-2 border-red-500/60 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase transition-all rounded-sm shadow-2xl active:scale-95"
             >
               <RotateCcw size={12} /> CLEAR
             </button>
             <button 
               onClick={() => triggerSignAction('save')}
               className="flex items-center gap-2 px-4 py-2 bg-[#00ffff]/20 border-2 border-[#00ffff]/60 text-[#00ffff] hover:bg-[#00ffff] hover:text-black text-[10px] font-black uppercase transition-all rounded-sm shadow-2xl active:scale-95"
             >
               <Save size={12} /> SAVE
             </button>
          </div>
        )}

        {/* Animasi Garis Pindai */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff]/50 animate-pixel-scan z-20" />
        
        {/* Label Identitas Visual */}
        <div className="absolute bottom-6 left-6 flex flex-col z-30 font-pixel text-left">
          <span className="text-[11px] bg-[#00ffff] text-black px-2 py-0.5 font-black uppercase tracking-tighter w-fit">
            {previewUrl ? 'BUFFER_LOADED' : `ID: ${shortTitle}`}
          </span>
          <span className="text-[8px] text-white/60 font-mono mt-1 tracking-widest uppercase bg-black/60 px-2 py-0.5 w-fit">
            {isSignPad ? 'Real-time_Signature_Stream' : 'Encryption_RSA_Active'}
          </span>
        </div>
        
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#00ffff]/80" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#00ffff]/80" />
      </div>
      
      {/* Indikator Spektrum Warna */}
      <div className="flex h-5 w-full border-2 border-[#00ffff]/40 overflow-hidden mb-4 shadow-lg">
         {['#082e2e', '#0d4a4a', '#126666', '#178282', '#00ffff', '#ff00ff', '#cc00cc', '#990099', '#ffffff', '#999999', '#444444', '#222222'].map((color, i) => (
           <div key={i} className="flex-1" style={{ backgroundColor: color }} />
         ))}
      </div>

      <div className="flex h-8 w-fit font-mono text-[9px] uppercase tracking-tighter items-stretch mb-6">
          <div className="flex items-center px-4 pr-8 bg-[#178282] text-white relative z-10 path-arrow-start shadow-lg">
            <Home size={12} strokeWidth={2.5} />
          </div>
          <div className="flex items-center pl-9 pr-8 bg-[#0d4a4a] text-zinc-300 relative z-20 -ml-[18px] path-arrow-nested">
            <span className="font-black">vault</span>
          </div>
          <div className="flex items-center pl-9 pr-10 bg-[#082e2e] text-[#00ffff]/90 relative z-30 -ml-[18px] path-arrow-end border-y border-[#00ffff]/10">
            <FolderOpen size={10} className="mr-2 opacity-60" />
            <span className="whitespace-nowrap tracking-widest uppercase">{shortTitle.toLowerCase()}</span>
          </div>
      </div>

      {!isPrinter && (
        <>
          {isOCR ? (
            <div className="w-full border-2 border-[#00ffff]/20 bg-black/90 p-5 flex flex-col rounded-sm relative h-[280px]">
              <div className="flex items-center gap-3 text-[#00ffff] mb-4 uppercase font-black border-b border-[#00ffff]/10 pb-2">
                <Activity size={12} className="animate-pulse" />
                <span>OCR_Logs</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 text-[11px] text-zinc-400">
                {ocrLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-3">
                        <span className="text-[#00ffff]/30">{(idx + 1).toString().padStart(2, '0')}</span>
                        <span className={log.includes('SUCCESS') ? 'text-[#00ffff]' : ''}>{log}</span>
                    </div>
                ))}
              </div>
            </div>
          ) : isFingerprint ? (
            <div className="grid grid-cols-4 gap-4 w-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square border-2 border-[#00ffff]/20 bg-zinc-900/50 flex items-center justify-center hover:bg-[#00ffff]/20 transition-all cursor-crosshair group relative">
                  <Fingerprint size={28} className="text-[#00ffff]/20 group-hover:text-[#00ffff]/80 transition-colors z-10" />
                  <div className="absolute bottom-1 right-1 text-[6px] text-white/20 font-bold">#{i+1}</div>
                </div>
              ))}
            </div>
          ) : isSignPad ? (
            <div className="w-full border-2 border-[#00ffff]/20 bg-zinc-950 p-6 flex flex-col items-center justify-center rounded-sm text-center">
               <Signature size={48} className="text-[#00ffff]/10 mb-4 animate-pulse" />
               <span className="text-[10px] text-[#00ffff]/40 font-black uppercase tracking-[0.2em]">Signature_Live_Stream_Ready</span>
            </div>
          ) : null}
        </>
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
          {isOCR ? <OCRScannerModule data={props.data} logs={ocrLogs} setLogs={setOcrLogs} />
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