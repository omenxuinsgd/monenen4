"use client";
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Home, 
  FolderOpen, 
  Activity,
  Play,
  RefreshCcw,
  Square,
  UserPlus,
  CheckCircle,
  Terminal as TerminalIcon,
  Zap
} from 'lucide-react';

// Import Komponen Modular
import TerminalShell from './terminal/TerminalShell';
import FingerprintModule from './terminal/FingerprintModule';
import ThermalPrinterModule from './terminal/ThermalPrinterModule';
import BarcodeScannerModule from './terminal/BarcodeScannerModule';
import OCRScannerModule from './terminal/OCRScannerModule'; 
import SignPadModule from './terminal/SignPadModule'; 
import DocumentScannerModule from './terminal/DocumentScannerModule';
import PassportScannerModule from './terminal/PassportScannerModule'; 
import FaceRecognitionModule from './terminal/FaceRecognitionModule';
import PalmVeinModule from './terminal/PalmVeinModule'; 

/**
 * TerminalView
 * Komponen pusat yang mengelola sidebar visual, kontrol perangkat, 
 * dan perutean modul untuk semua jenis biometrik dan scanner.
 * FIX: Perutean yang presisi untuk menjaga integrasi antar modul tetap utuh.
 */
const TerminalView = (props) => {
  // --- 1. IDENTIFIKASI KONTEKS MODUL ---
  const shortText = props.data?.short?.toUpperCase() || "";
  
  const isPrinter = shortText.includes("PRINTER");
  const isBarcode = shortText.includes("BARCODE");
  const isOCR = shortText.includes("OCR");
  const isSignPad = shortText.includes("SIGN");
  const isFingerprint = shortText.includes("FINGERPRINT");
  const isDocScanner = shortText.includes("DOKUMEN SCANNER") || shortText.includes("DOCUMENT");
  const isPassportScanner = shortText.includes("PASSPORT");
  const isFaceRecognition = shortText.includes("FACE");
  const isPalmVein = shortText.includes("PALM"); 
  
  // --- 2. INISIALISASI STATE ---
  const [isPalmScanning, setIsPalmScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState(props.data?.image || null);
  const [isLiveStream, setIsLiveStream] = useState(false); 
  
  const shortTitle = props.data?.short?.split(' ')[0] || "SISTEM";

  const [consoleLogs, setConsoleLogs] = useState([
    `[${new Date().toLocaleTimeString()}] SISTEM_INITIALIZED`,
    `[${new Date().toLocaleTimeString()}] MODUL_${shortTitle.toUpperCase()}_SIAGA`
  ]);

  // Konfigurasi Tab Menu Utama berdasarkan tipe modul
  const tabs = isFaceRecognition
    ? [
        { id: 'face_enrollment', label: 'Enrollment', type: 'enroll' },
        { id: 'face_verification', label: 'Verification', type: 'verify' }
      ]
    : isPalmVein
      ? [
          { id: 'enrollment', label: 'Enrollment', type: 'enroll' },
          { id: 'identification', label: 'Identification', type: 'verify' },
          { id: 'data', label: 'Data', type: 'data' }
        ]
      : isPassportScanner 
        ? [
          { id: 'passport_control', label: 'Passport Validation', type: 'control' },
          { id: 'passport_reader', label: 'Passport Reader', type: 'reader' },
          { id: 'passport_ocr', label: 'OCR Extraction', type: 'ocr' }
        ]
        : (isFingerprint || isPrinter)
          ? [
            { id: 'enrollment', label: 'Enrollment', type: 'enroll' },
            { id: 'verification', label: 'Verification', type: 'verify' }
          ]
          : [
            { id: 'default', label: 'Main Panel', type: 'main' }
          ];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  const addLog = (message) => {
    setConsoleLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 20));
  };

  useEffect(() => {
    const handleScanningState = (e) => {
      setIsPalmScanning(e.detail);
      if (e.detail) addLog("PEMINDAIAN_AKTIF...");
      else addLog("PEMINDAIAN_SELESAI.");
    };

    const handleUpdatePreview = (e) => {
      if (e.detail) {
        setPreviewImage(e.detail);
        if (e.detail.startsWith('data:image')) {
          setIsLiveStream(true);
        } else {
          setIsLiveStream(false);
          addLog("PREVIEW_VISUAL_DIPERBARUI");
        }
      } else {
        setPreviewImage(props.data?.image);
        setIsLiveStream(false);
      }
    };

    window.addEventListener('palm:scanning-state', handleScanningState);
    window.addEventListener('terminal:update-preview', handleUpdatePreview);

    return () => {
      window.removeEventListener('palm:scanning-state', handleScanningState);
      window.removeEventListener('terminal:update-preview', handleUpdatePreview);
    };
  }, [props.data?.image]);

  const sendPalmCommand = (command) => {
    addLog(`EKSEKUSI_${command.toUpperCase()}`);
    window.dispatchEvent(new CustomEvent(`palm:${command}`));
  };

  // --- 3. RENDER SIDEBAR (KOLOM KIRI) ---
  const LeftColumn = (
    <div className="w-[500px] flex flex-col items-start shrink-0 h-full max-h-screen overflow-hidden font-mono text-left">
      <div className="relative w-full aspect-square border-2 border-[#00ffff]/40 bg-black overflow-hidden rounded-sm mb-4 shadow-lg shrink-0">
        <AnimatePresence mode="popLayout">
          <motion.img 
            key={isLiveStream ? 'live-stream-active' : previewImage} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isLiveStream ? 0 : 0.4 }}
            src={previewImage} 
            alt="Visual Output" 
            className="w-full h-full object-contain bg-black" 
          />
        </AnimatePresence>
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff]/50 animate-pulse" />
        <div className={`absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 border border-[#00ffff]/20 text-[8px] font-black uppercase ${isLiveStream ? 'text-emerald-400' : 'text-[#00ffff]'}`}>
          {isLiveStream ? 'LIVE_SENSOR_FEED' : 'Visual_Output_Buffer'}
        </div>
      </div>
      
      <div className="flex h-5 w-full border-2 border-[#00ffff]/40 overflow-hidden mb-4 shadow-lg shrink-0">
         {['#082e2e', '#0d4a4a', '#126666', '#178282', '#00ffff', '#ff00ff', '#ffffff', '#222222'].map((color, i) => (
           <div key={i} className="flex-1" style={{ backgroundColor: color }} />
         ))}
      </div>

      <div className="flex h-8 w-fit font-mono text-[9px] uppercase tracking-tighter items-stretch mb-6 shrink-0 font-black">
          <div className="flex items-center px-4 pr-8 bg-[#178282] text-white path-arrow-start shadow-lg"><Home size={12} /></div>
          <div className="flex items-center pl-9 pr-10 bg-[#082e2e] text-[#00ffff]/90 relative -ml-[18px] path-arrow-end border-y border-[#00ffff]/10 border-r border-[#00ffff]/20">
            <FolderOpen size={10} className="mr-2 opacity-60" />
            <span>{shortTitle.toLowerCase()}</span>
          </div>
      </div>

      <div className="w-full border-2 border-[#00ffff]/20 bg-zinc-950/60 rounded-sm flex flex-col shadow-2xl shrink-0 h-44 overflow-hidden mt-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#00ffff]/10 bg-black/40">
             <div className="flex items-center gap-2">
                <TerminalIcon size={12} className="text-[#00ffff]" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">System_Console_Log</span>
             </div>
             <Zap size={10} className="text-yellow-500 animate-pulse" />
          </div>
          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar font-mono text-[8px] space-y-1 bg-black/20 text-left">
             {consoleLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 border-l border-[#00ffff]/20 pl-2 py-0.5">
                   <span className="text-[#00ffff]/50 shrink-0">&gt;</span>
                   <span className={`${idx === 0 ? 'text-[#00ffff] font-bold' : 'text-zinc-500'}`}>
                      {log}
                   </span>
                </div>
             ))}
          </div>
      </div>

      <style jsx global>{`
        .path-arrow-start { clip-path: polygon(0% 0%, calc(100% - 18px) 0%, 100% 50%, calc(100% - 18px) 100%, 0% 100%); }
        .path-arrow-end { clip-path: polygon(0% 0%, 18px 50%, 0% 100%, calc(100% - 18px) 100%, 100% 50%, calc(100% - 18px) 0%); }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); }
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
          {/* PERUTEAN MODUL YANG TELITI & UTUH */}
          {isPalmVein ? <PalmVeinModule {...props} activeTab={activeTab} />
            : isFaceRecognition ? <FaceRecognitionModule {...props} activeTab={activeTab} />
            : isOCR ? <OCRScannerModule {...props} setLogs={setConsoleLogs} />
            : isBarcode ? <BarcodeScannerModule {...props} />
            : isSignPad ? <SignPadModule {...props} />
            : isDocScanner ? <DocumentScannerModule {...props} />
            : isPassportScanner ? <PassportScannerModule {...props} activeTab={activeTab} />
            : isPrinter ? <ThermalPrinterModule {...props} activeTab={activeTab} />
            : <FingerprintModule {...props} activeTab={activeTab} />
          }
        </motion.div>
      </AnimatePresence>
    </TerminalShell>
  );
};

export default TerminalView;