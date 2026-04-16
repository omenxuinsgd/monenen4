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
  Save,
  Search,
  Terminal as TerminalIcon
} from 'lucide-react';

// Import Komponen Modular
import TerminalShell from './terminal/TerminalShell';
import FingerprintModule from './terminal/FingerprintModule3';
import ThermalPrinterModule from './terminal/ThermalPrinterModule';
import BarcodeScannerModule from './terminal/BarcodeScannerModule';
import OCRScannerModule from './terminal/OCRScannerModule'; 
import SignPadModule from './terminal/SignPadModule'; 
import DocumentScannerModule from './terminal/DocumentScannerModule';

/**
 * TerminalView
 * Sidebar kiri dioptimalkan untuk menampilkan live stream dan Console Output khusus Scanner.
 */
const TerminalView = (props) => {
  // --- 1. IDENTIFIKASI MODUL ---
  const isPrinter = props.data?.short?.includes("PRINTER");
  const isBarcode = props.data?.short?.includes("BARCODE");
  const isOCR = props.data?.short?.includes("OCR");
  const isSignPad = props.data?.short?.includes("SIGN");
  const isFingerprint = props.data?.short?.includes("FINGERPRINT");
  const isDocScanner = props.data?.short?.includes("DOKUMEN SCANNER");

  // --- 2. DEKLARASI STATE ---
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scannerLogs, setScannerLogs] = useState([]);
  const [isSignPadReady, setIsSignPadReady] = useState(false); 
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  // Konfigurasi Tab
  const tabs = isOCR
    ? [{ id: 'ocr_scanner', label: 'OCR Scanner', type: 'enroll' }]
    : isBarcode
      ? [{ id: 'barcode_scanner', label: 'Barcode Scanner', type: 'enroll' }]
      : isSignPad
        ? [{ id: 'sign_pad', label: 'Signature Pad', type: 'enroll' }]
        : isDocScanner
          ? [{ id: 'doc_scanner', label: 'Document Control', type: 'enroll' }]
          : isPrinter 
            ? [{ id: 'text_barcode', label: 'Text & Barcode', type: 'enroll' }, { id: 'sample', label: 'Sample', type: 'verify' }]
            : [{ id: 'enrollment', label: 'Enrollment', type: 'enroll' }, { id: 'verification', label: 'Verification', type: 'verify' }];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");
  const shortTitle = props.data?.short?.split(' ')[0] || "SYSTEM";

  // --- 3. EVENT LISTENERS ---
  useEffect(() => {
    // Aliran Visual (Stream/Image)
    const handlePreviewUpdate = (event) => setPreviewUrl(event.detail);
    
    // Aliran Log Khusus Document Scanner
    const handleScannerLogs = (event) => setScannerLogs(event.detail);

    // Sign Pad Logic
    const handleSignPadReady = () => {
      setIsSignPadReady(true);
      setTimeout(() => initCanvasBackground(), 50);
    };
    const handleSignPadReset = () => {
      setIsSignPadReady(false);
      setPreviewUrl(null);
    };

    window.addEventListener('terminal:update-preview', handlePreviewUpdate);
    window.addEventListener('scanner:logs-sync', handleScannerLogs);
    window.addEventListener('signpad:data-ready', handleSignPadReady);
    window.addEventListener('signpad:data-reset', handleSignPadReset);

    return () => {
      window.removeEventListener('terminal:update-preview', handlePreviewUpdate);
      window.removeEventListener('scanner:logs-sync', handleScannerLogs);
      window.removeEventListener('signpad:data-ready', handleSignPadReady);
      window.removeEventListener('signpad:data-reset', handleSignPadReset);
    };
  }, []);

  // --- 4. SIGN PAD DRAWING ENGINE ---
  const initCanvasBackground = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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

  // --- 5. RENDER KOLOM KIRI (SIDEBAR) ---
  const LeftColumn = (
    <div className="w-[500px] flex flex-col items-start shrink-0">
      {/* BOX VISUAL UTAMA */}
      <div className="relative w-full aspect-square border-2 border-[#00ffff]/40 bg-black overflow-hidden rounded-sm group mb-4 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
        
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
          <img 
            src={previewUrl || props.data?.image} 
            alt="Visual Target" 
            className={`w-full h-full object-cover transition-opacity duration-500 ${previewUrl ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 scale-110'}`} 
          />
        )}
        
        {/* Tombol Khusus Sign Pad */}
        {isSignPad && (
          <div className="absolute bottom-6 right-6 flex gap-2 z-[100] animate-in fade-in slide-in-from-right-4 duration-500">
             <button disabled={!isSignPadReady} onClick={saveSignature} className={`flex items-center gap-2 px-5 py-2.5 border-2 text-[10px] font-black uppercase transition-all rounded-sm shadow-2xl active:scale-95 ${isSignPadReady ? 'bg-[#00ffff]/20 border-[#00ffff]/60 text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'bg-zinc-900/50 border-zinc-700 text-zinc-600 cursor-not-allowed opacity-30'}`}><Save size={14} /> SAVE</button>
             <button disabled={!isSignPadReady} onClick={clearCanvas} className={`flex items-center gap-2 px-5 py-2.5 border-2 text-[10px] font-black uppercase transition-all rounded-sm shadow-2xl active:scale-95 ${isSignPadReady ? 'bg-red-500/20 border-red-500/60 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-zinc-900/50 border-zinc-700 text-zinc-600 cursor-not-allowed opacity-30'}`}><RotateCcw size={14} /> CLEAR</button>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff]/50 animate-pixel-scan z-20 pointer-events-none" />
        <div className={`absolute bottom-6 left-6 flex flex-col z-30 font-pixel text-left pointer-events-none transition-opacity duration-500 ${isSignPadReady || previewUrl ? 'opacity-0' : 'opacity-100'}`}>
          <span className="text-[11px] bg-[#00ffff] text-black px-2 py-0.5 font-black uppercase tracking-tighter w-fit">ID: {shortTitle}</span>
        </div>
      </div>
      
      {/* Warna Spektrum */}
      <div className="flex h-5 w-full border-2 border-[#00ffff]/40 overflow-hidden mb-4 shadow-lg">
         {['#082e2e', '#0d4a4a', '#126666', '#178282', '#00ffff', '#ff00ff', '#cc00cc', '#990099', '#ffffff', '#999999', '#444444', '#222222'].map((color, i) => (
           <div key={i} className="flex-1" style={{ backgroundColor: color }} />
         ))}
      </div>

      {/* Breadcrumbs */}
      <div className="flex h-8 w-fit font-mono text-[9px] uppercase tracking-tighter items-stretch mb-6">
          <div className="flex items-center px-4 pr-8 bg-[#178282] text-white relative z-10 path-arrow-start shadow-lg"><Home size={12} strokeWidth={2.5} /></div>
          <div className="flex items-center pl-9 pr-8 bg-[#0d4a4a] text-zinc-300 relative z-20 -ml-[18px] path-arrow-nested"><span className="font-black">vault</span></div>
          <div className="flex items-center pl-9 pr-10 bg-[#082e2e] text-[#00ffff]/90 relative z-30 -ml-[18px] path-arrow-end border-y border-[#00ffff]/10"><FolderOpen size={10} className="mr-2 opacity-60" /><span className="whitespace-nowrap tracking-widest uppercase">{shortTitle.toLowerCase()}</span></div>
      </div>

      {/* BOX BAWAH: Console Output (Khusus Doc Scanner) atau Info Modul Lain */}
      <div className="w-full border-2 border-[#00ffff]/40 bg-zinc-950 rounded-sm relative overflow-hidden flex flex-col min-h-[160px] shadow-2xl">
         {isDocScanner ? (
           /* CONSOLE OUTPUT UNTUK DOCUMENT SCANNER */
           <div className="p-4 flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#00ffff]/20 pb-2 mb-2">
                 <div className="flex items-center gap-2 text-[#00ffff] font-black uppercase text-[9px]">
                    <TerminalIcon size={12} className="animate-pulse" />
                    <span>Scanner_Console_Output</span>
                 </div>
                 <div className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">Live_Sync_Active</div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 font-mono text-[9px]">
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
                 {previewUrl && <div className="animate-pulse text-[#00ffff] text-[8px] mt-1 font-black underline underline-offset-2 uppercase">_Stream_Detected_</div>}
              </div>
           </div>
         ) : (
           /* DEFAULT INFO UNTUK MODUL LAIN */
           <div className="p-6 flex flex-col items-center justify-center text-center">
              {isSignPad ? <Signature size={48} className="text-[#00ffff]/10 mb-4" /> : <Search size={48} className="text-[#00ffff]/10 mb-4" />}
              <span className="text-[10px] text-[#00ffff]/40 font-black uppercase tracking-[0.2em]">
                 {isSignPad ? 'Signature_Vault_Ready' : 'System_Ready_State'}
              </span>
           </div>
         )}
         
         <div className="absolute top-0 right-0 p-1.5 opacity-5 pointer-events-none">
            <Activity size={40} className="text-[#00ffff]" />
         </div>
      </div>
      
      <style jsx global>{`
        .path-arrow-start { clip-path: polygon(0% 0%, calc(100% - 18px) 0%, 100% 50%, calc(100% - 18px) 100%, 0% 100%); }
        .path-arrow-nested, .path-arrow-end { clip-path: polygon(0% 0%, 18px 50%, 0% 100%, calc(100% - 18px) 100%, 100% 50%, calc(100% - 18px) 0%); }
      `}</style>
    </div>
  );

  return (
    <TerminalShell {...props} activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} leftColumn={LeftColumn}>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col overflow-hidden">
          {isOCR ? <OCRScannerModule data={props.data} logs={[]} setLogs={() => {}} />
            : isBarcode ? <BarcodeScannerModule {...props} />
            : isSignPad ? <SignPadModule {...props} />
            : isDocScanner ? <DocumentScannerModule {...props} />
            : isPrinter ? <ThermalPrinterModule {...props} activeTab={activeTab} />
            : <FingerprintModule {...props} activeTab={activeTab} />
          }
        </motion.div>
      </AnimatePresence>
    </TerminalShell>
  );
};

export default TerminalView;