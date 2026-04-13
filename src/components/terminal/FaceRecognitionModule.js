"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Activity, 
  Terminal as TerminalIcon,
  Scan,
  Database,
  Loader2,
  User,
  Zap,
  Power,
  Save,
  Search,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  VideoOff,
  Video,
  CheckCircle,
  Dna,
  ShieldAlert
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

/**
 * FaceRecognitionModule
 * Terintegrasi penuh dengan API Backend (Port 5160)
 * Update: Visualisasi Atribut Wajah (Mask, Gender, Age, Pose, Spoof) dalam kontainer terstruktur.
 * FIX: Responsif untuk layar 11.6" 1920x1080 dengan zoom 90%
 */
const FaceRecognitionModule = ({ data: propsData, activeTab }) => {
  const baseUrl = "http://localhost:5160";
  
  // State dasar
  const [logs, setLogs] = useState([`[SYSTEM] Face Recognition Engine v3.2 Online.`]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [biometricRecords, setBiometricRecords] = useState([]);
  const [faceAttributes, setFaceAttributes] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  
  // Refs untuk pemrosesan canvas dan polling
  const pollingRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  
  // Data user dari localStorage
  const [userData, setUserData] = useState({ userId: "1" });

  useEffect(() => {
    const stored = localStorage.getItem("registrationData");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserData(parsed);
      loadBiometricData(parsed.userId);
    } else {
      loadBiometricData("123");
    }

    return () => stopCamera();
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scanner:logs-sync', { detail: logs }));
  }, [logs]);

  const addLog = (msg, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === "error" ? "[ERROR]" : type === "success" ? "[SUCCESS]" : "[INFO]";
    setLogs(prev => [`${prefix} ${msg} (${timestamp})`, ...prev].slice(0, 50));
  };

  // Tambahkan di deretan state paling atas
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    userId: "",
    name: "",
    address: ""
  });

  // Update useEffect untuk sinkronisasi awal data form dari userData
  useEffect(() => {
    if (userData?.userId) {
      setEnrollForm(prev => ({ ...prev, userId: userData.userId }));
    }
  }, [userData]);

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
      img.onerror = () => resolve(null);
      const sep = url.includes("?") ? "&" : "?";
      img.src = url + sep + "t=" + Date.now();
    });
  };

  // const loadBiometricData = async (userId) => {
  //   try {
  //     const res = await fetch(`${baseUrl}/api/face/facebiometric/${userId}`);
  //     if (res.ok) {
  //       const data = await res.json();
  //       setBiometricRecords(data);
  //     }
  //   } catch (err) {
  //     console.error("Load failed:", err);
  //   }
  // };

  // 1. Pastikan loadBiometricData membersihkan data lama sebelum memuat yang baru
const loadBiometricData = async (userId) => {
  try {
    // Sesuai referensi: fetch(`${baseUrl}/api/face/facebiometric/${userId}`)
    const res = await fetch(`${baseUrl}/api/face/facebiometric/${userId}`);
    if (res.ok) {
      const data = await res.json();
      setBiometricRecords(data); // Simpan hasil ke state untuk render tabel
      addLog(`Data biometrik untuk UID ${userId} berhasil dimuat.`, "info");
    }
  } catch (err) {
    console.error("Load failed:", err);
    addLog("Gagal memuat data dari database.", "error");
  }
};

// 2. Perbaikan handleEnrollAction agar sesuai dengan logika scripts.js
// const handleEnrollAction = async () => {
//   // Validasi dasar
//   if (!isConnected || isProcessing) return;
//   if (!userData?.userId) {
//     addLog("UserID tidak ditemukan dalam sesi pendaftaran.", "error");
//     return;
//   }

//   setIsProcessing(true);
//   addLog(`Memulai pendaftaran profil biometrik untuk UID: ${userData.userId}...`, "info");

//   try {
//     const ts = Date.now();
//     // Langkah 1: Ambil Snapshot dari backend (Sesuai referensi scripts.js)
//     const snapRes = await fetch(`${baseUrl}/api/face/snapshot?ts=${ts}`);
//     if (!snapRes.ok) throw new Error("Gagal mengambil snapshot dari sensor");
    
//     const blob = await snapRes.blob();
//     const formData = new FormData();
    
