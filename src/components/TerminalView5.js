"use client";
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Home, 
  FolderOpen, 
  Fingerprint, 
  Scan, 
  Barcode as BarcodeIcon, 
  ClipboardType, 
  Activity 
} from 'lucide-react';

// Import Komponen Modular
// Pastikan path import sesuai dengan folder tempat Anda menyimpan file-file di bawah
import TerminalShell from './terminal/TerminalShell';
import FingerprintModule from './terminal/FingerprintModule3';
import ThermalPrinterModule from './terminal/ThermalPrinterModule';
import BarcodeScannerModule from './terminal/BarcodeScannerModule';
import OCRScannerModule from './terminal/OCRScannerModule';

/**
 * TerminalView
 * Komponen utama yang mengoordinasikan navigasi antar modul.
 */
const TerminalView = (props) => {
  const isPrinter = props.data?.short?.includes("PRINTER");
  const isBarcode = props.data?.short?.includes("BARCODE");
  const isOCR = props.data?.short?.includes("OCR");
  
  // Konfigurasi Tab sesuai modul yang aktif
  const tabs = isOCR
    ? [{ id: 'ocr_scanner', label: 'OCR Scanner', type: 'enroll' }]
    : isBarcode
      ? [{ id: 'barcode_scanner', label: 'Barcode Scanner', type: 'enroll' }]
      : isPrinter 
        ? [{ id: 'text_barcode', label: 'Text & Barcode', type: 'enroll' }, { id: 'sample', label: 'Sample', type: 'verify' }]
        : [{ id: 'enrollment', label: 'Enrollment', type: 'enroll' }, { id: 'verification', label: 'Verification', type: 'verify' }];

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  // State logs OCR dipindah ke sini agar bisa diakses oleh Sidebar (LeftColumn)
  const [ocrLogs, setOcrLogs] = useState([`[SYSTEM] OCR Engine V.2.0 Active.`, `[STATUS] Menunggu ekstraksi teks.`]);
  const shortTitle = props.data?.short?.split(' ')[0] || "SYSTEM";

  // Sisi Kiri Terminal (Sidebar Visual & Logs)
  const LeftColumn = (
    <div className="w-[500px] flex flex-col items-start shrink-0">
      <div className="relative w-full aspect-square border-2 border-[#00ffff]/40 bg-black overflow-hidden rounded-sm group mb-4">
        <img src={props.data?.image} alt="Visual Target" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000 scale-110" style={{ imageRendering: 'pixelated' }} />
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff]/50 animate-pixel-scan z-20" />
        <div className="absolute bottom-6 left-6 flex flex-col z-30 font-pixel text-left">
          <span className="text-[11px] bg-[#00ffff] text-black px-2 py-0.5 font-black uppercase tracking-tighter w-fit">LOCKED_ID: {shortTitle}</span>
          <span className="text-[8px] text-white/60 font-mono mt-1 tracking-widest uppercase bg-black/60 px-2 py-0.5 w-fit">Encryption_RSA_Active</span>
        </div>
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#00ffff]/80" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#00ffff]/80" />
      </div>
      
      {/* Color Palette Indicator */}
      <div className="flex h-5 w-full border-2 border-[#00ffff]/40 overflow-hidden mb-4 shadow-lg">
         {['#082e2e', '#0d4a4a', '#126666', '#178282', '#00ffff', '#ff00ff', '#cc00cc', '#990099', '#ffffff', '#999999', '#444444', '#222222'].map((color, i) => (
           <div key={i} className="flex-1" style={{ backgroundColor: color }} />
         ))}
      </div>

      {!isPrinter && (
        <>
          {/* Breadcrumb Path dengan Ujung Runcing (Lancing) 18px */}
          <div className="flex h-8 w-fit font-mono text-[9px] uppercase tracking-tighter items-stretch mb-6">
             <div className="flex items-center px-4 pr-8 bg-[#178282] text-white relative z-10 path-arrow-start shadow-lg">
                <Home size={12} strokeWidth={2.5} />
             </div>
             <div className="flex items-center pl-9 pr-8 bg-[#0d4a4a] text-zinc-300 relative z-20 -ml-[18px] path-arrow-nested">
                <span className="font-black">team</span>
             </div>
             <div className="flex items-center pl-9 pr-10 bg-[#082e2e] text-[#00ffff]/90 relative z-30 -ml-[18px] path-arrow-end border-y border-[#00ffff]/10">
                <FolderOpen size={10} className="mr-2 opacity-60" />
                <span className="whitespace-nowrap tracking-widest uppercase">local/bin/vault/{shortTitle}</span>
             </div>
          </div>

          {/* Area Spesifik Modul di Sidebar Kiri */}
          {isOCR ? (
            /* OCR_PROCESS_LOGS BERPINDAH KE SINI (SIDEBAR) */
            <div className="w-full border-2 border-[#00ffff]/20 bg-black/90 p-5 flex flex-col rounded-sm relative overflow-hidden text-left font-mono text-[11px] text-zinc-400 shadow-inner h-[280px]">
              <div className="flex items-center gap-3 text-[#00ffff] mb-4 uppercase font-black tracking-widest border-b border-[#00ffff]/10 pb-2">
                <Activity size={12} className="animate-pulse" />
                <span>OCR_Process_Logs</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 h-[190px]">
                {ocrLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-3 leading-tight items-start">
                        <span className="text-[#00ffff]/30 text-[9px] w-6 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                        <span className={log.includes('CONNECTED') || log.includes('EKSTRAK') ? 'text-[#00ffff]' : ''}>{log}</span>
                    </div>
                ))}
                <div className="animate-pulse text-[#00ffff] font-black h-4 mt-1">_</div>
              </div>
            </div>
          ) : isBarcode ? (
            /* HASIL SCAN BARCODE (TETAP DI SIDEBAR) */
            <div className="w-full border-2 border-[#00ffff]/40 bg-zinc-900/60 p-5 rounded-sm relative overflow-hidden flex flex-col gap-4 shadow-[0_0_20px_rgba(0,255,255,0.05)] h-fit">
               <div className="absolute top-0 left-0 w-12 h-[2px] bg-[#00ffff]" /><div className="absolute top-0 left-0 w-[2px] h-12 bg-[#00ffff]" />
               <div className="flex justify-between items-center border-b border-[#00ffff]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00ffff] animate-pulse rounded-full" />
                    <span className="text-[10px] font-black text-[#00ffff] uppercase tracking-[0.2em]">Scanner Result</span>
                  </div>
                  <BarcodeIcon size={14} className="text-[#00ffff]/60" />
               </div>
               <div className="flex-1 bg-black/80 border border-[#00ffff]/10 p-6 flex flex-col justify-center items-center min-h-[120px] rounded-sm group relative">
                  <div className="text-center w-full">
                    <span className="text-[8px] text-zinc-500 uppercase block mb-3 tracking-[0.3em] font-black italic opacity-50">[ SYSTEM_READY ]</span>
                    <div className="px-4 py-2 border border-[#00ffff]/5 bg-[#00ffff]/5 inline-block min-w-[150px]">
                      <h4 className="text-[18px] font-mono text-[#00ffff] break-all uppercase tracking-tighter">{"--- EMPTY ---"}</h4>
                    </div>
                  </div>
               </div>
            </div>
          ) : (
            /* GRID GAMBAR STANDAR (FINGERPRINT) */
            <div className="grid grid-cols-4 gap-4 w-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square border-2 border-[#00ffff]/20 bg-zinc-900/50 flex items-center justify-center hover:bg-[#00ffff]/20 transition-all cursor-crosshair group relative overflow-hidden">
                  <div className="absolute inset-0 bg-black opacity-40" />
                  <Fingerprint size={28} className="text-[#00ffff]/20 group-hover:text-[#00ffff]/80 transition-colors z-10" />
                  <div className="absolute bottom-1 right-1 text-[6px] text-white/20 font-bold">#{i+1}</div>
                </div>
              ))}
            </div>
          )}
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
          {isOCR 
            ? <OCRScannerModule {...props} logs={ocrLogs} setLogs={setOcrLogs} />
            : isBarcode 
              ? <BarcodeScannerModule {...props} />
              : isPrinter 
                ? <ThermalPrinterModule {...props} activeTab={activeTab} />
                : <FingerprintModule {...props} activeTab={activeTab} />
          }
        </motion.div>
      </AnimatePresence>
    </TerminalShell>
  );
};

export default TerminalView;