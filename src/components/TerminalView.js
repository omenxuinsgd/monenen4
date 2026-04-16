"use client";
import React, { useState, useEffect, useRef } from 'react';
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
  Zap, 
  Save, 
  RotateCcw,
  Video,
  Layers,
  Eye,
  Printer,
  ShieldCheck,
  Database,
  Search
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
 * Komponen pusat yang mengelola sidebar visual, perutean modul, 
 * dan sinkronisasi data antar perangkat (Printer, Biometrik, Scanner).
 * FIX: Pencegahan Hydration Mismatch & Integrasi Thermal Printer Refined.
 */
const TerminalView = (props) => {
  // --- 1. IDENTIFIKASI KONTEKS MODUL ---
  const shortText = props.data?.short?.toUpperCase() || "";
  
  const isPrinter = shortText.includes("PRINTER");
  const isBarcode = shortText.includes("BARCODE");
  const isOCR = shortText.includes("OCR");
  const isSignPad = shortText.includes("SIGN");
  const isFingerprint = shortText.includes("FINGERPRINT");
  const isDocScanner = shortText.includes("DOKUMEN");
  const isPassportScanner = shortText.includes("PASSPORT");
  const isFaceRecognition = shortText.includes("FACE");
  const isPalmVein = shortText.includes("PALM"); 
  
  // --- 2. INISIALISASI STATE ---
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPalmScanning, setIsPalmScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState(props.data?.image || null);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [isSignPadReady, setIsSignPadReady] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [scannerLogs, setScannerLogs] = useState([]); 
  
  const shortTitle = props.data?.short?.split(' ')[0] || "SISTEM";

  // FIX: consoleLogs dimulai kosong untuk sinkronisasi hidrasi Next.js
  const [consoleLogs, setConsoleLogs] = useState([]);

  const addLog = (message) => {
    setConsoleLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 20));
  };

  // --- 3. GLOBAL EVENT LISTENERS ---
  useEffect(() => {
    // Inisialisasi log awal hanya di sisi client
    setConsoleLogs([
      `[${new Date().toLocaleTimeString()}] SISTEM_INITIALIZED`,
      `[${new Date().toLocaleTimeString()}] MODUL_${shortTitle.toUpperCase()}_SIAGA`
    ]);

    const handleScannerLogs = (event) => setScannerLogs(event.detail);

    const handleSignPadReady = () => {
      setIsSignPadReady(true);
      setTimeout(() => initCanvasBackground(), 100);
    };

    const handleSignPadReset = () => {
      setIsSignPadReady(false);
      setPreviewUrl(null);
    };

    const handleScanningState = (e) => {
      setIsPalmScanning(e.detail);
      if (e.detail) addLog("PEMINDAIAN_AKTIF...");
      else addLog("PEMINDAIAN_SELESAI.");
    };

    const handleUpdatePreview = (e) => {
      if (e.detail) {
        setPreviewImage(e.detail);
        if (e.detail.startsWith('data:image') && e.detail.length > 1000) {
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

    const handleTerminalLog = (e) => addLog(e.detail);

    window.addEventListener('palm:scanning-state', handleScanningState);
    window.addEventListener('terminal:update-preview', handleUpdatePreview);
    window.addEventListener('terminal:log', handleTerminalLog);
    window.addEventListener('signpad:data-ready', handleSignPadReady);
    window.addEventListener('signpad:data-reset', handleSignPadReset);
    window.addEventListener('scanner:logs-sync', handleScannerLogs);

    return () => {
      window.removeEventListener('palm:scanning-state', handleScanningState);
      window.removeEventListener('terminal:update-preview', handleUpdatePreview);
      window.removeEventListener('terminal:log', handleTerminalLog);
      window.removeEventListener('signpad:data-ready', handleSignPadReady);
      window.removeEventListener('signpad:data-reset', handleSignPadReset);
      window.removeEventListener('scanner:logs-sync', handleScannerLogs);
    };
  }, [props.data?.image, shortTitle]);

  // --- 4. SIGN PAD DRAWING ENGINE ---
  const initCanvasBackground = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const getCoords = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
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
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveSignature = () => {
    if (!isSignPadReady || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    window.dispatchEvent(new CustomEvent('signpad:capture-complete', { detail: dataUrl }));
  };

  const sendPalmCommand = (command) => {
    addLog(`EKSEKUSI_PALM_${command.toUpperCase()}`);
    window.dispatchEvent(new CustomEvent(`palm:${command}`));
  };

  // --- 5. TABS CONFIGURATION ---
  const tabs = isFaceRecognition
    ? [{ id: 'face_enrollment', label: 'Pendaftaran', type: 'enroll' }, { id: 'face_verification', label: 'Verifikasi', type: 'verify' }]
    : isPalmVein
      ? [
          { id: 'enrollment', label: 'Enrollment', type: 'enroll' },
          { id: 'identification', label: 'Identification', type: 'verify' },
          { id: 'data', label: 'Data Records', type: 'data' }
        ]
      : isPassportScanner 
        ? [
          { id: 'passport_control', label: 'Validation Control', type: 'control' },
          { id: 'passport_reader', label: 'Chip Reader', type: 'reader' },
          { id: 'passport_ocr', label: 'OCR Extraction', type: 'ocr' }
        ]
        : isPrinter 
              ? [{ id: 'text_barcode', label: 'Text & Barcode', type: 'enroll' }]
              : isDocScanner
                ? [{ id: 'doc_scanner', label: 'Document Control', type: 'enroll' }]
                : isOCR
                  ? [{ id: 'ocr_scanner', label: 'OCR Scanner', type: 'enroll' }]
                  : isSignPad
                    ? [{ id: 'sign_pad', label: 'Signature Pad', type: 'enroll' }]
                    : isBarcode
                      ? [{ id: 'barcode_scanner', label: 'Barcode Scanner', type: 'enroll' }]
                      : [{ id: 'enrollment', label: 'Enrollment', type: 'enroll' }, { id: 'verification', label: 'Verification', type: 'verify' }];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  // --- 6. RENDER SIDEBAR (KOLOM KIRI) ---
  const LeftColumn = (
    <div className="md:w-[500px] flex flex-col items-start shrink-0 h-full max-h-screen overflow-hidden font-mono text-left" suppressHydrationWarning>
      
      {/* AREA VISUAL UTAMA */}
      <div className="relative w-full aspect-square border-2 border-[#00ffff]/40 bg-black overflow-hidden rounded-sm mb-4 shadow-lg shrink-0 group">
        
        {isSignPadReady ? (
          <div className="w-full h-full bg-white animate-in zoom-in-95 duration-500">
             <canvas 
              ref={canvasRef} 
              width={800} height={800} 
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onMouseOut={() => setIsDrawing(false)} 
              onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} 
              className="w-full h-full touch-none cursor-crosshair" 
             />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.img 
              key={isLiveStream ? 'live-feed' : previewImage} 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: isLiveStream ? 0 : 0.4 }}
              src={previewImage || previewUrl || props.data?.image} 
              alt="Visual State" className="w-full h-full object-cover bg-black" 
            />
          </AnimatePresence>
        )}
        
        {/* Tombol Khusus Sign Pad Overlay */}
        {isSignPad && (
          <div className="absolute bottom-6 right-6 flex gap-2 z-[100]">
             <button disabled={!isSignPadReady} onClick={saveSignature} className={`flex items-center gap-2 px-5 py-2.5 border-2 text-[10px] font-black uppercase transition-all rounded-sm shadow-2xl ${isSignPadReady ? 'bg-[#00ffff]/20 border-[#00ffff]/60 text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_#00ffff44]' : 'bg-zinc-900/50 border-zinc-700 text-zinc-600 opacity-30 cursor-not-allowed'}`}><Save size={14} /> SAVE</button>
             <button disabled={!isSignPadReady} onClick={clearCanvas} className={`flex items-center gap-2 px-5 py-2.5 border-2 text-[10px] font-black uppercase transition-all rounded-sm shadow-2xl ${isSignPadReady ? 'bg-red-500/20 border-red-500/60 text-red-500 hover:bg-red-500 hover:text-white shadow-[0_0_15px_#ef444444]' : 'bg-zinc-900/50 border-zinc-700 text-zinc-600 opacity-30 cursor-not-allowed'}`}><RotateCcw size={14} /> CLEAR</button>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff]/50 animate-pulse z-20" />
        <div className={`absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 border border-[#00ffff]/20 text-[8px] font-black uppercase z-30 ${isLiveStream ? 'text-emerald-400' : 'text-[#00ffff]'}`}>
          {isLiveStream ? 'LIVE_SENSOR_FEED' : 'Visual_Output_Buffer'}
        </div>
      </div>
      
      {/* Decorative Spectrum Bar */}
      <div className="flex h-5 w-full border-2 border-[#00ffff]/40 overflow-hidden mb-4 shadow-lg shrink-0">
         {['#082e2e', '#0d4a4a', '#126666', '#178282', '#00ffff', '#ff00ff', '#ffffff', '#222222'].map((color, i) => (<div key={i} className="flex-1" style={{ backgroundColor: color }} />))}
      </div>

      {/* Path Navigation (Breadcrumbs) */}
      <div className="flex h-8 w-fit font-mono text-[9px] uppercase tracking-tighter items-stretch mb-6 shrink-0 font-black">
          <div className="flex items-center px-4 pr-8 bg-[#178282] text-white path-arrow-start shadow-lg"><Home size={14} strokeWidth={2.5} /></div>
          <div className="flex items-center pl-9 pr-10 bg-[#082e2e] text-[#00ffff]/90 relative -ml-[18px] path-arrow-end border-y border-[#00ffff]/10 border-r border-[#00ffff]/20">
            <FolderOpen size={14} className="mr-2 opacity-60" />
            <span className='text-[12px]'>{shortTitle.toLowerCase()}</span>
          </div>
      </div>

      {/* TAMPILAN KHUSUS PALM VEIN DI SIDEBAR */}
      {isPalmVein && (
        <div className="w-full flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-6 shrink-0">
           <div className="w-full border-2 border-[#00ffff]/20 bg-[#082e2e]/20 p-4 rounded-sm flex flex-col gap-3 shadow-xl">
              <div className="flex items-center text-[#00ffff] font-black uppercase text-[10px] border-b border-[#00ffff]/10 pb-2">Biometric_Vena_Status</div>
              <div className="grid grid-cols-2 gap-2">
                 <div className="bg-black/40 p-2 border border-[#00ffff]/10">
                    <div className="text-[7px] text-zinc-500 uppercase font-bold tracking-widest">Dual_Sensor</div>
                    <div className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter">Online</div>
                 </div>
                 <div className="bg-black/40 p-2 border border-[#00ffff]/10">
                    <div className="text-[7px] text-zinc-500 uppercase font-bold tracking-widest">Vault_Sync</div>
                    <div className="text-[9px] text-[#00ffff] font-black uppercase tracking-tighter">Ready</div>
                 </div>
              </div>
           </div>

           <div className="w-full border-2 border-[#00ffff]/20 bg-black/40 p-4 rounded-sm flex flex-col gap-4 shadow-xl">
              <div className="text-[#00ffff] font-black uppercase text-[10px] tracking-widest italic text-left flex flex-col gap-1 border-b border-[#00ffff]/10 pb-3">
                 <span>Biometric_Vena_Scanner</span>
                 <span className="text-[7px] text-zinc-500 not-italic font-bold uppercase tracking-widest">Protocol_Dual_Sensor: Aktif</span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => sendPalmCommand('capture-start')} disabled={isPalmScanning} className={`flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase transition-all rounded-sm border-2 ${isPalmScanning ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.1)]'}`}>
                    {isPalmScanning ? <RefreshCcw size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />} Capture Start
                  </button>
                  <button onClick={() => sendPalmCommand('capture-finish')} className="flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase transition-all rounded-sm border-2 bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500 hover:text-white active:scale-95"><Square size={12} fill="currentColor" /> Capture Finish</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => sendPalmCommand('enrollment')} className="flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase transition-all rounded-sm border-2 bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white active:scale-95"><UserPlus size={12} /> Enrollment</button>
                  <button onClick={() => sendPalmCommand('match')} className="flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase transition-all rounded-sm border-2 bg-purple-500/10 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white active:scale-95"><CheckCircle size={12} /> Match</button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* SYSTEM CONSOLE LOG CONTAINER */}
      {/* <div className="w-full border-2 border-[#00ffff]/20 bg-zinc-950/60 rounded-sm flex flex-col shadow-2xl shrink-0 h-44 overflow-hidden mt-auto">
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
                   <span className={`${idx === 0 ? 'text-[#00ffff] font-bold' : 'text-zinc-500'}`}>{log}</span>
                </div>
             ))}
             {consoleLogs.length === 0 && <div className="text-zinc-800 uppercase italic">Awaiting_Boot_Sequence...</div>}
          </div>
      </div> */}

      {/* DEVICE CONSOLE OUTPUT (Scrollable with Fixed Max Height) */}
            <div className="w-full border-2 border-[#00ffff]/40 bg-zinc-950 rounded-sm relative overflow-hidden flex flex-col md:min-h-[10px] max-h-[300px] shadow-2xl flex-1">
               {(isDocScanner || isPassportScanner || isFaceRecognition || isSignPad || isFingerprint || isOCR) ? (
                 <div className="p-3 flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#00ffff]/20 pb-2 mb-2 shrink-0">
                       <div className="flex items-center gap-2 text-[#00ffff] font-black uppercase text-[14px]">
                          <TerminalIcon size={18} className="animate-pulse" />
                          <span>Device_Console_Output</span>
                       </div>
                       <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Streaming_Sync</div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 font-mono text-[12px] pr-2">
                       {scannerLogs.length > 0 ? (
                          scannerLogs.map((log, i) => (
                            <div key={i} className={`flex gap-3 leading-tight ${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                               <span className="opacity-20 shrink-0 font-bold">{(scannerLogs.length - i).toString().padStart(2, '0')}</span>
                               <span className="break-all">{log}</span>
                            </div>
                          ))
                       ) : (
                          <div className="h-full flex items-center justify-center text-zinc-700 italic uppercase tracking-widest text-[8px]">
                            Waiting for device activity...
                          </div>
                       )}
                    </div>
                 </div>
               ) : (
                 <div className="p-6 flex flex-col items-center justify-center text-center">
                    <Activity size={48} className="text-[#00ffff]/10 mb-4" />
                    <span className="text-[10px] text-[#00ffff]/40 font-black uppercase tracking-[0.2em]">System_Ready_State</span>
                 </div>
               )}
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
          {/* PERUTEAN MODUL SECARA TELITI */}
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