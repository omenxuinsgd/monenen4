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
  CheckCircle2,
  User,
  Search,
  Target,
  History,
  Trash2,
  X,
  AlertCircle,
  Database,
  MapPin,
  IdCard,
  Lock,
  Unlock,
  Send,
  RefreshCw,
  LayoutGrid
} from 'lucide-react';

/**
 * FingerprintModule
 * Modul pendaftaran dan verifikasi sidik jari lengkap.
 * Menggunakan tombol kontrol mode sebagai pengganti select box.
 * FIX: Responsif untuk layar 11.6" 1920x1080 dengan zoom 90%
 */
const FingerprintModule = ({ data, activeTab }) => {
  // State Data User
  const [nik, setNik] = useState("");
  const [userName, setUserName] = useState("");
  const [address, setAddress] = useState("");
  const [isDataSaved, setIsDataSaved] = useState(false); 

  // Tambahkan setelah state logs
const [splitResults, setSplitResults] = useState([]); // Untuk menyimpan hasil split per jari
const [isWaitingForSplit, setIsWaitingForSplit] = useState(false); // Status menunggu split
  
  // State Status Perangkat & UI
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  // State Buffer & Hasil
  const [fingerCaptures, setFingerCaptures] = useState(new Array(10).fill(null));
  const [matchResult, setMatchResult] = useState(null);
  const [capturedBuffer, setCapturedBuffer] = useState(null);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  const [dbFingerImages, setDbFingerImages] = useState([]);
  const [isLoadingDbImages, setIsLoadingDbImages] = useState(false);
   const [logs, setLogs] = useState([`[SYSTEM] Fingerprint Intelligence v1.7 Online.`]);
  
  // State untuk verification
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResponse, setVerifyResponse] = useState(null);

  const [mode, setMode] = useState("3"); 

  // Konfigurasi API
  const API_FINGER_URL = "http://localhost:5160";
  const API_REG_URL = "http://localhost:5160";
  
  const processedFingersRef = useRef(new Set());
  const enrollmentStartedRef = useRef(false);
  const capturedFingersRef = useRef({});

  // Daftar Mode Pemindaian
  const CAPTURE_MODES = [
    { id: "0", label: "Left 4", detail: "4 Jari Kiri" },
    { id: "1", label: "Right 4", detail: "4 Jari Kanan" },
    { id: "2", label: "Thumbs", detail: "2 Ibu Jari" },
    { id: "3", label: "Single", detail: "1 Jari" },
    { id: "4", label: "Roll", detail: "Roll Scan" },
    { id: "5", label: "Ten", detail: "10 Jari" },
  ];

  const getRequiredCount = (m) => {
    const val = parseInt(m);
    if (val === 0 || val === 1) return 4;
    if (val === 2) return 2;
    if (val === 3 || val === 4) return 1;
    if (val === 5) return 10;
    return 1;
  };

  const getExpectedFingerIndices = (m) => {
    const val = parseInt(m);
    if (val === 0) return [5, 6, 7, 8];
    if (val === 1) return [0, 1, 2, 3];
    if (val === 2) return [0, 4];
    if (val === 3) return [0];
    if (val === 4) return [0];
    if (val === 5) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    return [0];
  };

  const getFingerName = (index) => {
    const fingerNames = {
      0: "Right Thumb", 1: "Right Index", 2: "Right Middle", 3: "Right Ring", 4: "Right Little",
      5: "Left Thumb", 6: "Left Index", 7: "Left Middle", 8: "Left Ring", 9: "Left Little"
    };
    return fingerNames[index] || `Finger ${index + 1}`;
  };

  const showToast = (message, type = "success") => {
    const cleanMsg = message ? message.replace(/\0/g, '').trim() : "Sistem Sibuk";
    setToast({ show: true, message: cleanMsg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 5000);
  };

  const loadFingerprintImagesFromDb = async (userId) => {
    if (!userId) return;
    setIsLoadingDbImages(true);
    try {
      const response = await fetch(`${API_FINGER_URL}/api/fingerprint/fingerimage/${userId}`);
      if (!response.ok) {
        console.log("No fingerprint data found for user:", userId);
        setDbFingerImages([]);
        return;
      }
      const data = await response.json();
      const mappedImages = new Array(10).fill(null);
      data.forEach((item, index) => {
        let fingerIdx = item.fingerIndex || item.FingerIndex || index;
        if (fingerIdx >= 0 && fingerIdx < 10) {
          mappedImages[fingerIdx] = `data:image/jpeg;base64,${item.Image}`;
        }
      });
      setDbFingerImages(mappedImages);
      setFingerCaptures(prev => {
        const newCaptures = [...prev];
        mappedImages.forEach((img, idx) => { if (img) newCaptures[idx] = img; });
        return newCaptures;
      });
    } catch (error) {
      console.error("Error DB Load:", error);
    } finally {
      setIsLoadingDbImages(false);
    }
  };

  const addLog = (msg, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === "error" ? "[ERROR]" : type === "success" ? "[SUCCESS]" : "[INFO]";
    setLogs(prev => [`${prefix} ${msg} (${timestamp})`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const initDevice = async () => {
      try {
        const res = await handleAction('/api/fingerprint/opendevice');
        if (res.success || res.message?.toLowerCase().includes("already")) setIsConnected(true);
      } catch (err) {}
    };
    initDevice();
  }, []);

  useEffect(() => {
    if (isDataSaved && nik) loadFingerprintImagesFromDb(nik);
  }, [isDataSaved, nik]);

  useEffect(() => {
    let intervalId;
    const fetchPreview = async () => {
      try {
        const res = await fetch(`${API_FINGER_URL}/api/fingerprint/preview`);
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: reader.result }));
          reader.readAsDataURL(blob);
        }
      } catch (err) {}
    };
    if (isCapturing) intervalId = setInterval(fetchPreview, 500);
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
      }
    };
  }, [isCapturing]);

  useEffect(() => {
    let pollId;
    if (!isEnrolling) return;
    const syncFingers = async () => {
      try {
        const res = await fetch(`${API_FINGER_URL}/api/fingerprint/finger-captured`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setFingerCaptures(prev => {
              const next = [...prev];
              let hasNew = false;
              const expectedIndices = getExpectedFingerIndices(mode);
              const requiredCount = getRequiredCount(mode);
              data.forEach(f => {
                let rawIdx = f.fingerIndex || f.Index || 1;
                if (typeof rawIdx === 'string' && rawIdx.includes('-')) rawIdx = rawIdx.split('-').pop();
                const idx = parseInt(rawIdx) - 1;
                const b64 = f.image || f.Image || f.Base64;
                if (expectedIndices.includes(idx) && b64 && !processedFingersRef.current.has(idx)) {
                  next[idx] = b64.startsWith('data:image') ? b64 : `data:image/bmp;base64,${b64}`;
                  processedFingersRef.current.add(idx);
                  hasNew = true;
                  showToast(`Captured: ${getFingerName(idx)}`, "success");
                  if (processedFingersRef.current.size >= requiredCount && !enrollmentComplete) {
                    setEnrollmentComplete(true);
                    showToast(`Selesai! ${requiredCount} Jari Terdaftar`, "success");
                    setTimeout(async () => {
                      await handleAction('/api/fingerprint/stopcapture');
                      setIsEnrolling(false);
                      setIsCapturing(false);
                      enrollmentStartedRef.current = false;
                    }, 1500);
                  }
                }
              });
              return hasNew ? next : prev;
            });
          }
        }
      } catch (err) {}
    };
    pollId = setInterval(syncFingers, 800);
    return () => clearInterval(pollId);
  }, [isEnrolling, mode, enrollmentComplete]);

  // --- SINKRONISASI LOG KE SIDEBAR ---
    useEffect(() => {
      window.dispatchEvent(new CustomEvent('scanner:logs-sync', { detail: logs }));
    }, [logs]);

  const handleAction = async (endpoint, body = null) => {
    setIsLoading(true);
    addLog("mencoba mengghubungkan...", "info");
    try {
      const response = await fetch(`${API_FINGER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
      });
      const result = await response.json().catch(() => ({ success: response.ok }));
      return { ...result, message: result.message ? result.message.replace(/\0/g, '').trim() : "" };
    } catch (error) {
      addLog("koneksi terputus/gagal menghubungkan, coba lagi!", "error");
      return { success: false, message: "Koneksi terputus." };
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleSaveUserData = async (e) => {
    if (e) e.preventDefault();
    if (!nik.trim() || !userName.trim() || !address.trim()) {
      showToast("Lengkapi semua field.", "error");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append("userId", nik.trim());
    formData.append("Name", userName.trim());
    formData.append("Address", address.trim());
    try {
      const response = await fetch(`${API_REG_URL}/api/face/registration`, { method: "POST", body: formData });
      if (response.ok) {
        setIsDataSaved(true);
        showToast("Data User Berhasil Disimpan.", "success");
      } else {
        showToast("Gagal Registrasi User.", "error");
      }
    } catch (error) {
      showToast("Server Registrasi Offline.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isDataSaved) return showToast("Simpan data user dahulu", "error");
    if (enrollmentStartedRef.current) return;
    const target = getRequiredCount(mode);
    processedFingersRef.current.clear();
    setFingerCaptures(new Array(10).fill(null));
    setEnrollmentComplete(false);
    enrollmentStartedRef.current = true;
    if (isCapturing) {
      await handleAction('/api/fingerprint/stopcapture');
      setIsCapturing(false);
      await new Promise(r => setTimeout(r, 800));
    }
    const res = await handleAction('/api/fingerprint/startenroll', {
      UserId: parseInt(nik) || 0, missingFinger: 0, captureType: parseInt(mode), featureFormat: 0
    });
    if (res.success) {
      setIsEnrolling(true);
      setIsCapturing(true);
      showToast(`Tempelkan ${target} jari secara bergantian`, "success");
    } else {
      showToast(res.message || "Gagal Memulai Enrollment", "error");
      enrollmentStartedRef.current = false;
    }
  };

  const handleVerifyLogic = async () => {
    if (!isConnected) return showToast("Sensor belum terhubung.", "error");
    setIsVerifying(true);
    setMatchResult(null);
    setVerifyResponse(null);
    capturedFingersRef.current = {};
    setFingerCaptures(prev => prev.map((img, i) => dbFingerImages[i] ? img : null));
    try {
      const res = await fetch(`${API_FINGER_URL}/api/fingerprint/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captureType: parseInt(mode), missingFinger: 0, featureFormat: 0 })
      });
      const json = await res.json();
      if (json.fingers) {
        setFingerCaptures(prev => {
          const next = [...prev];
          json.fingers.forEach(f => {
            let idx = (f.fingerIndex || 0) - 1;
            if (idx >= 0 && idx < 10 && f.image) {
              next[idx] = `data:image/bmp;base64,${f.image}`;
              capturedFingersRef.current[idx] = true;
            }
          });
          return next;
        });
      }
      if (res.ok && json.UserID) {
        setMatchResult({ userId: json.UserID, name: json.Name, address: json.Address, attributes: "AUTHORIZED", image: json.Image });
        if (json.Image) setCapturedBuffer(`data:image/bmp;base64,${json.Image}`);
        showToast(`Dikenali: ${json.Name || json.UserID}`, "success");
      } else {
        showToast(json.message || "Identitas Tidak Dikenali", "error");
      }
    } catch (error) {
      showToast("Gagal Terhubung ke Server Verifikasi", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetForm = () => {
    setNik(""); setUserName(""); setAddress("");
    setIsDataSaved(false); setIsEnrolling(false); setEnrollmentComplete(false);
    setFingerCaptures(new Array(10).fill(null)); setDbFingerImages([]);
    setMatchResult(null); setVerifyResponse(null);
    processedFingersRef.current.clear(); enrollmentStartedRef.current = false;
    showToast("Form Direset", "success");
  };

  // --- RENDER VERIFICATION TAB ---
  if (activeTab === 'verification') {
    return (
      <div className="flex-1 px-3 sm:px-4 py-2 flex flex-col gap-4 sm:gap-6 overflow-hidden text-left font-mono bg-black/40 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#00ffff]/20 pb-3 gap-3 sm:gap-0">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter italic">Verification <span className="text-[#00ffff]">Personal Finger</span></h1>
            <span className="pl-1 text-[10px] sm:text-[12px] text-[#00ffff]/50 uppercase tracking-[0.3em] sm:tracking-[0.4em]">Biometric_Vault_Protocol_v.4.0</span>
          </div>
          <button onClick={async () => {
            const endpoint = !isConnected ? '/api/fingerprint/opendevice' : '/api/fingerprint/closedevice';
            const res = await handleAction(endpoint);
            if (res.success || res.message?.toLowerCase().includes("already")) setIsConnected(!isConnected);
          }} className={`p-1.5 sm:p-2 border transition-all rounded-sm ${isConnected ? 'border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff] hover:text-black'}`}><Power size={14} /></button>
        </div>
        
        <div className="flex flex-col gap-3 sm:gap-4 bg-zinc-950/40 p-2 sm:p-3 border border-white/5 rounded-sm shrink-0">
          <label className="text-[12px] sm:text-[14px] text-[#00ffff]/60 font-black uppercase tracking-widest flex items-center gap-2">
            <LayoutGrid size={11} /> Pilih Mode Verifikasi
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
            {CAPTURE_MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} className={`flex flex-col items-center justify-center py-1 px-0.5 sm:px-1 border-2 rounded-sm transition-all ${mode === m.id ? 'bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff] shadow-[0_0_10px_#00ffff44]' : 'bg-black/40 border-white/10 text-zinc-500 hover:border-white/30'}`}>
                <span className="text-[12px] sm:text-[16px] font-black">{m.label}</span>
                <span className="text-[8px] sm:text-[10px] md:text-[12px] opacity-60 uppercase hidden sm:inline">{m.detail}</span>
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 font-mono">
            <button onClick={async () => {
              const res = await handleAction('/api/fingerprint/startcapture', { mode: parseInt(mode), nMissingFinger: 0 });
              if (res.success) setIsCapturing(true);
            }} disabled={!isConnected || isCapturing} className={`w-full sm:flex-1 py-2 sm:py-3 border font-black text-[11px] sm:text-[14px] uppercase transition-all flex items-center justify-center gap-1 sm:gap-2 rounded-sm ${isConnected && !isCapturing ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff]' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}><Play size={11} fill="currentColor" /> Preview</button>
            <button onClick={async () => {
              const res = await handleAction('/api/fingerprint/stopcapture');
              if (res.success !== false) setIsCapturing(false);
            }} disabled={!isCapturing} className={`w-full sm:flex-1 py-2 sm:py-3 border font-black text-[11px] sm:text-[14px] uppercase transition-all flex items-center justify-center gap-1 sm:gap-2 rounded-sm ${isCapturing ? 'bg-rose-500/10 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}><CircleStop size={11} fill="currentColor" /> Stop</button>
            <button onClick={handleVerifyLogic} disabled={!isConnected || isVerifying} className={`w-full sm:flex-[1.5] py-2 sm:py-3 border font-black text-[11px] sm:text-[14px] uppercase transition-all flex items-center justify-center gap-1 sm:gap-2 rounded-sm ${isConnected ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>{isVerifying ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />} Verify</button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0 py-3 sm:py-4">
          <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] bg-zinc-950 border border-[#00ffff]/20 rounded-sm shadow-2xl overflow-hidden group mx-auto">
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 text-center text-white text-[9px] sm:text-[10px]">
              <AnimatePresence mode="wait">
                {matchResult ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-28 h-36 sm:w-36 sm:h-48 border border-[#00ffff]/20 bg-black/60 p-1.5 sm:p-2 rounded-sm shadow-2xl mb-3 sm:mb-4 relative">
                      {capturedBuffer && <img src={capturedBuffer} className="w-full h-full object-contain mix-blend-screen brightness-125" alt="Match" />}
                      <div className="absolute -top-2.5 -left-2.5 sm:-top-3 sm:-left-3 bg-black/80 px-1.5 sm:px-2 py-0.5 border border-[#00ffff]/20 text-[6px] sm:text-[7px] text-[#00ffff] font-black uppercase tracking-tighter shadow-lg">VERIFIED</div>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                      <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight italic text-center">{matchResult.name}</h2>
                      <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4 text-[7px] sm:text-[9px] text-[#00ffff]/60 font-bold border-t border-[#00ffff]/10 pt-1.5 sm:pt-2 w-full justify-center mt-1">
                        <span>ID: {matchResult.userId}</span>
                        <span>STATUS: <span className="text-emerald-400">AUTHORIZED</span></span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-3 sm:gap-4 opacity-20">
                    {isVerifying ? <Loader2 size={60} strokeWidth={1} className="text-[#00ffff] animate-spin" /> : <Search size={60} strokeWidth={1} className="text-[#00ffff] animate-pulse" />}
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-[#00ffff] text-center">{isVerifying ? 'Scanning...' : 'Awaiting_Verification'}</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {isCapturing && <div className="absolute inset-x-0 h-[2px] bg-[#00ffff] shadow-[0_0_15px_#00ffff] animate-biometric-scan z-50" />}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER ENROLLMENT TAB ---
  return (
    <div className="flex-1 p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 overflow-y-auto custom-scrollbar text-left font-mono relative">
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className={`fixed top-12 right-12 z-[9999] flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 border-2 shadow-2xl backdrop-blur-md rounded-sm ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'}`}>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })}><X size={12} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-[320px] sm:h-[300px] py-2 sm:py-4 flex flex-col lg:flex-row gap-4 sm:gap-6 overflow-hidden shrink-0 font-mono">

        <div className="flex-1 border-2 border-[#00ffff]/20 bg-zinc-950/80 relative rounded-sm text-left shadow-lg flex flex-col">
          <div className="absolute -top-[10px] sm:-top-[12px] left-3 sm:left-5 bg-white text-black px-2 sm:px-3 py-0.5 text-[11px] sm:text-[14px] font-black uppercase tracking-widest z-[50] whitespace-nowrap">Registrasi_Data_User</div>
          <div className="absolute -top-[13px] sm:-top-[15px] right-3 sm:right-5 z-[60]">
             <button onClick={async () => {
                const endpoint = !isConnected ? '/api/fingerprint/opendevice' : '/api/fingerprint/closedevice';
                const res = await handleAction(endpoint);
                if (res.success) setIsConnected(!isConnected);
              }} className={`px-2 sm:px-3 py-0.5 sm:py-1 border-2 text-[9px] sm:text-[11px] font-black uppercase transition-all flex items-center gap-1 sm:gap-2 shadow-lg ${isConnected ? 'bg-rose-500 border-rose-500 text-white' : 'bg-[#00ffff] border-[#00ffff] text-black hover:bg-white'}`}><Power size={10} /> <span className="hidden xs:inline">{isConnected ? 'Disconnect' : 'Connect Device'}</span><span className="xs:hidden">{isConnected ? 'Off' : 'On'}</span></button>
          </div>
          
          <div className="flex-1 p-4 sm:p-5 pt-6 sm:pt-8 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-[11px] sm:text-[14px] text-[#00ffff]/60 font-black uppercase tracking-widest ml-1 flex items-center gap-1"><IdCard size={9}/> User ID / NIK</label>
                <input disabled={isDataSaved} value={nik} onChange={(e) => setNik(e.target.value)} placeholder="NIK..." className="w-full bg-black/40 border-2 border-[#00ffff]/10 focus:border-[#00ffff] text-[11px] sm:text-[14px] p-2 text-[#00ffff] outline-none rounded-sm uppercase font-mono shadow-inner" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] sm:text-[14px] text-[#00ffff]/60 font-black uppercase tracking-widest ml-1 flex items-center gap-1"><User size={9}/> Full Name</label>
                <input disabled={isDataSaved} value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="NAME..." className="w-full bg-black/40 border-2 border-[#00ffff]/10 focus:border-[#00ffff] text-[11px] sm:text-[14px] p-2 text-white outline-none rounded-sm uppercase font-mono shadow-inner" />
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-1">
                <label className="text-[11px] sm:text-[14px] text-[#00ffff]/60 font-black uppercase tracking-widest ml-1 flex items-center gap-1"><MapPin size={9}/> Address</label>
                <input disabled={isDataSaved} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ADDRESS..." className="w-full bg-black/40 border-2 border-[#00ffff]/10 focus:border-[#00ffff] text-[11px] sm:text-[14px] p-2 text-zinc-400 outline-none rounded-sm uppercase font-mono shadow-inner" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button onClick={handleSaveUserData} disabled={isDataSaved || isLoading} className={`flex-1 py-2 sm:py-3 border-2 font-black text-[11px] sm:text-[14px] uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-1 sm:gap-2 ${!isDataSaved ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>{isLoading ? <Loader2 size={11} className="animate-spin"/> : isDataSaved ? <Lock size={11}/> : <Send size={11}/>} <span className="hidden xs:inline">{isDataSaved ? "DATA_TERKUNCI" : "Simpan Data User"}</span><span className="xs:hidden">{isDataSaved ? "LOCKED" : "SAVE"}</span></button>
              {isDataSaved && (
                <>
                  <button onClick={() => loadFingerprintImagesFromDb(nik)} disabled={isLoadingDbImages} className="px-3 sm:px-5 py-2 sm:py-3 border-2 border-[#00ffff]/30 text-[#00ffff] text-[9px] sm:text-[11px] font-black hover:bg-[#00ffff] hover:text-black uppercase transition-all rounded-sm"><RefreshCw size={11} className={isLoadingDbImages ? "animate-spin" : ""}/></button>
                  <button onClick={() => { setIsDataSaved(false); setEnrollmentComplete(false); setFingerCaptures(new Array(10).fill(null)); processedFingersRef.current.clear(); }} className="px-3 sm:px-5 py-2 sm:py-3 border-2 border-[#ff00ff]/30 text-[#ff00ff] text-[9px] sm:text-[11px] font-black hover:bg-[#ff00ff] hover:text-white uppercase transition-all rounded-sm"><Unlock size={11} /></button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[700px] xl:w-[650px] h-full border-2 border-[#00ffff]/30 bg-zinc-900/60 relative rounded-sm flex flex-col justify-between shadow-xl min-h-[220px]">
          <div className="absolute -top-[10px] sm:-top-[12px] left-3 sm:left-5 bg-white text-black px-2 sm:px-3 py-0.5 text-[11px] sm:text-[14px] font-black font-mono uppercase tracking-widest z-[50] whitespace-nowrap">Capture Control</div>
          
          <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-5 mt-2 sm:mt-3 flex-1">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-[10px] sm:text-[12px] text-[#00ffff] font-black uppercase tracking-[0.2em] block flex items-center gap-2">
                <Target size={10}/> Pilih Mode Capture
              </label>
              
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
                {CAPTURE_MODES.map((m) => (
                  <button key={m.id} disabled={isEnrolling} onClick={() => setMode(m.id)} className={`relative flex flex-col items-center justify-center p-0.5 border-2 rounded-sm transition-all group overflow-hidden ${mode === m.id ? 'bg-[#00ffff] border-[#00ffff] text-black shadow-[0_0_15px_#00ffff66]' : 'bg-black/60 border-white/10 text-[#00ffff]/40 hover:border-[#00ffff]/40 hover:text-[#00ffff]'}`}>
                    <span className="text-[12px] sm:text-[16px] font-black z-10">{m.label}</span>
                    <span className={`text-[8px] sm:text-[10px] md:text-[12px] uppercase z-10 font-bold hidden sm:inline ${mode === m.id ? 'text-black/60' : 'opacity-40'}`}>{m.detail}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="text-[10px] sm:text-[12px] text-[#00ffff] font-black uppercase tracking-[0.2em] block flex items-center gap-2">
                <Target size={10}/> Jalankan Device & Enrollment
            </label>

            <div className="flex flex-col gap-2 mt-auto font-mono">
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={async () => {
                  const res = await handleAction('/api/fingerprint/startcapture', { mode: parseInt(mode), nMissingFinger: 0 });
                  if (res.success) setIsCapturing(true);
                }} disabled={!isConnected || isCapturing} className={`flex-1 py-1.5 sm:py-2 border-2 font-black uppercase text-[14px] sm:text-[18px] transition-all flex items-center justify-center gap-1 sm:gap-2 rounded-sm ${isConnected && !isCapturing ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-inner' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}><Play size={11} fill="currentColor" /> Preview</button>
                <button onClick={async () => {
                  const res = await handleAction('/api/fingerprint/stopcapture');
                  if (res.success !== false) setIsCapturing(false);
                }} disabled={!isCapturing} className={`flex-1 py-1.5 sm:py-2 border-2 font-black uppercase text-[14px] sm:text-[18px] transition-all flex items-center justify-center gap-1 sm:gap-2 rounded-sm ${isCapturing ? 'bg-zinc-950 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}><CircleStop size={11} fill="currentColor" /> Stop</button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={handleEnroll} disabled={!isConnected || isEnrolling || !isDataSaved || enrollmentComplete} className={`flex-1 py-1.5 sm:py-2 border-1 font-black text-[14px] sm:text-[18px] uppercase transition-all rounded-sm flex items-center justify-center gap-1 sm:gap-2 ${isConnected && isDataSaved && !isEnrolling && !enrollmentComplete ? 'bg-[#00ffff] border-[#00ffff] text-black hover:bg-white shadow-lg' : 'bg-zinc-900 border-zinc-700 text-zinc-600'}`}><ShieldCheck size={12} /> {enrollmentComplete ? "SELESAI" : "Start Enroll"}</button>
                <button onClick={handleResetForm} className="flex-1 py-1.5 sm:py-2 border-2 border-red-500/30 text-red-500 text-[14px] sm:text-[18px] font-black hover:bg-red-500 hover:text-white uppercase transition-all rounded-sm flex items-center justify-center gap-1 sm:gap-2"><Trash2 size={11} /> Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-2 border-[#00ffff]/20 bg-black/40 p-3 sm:p-5 rounded-sm shadow-2xl shrink-0 flex-1 min-h-0 flex flex-col font-mono">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b border-[#00ffff]/10 pb-2 sm:pb-3 mb-3 sm:mb-4">
          <Fingerprint size={14} className="text-[#00ffff]" />
          <span className="text-[11px] sm:text-[14px] font-black text-[#00ffff] uppercase tracking-[0.2em] sm:tracking-[0.4em]">Finger_Extraction_Visual_Buffer</span>
          <div className="ml-auto flex items-center gap-2">
            <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isCapturing ? 'bg-[#00ffff] animate-pulse shadow-[0_0_8px_#00ffff]' : 'bg-zinc-800'}`} />
            <span className="text-[7px] sm:text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{isCapturing ? 'Live_Feed' : 'Standby'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-5 md:gap-10 flex-1 overflow-y-auto custom-scrollbar p-1">
          {fingerCaptures.map((img, idx) => {
            const expectedIndices = getExpectedFingerIndices(mode);
            const isExpected = expectedIndices.includes(idx);
            const isFromDb = dbFingerImages[idx] !== null;
            const displayImg = img || dbFingerImages[idx];
            
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={`relative w-full aspect-[3/4] border-2 ${isExpected ? 'border-[#00ffff]/40 shadow-[0_0_10px_#00ffff11]' : 'border-white/5'} ${isFromDb ? 'bg-emerald-950/20' : 'bg-zinc-950'} rounded-sm overflow-hidden flex items-center justify-center transition-all`}>
                  <AnimatePresence>
                    {displayImg ? (
                      <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={displayImg} className="w-full h-full object-contain p-1 filter brightness-110 contrast-125" alt="Finger" />
                    ) : (
                      <Fingerprint size={24} className="opacity-[0.03]" />
                    )}
                  </AnimatePresence>
                  {isCapturing && !displayImg && isExpected && <div className="absolute inset-x-0 h-[2px] bg-[#00ffff]/60 shadow-[0_0_10px_#00ffff] animate-pixel-scan z-20" />}
                  <div className={`absolute top-0 left-0 bg-black/80 px-1 py-0.5 text-[6px] font-black ${displayImg ? 'text-emerald-400' : 'text-[#00ffff]/30'} border-r border-b border-[#00ffff]/10 uppercase tracking-tighter`}>{getFingerName(idx).substring(0, 3)}</div>
                  {isFromDb && <div className="absolute bottom-0 right-0 bg-emerald-500/80 px-1 py-0.5 text-[5px] font-black text-white uppercase tracking-tighter">DB</div>}
                </div>
                <span className={`text-[6px] sm:text-[7px] md:text-[8px] font-black uppercase tracking-widest ${isExpected ? 'text-[#00ffff]/80' : 'text-zinc-600'}`}>{idx < 5 ? `L_${idx + 1}` : `R_${idx - 4}`}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes biometric-scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-biometric-scan { animation: biometric-scan 2.5s linear infinite; }
        @keyframes pixel-scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-pixel-scan { animation: pixel-scan 2.2s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.1); border-radius: 10px; }
        
        /* Extra small breakpoint untuk responsivitas */
        @media (min-width: 480px) {
          .xs\\:inline { display: inline !important; }
          .xs\\:hidden { display: none !important; }
          .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 479px) {
          .xs\\:inline { display: none !important; }
          .xs\\:hidden { display: inline !important; }
          .xs\\:grid-cols-3 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
      `}</style>
    </div>
  );
};

export default FingerprintModule;