//     // Sesuai referensi: formData.append("frame", blob, `frame_${ts}.jpg`)
//     // dan formData.append("userId", data.userId)
//     formData.append("frame", blob, `enroll_${ts}.jpg`);
//     formData.append("userId", userData.userId);

//     // Langkah 2: Kirim ke endpoint Enroll
//     const res = await fetch(`${baseUrl}/api/face/enroll`, {
//       method: "POST",
//       body: formData
//     });

//     if (res.ok) {
//       const json = await res.json();
//       addLog("Pendaftaran BERHASIL. Database diperbarui.", "success");
      
//       // Update tampilan log dengan hasil JSON dari backend (opsional)
//       console.log("Enroll Result:", json);

//       // Langkah 3: Muat ulang data ke tabel (Sesuai referensi loadFace(data.userId))
//       await loadBiometricData(userData.userId);
//     } else {
//       const errorText = await res.text();
//       addLog(`Pendaftaran DITOLAK: ${errorText}`, "error");
//     }
//   } catch (err) {
//     console.error(err);
//     addLog(`Kesalahan Sistem: ${err.message}`, "error");
//   } finally {
//     setIsProcessing(false);
//   }
// };

// tambahan
const handleEnrollAction = async (e) => {
  if (e) e.preventDefault();
  
  if (!isConnected || isProcessing) return;
  if (!enrollForm.userId || !enrollForm.name) {
    toast.error("ID dan Nama wajib diisi!");
    addLog("ID dan Nama wajib diisi.", "error");
    return;
  }

  // Menampilkan toast loading
  const loadingToast = toast.loading("Sedang mendaftarkan subjek...");
  setIsProcessing(true);

  try {
    const ts = Date.now();
    const snapRes = await fetch(`${baseUrl}/api/face/snapshot?ts=${ts}`);
    if (!snapRes.ok) throw new Error("Gagal mengambil snapshot");
    
    const blob = await snapRes.blob();
    const formData = new FormData();
    
    formData.append("frame", blob, `enroll_${ts}.jpg`);
    formData.append("userId", enrollForm.userId);
    formData.append("name", enrollForm.name);
    formData.append("address", enrollForm.address);

    const res = await fetch(`${baseUrl}/api/face/enroll`, {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      // 1. Notifikasi Berhasil
      toast.success(`Berhasil! Subjek ${enrollForm.name} telah terdaftar.`, { id: loadingToast });
      addLog("Pendaftaran BERHASIL.", "success");
      
      // 2. Tutup Modal Otomatis
      setIsEnrollModalOpen(false); 
      
      // 3. Reset Form (Opsional agar bersih saat dibuka lagi)
      setEnrollForm({ userId: userData.userId || "", name: "", address: "" });
      
      await loadBiometricData(enrollForm.userId);
    } else {
      const errorText = await res.text();
      // Notifikasi Gagal
      toast.error(`Pendaftaran Gagal: ${errorText}. Silakan ulangi.`, { id: loadingToast });
      addLog(`Ditolak: ${errorText}`, "error");
    }
  } catch (err) {
    toast.error(`Kesalahan Sistem: ${err.message}`, { id: loadingToast });
    addLog(`Error: ${err.message}`, "error");
  } finally {
    setIsProcessing(false);
  }
};

  const startCamera = () => {
    if (pollingRef.current) return;
    
    setIsConnected(true);
    addLog("Memulai sensor optik (Polling Stream aktif)...", "success");

    pollingRef.current = setInterval(async () => {
      const url = `${baseUrl}/api/face/capture`;
      if (cameraCanvasRef.current) {
        const canvas = await drawImageToCanvas(url, cameraCanvasRef.current);
        if (canvas) {
          const frameData = canvas.toDataURL("image/jpeg", 0.6);
          window.dispatchEvent(new CustomEvent('terminal:update-preview', { 
            detail: frameData 
          }));
        }
      }
    }, 100);
  };

  const stopCamera = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsConnected(false);
    addLog("Sensor optik dinonaktifkan.", "info");
    window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
  };

  const handleMatchAction = async () => {
    if (!isConnected || isProcessing) return;
    setIsProcessing(true);
    setMatchResult(null);
    setFaceAttributes(null);
    addLog("Memulai proses identifikasi (Face_match)...", "info");

    try {
      const ts = Date.now();
      const snapRes = await fetch(`${baseUrl}/api/face/snapshot?ts=${ts}`);
      if (!snapRes.ok) throw new Error("Snapshot failed");
      const blob = await snapRes.blob();

      const formData = new FormData();
      formData.append("frame", blob, "capture.png");
      formData.append("frame1", blob, "capture.png");

      const matchRes = await fetch(`${baseUrl}/api/face/Face_match`, {
        method: "POST",
        body: formData
      });

      if (!matchRes.ok) {
        addLog("Identifikasi Gagal: Subjek tidak terdaftar.", "error");
        setIsProcessing(false);
        return;
      }

      const matchData = await matchRes.json();

      const trackRes = await fetch(`${baseUrl}/api/face/tracking`, {
        method: "POST",
        body: formData
      });

      if (trackRes.ok) {
        const processedBlob = await trackRes.blob();
        const imgUrl = URL.createObjectURL(processedBlob);
        const canvas = resultCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = imgUrl;
        }
        window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: imgUrl }));
      }

      const attrRes = await fetch(`${baseUrl}/api/face/attributes`, {
        method: "POST",
        body: formData
      });

      if (attrRes.ok) {
        const attrJson = await attrRes.json();
        if (attrJson.FaceCount > 0) {
          setFaceAttributes(attrJson.Faces[0]);
        }
      }

      setMatchResult({
        userId: matchData.UserID,
        name: matchData.Name,
        address: matchData.Address,
        status: "AUTHORIZED",
        timestamp: new Date().toLocaleString()
      });

      addLog(`Identifikasi SUKSES: subjek ${matchData.Name} terdeteksi.`, "success");

    } catch (err) {
      console.error(err);
      addLog("Gagal melakukan proses matching.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTrackingAction = async () => {
    if (!isConnected || isProcessing) return;
    setIsProcessing(true);
    setFaceAttributes(null);
    addLog("Menjalankan pelacakan wajah & analisis atribut...", "info");

    try {
      const ts = Date.now();
      const snapRes = await fetch(`${baseUrl}/api/face/snapshot?ts=${ts}`);
      const blob = await snapRes.blob();
      const formData = new FormData();
      formData.append("frame", blob, `frame_${ts}.jpg`);

      const trackRes = await fetch(`${baseUrl}/api/face/tracking`, {
        method: "POST",
        body: formData
      });

      if (trackRes.ok) {
        const processedBlob = await trackRes.blob();
        const imgUrl = URL.createObjectURL(processedBlob);
        const canvas = resultCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = imgUrl;
        }
        window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: imgUrl }));
      }

      const attrRes = await fetch(`${baseUrl}/api/face/attributes`, {
        method: "POST",
        body: formData
      });

      if (attrRes.ok) {
        const attrJson = await attrRes.json();
        if (attrJson.FaceCount > 0) {
          setFaceAttributes(attrJson.Faces[0]);
        }
      }

    } catch (err) {
      addLog("Analisis gagal.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // const handleEnrollAction = async () => {
  //   if (!isConnected || isProcessing) return;
  //   setIsProcessing(true);
  //   addLog(`Mendaftarkan profil biometrik: ${userData.userId}...`, "info");

  //   try {
  //     const ts = Date.now();
  //     const snapRes = await fetch(`${baseUrl}/api/face/snapshot?ts=${ts}`);
  //     const blob = await snapRes.blob();
  //     const formData = new FormData();
  //     formData.append("frame", blob, `enroll_${ts}.jpg`);
  //     formData.append("userId", userData.userId);

  //     const res = await fetch(`${baseUrl}/api/face/enroll`, {
  //       method: "POST",
  //       body: formData
  //     });

  //     if (res.ok) {
  //       addLog("Database identitas diperbarui.", "success");
  //       loadBiometricData(userData.userId);
  //     } else {
  //       addLog("Pendaftaran ditolak.", "error");
  //     }
  //   } catch (err) {
  //     addLog("Kesalahan jaringan.", "error");
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const handleDelete = async (uid) => {
    if (!confirm("Hapus rekaman biometrik ini?")) return;
    try {
      const res = await fetch(`${baseUrl}/api/face/del_face/${uid}`, { method: "DELETE" });
      if (res.ok) {
        addLog("Rekaman telah dihapus.", "success");
        loadBiometricData(userData.userId);
      }
    } catch (err) {
      addLog("Gagal menghapus data.", "error");
    }
  };

  return (
    <div className="w-full h-full p-3 sm:p-4 flex flex-col gap-4 sm:gap-5 overflow-hidden text-left bg-zinc-950/20 font-mono">
      {/* Letakkan Toaster di mana saja di dalam div utama */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#09090b', // zinc-950
            color: '#00ffff',      // cyan
            border: '1px solid rgba(0, 255, 255, 0.2)',
            fontFamily: 'monospace',
            fontSize: '12px',
          },
        }} 
      />

      {/* BARIS ATAS - Menggunakan flex dengan gap yang responsif */}
      <div className="h-[720px] sm:h-[740px] py-2 sm:py-4 flex flex-col lg:flex-row gap-4 sm:gap-6 overflow-hidden shrink-0">
        
        {/* SISI KANAN: Data Vault */}
        <div className="flex-1 h-full border-2 border-[#00ffff]/40 bg-zinc-900/60 pt-4 sm:pt-6 px-4 sm:px-6 pb-8 sm:pb-12 relative rounded-sm group flex flex-col justify-start gap-3 sm:gap-4 overflow-visible">
          <div className="absolute -top-[10px] sm:-top-[12px] left-4 sm:left-6 bg-white text-black px-3 sm:px-4 py-0.5 text-[11px] sm:text-[14px] font-black uppercase z-50 whitespace-nowrap">
            {activeTab === 'face_enrollment' ? 'Personal Biometric Data Vault' : 'Biometric Identity Verification'}
          </div>

          {/* Controls - Responsif */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 bg-black/60 p-3 border border-[#00ffff]/10 rounded-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <div className="flex flex-col leading-tight">
                <span className={`text-[11px] sm:text-[14px] font-black uppercase tracking-widest ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isConnected ? 'KAMERA_NYALA' : 'KAMERA_MATI'}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <canvas ref={cameraCanvasRef} className="w-full h-full object-cover hidden" />
              <button onClick={isConnected ? stopCamera : startCamera} className={`px-3 sm:px-4 py-1 sm:py-1.5 border-2 text-[10px] sm:text-[12px] font-black uppercase rounded-sm transition-all flex items-center gap-1 sm:gap-2 ${isConnected ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' : 'border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black'}`}>
                {isConnected ? <Power size={14} /> : <Video size={16} />}
                <span className="hidden xs:inline">{isConnected ? 'Stop sensor' : 'Start sensor'}</span>
                <span className="xs:hidden">{isConnected ? 'Stop' : 'Start'}</span>
              </button>

              {activeTab === 'face_verification' && (
                <button onClick={handleMatchAction} disabled={!isConnected || isProcessing} className={`px-3 sm:px-4 py-1 sm:py-1.5 border-2 text-[9px] sm:text-[11px] font-black uppercase rounded-sm transition-all flex items-center gap-1 sm:gap-2 ${!isConnected || isProcessing ? 'opacity-20 border-zinc-500 text-zinc-500' : 'border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_10px_rgba(0,255,255,0.2)]'}`}>
                  <CheckCircle size={11} /> <span className="xs:inline"> Matching</span>
                </button>
              )}
              
              {/* {activeTab === 'face_enrollment' && (
                <>
                  <button onClick={handleTrackingAction} disabled={!isConnected || isProcessing} className="px-3 sm:px-4 py-1 sm:py-1.5 border-2 text-[9px] sm:text-[11px] font-black uppercase border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff]/10 rounded-sm disabled:opacity-20 flex items-center gap-1 sm:gap-2">
                    <Scan size={11} /> Capture <span className="hidden xs:inline">Capture</span>
                  </button>
                  <button onClick={handleEnrollAction} disabled={!isConnected || isProcessing} className="px-3 sm:px-4 py-1 sm:py-1.5 border-2 text-[9px] sm:text-[11px] font-black uppercase border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff]/10 rounded-sm disabled:opacity-20 flex items-center gap-1 sm:gap-2">
                    <Save size={11} /> Save Enrollment <span className="hidden xs:inline">Save Enroll</span>
                  </button>
                </>
              )} */}

              {/* tambahan */}
              {/* Cari bagian ini dan ganti */}
              {activeTab === 'face_enrollment' && (
                <>
                  <button onClick={handleTrackingAction} disabled={!isConnected || isProcessing} className="px-3 sm:px-4 py-1 sm:py-1.5 border-2 text-[9px] sm:text-[11px] font-black uppercase border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff]/10 rounded-sm disabled:opacity-20 flex items-center gap-1 sm:gap-2">
                    <Scan size={11} /> Capture <span className="hidden xs:inline">Capture</span>
                  </button>
                  <button 
                    onClick={() => setIsEnrollModalOpen(true)} // Ubah ini untuk membuka modal
                    disabled={!isConnected || isProcessing} 
                    className="px-3 sm:px-4 py-1 sm:py-1.5 border-2 text-[9px] sm:text-[11px] font-black uppercase border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff]/10 rounded-sm disabled:opacity-20 flex items-center gap-1 sm:gap-2"
                  >
                    <User size={11} /> Enrollment Form
                  </button>
                </>
              )}
            </div>
          </div>

          {/* AREA KONTEN UTAMA */}
          <div className="flex-1 min-h-0 border border-[#00ffff]/10 rounded-sm overflow-hidden bg-black/20">
            {activeTab === 'face_enrollment' ? (
              <div className="h-full overflow-y-auto custom-scrollbar">
                <table className="w-full border-collapse text-center">
                  <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-[#00ffff]/30 text-[10px] sm:text-[12px] font-black text-[#00ffff] uppercase">
                    <tr>
                      <th className="p-2 sm:p-3 w-16 sm:w-20">UID</th>
                      <th className="p-2 sm:p-3">Subject Name</th>
                      <th className="p-2 sm:p-3 hidden sm:table-cell">Bio_Frame</th>
                      <th className="p-2 sm:p-3 hidden md:table-cell">Timestamp</th>
                      <th className="p-2 sm:p-3 text-right">Ops</th>
                    </tr>
                  </thead>
                  <tbody className="text-[8px] sm:text-[9px]">
                    {biometricRecords.map((record, idx) => (
                      <tr key={idx} className="border-b border-[#00ffff]/5 hover:bg-[#00ffff]/5 transition-colors text-white">
                        <td className="p-2 sm:p-3 text-[#00ffff] font-mono text-[10px] sm:text-[11px]">{record.UserID}</td>
                        <td className="p-2 sm:p-3 font-bold uppercase text-[9px] sm:text-[10px] truncate max-w-[100px]">{record.Name}</td>
                        <td className="p-2 sm:p-3 hidden sm:table-cell"><div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-sm border border-white/5 overflow-hidden"><img src={`data:image/jpeg;base64,${record.Image}`} className="w-full h-full object-cover grayscale" alt="bin" /></div></td>
                        <td className="p-2 sm:p-3 text-zinc-500 font-mono text-[8px] sm:text-[9px] hidden md:table-cell">{record.Date}</td>
                        <td className="p-2 sm:p-3 text-right"><button onClick={() => handleDelete(record.UserID)} className="text-red-500 hover:text-white transition-colors"><Trash2 size={11} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 sm:gap-6 text-left">
                 {/* 1. Kontainer Identitas (AUTHORIZED) - Responsif */}
                 {matchResult && (
                   <div className="p-4 sm:p-5 border-2 border-emerald-500/40 bg-emerald-500/5 rounded-sm animate-in fade-in slide-in-from-left duration-500 flex flex-col gap-4 sm:gap-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><UserCheck size={60} className="text-emerald-400" /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-4 sm:gap-y-6 relative z-10">
                        <div className="flex flex-col gap-1">
                           <span className="text-[7px] sm:text-[8px] text-zinc-500 uppercase tracking-widest font-black">Subject_Identity</span>
                           <span className="text-xl sm:text-2xl font-black text-white truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{matchResult.name}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[7px] sm:text-[8px] text-zinc-500 uppercase tracking-widest font-black">Authorization_State</span>
                           <div className="flex items-center gap-2 text-emerald-400">
                             <ShieldCheck size={14} className="animate-pulse" />
                             <span className="text-lg sm:text-xl font-black uppercase tracking-tighter">{matchResult.status}</span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[7px] sm:text-[8px] text-zinc-500 uppercase tracking-widest font-black">Subject_UID</span>
                           <span className="text-[10px] sm:text-[12px] font-bold text-[#00ffff] bg-[#00ffff]/10 px-2 sm:px-3 py-1 w-fit border border-[#00ffff]/20 rounded-sm font-mono shadow-[0_0_10px_rgba(0,255,255,0.1)]">{matchResult.userId}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[7px] sm:text-[8px] text-zinc-500 uppercase tracking-widest font-black">Subject_Address</span>
                           <span className="text-[9px] sm:text-[10px] text-zinc-300 italic truncate max-w-[200px] sm:max-w-[280px]">{matchResult.address}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 sm:pt-3 border-t border-[#00ffff]/10 flex flex-col sm:flex-row justify-between gap-2 text-[7px] sm:text-[8px] text-zinc-600 font-bold uppercase tracking-wider font-mono">
                        <span>Verification_Node: SECURE_ALPHA_9</span>
                        <span>{matchResult.timestamp}</span>
                      </div>
                   </div>
                 )}

                 {/* 2. Kontainer Atribut Wajah - Responsif Grid */}
                 {(faceAttributes || isProcessing) && (
                   <div className="p-4 sm:p-5 border-2 border-[#00ffff]/30 bg-black/40 rounded-sm flex flex-col gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-700">
                      <div className="flex items-center gap-2 text-[#00ffff] border-b border-[#00ffff]/10 pb-2 mb-1 sm:mb-2">
                         <Dna size={12} className={isProcessing ? "animate-spin" : ""} />
                         <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Face_Attributes_Analysis</span>
                      </div>
                      
                      {isProcessing && !faceAttributes ? (
                        <div className="py-8 sm:py-10 flex flex-col items-center justify-center gap-3 opacity-30 italic">
                           <Loader2 size={20} className="animate-spin" />
                           <span className="text-[8px] sm:text-[9px] uppercase tracking-widest">Extracting_Atribut_Vector...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[6px] sm:text-[7px] text-zinc-500 uppercase font-black">Mask_Status</span>
                              <span className={`text-[9px] sm:text-[11px] font-black uppercase mt-1 ${faceAttributes.Mask === 'No Mask' ? 'text-emerald-400' : 'text-yellow-400'}`}>{faceAttributes.Mask}</span>
                           </div>
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[6px] sm:text-[7px] text-zinc-500 uppercase font-black">Gender</span>
                              <span className="text-[9px] sm:text-[11px] font-black uppercase text-white mt-1">{faceAttributes.Gender}</span>
                           </div>
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[6px] sm:text-[7px] text-zinc-500 uppercase font-black">Subject_Age</span>
                              <span className="text-[11px] sm:text-[14px] font-black text-[#00ffff] mt-1">{faceAttributes.Age} <span className="text-[7px] sm:text-[8px] font-normal text-zinc-500 ml-1">Years</span></span>
                           </div>
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[6px] sm:text-[7px] text-zinc-500 uppercase font-black">Head_Pose</span>
                              <span className="text-[9px] sm:text-[11px] font-black uppercase text-white mt-1 truncate">{faceAttributes.Pose}</span>
                           </div>
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[6px] sm:text-[7px] text-zinc-500 uppercase font-black">Spoof_Det</span>
                              <span className={`text-[9px] sm:text-[11px] font-black uppercase mt-1 flex items-center gap-1 ${faceAttributes.Spoof === 'Real' ? 'text-emerald-400' : 'text-rose-500'}`}>
                                 {faceAttributes.Spoof === 'Real' ? <ShieldCheck size={9} /> : <ShieldAlert size={9} />}
                                 {faceAttributes.Spoof}
                              </span>
                           </div>
                        </div>
                      )}
                   </div>
                 )}

                 {!matchResult && !isProcessing && (
                   <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 italic opacity-20 gap-3 border-2 border-dashed border-white/5 rounded-sm py-12 sm:py-20">
                      <Search size={36} strokeWidth={1} />
                      <span className="text-[9px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.5em] text-center">Awaiting_Sensor_Trigger</span>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* SISI KIRI: Operasi - Lebar responsif */}
        <div className="w-full lg:w-[480px] xl:w-[520px] h-full shrink-0 overflow-hidden">
          <div className="h-full border-2 border-[#00ffff]/40 bg-zinc-950 p-3 sm:p-4 rounded-sm shadow-[0_0_20px_rgba(0,255,255,0.1)] relative overflow-hidden flex flex-col gap-2 sm:gap-3">
            <div className="text-[10px] sm:text-[12px] text-[#00ffff] font-black uppercase tracking-[0.2em] border-b-5 border-[#00ffff]/20 pb-2 flex items-center gap-2">
               <Zap size={10} fill="#00ffff" /> 
               <span>Tracking_Output</span>
            </div>

            <div className="flex-1 flex flex-col gap-1 min-h-0">
              <div className="relative w-full flex-1 min-h-0 bg-black/60 rounded-sm overflow-hidden flex items-center justify-center">
                <canvas ref={resultCanvasRef} className="w-full h-full object-contain" />
                {isProcessing && <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00ffff] shadow-[0_0_10px_#00ffff] animate-pixel-scan z-20" />}
                {!isConnected && <div className="opacity-10 pr-120"><User size={100} />{/*<User size={88} />*/}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* tambahan */}
      {/* MODAL ENROLLMENT FORM */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border-2 border-[#00ffff] bg-zinc-950 p-6 rounded-sm shadow-[0_0_50px_rgba(0,255,255,0.2)]">
            <div className="flex justify-between items-center border-b border-[#00ffff]/30 pb-3 mb-6">
              <h3 className="text-[#00ffff] font-black uppercase tracking-tighter flex items-center gap-2">
                <Database size={18} /> New Subject Registration
              </h3>
              <button onClick={() => setIsEnrollModalOpen(false)} className="text-zinc-500 hover:text-white">
                <Trash2 size={18} />
              </button>
            </div>

            <form onSubmit={handleEnrollAction} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#00ffff] uppercase font-bold">Subject UID</label>
                <input 
                  type="text" 
                  value={enrollForm.userId}
                  onChange={(e) => setEnrollForm({...enrollForm, userId: e.target.value})}
                  className="w-full bg-black border border-[#00ffff]/20 p-2 text-white font-mono focus:border-[#00ffff] outline-none"
                  placeholder="e.g. 12345"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#00ffff] uppercase font-bold">Full Name</label>
                <input 
                  type="text" 
                  value={enrollForm.name}
                  onChange={(e) => setEnrollForm({...enrollForm, name: e.target.value})}
                  className="w-full bg-black border border-[#00ffff]/20 p-2 text-white font-mono focus:border-[#00ffff] outline-none"
                  placeholder="INPUT NAME..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#00ffff] uppercase font-bold">Address / Description</label>
                <textarea 
                  value={enrollForm.address}
                  onChange={(e) => setEnrollForm({...enrollForm, address: e.target.value})}
                  className="w-full bg-black border border-[#00ffff]/20 p-2 text-white font-mono focus:border-[#00ffff] outline-none h-20"
                  placeholder="DEPT / OFFICE..."
                />
              </div>

              <div className="mt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="flex-1 py-2 border-2 border-zinc-700 text-zinc-500 font-black uppercase hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 border-2 border-[#00ffff] bg-[#00ffff]/10 text-[#00ffff] font-black uppercase hover:bg-[#00ffff] hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Confirm Enroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pixel-scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-pixel-scan { position: absolute; height: 2px; width: 100%; animation: pixel-scan 2s linear infinite; }
        
        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 255, 255, 0.5); }
        
        /* Stabilkan untuk zoom 90% di layar 11.6 inch */
        @media screen and (min-width: 1900px) and (max-width: 2200px) {
          .w-full, .h-full, .flex, .grid {
            transform-origin: top left;
          }
        }
        
        /* Untuk layar dengan lebar antara 1000px - 1366px */
        @media screen and (max-width: 1366px) {
          .lg\\:w-\\[480px\\] {
            width: 420px !important;
          }
        }
        
        /* Extra small breakpoint untuk teks tombol */
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline !important;
          }
          .xs\\:hidden {
            display: none !important;
          }
        }
        @media (max-width: 479px) {
          .xs\\:inline {
            display: none !important;
          }
          .xs\\:hidden {
            display: inline !important;
          }
        }
      `}</style>
    </div>
    
  );
};

export default FaceRecognitionModule;