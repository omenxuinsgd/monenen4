"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Loader2, 
  FileText, 
  Scan,
  Fingerprint,
  UserCircle,
  Terminal as TerminalIcon,
  Camera,
  Database,
  Image as ImageIcon,
  Cpu,
  ShieldCheck,
  Power,
  CircleStop,
  Zap,
  RefreshCcw,
  Video,
  VideoOff
} from 'lucide-react';

/**
 * PassportScannerModule
 * Modul khusus pemindaian paspor.
 * INTEGRASI: Menghubungkan Thalles Scanner T10K API ke menu Validasi Paspor.
 */
const PassportScannerModule = ({ data, activeTab: propActiveTab }) => {
  const baseUrl = "http://localhost:5160"; // Base URL untuk API
  const [logs, setLogs] = useState([`[SYSTEM] Passport Intelligence v1.7 Online.`]);
  const [activeTab, setActiveTab] = useState('control'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);

  // State navigasi tab output internal
  const [outputTab, setOutputTab] = useState('image'); 

  // State simulasi data
  const [isSentExecuted, setIsSentExecuted] = useState(false);
  
  // State penyimpanan data per tab
  const [capturedImages, setCapturedImages] = useState(null);
  const [mrzOutput, setMrzOutput] = useState("");
  const [dgOutput, setDgOutput] = useState("");
  
  // State Output Stream untuk menu Reader
  const [readerOutput, setReaderOutput] = useState("");

  // --- STATE & REFS KHUSUS OCR ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [ocrResultJson, setOcrResultJson] = useState(null);
  
  const cameraCanvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const cameraIntervalRef = useRef(null);

  const [bacData, setBacData] = useState({
    docNumber: "", birthDate: "", expiryDate: "" 
  });

  const isBacFilled = bacData.docNumber.trim() !== "" && 
                     bacData.birthDate.trim().length === 6 && 
                     bacData.expiryDate.trim().length === 6;

  useEffect(() => {
    if (propActiveTab) {
      const tabId = propActiveTab === 'passport_control' ? 'control' : propActiveTab.replace('passport_', '');
      setActiveTab(tabId);
      
      if (tabId !== 'ocr') {
        stopCamera();
      }

      setIsSentExecuted(false);
      setCapturedImages(null);
      setMrzOutput("");
      setDgOutput("");
      setReaderOutput("");
      setOcrResultJson(null);
      setOutputTab('image');
    }
  }, [propActiveTab]);

  // --- SINKRONISASI LOG KE SIDEBAR ---
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scanner:logs-sync', { detail: logs }));
  }, [logs]);

  const addLog = (msg, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === "error" ? "[ERROR]" : type === "success" ? "[SUCCESS]" : "[INFO]";
    setLogs(prev => [`${prefix} ${msg} (${timestamp})`, ...prev].slice(0, 50));
  };

  // --- FUNGSI HELPER: DRAW IMAGE ---
  const drawImageToCanvas = (url, canvas) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!canvas) return resolve();
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      const sep = url.includes("?") ? "&" : "?";
      img.src = url + sep + "t=" + Date.now();
    });
  };

  // --- FUNGSI KAMERA POLLING ---
  const openCamera = async () => {
    if (cameraIntervalRef.current) return;
    setIsCameraOpen(true);
    addLog("Membuka stream kamera...", "success");
    cameraIntervalRef.current = setInterval(async () => {
      if (cameraCanvasRef.current) {
        await drawImageToCanvas(`${baseUrl}/api/face/capture`, cameraCanvasRef.current);
      }
    }, 100);
  };

  const stopCamera = () => {
    if (cameraIntervalRef.current) {
      clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }
    setIsCameraOpen(false);
  };

  /**
   * handleTakeOCR
   */
  const handleTakeOCR = async () => {
    if (isProcessing || !isCameraOpen) return;
    setIsProcessing(true);
    setOcrResultJson(null);

    const cameraCanvas = cameraCanvasRef.current;
    const resultCanvas = resultCanvasRef.current;
    if (!cameraCanvas || !resultCanvas) {
      setIsProcessing(false);
      return;
    }

    const ctx = resultCanvas.getContext("2d");
    let counter = 0;
    const maxRetry = 20;

    addLog("Memulai ekstraksi Passport OCR...", "success");

    while (counter < maxRetry) {
      resultCanvas.width = cameraCanvas.width;
      resultCanvas.height = cameraCanvas.height;
      ctx.drawImage(cameraCanvas, 0, 0);

      const blob = await new Promise(resolve =>
        resultCanvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      try {
        const res = await fetch(`${baseUrl}/api/ocr/mrz_img`, {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          const json = await res.json();
          const b64Image = "data:image/jpeg;base64," + json.image;
          const img = new Image();
          img.onload = () => {
            resultCanvas.width = img.width;
            resultCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = b64Image;
          setOcrResultJson(json.parsed);
          window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: b64Image }));
          addLog("Paspor MRZ berhasil terdeteksi.", "success");
          break;
        }
      } catch (err) {
        console.log("Error:", err);
      }
      counter++;
      setOcrResultJson({ status: `Retry OCR: ${counter}` });
      await new Promise(r => setTimeout(r, 500));
    }
    if (counter >= maxRetry) {
      setOcrResultJson({ status: "MRZ not detected after multiple attempts." });
      addLog("Gagal mendeteksi MRZ.", "error");
    }
    setIsProcessing(false);
  };

  /**
   * INTEGRASI THALLES SCANNER T10K
   */
  const handleStartScanner = async () => {
    try {
      if (activeTab === 'control') {
        // T10K Scanner Start
        await fetch(`${baseUrl}/api/scanner_t10k/scanner_start`);
        setIsScannerActive(true);
        addLog("T10K Scanner Hardware Started.", "success");
      } else {
        // NFC Service Start
        const res = await fetch(`${baseUrl}/api/nfc/start`);
        const msg = await res.text();
        setIsScannerActive(true);
        addLog(`NFC Service Started: ${msg}`, "success");
      }
    } catch (err) {
      addLog("Failed to start hardware service.", "error");
    }
  };

  const handleStopScanner = async () => {
    try {
      if (activeTab === 'control') {
        // T10K Scanner Finish
        await fetch(`${baseUrl}/api/scanner_t10k/scanner_finish`);
        setIsScannerActive(false);
        setIsProcessing(false);
        addLog("T10K Scanner Hardware Finished.", "error");
      } else {
        // NFC Service Stop
        const res = await fetch(`${baseUrl}/api/nfc/stop`);
        const msg = await res.text();
        setIsScannerActive(false);
        setIsProcessing(false);
        addLog(`NFC Service Stopped: ${msg}`, "error");
      }
    } catch (err) {
      addLog("Failed to stop hardware service.", "error");
    }
  };

  /**
   * handleShowImagesScanner (T10K Integration)
   */
  const handleShowImagesT10K = () => {
    if (!isScannerActive) return addLog("Scanner is not active.", "error");
    setIsProcessing(true);
    setOutputTab('image');
    const ts = Date.now();

    addLog("Requesting multispectral images from T10K...", "info");

    // Simulasi delay pengambilan gambar berurutan sesuai scripts.js
    const images = [
      { id: 'nfc', label: 'Image NFC', url: `${baseUrl}/api/scanner_t10k/Img_nfc?ts=${ts}` },
      { id: 'uv', label: 'Image UV', url: `${baseUrl}/api/scanner_t10k/Img_uv?ts=${ts}`, delay: 500 },
      { id: 'ocr', label: 'Image OCR', url: `${baseUrl}/api/scanner_t10k/Img_ocr?ts=${ts}`, delay: 1000 },
      { id: 'rgb', label: 'Image RGB1', url: `${baseUrl}/api/scanner_t10k/Img_rgb?ts=${ts}`, delay: 1500 }
    ];

    setCapturedImages([]); // Reset

    images.forEach((img, idx) => {
      setTimeout(() => {
        setCapturedImages(prev => [...(prev || []), img]);
        if (idx === images.length - 1) {
          setIsProcessing(false);
          addLog("All T10K spectral images acquired.", "success");
          // Update preview utama dengan RGB
          window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: images[3].url }));
        }
      }, img.delay || 0);
    });
  };

  /**
   * handleLoadMrzT10K
   */
  const handleGetMrzT10K = async () => {
    if (!isScannerActive) return addLog("Scanner is not active.", "error");
    setIsProcessing(true);
    setOutputTab('mrz');
    try {
      const res = await fetch(`${baseUrl}/api/scanner_t10k/Data_mrz_ocr`);
      const json = await res.json();
      setMrzOutput(JSON.stringify(json, null, 2));
      addLog("T10K MRZ Data Extracted.", "success");
    } catch (err) {
      addLog("Failed to load T10K MRZ data.", "error");
    }
    setIsProcessing(false);
  };

  /**
   * handleLoadDGT10K
   */
  const handleGetDgT10K = async () => {
    if (!isScannerActive) return addLog("Scanner is not active.", "error");
    setIsProcessing(true);
    setOutputTab('dg');
    try {
      const res = await fetch(`${baseUrl}/api/scanner_t10k/Data_mrz_nfc`);
      const json = await res.json();
      setDgOutput(JSON.stringify(json, null, 2));
      addLog("T10K DG (NFC) Data Extracted.", "success");
    } catch (err) {
      addLog("Failed to load T10K DG data.", "error");
    }
    setIsProcessing(false);
  };

  /**
   * handleGetMRZAction (NFC Tab)
   */
  const handleGetMRZAction = async () => {
    if (!isScannerActive) return addLog("Action denied. Scanner is STOPPED.", "error");
    const time = new Date().toLocaleTimeString('en-US', { hour12: true });
    setIsProcessing(true);
    
    try {
      const res = await fetch(`${baseUrl}/api/nfc/mrz`);
      const text = await res.text();
      setReaderOutput(prev => prev + `\n[${time}] NFC_MRZ_DATA: ${text}\n----------------------------`);
      addLog("MRZ Data retrieved from NFC chip.", "success");
    } catch (err) {
      addLog("Failed to get MRZ from NFC.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Mengambil Foto Wajah Biometrik (NFC Tab)
   */
  const handleGetFaceAction = async () => {
    if (!isScannerActive) return addLog("Action denied. Scanner is STOPPED.", "error");
    const time = new Date().toLocaleTimeString('en-US', { hour12: true });
    setIsProcessing(true);
    
    const imageUrl = `${baseUrl}/api/nfc/image?ts=${Date.now()}`;
    window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: imageUrl }));
    setReaderOutput(prev => prev + `\n[${time}] FACE_IMAGE: Acquired from DG2 (NFC Chip)\n----------------------------`);
    addLog("Biometric face image retrieved from NFC.", "success");
    setIsProcessing(false);
  };

  /**
   * Eksekusi Perintah Utama (SENT - NFC Tab)
   */
  const handleSentAction = async () => {
    if (!isScannerActive) return addLog("Action denied. Scanner is STOPPED.", "error");
    const time = new Date().toLocaleTimeString('en-US', { hour12: true });
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("nomor_document", bacData.docNumber);
      formData.append("dob", bacData.birthDate);
      formData.append("doe", bacData.expiryDate);

      const res = await fetch(`${baseUrl}/api/nfc/BACKey`, {
        method: "POST",
        body: formData
      });

      const result = await res.json();
      if (res.ok) {
        setIsSentExecuted(true);
        setReaderOutput(prev => prev + `\n[${time}] BAC_AUTH_SUCCESS: ${result.message}\n----------------------------`);
        addLog(result.message, "success");
      } else {
        addLog("BAC Authentication failed. Check your data.", "error");
      }
    } catch (err) {
      addLog("NFC API Error. Check connection.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      
      {activeTab === 'ocr' ? (
        /* DISPLAY KHUSUS MENU EKSTRAKSI OCR */
        <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-950 flex flex-col rounded-sm relative overflow-hidden shadow-2xl min-h-[600px]">
           <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-[#00ffff]/20 bg-black/40 gap-4">
              <div className="flex items-center gap-4 flex-1">
                 <div className="w-10 h-10 bg-[#00ffff]/10 border border-[#00ffff]/40 flex items-center justify-center rounded-sm">
                    <Scan className="text-[#00ffff]" size={20} />
                 </div>
                 <div className="flex flex-col">
                    <h3 className="text-[15px] font-black text-[#00ffff] uppercase tracking-[0.2em] font-mono">Sistem Informasi OCR Passport</h3>
                    {/* <div className="flex items-center gap-2 mt-1">
                       <button onClick={isCameraOpen ? stopCamera : openCamera} className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all ${isCameraOpen ? 'bg-rose-500/20 text-rose-500 border border-rose-500' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500'}`}>
                          {isCameraOpen ? <CircleStop size={12} /> : <Video size={12} />}
                          {isCameraOpen ? 'Stop Camera' : 'Open Camera'}
                       </button>
                    </div> */}
                 </div>
              </div>
              <button onClick={isCameraOpen ? stopCamera : openCamera} className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[9px] font-black uppercase transition-all ${isCameraOpen ? 'bg-rose-500/20 text-rose-500 border border-rose-500' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500 font-mono'}`}>
                {isCameraOpen ? <CircleStop size={12} /> : <Video size={12} />}
                {isCameraOpen ? 'Stop Camera' : 'Open Camera'}
              </button>
              <button onClick={handleTakeOCR} disabled={isProcessing || !isCameraOpen} className="px-8 py-2.5 bg-[#00ffff] text-black font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-[#00ffff]/80 transition-all active:scale-95 disabled:opacity-30 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                {isProcessing ? 'Taking OCR...' : 'Take OCR'}
              </button>
           </div>

           <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden">
              <div className="flex-1 border-2 border-[#00ffff]/20 bg-black relative rounded-sm flex items-center justify-center overflow-hidden">
                 <canvas ref={cameraCanvasRef} className={`w-full h-full object-contain transition-opacity duration-500 ${isCameraOpen ? 'opacity-100' : 'opacity-0'}`} />
                 {!isCameraOpen && <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-800 opacity-40 uppercase tracking-[0.3em]"><VideoOff size={80} strokeWidth={1} /><span className="text-[11px] font-black mt-4">Camera Offline_</span></div>}
                 {isProcessing && <div className="absolute inset-x-0 h-[2px] bg-[#00ffff] shadow-[0_0_15px_#00ffff] z-20 animate-pixel-scan" />}
              </div>
              <div className="w-full lg:w-[450px] flex flex-col gap-6">
                 <div className="h-[240px] border-2 border-[#00ffff]/10 bg-zinc-900/40 rounded-sm flex items-center justify-center relative overflow-hidden">
                    <canvas ref={resultCanvasRef} className="w-full h-full object-contain opacity-95 transition-transform duration-700" />
                    {!ocrResultJson && !isProcessing && <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 opacity-30 uppercase text-[9px] font-black tracking-widest gap-2"><ImageIcon size={40} /><span>Waiting for capture...</span></div>}
                 </div>
                 <div className="flex-1 border-2 border-[#00ffff]/10 bg-zinc-900/40 rounded-sm overflow-hidden flex flex-col">
                    <div className="p-3 bg-black/40 border-b border-[#00ffff]/10 flex items-center gap-2"><Zap size={14} className="text-[#00ffff]" /><span className="text-[9px] font-black text-[#00ffff] uppercase tracking-widest">Extraction Result Buffer</span></div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono"><pre className="text-emerald-400 text-[12px] leading-relaxed whitespace-pre-wrap">{ocrResultJson ? JSON.stringify(ocrResultJson, null, 2) : "// Awaiting signal..."}</pre></div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        /* TAMPILAN STANDARD UNTUK VALIDASI & PEMBACA */
        <>
          <div className="flex flex-col lg:flex-row gap-8 items-start shrink-0">
            {/* <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0">
              <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/20 bg-zinc-950 overflow-hidden shadow-2xl rounded-sm group">
                <div className="w-full h-full relative">
                  <img src={isProcessing ? "https://cdn.dribbble.com/userupload/23642809/file/original-129fd5d25fa96a3437877562aa243ad6.gif" : "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2N3ZXg5NzV5ZW9hZHJpY2xxMjRid2Q3dGt3aTBuNWwyMWI0cTFwbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/gUNA7QH4AeLde/giphy.gif"} alt="Status" className={`w-full h-full object-cover transition-all duration-500 ${isScannerActive ? 'opacity-90' : 'opacity-40 grayscale'}`} />
                </div>
                <div className="absolute inset-0 flex flex-col items-end justify-start text-right p-3 pointer-events-none z-30">
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${isScannerActive ? 'text-emerald-400' : 'text-zinc-500'}`}>{isScannerActive ? 'SCANNER_ACTIVE' : 'SCANNER_OFF'}</span>
                </div>
              </div>
              <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">Passport_Buffer_v1.7</span>
            </div> */}

            <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-900/60 p-6 relative rounded-sm flex flex-col shadow-2xl min-h-[160px]">
              <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[14px] font-black font-mono uppercase z-[50] shadow-md">
                {activeTab === 'control' ? 'Sistem Informasi Passport' : 'Protokol Konfigurasi Passport BAC'}
              </div>

              <div className="absolute -top-[14px] right-6 flex gap-2 z-[50] font-mono">
                <button onClick={handleStartScanner} className={`flex items-center gap-2 px-4 py-1 text-[12px] font-black uppercase transition-all border-2 ${isScannerActive ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_2px_#10b981]' : 'bg-zinc-950 text-emerald-500 border-emerald-500 hover:bg-emerald-500/20'}`}><Power size={12} fill={isScannerActive ? "black" : "none"} />START</button>
                <button onClick={handleStopScanner} className={`flex items-center gap-2 px-4 py-1 text-[12px] font-black uppercase transition-all border-2 ${!isScannerActive ? 'bg-rose-500 text-white border-rose-500' : 'bg-zinc-950 text-rose-500 border-rose-500 hover:bg-rose-500/20'}`}><CircleStop size={12} fill={!isScannerActive ? "white" : "none"} />STOP</button>
              </div>
              
              <div className="flex flex-col md:flex-row items-end gap-6 text-left font-mono w-full mb-auto transition-all duration-300 pt-2">
                {activeTab === 'control' ? (
                  <div className="flex-1 pb-4"><p className={`text-[12px] font-bold uppercase ${isScannerActive ? 'text-emerald-400' : 'text-zinc-600'}`}>{isScannerActive ? '[SIGNAL_READY]: Sistem siap untuk ekstraksi Intelligent Control T10K...' : '[OFFLINE]: Sistem tidak aktif. Tekan START untuk memulai.'}</p></div>
                ) : (
                  <>
                    <div className="flex-1 space-y-2"><label className="text-[14px] text-[#00ffff]/60 font-black flex items-center gap-2 uppercase"><FileText size={12} /> Doc Number</label><input type="text" disabled={!isScannerActive} value={bacData.docNumber} onChange={(e) => setBacData({...bacData, docNumber: e.target.value})} placeholder="X12345678" className="w-full bg-black border border-[#00ffff]/20 h-9 px-4 text-[12px] text-white outline-none focus:border-[#00ffff]/60 font-mono" /></div>
                    <div className="w-full md:w-48 space-y-2"><label className="text-[14px] text-[#00ffff]/60 font-black flex items-center gap-2 uppercase"><Fingerprint size={12} /> Birth</label><input type="text" maxLength={6} disabled={!isScannerActive} value={bacData.birthDate} onChange={(e) => setBacData({...bacData, birthDate: e.target.value})} placeholder="YYMMDD" className="w-full bg-black border border-[#00ffff]/20 h-9 px-4 text-[12px] text-white text-center font-mono" /></div>
                    <div className="w-full md:w-48 space-y-2"><label className="text-[14px] text-[#00ffff]/60 font-black flex items-center gap-2 uppercase"><ShieldCheck size={12} /> Expiry</label><input type="text" maxLength={6} disabled={!isScannerActive} value={bacData.expiryDate} onChange={(e) => setBacData({...bacData, expiryDate: e.target.value})} placeholder="YYMMDD" className="w-full bg-black border border-[#00ffff]/20 h-9 px-4 text-[12px] text-white text-center font-mono" /></div>
                  </>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
                 {activeTab === 'control' ? (
                   <>
                     <button onClick={handleShowImagesT10K} disabled={isProcessing || !isScannerActive} className="py-2.5 font-black text-[12px] uppercase transition-all flex items-center justify-center gap-2 rounded-sm border-2 bg-zinc-950 text-emerald-500 border-emerald-500 hover:bg-emerald-500/10 active:scale-95 disabled:opacity-20"><Camera size={14} /> GET IMAGES</button>
                     <button onClick={handleGetMrzT10K} disabled={isProcessing || !isScannerActive} className="py-2.5 font-black text-[12px] uppercase transition-all flex items-center justify-center gap-2 rounded-sm border-2 bg-zinc-950 text-emerald-500 border-emerald-500 hover:bg-emerald-500/10 active:scale-95 disabled:opacity-20"><Scan size={14} /> GET MRZ INFO</button>
                     <button onClick={handleGetDgT10K} disabled={isProcessing || !isScannerActive} className="py-2.5 font-black text-[12px] uppercase transition-all flex items-center justify-center gap-2 rounded-sm border-2 bg-zinc-950 text-emerald-500 border-emerald-500 hover:bg-emerald-500/10 active:scale-95 disabled:opacity-20"><Database size={14} /> GET DG INFO</button>
                   </>
                 ) : activeTab === 'reader' && (
                   <>
                     <button onClick={handleSentAction} disabled={!isBacFilled || isProcessing || !isScannerActive} className={`py-2.5 font-black text-[10px] uppercase border-2 transition-all flex items-center justify-center gap-2 rounded-sm ${isBacFilled && isScannerActive ? 'bg-zinc-950 text-emerald-500 border-emerald-500 hover:bg-emerald-500/10' : 'opacity-20 bg-zinc-900 border-zinc-800 text-zinc-700'}`}>
                       {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />} SENT
                     </button>
                     <button onClick={handleGetFaceAction} disabled={!isSentExecuted || isProcessing || !isScannerActive} className={`py-2.5 font-black text-[10px] uppercase border-2 transition-all flex items-center justify-center gap-2 rounded-sm ${isSentExecuted && isScannerActive ? 'bg-zinc-950 text-emerald-500 border-emerald-500 hover:bg-emerald-500/10' : 'opacity-20 bg-zinc-900 border-zinc-800 text-zinc-700'}`}>
                        <UserCircle size={14} /> GET FACE IMAGE
                     </button>
                     <button onClick={handleGetMRZAction} disabled={!isSentExecuted || isProcessing || !isScannerActive} className={`py-2.5 font-black text-[10px] uppercase border-2 transition-all flex items-center justify-center gap-2 rounded-sm ${isSentExecuted && isScannerActive ? 'bg-zinc-950 text-emerald-500 border-emerald-500 hover:bg-emerald-500/10' : 'opacity-20 bg-zinc-900 border-zinc-800 text-zinc-700'}`}>
                        <Scan size={14} /> GET MRZ
                     </button>
                   </>
                 )}
              </div>
            </div>
          </div>

          <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-950 flex flex-col rounded-sm relative shadow-2xl min-h-[400px]">
              {activeTab === 'control' && (
                <div className="flex bg-zinc-900/80 border-b border-[#00ffff]/20 shrink-0 font-mono">
                  {[
                    { id: 'image', label: 'T10K Images Capture', icon: ImageIcon },
                    { id: 'mrz', label: 'T10K MRZ Result', icon: TerminalIcon },
                    { id: 'dg', label: 'T10K DG (NFC) Result', icon: Cpu }
                  ].map((t) => (
                    <button key={t.id} onClick={() => setOutputTab(t.id)} className={`flex-1 flex items-center justify-center gap-3 py-2 text-[13px] font-black uppercase transition-all border-r border-[#00ffff]/10 ${outputTab === t.id ? 'bg-[#00ffff] text-black shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]' : 'text-zinc-500 hover:text-[#00ffff] hover:bg-zinc-800'}`}>
                      <t.icon size={14} /> {t.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-8 flex-1 flex flex-col relative overflow-hidden custom-scrollbar bg-black/40">
                  <div className="flex-1 flex flex-col animate-in fade-in duration-500">
                      {activeTab === 'control' ? (
                        <div className="flex-1 flex flex-col">
                            {outputTab === 'image' && (
                                <div className="flex-1">
                                    {capturedImages && capturedImages.length > 0 ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in zoom-in-95 duration-500">
                                            {capturedImages.map((img) => (
                                                <div key={img.id} className="flex flex-col bg-zinc-900/60 border border-[#00ffff]/20 rounded-sm p-2 shadow-xl group">
                                                    <div className="flex items-center gap-2 mb-2 px-1 border-b border-white/5 pb-1"><Camera size={10} className="text-[#00ffff]" /><span className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter">{img.label}</span></div>
                                                    <div className="aspect-[3/4] bg-black/40 rounded-sm overflow-hidden relative"><img src={img.url} alt={img.label} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700" /></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-zinc-700 italic opacity-30 uppercase tracking-[0.3em] text-center py-20"><ImageIcon size={64} className="mb-6" /><span>Waiting for T10K Capture...</span></div>
                                    )}
                                </div>
                            )}
                            {(outputTab === 'mrz' || outputTab === 'dg') && (
                                <div className="flex-1 bg-black/60 border border-[#00ffff]/10 rounded-sm p-6 font-mono shadow-inner overflow-y-auto"><pre className="text-emerald-400 text-[14px] leading-relaxed">{(outputTab === 'mrz' ? mrzOutput : dgOutput) || "[SYSTEM]: Awaiting T10K extraction..."}{((outputTab === 'mrz' && mrzOutput) || (outputTab === 'dg' && dgOutput)) && <span className="animate-pulse">_</span>}</pre></div>
                            )}
                        </div>
                      ) : (
                        <>
                          {/* <div className="flex items-center gap-3 mb-4 border-b border-[#00ffff]/20 pb-3"><TerminalIcon size={18} className="text-[#00ffff] animate-pulse" /><span className="text-[15px] font-black text-[#00ffff] uppercase tracking-widest font-mono">Logs Output</span></div>
                          <div className="flex-1 bg-black/60 border border-[#00ffff]/10 rounded-sm overflow-y-auto custom-scrollbar font-mono shadow-inner p-5"><pre className="text-emerald-400 text-[14px] leading-relaxed">{readerOutput || `[WAITING]: Awaiting NFC BAC authentication...`}{readerOutput && <span className="animate-pulse">_</span>}</pre></div> */}
                          <div className="flex items-center gap-3 mb-4 border-b border-[#00ffff]/20 pb-3">
                            <TerminalIcon size={18} className="text-[#00ffff] animate-pulse" />
                            <span className="text-[15px] font-black text-[#00ffff] uppercase tracking-widest font-mono">
                              Logs Output
                            </span>
                          </div>

                          {/* Penambahan h-full atau max-h agar container memiliki batas tinggi untuk memicu scroll */}
                          <div className="flex-1 min-h-0 bg-black/60 border border-[#00ffff]/10 rounded-sm overflow-auto custom-scrollbar font-mono shadow-inner p-5">
                            <pre className="text-emerald-400 text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                              {readerOutput || `[WAITING]: Awaiting NFC BAC authentication...`}
                              {readerOutput && <span className="animate-pulse">_</span>}
                            </pre>
                          </div>
                        </>
                      )}
                  </div>
              </div>
          </div>
        </>
      )}
      
      <style jsx>{`
        @keyframes pixel-scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
        .animate-pixel-scan { position: absolute; width: 100%; animation: pixel-scan 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default PassportScannerModule;