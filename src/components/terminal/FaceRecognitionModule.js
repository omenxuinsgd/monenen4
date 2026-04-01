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

/**
 * FaceRecognitionModule
 * Terintegrasi penuh dengan API Backend (Port 5160)
 * Update: Visualisasi Atribut Wajah (Mask, Gender, Age, Pose, Spoof) dalam kontainer terstruktur.
 */
const FaceRecognitionModule = ({ data: propsData, activeTab }) => {
  const baseUrl = "http://localhost:5160";
  
  // State dasar
  const [logs, setLogs] = useState([`[SYSTEM] Face Recognition Engine v3.2 Online.`]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [biometricRecords, setBiometricRecords] = useState([]);
  const [faceAttributes, setFaceAttributes] = useState(null); // Menyimpan data atribut wajah terurai
  const [matchResult, setMatchResult] = useState(null); 
  
  // Refs untuk pemrosesan canvas dan polling
  const pollingRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  
  // Data user dari localStorage
  const [userData, setUserData] = useState({ userId: "12345" });

  useEffect(() => {
    const stored = localStorage.getItem("registrationData");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserData(parsed);
      loadBiometricData(parsed.userId);
    } else {
      loadBiometricData("12345");
    }

    return () => stopCamera();
  }, []);

  const addLog = (msg, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === "error" ? "[ERROR]" : type === "success" ? "[SUCCESS]" : "[INFO]";
    setLogs(prev => [`${prefix} ${msg} (${timestamp})`, ...prev].slice(0, 50));
  };

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

  const loadBiometricData = async (userId) => {
    try {
      const res = await fetch(`${baseUrl}/api/face/facebiometric/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setBiometricRecords(data);
      }
    } catch (err) {
      console.error("Load failed:", err);
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

  /**
   * Logika Matching / Verification (Integrasi Face_match API)
   */
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

      // 1. Eksekusi Pencocokan Wajah
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

      // 2. Eksekusi Tracking
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

      // 3. Eksekusi Atribut (Mask, Age, Gender, Pose, Spoof)
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

      // 4. Update Identitas
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

  const handleEnrollAction = async () => {
    if (!isConnected || isProcessing) return;
    setIsProcessing(true);
    addLog(`Mendaftarkan profil biometrik: ${userData.userId}...`, "info");

    try {
      const ts = Date.now();
      const snapRes = await fetch(`${baseUrl}/api/face/snapshot?ts=${ts}`);
      const blob = await snapRes.blob();
      const formData = new FormData();
      formData.append("frame", blob, `enroll_${ts}.jpg`);
      formData.append("userId", userData.userId);

      const res = await fetch(`${baseUrl}/api/face/enroll`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        addLog("Database identitas diperbarui.", "success");
        loadBiometricData(userData.userId);
      } else {
        addLog("Pendaftaran ditolak.", "error");
      }
    } catch (err) {
      addLog("Kesalahan jaringan.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

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
    <div className="w-full h-full p-4 flex flex-col gap-5 overflow-hidden text-left bg-zinc-950/20 font-mono">
      
      {/* BARIS ATAS */}
      <div className="h-[520px] py-4 flex flex-col lg:flex-row gap-8 overflow-hidden shrink-0">
        
        {/* SISI KIRI: Operasi */}
        <div className="w-full lg:w-[190px] h-full shrink-0 overflow-hidden">
          <div className="h-full border-2 border-[#00ffff]/40 bg-zinc-950 p-4 rounded-sm shadow-[0_0_20px_rgba(0,255,255,0.1)] relative overflow-hidden flex flex-col gap-3">
            <div className="text-[9px] text-[#00ffff] font-black uppercase tracking-[0.2em] border-b border-[#00ffff]/20 pb-2 flex items-center gap-2">
               <Zap size={12} fill="#00ffff" /> 
               <span>Ops_Monitor</span>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 min-h-0">
              <span className="text-[7px] text-[#00ffff]/40 uppercase font-black tracking-widest">Live_Capture</span>
              <div className="relative w-full h-1/2 min-h-0 border border-[#00ffff]/30 bg-black/60 rounded-sm overflow-hidden flex items-center justify-center">
                <canvas ref={cameraCanvasRef} className="w-full h-full object-cover" />
                {!isConnected && <div className="opacity-10"><Camera size={24} /></div>}
                <div className="absolute top-2 left-2 bg-black/40 px-1 py-0.5 border border-[#00ffff]/20 text-[6px] text-[#00ffff] uppercase font-black">Raw_Stream</div>
              </div>

              <span className="text-[7px] text-[#00ffff]/40 uppercase font-black tracking-widest mt-1">Tracking_Output</span>
              <div className="relative w-full flex-1 min-h-0 border border-[#00ffff]/30 bg-black/60 rounded-sm overflow-hidden flex items-center justify-center">
                <canvas ref={resultCanvasRef} className="w-full h-full object-cover" />
                {isProcessing && <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00ffff] shadow-[0_0_10px_#00ffff] animate-pixel-scan z-20" />}
                {!isConnected && <div className="opacity-10"><User size={48} /></div>}
              </div>
            </div>
            
            <div className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.4em] text-center">V.3.2_SECURE</div>
          </div>
        </div>

        {/* SISI KANAN: Data Vault */}
        <div className="flex-1 h-full border-2 border-[#00ffff]/40 bg-zinc-900/60 p-5 relative rounded-sm group flex flex-col gap-4 shadow-xl overflow-hidden">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase z-50">
            {activeTab === 'face_enrollment' ? 'Personal Biometric Data Vault' : 'Biometric Identity Verification'}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between bg-black/60 p-3 border border-[#00ffff]/10 rounded-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <div className="flex flex-col leading-tight">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isConnected ? 'NODE_ACTIVE' : 'NODE_STANDBY'}
                </span>
                <span className="text-[7px] text-zinc-500 uppercase tracking-[0.2em]">UID: {userData.userId}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button onClick={isConnected ? stopCamera : startCamera} className={`px-4 py-1.5 border-2 text-[9px] font-black uppercase rounded-sm transition-all flex items-center gap-2 ${isConnected ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' : 'border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black'}`}>
                {isConnected ? <Power size={12} /> : <Video size={12} />}
                {isConnected ? 'Stop sensor' : 'Start sensor'}
              </button>

              {activeTab === 'face_verification' && (
                <button onClick={handleMatchAction} disabled={!isConnected || isProcessing} className={`px-4 py-1.5 border-2 text-[9px] font-black uppercase rounded-sm transition-all flex items-center gap-2 ${!isConnected || isProcessing ? 'opacity-20 border-zinc-500 text-zinc-500' : 'border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black shadow-[0_0_10px_rgba(0,255,255,0.2)]'}`}>
                  <CheckCircle size={12} /> Matching
                </button>
              )}
              
              {activeTab === 'face_enrollment' && (
                <>
                  <button onClick={handleTrackingAction} disabled={!isConnected || isProcessing} className="px-4 py-1.5 border-2 text-[9px] font-black uppercase border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff]/10 rounded-sm disabled:opacity-20 flex items-center gap-2"><Scan size={12} /> Capture</button>
                  <button onClick={handleEnrollAction} disabled={!isConnected || isProcessing} className="px-4 py-1.5 border-2 text-[9px] font-black uppercase border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff]/10 rounded-sm disabled:opacity-20 flex items-center gap-2"><Save size={12} /> Save Enroll</button>
                </>
              )}
            </div>
          </div>

          {/* AREA KONTEN UTAMA */}
          <div className="flex-1 min-h-0 border border-[#00ffff]/10 rounded-sm overflow-hidden bg-black/20">
            {activeTab === 'face_enrollment' ? (
              <div className="h-full overflow-y-auto custom-scrollbar">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-[#00ffff]/30 text-[9px] font-black text-[#00ffff] uppercase">
                    <tr><th className="p-3 w-20">UID</th><th className="p-3">Subject Name</th><th className="p-3">Bio_Frame</th><th className="p-3">Timestamp</th><th className="p-3 text-right">Ops</th></tr>
                  </thead>
                  <tbody className="text-[9px]">
                    {biometricRecords.map((record, idx) => (
                      <tr key={idx} className="border-b border-[#00ffff]/5 hover:bg-[#00ffff]/5 transition-colors text-white">
                        <td className="p-3 text-[#00ffff] font-mono">{record.UserID}</td>
                        <td className="p-3 font-bold uppercase">{record.Name}</td>
                        <td className="p-3"><div className="w-10 h-10 bg-black rounded-sm border border-white/5 overflow-hidden"><img src={`data:image/jpeg;base64,${record.Image}`} className="w-full h-full object-cover grayscale" alt="bin" /></div></td>
                        <td className="p-3 text-zinc-500 font-mono">{record.Date}</td>
                        <td className="p-3 text-right"><button onClick={() => handleDelete(record.UserID)} className="text-red-500 hover:text-white transition-colors"><Trash2 size={12} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 text-left">
                 {/* 1. Kontainer Identitas Identitas (AUTHORIZED) */}
                 {matchResult && (
                   <div className="p-5 border-2 border-emerald-500/40 bg-emerald-500/5 rounded-sm animate-in fade-in slide-in-from-left duration-500 flex flex-col gap-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><UserCheck size={80} className="text-emerald-400" /></div>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-6 relative z-10">
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Subject_Identity</span>
                           <span className="text-2xl font-black text-white truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{matchResult.name}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Authorization_State</span>
                           <div className="flex items-center gap-2 text-emerald-400">
                             <ShieldCheck size={18} className="animate-pulse" />
                             <span className="text-xl font-black uppercase tracking-tighter">{matchResult.status}</span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Subject_UID</span>
                           <span className="text-[12px] font-bold text-[#00ffff] bg-[#00ffff]/10 px-3 py-1 w-fit border border-[#00ffff]/20 rounded-sm font-mono shadow-[0_0_10px_rgba(0,255,255,0.1)]">{matchResult.userId}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Subject_Address</span>
                           <span className="text-[10px] text-zinc-300 italic truncate max-w-[280px]">{matchResult.address}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-3 border-t border-[#00ffff]/10 flex justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-wider font-mono">
                        <span>Verification_Node: SECURE_ALPHA_9</span>
                        <span>{matchResult.timestamp}</span>
                      </div>
                   </div>
                 )}

                 {/* 2. Kontainer Atribut Wajah (Mask, Gender, Age, Pose, Spoof) */}
                 {(faceAttributes || isProcessing) && (
                   <div className="p-5 border-2 border-[#00ffff]/30 bg-black/40 rounded-sm flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-700">
                      <div className="flex items-center gap-2 text-[#00ffff] border-b border-[#00ffff]/10 pb-2 mb-2">
                         <Dna size={14} className={isProcessing ? "animate-spin" : ""} />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Face_Attributes_Analysis</span>
                      </div>
                      
                      {isProcessing && !faceAttributes ? (
                        <div className="py-10 flex flex-col items-center justify-center gap-3 opacity-30 italic">
                           <Loader2 size={24} className="animate-spin" />
                           <span className="text-[9px] uppercase tracking-widest">Extracting_Atribut_Vector...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[7px] text-zinc-500 uppercase font-black">Mask_Status</span>
                              <span className={`text-[11px] font-black uppercase mt-1 ${faceAttributes.Mask === 'No Mask' ? 'text-emerald-400' : 'text-yellow-400'}`}>{faceAttributes.Mask}</span>
                           </div>
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[7px] text-zinc-500 uppercase font-black">Gender</span>
                              <span className="text-[11px] font-black uppercase text-white mt-1">{faceAttributes.Gender}</span>
                           </div>
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[7px] text-zinc-500 uppercase font-black">Subject_Age</span>
                              <span className="text-[14px] font-black text-[#00ffff] mt-1">{faceAttributes.Age} <span className="text-[8px] font-normal text-zinc-500 ml-1">Years</span></span>
                           </div>
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[7px] text-zinc-500 uppercase font-black">Head_Pose</span>
                              <span className="text-[11px] font-black uppercase text-white mt-1">{faceAttributes.Pose}</span>
                           </div>
                           <div className="flex flex-col p-2 bg-zinc-900/60 border border-white/5 rounded-sm">
                              <span className="text-[7px] text-zinc-500 uppercase font-black">Spoof_Det</span>
                              <span className={`text-[11px] font-black uppercase mt-1 flex items-center gap-1 ${faceAttributes.Spoof === 'Real' ? 'text-emerald-400' : 'text-rose-500'}`}>
                                 {faceAttributes.Spoof === 'Real' ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                                 {faceAttributes.Spoof}
                              </span>
                           </div>
                        </div>
                      )}
                   </div>
                 )}

                 {!matchResult && !isProcessing && (
                   <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 italic opacity-20 gap-3 border-2 border-dashed border-white/5 rounded-sm py-20">
                      <Search size={48} strokeWidth={1} />
                      <span className="text-[11px] uppercase tracking-[0.5em]">Awaiting_Sensor_Trigger</span>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BARIS BAWAH */}
      <div className="h-[260px] w-full overflow-hidden shrink-0">
        <div className="border-2 border-[#00ffff]/20 bg-black/90 p-4 flex flex-col rounded-sm font-mono text-[11px] h-full shadow-inner">
          <div className="flex items-center gap-2 text-[#00ffff] uppercase font-black border-b border-[#00ffff]/10 pb-2 mb-2">
            <Activity size={12} className="animate-pulse" />
            <span>Biometric_Event_Stream</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-2 text-[10px] text-left">
            {logs.map((log, idx) => (
              <div key={idx} className="flex gap-3 border-l-2 border-[#00ffff]/10 pl-3 leading-relaxed transition-all hover:bg-white/5 py-0.5">
                <span className={log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('ERROR') ? 'text-red-400' : 'text-zinc-500'}>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pixel-scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-pixel-scan { position: absolute; height: 2px; width: 100%; animation: pixel-scan 2s linear infinite; }
      `}</style>
    </div>
  );
};

export default FaceRecognitionModule;