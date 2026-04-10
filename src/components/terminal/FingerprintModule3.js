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
  RefreshCw
} from 'lucide-react';

/**
 * FingerprintModule
 * Complete fingerprint enrollment and verification module
 * Uses /api/fingerprint/verify endpoint for identification
 */
const FingerprintModule = ({ data, activeTab }) => {
  // State Data User
  const [nik, setNik] = useState("");
  const [userName, setUserName] = useState("");
  const [address, setAddress] = useState("");
  const [isDataSaved, setIsDataSaved] = useState(false); 
  
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
  
  // State untuk verification
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResponse, setVerifyResponse] = useState(null);

  const [mode, setMode] = useState("3"); 

  // Konfigurasi API
  const API_FINGER_URL = "http://localhost:7180";
  const API_REG_URL = "http://localhost:7180";
  
  const processedFingersRef = useRef(new Set());
  const enrollmentStartedRef = useRef(false);
  const capturedFingersRef = useRef({});

  // Helper: Dapatkan target jumlah jari berdasarkan mode
  const getRequiredCount = (m) => {
    const val = parseInt(m);
    if (val === 0 || val === 1) return 4;  // LeftFinger atau RightFinger: 4 jari
    if (val === 2) return 2;               // BothThumb: 2 jari
    if (val === 3 || val === 4) return 1;  // OneFinger atau Roll: 1 jari
    if (val === 5) return 10;              // TenFinger: 10 jari
    return 1;
  };

  // Helper: Dapatkan finger indices yang diharapkan berdasarkan mode
  const getExpectedFingerIndices = (m) => {
    const val = parseInt(m);
    if (val === 0) return [5, 6, 7, 8];      // LeftFinger: jari 5-8
    if (val === 1) return [0, 1, 2, 3];      // RightFinger: jari 0-3
    if (val === 2) return [0, 4];            // BothThumb: jari 0 dan 4
    if (val === 3) return [0];               // OneFinger: jari 0
    if (val === 4) return [0];               // Roll: jari 0
    if (val === 5) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // TenFinger: semua jari
    return [0];
  };

  // Helper: Get finger name based on index
  const getFingerName = (index) => {
    const fingerNames = {
      0: "Right Thumb",
      1: "Right Index",
      2: "Right Middle",
      3: "Right Ring",
      4: "Right Little",
      5: "Left Thumb",
      6: "Left Index",
      7: "Left Middle",
      8: "Left Ring",
      9: "Left Little"
    };
    return fingerNames[index] || `Finger ${index + 1}`;
  };

  const showToast = (message, type = "success") => {
    const cleanMsg = message ? message.replace(/\0/g, '').trim() : "Terjadi kesalahan sistem";
    setToast({ show: true, message: cleanMsg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 5000);
  };

  // Function to load fingerprint images from database
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
      console.log("Loaded fingerprint images from DB:", data);
      
      const mappedImages = new Array(10).fill(null);
      data.forEach((item, index) => {
        let fingerIdx = item.fingerIndex || item.FingerIndex || index;
        if (fingerIdx >= 0 && fingerIdx < 10) {
          const imageBase64 = `data:image/jpeg;base64,${item.Image}`;
          mappedImages[fingerIdx] = imageBase64;
        }
      });
      
      setDbFingerImages(mappedImages);
      
      setFingerCaptures(prev => {
        const newCaptures = [...prev];
        mappedImages.forEach((img, idx) => {
          if (img) {
            newCaptures[idx] = img;
          }
        });
        return newCaptures;
      });
      
      if (data.length > 0) {
        showToast(`Berhasil memuat ${data.length} data sidik jari dari database`, "success");
      }
      
    } catch (error) {
      console.error("Error loading fingerprint images:", error);
      showToast("Gagal memuat data sidik jari", "error");
    } finally {
      setIsLoadingDbImages(false);
    }
  };

  // --- 1. INITIAL HARDWARE CHECK ---
  useEffect(() => {
    const initDevice = async () => {
      try {
        const res = await handleAction('/api/fingerprint/opendevice');
        if (res.success === true || res.message?.toLowerCase().includes("already")) {
          setIsConnected(true);
        }
      } catch (err) {
        console.warn("[DEBUG_INIT] Gagal inisialisasi sensor biometrik.");
      }
    };
    initDevice();
  }, []);

  // Load fingerprint images when data is saved
  useEffect(() => {
    if (isDataSaved && nik) {
      loadFingerprintImagesFromDb(nik);
    }
  }, [isDataSaved, nik]);

  // Reload when enrollment completes
  useEffect(() => {
    if (enrollmentComplete && nik) {
      setTimeout(() => {
        loadFingerprintImagesFromDb(nik);
      }, 1500);
    }
  }, [enrollmentComplete, nik]);

  // --- 2. LIVE PREVIEW POLLING ---
  useEffect(() => {
    let intervalId;
    const fetchPreview = async () => {
      try {
        const res = await fetch(`${API_FINGER_URL}/api/fingerprint/preview`);
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: reader.result }));
          };
          reader.readAsDataURL(blob);
        }
      } catch (err) {}
    };

    if (isCapturing) {
      intervalId = setInterval(fetchPreview, 500);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
      }
    };
  }, [isCapturing]);

  // --- 3. ENROLLMENT DATA SYNC ---
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
                if (typeof rawIdx === 'string' && rawIdx.includes('-')) {
                  rawIdx = rawIdx.split('-').pop();
                }
                const idx = parseInt(rawIdx) - 1;
                const b64 = f.image || f.Image || f.Base64;

                if (expectedIndices.includes(idx) && b64 && !processedFingersRef.current.has(idx)) {
                  next[idx] = b64.startsWith('data:image') ? b64 : `data:image/bmp;base64,${b64}`;
                  processedFingersRef.current.add(idx);
                  hasNew = true;
                  
                  console.log(`[ENROLL] Captured finger: ${getFingerName(idx)} (${processedFingersRef.current.size}/${requiredCount})`);
                  showToast(`Berhasil menangkap ${getFingerName(idx)}`, "success");
                  
                  if (processedFingersRef.current.size >= requiredCount && !enrollmentComplete) {
                    setEnrollmentComplete(true);
                    showToast(`Pendaftaran ${requiredCount} Jari Selesai!`, "success");
                    
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
      } catch (err) {
        console.error("[ENROLL] Error syncing fingers:", err);
      }
    };

    pollId = setInterval(syncFingers, 800);
    return () => clearInterval(pollId);
  }, [isEnrolling, mode, enrollmentComplete]);

  // --- 4. ACTION HANDLER ---
  const handleAction = async (endpoint, body = null) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_FINGER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
        mode: 'cors'
      });
      const result = await response.json().catch(() => ({ success: response.ok }));
      return { ...result, message: result.message ? result.message.replace(/\0/g, '').trim() : "" };
    } catch (error) {
      return { success: false, message: "Koneksi terputus." };
    } finally { 
      setIsLoading(false); 
    }
  };

  // =========================================================================
  // REGISTRASI DATA USER
  // =========================================================================
  const handleSaveUserData = async (e) => {
    if (e) e.preventDefault();

    const userId = nik.trim();
    const fullName = userName.trim();
    const userAddress = address.trim();

    if (!userId || !fullName || !userAddress) {
      showToast("Lengkapi semua field sebelum melanjutkan.", "error");
      return;
    }

    setIsLoading(true);
    
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("Name", fullName);
    formData.append("Address", userAddress);

    try {
      const response = await fetch(`${API_REG_URL}/api/face/registration`, {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Registrasi Berhasil:", result);
        
        localStorage.setItem("registrationData", JSON.stringify({
          userId,
          fullName,
          address: userAddress
        }));

        setIsDataSaved(true);
        showToast("Data User Berhasil Terdaftar. Sensor Siap.", "success");
      } else {
        showToast("Gagal Registrasi: " + (result.message || "Unknown error"), "error");
      }
    } catch (error) {
      console.error("Server Error:", error);
      showToast("Kesalahan Jaringan: Server Registrasi Offline", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isDataSaved) return showToast("Simpan data user dahulu", "error");
    
    if (enrollmentStartedRef.current) {
      showToast("Proses enrollment sedang berjalan", "warning");
      return;
    }
    
    const target = getRequiredCount(mode);
    processedFingersRef.current.clear();
    setFingerCaptures(new Array(10).fill(null));
    setEnrollmentComplete(false);
    enrollmentStartedRef.current = true;
    
    if (isCapturing) {
      await handleAction('/api/fingerprint/stopcapture');
      setIsCapturing(false);
      await new Promise(r => setTimeout(r, 1000));
    }
    
    const res = await handleAction('/api/fingerprint/startenroll', {
      UserId: parseInt(nik) || 0,
      missingFinger: 0,
      captureType: parseInt(mode),
      featureFormat: 0
    });
    
    if (res.success) {
      setIsEnrolling(true);
      setIsCapturing(true);
      showToast(`Letakkan ${target} jari pada sensor secara bergantian`, "success");
    } else {
      showToast(res.message || "Pendaftaran Biometrik Gagal", "error");
      enrollmentStartedRef.current = false;
    }
  };

  const handleResetForm = () => {
    setNik("");
    setUserName("");
    setAddress("");
    setIsDataSaved(false);
    setIsEnrolling(false);
    setEnrollmentComplete(false);
    setFingerCaptures(new Array(10).fill(null));
    setDbFingerImages([]);
    setMatchResult(null);
    setVerifyResponse(null);
    processedFingersRef.current.clear();
    enrollmentStartedRef.current = false;
    capturedFingersRef.current = {};
    showToast("Sesi Direset", "success");
  };

  const handleRefreshDbImages = async () => {
    if (nik) {
      await loadFingerprintImagesFromDb(nik);
    } else {
      showToast("User ID tidak ditemukan", "error");
    }
  };

  // =========================================================================
  // VERIFICATION - Menggunakan endpoint /api/fingerprint/verify
  // =========================================================================
  const handleVerifyLogic = async () => {
    if (!isConnected) {
      showToast("Sensor tidak terhubung. Buka device terlebih dahulu.", "error");
      return;
    }
    
    setIsVerifying(true);
    setMatchResult(null);
    setVerifyResponse(null);
    
    // Clear captured fingers tracking
    capturedFingersRef.current = {};
    
    // Clear finger container in UI (will be handled by re-render)
    setFingerCaptures(prev => {
      const newCaptures = [...prev];
      // Only clear non-DB images
      for (let i = 0; i < newCaptures.length; i++) {
        if (!dbFingerImages[i]) {
          newCaptures[i] = null;
        }
      }
      return newCaptures;
    });
    
    const modeValue = parseInt(mode);
    
    showToast("Memverifikasi sidik jari... Tempelkan jari pada sensor", "info");
    
    try {
      console.log(`[VERIFY] Sending verify request with mode: ${modeValue}`);
      
      const res = await fetch(`${API_FINGER_URL}/api/fingerprint/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captureType: modeValue,
          missingFinger: 0,
          featureFormat: 0
        })
      });
      
      const json = await res.json();
      console.log("[VERIFY] Response:", json);
      
      // Update captured fingers
      if (json.fingers && Array.isArray(json.fingers)) {
        setFingerCaptures(prev => {
          const newCaptures = [...prev];
          json.fingers.forEach(f => {
            let idx = (f.fingerIndex || 0) - 1;
            if (idx >= 0 && idx < 10 && f.image) {
              newCaptures[idx] = `data:image/bmp;base64,${f.image}`;
              capturedFingersRef.current[idx] = true;
            }
          });
          return newCaptures;
        });
      }
      
      // Check if verification was successful
      if (res.ok && json.UserID) {
        const result = {
          userId: json.UserID,
          name: json.Name || "Terdaftar",
          address: json.Address || "SECURE_ZONE",
          attributes: "AUTHORIZED",
          image: json.Image
        };
        
        setMatchResult(result);
        setVerifyResponse(json);
        
        if (json.Image) {
          setCapturedBuffer(`data:image/bmp;base64,${json.Image}`);
        }
        
        showToast(`Verifikasi Berhasil: ${result.name || result.userId}`, "success");
        
        // Dispatch event for parent components
        window.dispatchEvent(new CustomEvent('fingerprint:verified', { detail: result }));
        
      } else {
        // Verification failed
        setMatchResult(null);
        setVerifyResponse({ error: true, message: json.message || "Identitas Tidak Dikenali" });
        showToast(json.message || "Identitas Tidak Dikenali", "error");
        
        window.dispatchEvent(new CustomEvent('fingerprint:not-verified'));
      }
      
    } catch (error) {
      console.error("[VERIFY] Error:", error);
      setVerifyResponse({ error: true, message: "Server Offline atau Koneksi Gagal" });
      showToast("Server Offline atau Koneksi Gagal", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // --- RENDER VERIFICATION TAB ---
  if (activeTab === 'verification') {
    return (
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden text-left font-mono bg-black/40 relative">
        <AnimatePresence>
          {toast.show && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: 20 }} 
              animate={{ opacity: 1, y: 0, x: 0 }} 
              exit={{ opacity: 0, x: 50 }} 
              className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-6 py-3 border-2 shadow-2xl backdrop-blur-md rounded-sm ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'}`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center justify-between border-b border-[#00ffff]/20 pb-3">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              Verification <span className="text-[#00ffff]">Personal Finger</span>
            </h1>
            <span className="text-[7px] text-[#00ffff]/50 uppercase tracking-[0.4em]">Biometric_Vault_Protocol_v.4.0</span>
          </div>
          <button 
            onClick={async () => {
              const willConnect = !isConnected;
              const endpoint = willConnect ? '/api/fingerprint/opendevice' : '/api/fingerprint/closedevice';
              const res = await handleAction(endpoint);
              if (res.success === true || res.message?.toLowerCase().includes("already")) {
                setIsConnected(willConnect);
                showToast(willConnect ? "Device Terhubung" : "Device Terputus", willConnect ? "success" : "error");
              }
            }} 
            className={`p-2 border transition-all rounded-sm ${isConnected ? 'border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff] hover:text-black'}`}
          >
            <Power size={14} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-950/40 p-3 border border-white/5 rounded-sm shrink-0">
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)} 
            className="bg-black border border-[#00ffff]/20 text-[#00ffff] text-[10px] p-2 outline-none focus:border-[#00ffff] transition-all rounded-sm font-mono shadow-inner"
          >
            <option value="0">LEFT_HAND (4 Jari)</option>
            <option value="1">RIGHT_HAND (4 Jari)</option>
            <option value="2">BOTH_THUMBS (2 Jari)</option>
            <option value="3">SINGLE_FINGER (1 Jari)</option>
            <option value="4">ROLL (1 Jari)</option>
          </select>
          
          <div className="flex items-center gap-2 flex-1">
            <button 
              onClick={async () => {
                const res = await handleAction('/api/fingerprint/startcapture', { mode: parseInt(mode), nMissingFinger: 0 });
                if (res.success || res.message?.toLowerCase().includes("already")) {
                  setIsCapturing(true);
                  showToast("Capture dimulai", "success");
                }
              }} 
              disabled={!isConnected || isCapturing} 
              className={`flex-1 py-3 border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isConnected && !isCapturing ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
            >
              <Play size={12} fill="currentColor" /> Start Capture
            </button>
            
            <button 
              onClick={async () => {
                const res = await handleAction('/api/fingerprint/stopcapture');
                if (res.success !== false) {
                  setIsCapturing(false);
                  showToast("Capture dihentikan", "info");
                }
              }} 
              disabled={!isCapturing} 
              className={`flex-1 py-3 border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isCapturing ? 'bg-[#ff00ff]/10 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
            >
              <CircleStop size={12} fill="currentColor" /> Stop
            </button>
            
            <button 
              onClick={handleVerifyLogic} 
              disabled={!isConnected || isLoading || isVerifying} 
              className={`flex-[1.5] py-3 border font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isConnected ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-700' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'}`}
            >
              {isVerifying ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />} 
              {isVerifying ? "Memverifikasi..." : "Verify Finger"}
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center min-h-0 py-4 relative">
          <div className="relative aspect-square h-full max-h-[420px] bg-zinc-950 border border-[#00ffff]/20 rounded-sm shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white text-[10px]">
              <AnimatePresence mode="wait">
                {matchResult ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 1.1 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="w-full h-full flex flex-col items-center justify-center relative"
                  >
                    <div className="w-40 h-56 border border-[#00ffff]/20 bg-black/60 p-2 rounded-sm shadow-2xl mb-2 relative">
                      {capturedBuffer && (
                        <img 
                          src={capturedBuffer} 
                          className="w-full h-full object-contain mix-blend-screen brightness-125" 
                          alt="Result" 
                        />
                      )}
                      <div className="absolute -top-4 -left-4 flex items-center gap-1 text-[7px] text-[#00ffff] font-bold bg-black/80 px-2 py-0.5 border border-[#00ffff]/20 uppercase tracking-tighter">
                        VERIFIED
                      </div>
                    </div>
                    <div className="w-full flex flex-col items-center gap-1">
                      <h2 className="text-lg font-black text-white uppercase tracking-tight">{matchResult.name}</h2>
                      <div className="grid grid-cols-3 gap-4 mt-2 w-full px-4 text-center border-t border-white/5 pt-2">
                        <div>
                          <span className="text-[6px] text-[#00ffff]/40 block uppercase tracking-tighter">ID</span>
                          <span className="text-[9px] text-[#00ffff] font-bold">{matchResult.userId}</span>
                        </div>
                        <div>
                          <span className="text-[6px] text-[#00ffff]/40 block uppercase tracking-tighter">LVL</span>
                          <span className="text-[9px] text-white font-bold">{matchResult.attributes}</span>
                        </div>
                        <div>
                          <span className="text-[6px] text-[#00ffff]/40 block uppercase tracking-tighter">STATUS</span>
                          <span className="text-[9px] text-emerald-400 font-bold">MATCH</span>
                        </div>
                      </div>
                      {matchResult.address && matchResult.address !== "SECURE_ZONE" && (
                        <div className="mt-2 text-[8px] text-[#00ffff]/60">
                          <MapPin size={10} className="inline mr-1" />
                          {matchResult.address}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    {isVerifying ? (
                      <>
                        <Loader2 size={100} strokeWidth={1} className="text-[#00ffff] animate-spin" />
                        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#00ffff]">Verifying...</span>
                        <span className="text-[7px] text-[#00ffff]/40">Tempelkan jari pada sensor</span>
                      </>
                    ) : (
                      <>
                        <Search size={100} strokeWidth={1} className="text-[#00ffff] animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#00ffff]">Awaiting_Verification</span>
                        <span className="text-[7px] text-[#00ffff]/40">Klik "Verify Finger" untuk memulai</span>
                      </>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
            {isCapturing && <div className="absolute inset-x-0 h-[2px] bg-[#00ffff] shadow-[0_0_15px_#00ffff] animate-biometric-scan z-50" />}
          </div>
        </div>
        
        <style jsx global>{`
          @keyframes biometric-scan { 
            0% { top: 0; opacity: 0; } 
            10% { opacity: 1; } 
            90% { opacity: 1; } 
            100% { top: 100%; opacity: 0; } 
          }
          .animate-biometric-scan { animation: biometric-scan 2.5s linear infinite; }
        `}</style>
      </div>
    );
  }

  // --- RENDER ENROLLMENT TAB ---
  return (
    <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar text-left font-mono relative">
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 50 }} 
            className={`fixed top-12 right-12 z-[9999] flex items-center gap-3 px-6 py-3 border-2 shadow-2xl backdrop-blur-md rounded-sm ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-emerald-500/20' : 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-rose-500/20'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <div className="flex flex-col text-left">
              <span className="text-[8px] uppercase opacity-60 font-black tracking-widest">Feedback_Sistem</span>
              <span className="text-[10px] font-black uppercase leading-tight">{toast.message}</span>
            </div>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch shrink-0">
        <div className="lg:col-span-4 border-2 border-[#00ffff]/30 bg-zinc-900/60 relative rounded-sm flex flex-col justify-between shadow-xl min-h-[160px]">
          <div className="absolute -top-[12px] left-5 bg-white text-black px-3 py-0.5 text-[9px] font-black uppercase tracking-widest z-[50]">
            Capture Control
          </div>
          <div className="absolute -top-[15px] right-5 z-[60]">
            <button 
              onClick={async () => {
                const res = await handleAction(isConnected ? '/api/fingerprint/closedevice' : '/api/fingerprint/opendevice');
                if (res.success || res.message?.toLowerCase().includes("already")) {
                  setIsConnected(!isConnected);
                  showToast(!isConnected ? "Device Terhubung" : "Device Terputus", !isConnected ? "success" : "error");
                }
              }} 
              className={`px-3 py-1.5 border-2 text-[8px] font-black uppercase transition-all flex items-center gap-2 shadow-lg ${isConnected ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600' : 'bg-[#00ffff] border-[#00ffff] text-black hover:bg-white'}`}
            >
              <Power size={10} /> {isConnected ? 'Disconnect' : 'Connect Device'}
            </button>
          </div>
          <div className="flex flex-col gap-4 p-5 mt-2">
            <div className="space-y-1.5">
              <label className="text-[9px] text-[#00ffff] font-black uppercase tracking-[0.2em] block ml-1 flex items-center gap-2">
                <Target size={10}/> Mode Capture
              </label>
              <div className="relative group">
                <select 
                  disabled={isEnrolling} 
                  value={mode} 
                  onChange={(e) => setMode(e.target.value)} 
                  className="w-full bg-black/60 border-2 border-[#00ffff]/20 group-hover:border-[#00ffff]/50 text-[11px] p-2 text-[#00ffff] outline-none transition-all rounded-sm font-mono appearance-none shadow-inner"
                >
                  <option value="0">LeftFinger (4 Jari Kiri)</option>
                  <option value="1">RightFinger (4 Jari Kanan)</option>
                  <option value="2">BothThumb (2 Ibu Jari)</option>
                  <option value="3">OneFinger (1 Jari)</option>
                  <option value="4">Roll (1 Jari - Roll)</option>
                  <option value="5">TenFinger (10 Jari)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#00ffff]/40 text-[10px]">▼</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    const res = await handleAction('/api/fingerprint/startcapture', { mode: parseInt(mode), nMissingFinger: 0 });
                    if (res.success || res.message?.toLowerCase().includes("already")) {
                      setIsCapturing(true);
                      showToast("Preview capture dimulai", "success");
                    }
                  }} 
                  disabled={!isConnected || isCapturing} 
                  className={`flex-1 py-2 border-2 font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 rounded-sm ${isConnected && !isCapturing ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_10px_rgba(0,255,255,0.1)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                >
                  <Play size={12} fill="currentColor" /> Preview
                </button>
                <button 
                  onClick={async () => {
                    const res = await handleAction('/api/fingerprint/stopcapture');
                    if (res.success !== false) {
                      setIsCapturing(false);
                      showToast("Preview dihentikan", "info");
                    }
                  }} 
                  disabled={!isCapturing} 
                  className={`flex-1 py-2 border-2 font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 rounded-sm ${isCapturing ? 'bg-zinc-950 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-white shadow-[0_0_10px_rgba(255,0,255,0.1)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                >
                  <CircleStop size={12} fill="currentColor" /> Stop
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleEnroll} 
                  disabled={!isConnected || isEnrolling || !isDataSaved || enrollmentComplete} 
                  className={`flex-[2] py-2.5 border-2 font-black text-[10px] uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 ${isConnected && isDataSaved && !isEnrolling && !enrollmentComplete ? 'bg-[#00ffff] border-[#00ffff] text-black hover:bg-white shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed'}`}
                >
                  <ShieldCheck size={14} /> {enrollmentComplete ? "ENROLLMENT SELESAI" : "Start Enroll"}
                </button>
                <button 
                  onClick={handleResetForm} 
                  className="flex-1 py-2.5 border-2 border-red-500/30 text-red-500 text-[10px] font-black hover:bg-red-500 hover:text-white uppercase transition-all rounded-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={12} /> Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 border-2 border-[#00ffff]/20 bg-zinc-950/80 relative rounded-sm text-left shadow-lg flex flex-col min-h-[160px]">
          <div className="absolute -top-[12px] left-5 bg-white text-black px-3 py-0.5 text-[9px] font-black uppercase tracking-widest z-[50]">
            Registrasi_Data_User
          </div>
          <div className="flex-1 p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
              {isDataSaved ? <Lock size={120} className="text-[#00ffff]" /> : <User size={120} className="text-[#00ffff]" />}
            </div>
            <div className="grid grid-cols-3 gap-4 relative z-10">
              <div className="space-y-1">
                <label className="text-[8px] text-[#00ffff]/60 font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                  <IdCard size={10}/> User ID / NIK
                </label>
                <input 
                  disabled={isDataSaved || isEnrolling} 
                  value={nik} 
                  onChange={(e) => setNik(e.target.value)} 
                  placeholder="NIK..." 
                  className="w-full bg-black/40 border-2 border-[#00ffff]/10 focus:border-[#00ffff] text-[11px] p-2 text-[#00ffff] outline-none rounded-sm uppercase font-mono tracking-widest shadow-inner placeholder:opacity-20" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-[#00ffff]/60 font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                  <User size={10}/> Full Name
                </label>
                <input 
                  disabled={isDataSaved || isEnrolling} 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  placeholder="NAME..." 
                  className="w-full bg-black/40 border-2 border-[#00ffff]/10 focus:border-[#00ffff] text-[11px] p-2 text-white outline-none rounded-sm font-mono tracking-widest shadow-inner placeholder:opacity-20 uppercase" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-[#00ffff]/60 font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                  <MapPin size={10}/> Address
                </label>
                <input 
                  disabled={isDataSaved || isEnrolling} 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  placeholder="ADDRESS..." 
                  className="w-full bg-black/40 border-2 border-[#00ffff]/10 focus:border-[#00ffff] text-[11px] p-2 text-zinc-400 outline-none rounded-sm font-mono tracking-widest shadow-inner placeholder:opacity-20" 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleSaveUserData} 
                disabled={isDataSaved || isEnrolling || isLoading} 
                className={`flex-1 py-2.5 border-2 font-black text-[10px] uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 ${!isDataSaved && !isLoading ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
              >
                {isLoading ? <Loader2 size={12} className="animate-spin"/> : isDataSaved ? <Lock size={12}/> : <Send size={12}/>} 
                {isDataSaved ? "DATA_TERKUNCI" : "Simpan Data User"}
              </button>
              {isDataSaved && (
                <>
                  <button 
                    onClick={handleRefreshDbImages} 
                    disabled={isLoadingDbImages} 
                    className="px-5 py-2.5 border-2 border-[#00ffff]/30 text-[#00ffff] text-[10px] font-black hover:bg-[#00ffff] hover:text-black uppercase transition-all rounded-sm flex items-center gap-2"
                  >
                    {isLoadingDbImages ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Refresh
                  </button>
                  <button 
                    onClick={() => {
                      setIsDataSaved(false);
                      setEnrollmentComplete(false);
                      setFingerCaptures(new Array(10).fill(null));
                      processedFingersRef.current.clear();
                    }} 
                    disabled={isEnrolling} 
                    className="px-5 py-2.5 border-2 border-[#ff00ff]/30 text-[#ff00ff] text-[10px] font-black hover:bg-[#ff00ff] hover:text-white uppercase transition-all rounded-sm"
                  >
                    <Unlock size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-2 border-[#00ffff]/20 bg-black/40 p-5 rounded-sm shadow-2xl shrink-0 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-3 border-b border-[#00ffff]/10 pb-3 mb-4">
          <Fingerprint size={16} className="text-[#00ffff]" />
          <span className="text-[11px] font-black text-[#00ffff] uppercase tracking-[0.4em]">Finger_Extraction_Visual_Buffer</span>
          {enrollmentComplete && (
            <div className="ml-auto flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">
                Enrollment Complete
              </span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="h-1 w-20 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: [-80, 80] }} 
                transition={{ repeat: Infinity, duration: 2 }} 
                className="h-full w-1/2 bg-[#00ffff]/30" 
              />
            </div>
            <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">Streaming_Active</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3.5 flex-1">
          {fingerCaptures.map((img, idx) => {
            const expectedIndices = getExpectedFingerIndices(mode);
            const isExpected = expectedIndices.includes(idx);
            const isFromDb = dbFingerImages[idx] !== null && dbFingerImages[idx] !== undefined;
            const displayImg = img || dbFingerImages[idx];
            
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div className={`relative w-full aspect-[3/4] border-2 ${isExpected ? 'border-[#00ffff]/40' : 'border-[#00ffff]/10'} ${isFromDb ? 'bg-emerald-950/30' : 'bg-zinc-950'} rounded-sm overflow-hidden flex items-center justify-center group hover:border-[#00ffff]/60 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]`}>
                  <AnimatePresence>
                    {displayImg ? (
                      <motion.img 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        src={displayImg} 
                        className="w-full h-full object-contain p-1.5 filter brightness-110 contrast-125" 
                        alt={getFingerName(idx)} 
                        key={idx} 
                      />
                    ) : (
                      <div className="flex flex-col items-center opacity-5 group-hover:opacity-15 transition-opacity">
                        <Fingerprint size={36} />
                      </div>
                    )}
                  </AnimatePresence>
                  {isCapturing && !displayImg && isExpected && (
                    <div className="absolute inset-x-0 h-[2px] bg-[#00ffff]/60 shadow-[0_0_12px_#00ffff] animate-pixel-scan z-20" />
                  )}
                  <div className={`absolute top-0 left-0 bg-black/80 px-1.5 py-0.5 text-[7px] font-black ${displayImg ? 'text-emerald-400' : 'text-[#00ffff]/40'} border-r border-b border-[#00ffff]/10 uppercase tracking-tighter`}>
                    {getFingerName(idx).substring(0, 3)}
                  </div>
                  {isFromDb && displayImg && (
                    <div className="absolute bottom-0 right-0 bg-emerald-500/80 px-1 py-0.5 text-[6px] font-black text-white uppercase tracking-tighter">
                      DB
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isExpected ? 'text-[#00ffff]/80' : 'text-zinc-600'}`}>
                    {idx < 5 ? `L_${idx + 1}` : `R_${idx - 4}`}
                  </span>
                  <div className={`w-6 h-[1.5px] ${displayImg ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`} />
                </div>
              </div>
            );
          })}
        </div>
        
        {isEnrolling && (
          <div className="mt-4 pt-3 border-t border-[#00ffff]/10">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-[#00ffff]/60 uppercase tracking-wider">Progress Enrollment</span>
              <span className="text-[10px] text-[#00ffff] font-mono">
                {processedFingersRef.current.size} / {getRequiredCount(mode)} fingers captured
              </span>
            </div>
            <div className="w-full h-1 bg-zinc-800 mt-2 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#00ffff] shadow-[0_0_8px_#00ffff]"
                initial={{ width: 0 }}
                animate={{ width: `${(processedFingersRef.current.size / getRequiredCount(mode)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
        
        {enrollmentComplete && !isEnrolling && (
          <div className="mt-4 pt-3 border-t border-emerald-500/30">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">
                Enrollment Berhasil! Data sidik jari telah tersimpan di database
              </span>
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes pixel-scan { 
          0% { top: 0; } 
          100% { top: 100%; } 
        }
        .animate-pixel-scan { animation: pixel-scan 2.2s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
      `}</style>
    </div>
  );
};

export default FingerprintModule;