"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Wifi,
  Loader2, 
  Fingerprint, 
  Power, 
  CircleStop, 
  Play, 
  ShieldCheck,
  Scan,
  Info,
  CheckCircle2,
  User,
  Search,
  Crosshair,
  Target,
  Database,
  Cpu,
  History,
  Trash2,
  X,
  AlertCircle,
  Bell
} from 'lucide-react';

/**
 * FingerprintModule
 * Diperbarui: 
 * - Penambahan Toast Notification untuk status Enrollment.
 * - Hasil jari yang di-split kini ditampilkan di Visual Buffer.
 * - Perbaikan label Registrasi (overflow fix).
 * - Layout Enrollment compact & eyecatching.
 */
const FingerprintModule = ({ data, activeTab }) => {
  const [nik, setNik] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // State untuk Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // State untuk enrollment (10 slot jari)
  const [fingerCaptures, setFingerCaptures] = useState(new Array(10).fill(null));
  
  // State untuk hasil verifikasi
  const [matchResult, setMatchResult] = useState(null);
  const [capturedBuffer, setCapturedBuffer] = useState(null);
  const [recentVerifications, setRecentVerifications] = useState([]);

  // Parameter Perangkat
  const [mode, setMode] = useState("3"); // Default OneFinger
  const [featureFormat, setFeatureFormat] = useState("0");
  const [nMissingFinger, setNMissingFinger] = useState("0");
  
  const API_BASE_URL = "http://localhost:5160";

  // Fungsi pembantu untuk menampilkan Toast
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  // --- 1. AUTO-CHECK KONEKSI SAAT MOUNT ---
  useEffect(() => {
    const checkInitialConnection = async () => {
      try {
        const res = await handleAction('/api/fingerprint/opendevice');
        if (res.success === true || res.message === "Device already opened") {
          setIsConnected(true);
        }
      } catch (err) {
        console.warn("[CONNECTION] Server biometrik offline.");
      }
    };
    checkInitialConnection();
  }, []);

  // --- 2. LOGIKA POLLING PREVIEW ---
  useEffect(() => {
    let intervalId;
    const fetchPreviewFrame = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/fingerprint/preview`);
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: reader.result }));
          };
          reader.readAsDataURL(blob);
        }
      } catch (err) {
        console.error("[PREVIEW_POLL] Gagal mengambil frame.");
      }
    };

    if (isCapturing) {
      intervalId = setInterval(fetchPreviewFrame, 500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
      }
    };
  }, [isCapturing]);

  const handleAction = async (endpoint, body = null) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
        mode: 'cors'
      });
      const result = await response.json().catch(() => ({ success: response.ok }));
      
      // Deteksi jari split jika ada
      const rawFingers = result.IndividualFingers || result.individualFingers || result.images || result.Images || result.Fingers;
      if (rawFingers && Array.isArray(rawFingers)) {
         setFingerCaptures(prev => {
            const updated = [...prev];
            rawFingers.forEach((item) => {
               const idx = (item.Index || item.index || item.id || 1) - 1;
               const b64 = item.Base64 || item.base64 || item.Image || item.image || item.Data;
               if (idx >= 0 && idx < 10 && b64) {
                  updated[idx] = b64.startsWith('data:image') ? b64 : `data:image/bmp;base64,${b64}`;
               }
            });
            return updated;
         });
      }

      return result;
    } catch (error) {
      return { success: false, message: "Kesalahan Jaringan: Server Offline" };
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleConnectToggle = async () => {
    const willConnect = !isConnected;
    const endpoint = willConnect ? '/api/fingerprint/opendevice' : '/api/fingerprint/closedevice';
    const res = await handleAction(endpoint);
    
    if (res.success === true || res.message === "Device already opened") {
      setIsConnected(willConnect);
      if (willConnect) showToast("Perangkat Terhubung", "success");
    } else if (!willConnect) {
      setIsConnected(false);
      showToast("Perangkat Diputuskan", "error");
    }
  };

  const handleStartCapture = async () => {
    const captureMode = parseInt(mode);
    if (captureMode === 5) {
      showToast("StartCapture tidak mendukung TenFinger", "error");
      return;
    }
    const res = await handleAction('/api/fingerprint/startcapture', { mode: captureMode, nMissingFinger: 0 });
    if (res.success || res.message?.toLowerCase().includes("already")) {
      setIsCapturing(true);
      showToast("Pemindaian Dimulai", "success");
    } else {
      showToast(res.message || "Gagal Memulai Capture", "error");
    }
  };

  const handleStopCapture = async () => {
    const res = await handleAction('/api/fingerprint/stopcapture');
    if (res.success !== false) {
      setIsCapturing(false);
      showToast("Pemindaian Berhenti", "success");
    }
  };

  const handleVerifyLogic = async () => {
    setIsLoading(true);
    setMatchResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fingerprint/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captureType: parseInt(mode), featureFormat: 0 })
      });
      const json = await res.json();
      if (res.ok && json.UserID) {
        setMatchResult({
          userId: json.UserID,
          name: json.Name,
          address: json.Address || "ZONE_SECURE",
          attributes: "AUTHORIZED"
        });
        const imgUrl = "data:image/bmp;base64," + json.Image;
        setCapturedBuffer(imgUrl);
        setRecentVerifications(prev => [imgUrl, ...prev].slice(0, 10));
        showToast("Verifikasi Berhasil", "success");
      } else {
        showToast("Identitas Tidak Dikenali", "error");
      }
    } catch (e) { 
      showToast("Gagal Menghubungi Server Verifikasi", "error");
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleEnroll = async () => {
    if (!nik) {
      showToast("NIK Harus Diisi", "error");
      return;
    }
    const captureMode = parseInt(mode);
    if (captureMode === 4) {
      showToast("Enroll tidak boleh OneFinger/Roll", "error");
      return;
    }
    
    setFingerCaptures(new Array(10).fill(null));

    const res = await handleAction('/api/fingerprint/startenroll', {
      userId: parseInt(nik) || 0,
      missingFinger: 0,
      captureType: captureMode,
      featureFormat: 0
    });
    
    if (res.success) {
      setIsCapturing(true);
      showToast("Proses Enrollment Dimulai", "success");
    } else {
      showToast(res.message || "Gagal Memulai Enrollment", "error");
    }
  };

  const handleClearFields = () => {
    setNik("");
    setUserName("");
    setFingerCaptures(new Array(10).fill(null));
    showToast("Data Dibersihkan", "success");
  };

  // =========================================================================
  // RENDER: MENU VERIFICATION
  // =========================================================================
  if (activeTab === 'verification') {
    return (
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden text-left font-mono bg-black/40 relative">
        {/* TOAST OVERLAY */}
        <AnimatePresence>
          {toast.show && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`absolute top-6 right-6 z-[999] flex items-center gap-3 px-6 py-3 border-2 shadow-2xl backdrop-blur-md rounded-sm ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'}`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between border-b border-[#00ffff]/20 pb-3">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Identification <span className="text-[#00ffff]">Personal Finger</span></h1>
            <span className="text-[7px] text-[#00ffff]/50 uppercase tracking-[0.4em]">Biometric_Vault_Protocol_v.4.0</span>
          </div>
          <div className="flex items-center gap-3">
             <div className={`px-3 py-1 border rounded-full flex items-center gap-2 text-[9px] font-black uppercase transition-all ${isConnected ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                {isConnected ? 'Device_Ready' : 'Device_Offline'}
             </div>
             <button onClick={handleConnectToggle} className={`p-2 border transition-all rounded-sm ${isConnected ? 'border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff] hover:text-black'}`}><Power size={14} /></button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-zinc-950/40 p-3 border border-white/5 rounded-sm shrink-0">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-[8px] text-[#00ffff]/40 font-black uppercase tracking-widest ml-1">Capture_Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="bg-black border border-[#00ffff]/20 text-[#00ffff] text-[10px] p-2 outline-none focus:border-[#00ffff] transition-all rounded-sm">
              <option value="3">SINGLE_FINGER</option>
              <option value="0">LEFT_FINGER</option>
              <option value="1">RIGHT_FINGER</option>
              <option value="2">BOTH_THUMBS</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <button onClick={handleStartCapture} disabled={!isConnected || isCapturing || isLoading} className={`flex-1 py-3 border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isConnected && !isCapturing ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}><Play size={12} fill="currentColor" /> Start Capture</button>
            <button onClick={handleStopCapture} disabled={!isCapturing} className={`flex-1 py-3 border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isCapturing ? 'bg-[#ff00ff]/10 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-white shadow-[0_0_15px_rgba(255,0,255,0.1)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}><CircleStop size={12} fill="currentColor" /> Stop</button>
            <button onClick={handleVerifyLogic} disabled={!isConnected || isLoading} className={`flex-[1.5] py-3 border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isConnected && !isLoading ? 'bg-blue-600 border-blue-500 text-white hover:bg-white hover:text-black shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}>{isLoading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />} Execute Verify</button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0 py-4 relative">
          <div className="relative aspect-square h-full max-h-[420px] bg-zinc-950 border border-[#00ffff]/20 rounded-sm shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
              <AnimatePresence mode="wait">
                {matchResult ? (
                  <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col items-center justify-center relative">
                    <div className="w-40 h-56 border border-[#00ffff]/20 bg-black/60 p-2 rounded-sm shadow-2xl mb-2 relative">
                       <img src={capturedBuffer} className="w-full h-full object-contain mix-blend-screen brightness-125" alt="Result" />
                       <div className="absolute -top-4 -left-4 flex items-center gap-1 text-[7px] text-[#00ffff] font-bold bg-black/80 px-2 py-0.5 border border-[#00ffff]/20 uppercase tracking-tighter">VALIDATED</div>
                    </div>
                    <div className="w-full flex flex-col items-center gap-1">
                       <span className="text-[7px] text-zinc-500 uppercase tracking-[0.4em] mb-0.5">Subject_Identity</span>
                       <h2 className="text-lg font-black text-white uppercase tracking-tight">{matchResult.name}</h2>
                       <div className="grid grid-cols-3 gap-4 mt-2 w-full px-4">
                          <div className="border-r border-white/5"><span className="text-[6px] text-[#00ffff]/40 uppercase block">ID_Token</span><span className="text-[9px] text-[#00ffff] font-bold">{matchResult.userId}</span></div>
                          <div className="border-r border-white/5"><span className="text-[6px] text-[#00ffff]/40 uppercase block">Auth_Lvl</span><span className="text-[9px] text-white font-bold">{matchResult.attributes}</span></div>
                          <div><span className="text-[6px] text-[#00ffff]/40 uppercase block">Accuracy</span><span className="text-[9px] text-emerald-400 font-bold">99.8%</span></div>
                       </div>
                    </div>
                    <div className="absolute top-2 right-2 text-emerald-500 opacity-60"><CheckCircle2 size={24} /></div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <Search size={100} strokeWidth={1} className="text-[#00ffff] animate-pulse" />
                    <div className="flex flex-col items-center">
                       <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#00ffff]">Awaiting_Signal</span>
                       <span className="text-[7px] uppercase tracking-widest text-zinc-500 mt-2">Ready_To_Analyze_Biometric_Stream</span>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {isCapturing && <div className="absolute inset-x-0 h-[2px] bg-[#00ffff] shadow-[0_0_15px_#00ffff] animate-biometric-scan z-50" />}
          </div>
        </div>
        <style jsx global>{`
          @keyframes biometric-scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
          .animate-biometric-scan { animation: biometric-scan 2.5s linear infinite; }
        `}</style>
      </div>
    );
  }

  // =========================================================================
  // RENDER: MENU ENROLLMENT
  // =========================================================================
  return (
    <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar text-left font-mono relative">
      
      {/* TOAST OVERLAY */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`absolute top-6 right-6 z-[999] flex items-center gap-3 px-6 py-3 border-2 shadow-2xl backdrop-blur-md rounded-sm ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:text-white transition-colors">
               <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch shrink-0">
        
        {/* PANEL KIRI: CAPTURE CONTROL */}
        <div className="border-2 border-[#00ffff]/30 bg-zinc-900/60 relative rounded-sm flex flex-col justify-between shadow-xl min-h-[180px]">
          <div className="absolute -top-[12px] left-5 bg-white text-black px-3 py-0.5 text-[9px] font-black uppercase tracking-widest z-[50]">
            Capture Control
          </div>
          
          <div className="absolute -top-[15px] right-5 z-[60]">
            <button 
              onClick={handleConnectToggle} 
              className={`px-3 py-1.5 border-2 text-[8px] font-black uppercase transition-all flex items-center gap-2 shadow-lg ${isConnected ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600' : 'bg-[#00ffff] border-[#00ffff] text-black hover:bg-white'}`}
            >
              <Power size={10} />
              {isConnected ? 'Disconnect' : 'Connect Device'}
            </button>
          </div>

          <div className="flex flex-col gap-4 p-5 mt-2">
            <div className="space-y-1.5">
              <label className="text-[9px] text-[#00ffff] font-black uppercase tracking-[0.2em] block ml-1">Mode Capture</label>
              <div className="relative group">
                <select 
                  value={mode} 
                  onChange={(e) => setMode(e.target.value)} 
                  className="w-full bg-black/60 border-2 border-[#00ffff]/20 group-hover:border-[#00ffff]/50 text-[11px] p-2 text-[#00ffff] outline-none transition-all rounded-sm font-mono appearance-none"
                >
                  <option value="0">LeftFinger</option>
                  <option value="1">RightFinger</option>
                  <option value="2">BothThumb</option>
                  <option value="3">OneFinger</option>
                  <option value="4">Roll</option>
                  <option value="5">TenFinger</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#00ffff]/40 text-[10px]">▼</div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={handleStartCapture} 
                disabled={!isConnected || isCapturing || isLoading} 
                className={`flex-1 py-2 border-2 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 rounded-sm ${isConnected && !isCapturing ? 'bg-zinc-950 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
              >
                <Play size={14} fill="currentColor" /> Start Capture
              </button>
              <button 
                onClick={handleStopCapture} 
                disabled={!isCapturing} 
                className={`flex-1 py-2 border-2 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 rounded-sm ${isCapturing ? 'bg-zinc-950 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-white shadow-[0_0_15px_rgba(255,0,255,0.1)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
              >
                <CircleStop size={14} fill="currentColor" /> Stop Capture
              </button>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: REGISTRASI DATA USER */}
        <div className="border-2 border-[#00ffff]/20 bg-zinc-950/80 relative rounded-sm text-left shadow-lg flex flex-col min-h-[180px]">
          <div className="absolute -top-[12px] left-5 bg-white text-black px-3 py-0.5 text-[9px] font-black uppercase tracking-widest z-[50]">
            Registrasi_Data_User
          </div>

          <div className="flex-1 p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
              <User size={100} className="text-[#00ffff]" />
            </div>

            <div className="space-y-3 relative z-10">
              <div className="space-y-1">
                <label className="text-[8px] text-[#00ffff]/60 font-black uppercase tracking-widest ml-1">Nomor Induk Kependudukan</label>
                <input 
                  value={nik} 
                  onChange={(e) => setNik(e.target.value)} 
                  placeholder="USER ID / NIK" 
                  className="w-full bg-black/40 border-2 border-[#00ffff]/10 focus:border-[#00ffff] text-[11px] p-2 text-[#00ffff] outline-none rounded-sm uppercase font-mono tracking-widest placeholder:text-zinc-800 shadow-inner" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-[#00ffff]/60 font-black uppercase tracking-widest ml-1">Nama Lengkap Subjek</label>
                <input 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  placeholder="NAMA LENGKAP" 
                  className="w-full bg-black/40 border-2 border-[#00ffff]/10 focus:border-[#00ffff] text-[11px] p-2 text-[#00ffff] outline-none rounded-sm font-mono tracking-widest placeholder:text-zinc-800 shadow-inner" 
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-3">
              <button 
                onClick={handleEnroll} 
                disabled={!isConnected || isLoading || !nik} 
                className={`flex-[2] py-2 border-2 font-black text-[10px] uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 ${isConnected && nik ? 'bg-[#00ffff] border-[#00ffff] text-black hover:bg-white shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed'}`}
              >
                <ShieldCheck size={14} /> Start Enroll
              </button>
              <button 
                onClick={handleClearFields} 
                className="flex-1 py-2 border-2 border-[#ff00ff]/30 text-[#ff00ff] text-[9px] font-black hover:bg-[#ff00ff] hover:text-white uppercase transition-all rounded-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BARIS BAWAH: VISUAL BUFFER */}
      <div className="w-full border-2 border-[#00ffff]/20 bg-black/40 p-5 rounded-sm shadow-2xl shrink-0 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-3 border-b border-[#00ffff]/10 pb-3 mb-4">
          <Fingerprint size={16} className="text-[#00ffff]" />
          <span className="text-[11px] font-black text-[#00ffff] uppercase tracking-[0.4em]">Finger_Extraction_Visual_Buffer</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1 w-20 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div animate={{ x: [-80, 80] }} transition={{ repeat: Infinity, duration: 2 }} className="h-full w-1/2 bg-[#00ffff]/30" />
            </div>
            <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">Streaming_Active</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3.5 flex-1">
          {fingerCaptures.map((img, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div className="relative w-full aspect-[3/4] border-2 border-[#00ffff]/20 bg-zinc-950 rounded-sm overflow-hidden flex items-center justify-center group hover:border-[#00ffff]/60 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                <AnimatePresence>
                  {img ? (
                    <motion.img 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      src={img} 
                      className="w-full h-full object-contain p-1.5 filter brightness-110 contrast-125" 
                      alt={`Finger Split Result ${idx + 1}`} 
                    />
                  ) : (
                    <div className="flex flex-col items-center opacity-5 group-hover:opacity-15 transition-opacity">
                      <Fingerprint size={36} strokeWidth={1} />
                    </div>
                  )}
                </AnimatePresence>
                
                {isCapturing && !img && (
                  <div className="absolute inset-x-0 h-[2px] bg-[#00ffff]/60 shadow-[0_0_12px_#00ffff] animate-pixel-scan z-20" />
                )}

                <div className="absolute top-0 left-0 bg-black/80 px-1.5 py-0.5 text-[7px] font-black text-[#00ffff]/60 border-r border-b border-[#00ffff]/10 uppercase tracking-tighter">
                  F_{String(idx + 1).padStart(2, '0')}
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">{idx < 5 ? `L_${idx + 1}` : `R_${idx - 4}`}</span>
                <div className={`w-6 h-[1.5px] ${img ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pixel-scan { 
          0% { top: 0; } 
          100% { top: 100%; } 
        }
        .animate-pixel-scan { animation: pixel-scan 2.2s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default FingerprintModule;