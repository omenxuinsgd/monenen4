"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Camera, 
  Eye, 
  Zap, 
  FileJson,
  Trash2,
  Loader2,
  ShieldCheck,
  Hand,
  ShieldAlert,
  Database,
  CheckCircle2,
  XCircle,
  UserCheck,
  MapPin,
  Fingerprint
} from 'lucide-react';

/**
 * PalmVeinModule
 * Modul modular untuk pendaftaran dan pengecaman vena telapak tangan.
 * Integrasi: Matching_Palm untuk memaparkan identiti (Nama, Alamat) subjek.
 * FIX: Menggunakan Ref untuk status scanning guna mengelakkan stale closure pada event listener.
 */
const PalmVeinModule = ({ activeTab }) => {
  const baseUrl = "http://localhost:5160";
  
  const [logs, setLogs] = useState([`[SISTEM] Inti Pemantauan Vena v3.1 aktif.`]);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Standby");
  const [biometricData, setBiometricData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [enrollResult, setEnrollResult] = useState(null);
  const [matchResult, setMatchResult] = useState(null);

  const rgbCanvasRef = useRef(null);
  const irCanvasRef = useRef(null);
  const resultCanvasRef = useRef(null); 
  const previewIntervalRef = useRef(null);
  
  // Ref untuk mengelakkan stale closure dalam listener window
  const isScanningRef = useRef(false);

  const [userData, setUserData] = useState({ userId: "1" });

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    const stored = localStorage.getItem("registrationData");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserData(parsed);
      loadBiometricData(parsed.userId);
    } else {
      loadBiometricData("1");
    }

    // Pendengar acara (Event Listeners)
    window.addEventListener('palm:capture-start', startPalmProtocol);
    window.addEventListener('palm:capture-finish', finishPalmProtocol);
    window.addEventListener('palm:enrollment', handleEnrollAction);
    window.addEventListener('palm:match', handleIdentificationAction);

    return () => {
      stopPreview();
      window.removeEventListener('palm:capture-start', startPalmProtocol);
      window.removeEventListener('palm:capture-finish', finishPalmProtocol);
      window.removeEventListener('palm:enrollment', handleEnrollAction);
      window.removeEventListener('palm:match', handleIdentificationAction);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'enrollment') setMatchResult(null);
    if (activeTab === 'identification') setEnrollResult(null);
  }, [activeTab]);

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const processInBackground = (url, canvasId) => {
    return new Promise((resolve) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return resolve();
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => resolve(null);
      img.src = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
    });
  };

  const startPreview = () => {
    if (previewIntervalRef.current) return;
    previewIntervalRef.current = setInterval(async () => {
      await processInBackground(`${baseUrl}/api/palm/previewrgb`, "palm1");
      await processInBackground(`${baseUrl}/api/palm/previewir`, "palm2");
    }, 1000);
  };

  const stopPreview = () => {
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
  };

  const startPalmProtocol = async () => {
    setIsScanning(true);
    setEnrollResult(null);
    setMatchResult(null);
    try {
      const res = await fetch(`${baseUrl}/api/palm/start-palm`);
      const text = await res.text();
      setStatusMsg(text);
      startPreview();
      addLog(`Sensor Aktif: ${text}`);
      window.dispatchEvent(new CustomEvent('palm:scanning-state', { detail: true }));
    } catch (err) { addLog("Gagal memulakan sensor."); }
  };

  const finishPalmProtocol = async () => {
    setIsScanning(false);
    try {
      const res = await fetch(`${baseUrl}/api/palm/finish-palm`);
      const text = await res.text();
      setStatusMsg(text);
      stopPreview();
      addLog(`Sensor Dimatikan: ${text}`);
      window.dispatchEvent(new CustomEvent('palm:scanning-state', { detail: false }));
    } catch (err) { addLog("Gagal menamatkan sensor."); }
  };

  const handleEnrollAction = async () => {
    if (!rgbCanvasRef.current) return;
    setIsProcessing(true);
    setEnrollResult(null);
    addLog("Memproses pendaftaran biometrik...");
    try {
      await fetch(`${baseUrl}/api/palm/capture-frame`);
      const blobRgb = await new Promise(res => rgbCanvasRef.current.toBlob(res, "image/png"));
      const blobIr = await new Promise(res => irCanvasRef.current.toBlob(res, "image/png"));
      const formData = new FormData();
      formData.append("image_rgb", blobRgb, "rgb.png");
      formData.append("image_ir", blobIr, "ir.png");
      formData.append("userId", userData.userId);
      const res = await fetch(`${baseUrl}/api/palm/enroll`, { method: "POST", body: formData });
      if (res.ok) {
        setEnrollResult({ type: 'SUCCESS', status: 'COMPLETED', message: `Subjek ${userData.userId} berjaya didaftarkan.`, userId: userData.userId, timestamp: new Date().toLocaleString(), db_sync: 'AUTHORIZED' });
        loadBiometricData(userData.userId);
      }
    } catch (err) { addLog("Ralat pendaftaran."); } finally { setIsProcessing(false); }
  };

  const handleIdentificationAction = async () => {
    // Menggunakan Ref untuk mengelakkan bug closure
    if (!isScanningRef.current) {
      addLog("Gagal: Sila aktifkan sensor terlebih dahulu.", "error");
      return;
    }
    setIsProcessing(true);
    setMatchResult(null);
    addLog("Memulakan pemadanan pola vena...");

    try {
      const res = await fetch(`${baseUrl}/api/palm/Palm_match`);
      if (!res.ok) {
        addLog("[INFO] Tiada padanan ditemui.");
        setIsProcessing(false);
        return;
      }
      const json = await res.json();

      // Bukti visual
      if (rgbCanvasRef.current && resultCanvasRef.current) {
        const resCtx = resultCanvasRef.current.getContext('2d');
        resultCanvasRef.current.width = rgbCanvasRef.current.width;
        resultCanvasRef.current.height = rgbCanvasRef.current.height;
        resCtx.drawImage(rgbCanvasRef.current, 0, 0);
      }

      setMatchResult({
        userId: json.userID || json.UserID || "-",
        name: json.name || json.Name || "-",
        address: json.address || json.Address || "-",
        status: "AUTHORIZED",
        timestamp: new Date().toLocaleString()
      });

      addLog(`[AUTH] Berjaya mengenal pasti: ${json.name || json.Name}`);
    } catch (err) { addLog("Ralat proses identifikasi."); } finally { setIsProcessing(false); }
  };

  const loadBiometricData = async (userId) => {
    try {
      const res = await fetch(`${baseUrl}/api/palm/palmbiometric/${userId}`);
      if (res.ok) setBiometricData(await res.json());
    } catch (err) { console.error("Gagal muat data."); }
  };

  const handleDelete = async (uid) => {
    if (!confirm("Padam data biometrik ini?")) return;
    try {
      const res = await fetch(`${baseUrl}/del_palm/${userData.userId}`, { method: "DELETE" });
      if (res.ok) loadBiometricData(userData.userId);
    } catch (err) { console.error("Gagal padam."); }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden bg-black/40 font-mono text-left">
      {(activeTab === 'enrollment' || activeTab === 'identification') && (
        <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-500">
           <div className={`grid grid-cols-2 gap-4 h-[320px] shrink-0`}>
              <div className="relative h-full border-2 border-[#00ffff]/30 bg-black rounded-sm overflow-hidden group">
                 <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/80 px-2 py-0.5 border border-[#00ffff]/20 rounded-sm">
                    <Camera size={10} className="text-[#00ffff]" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Sensor_Visual_RGB</span>
                 </div>
                 <canvas id="palm1" ref={rgbCanvasRef} className="w-full h-full object-contain opacity-90" />
                 {!isScanning && statusMsg === "Standby" && <div className="absolute inset-0 flex items-center justify-center bg-black/80 italic text-[10px] text-zinc-600 uppercase tracking-widest z-30">Sinyal_Offline</div>}
                 {isScanning && <div className="absolute inset-x-0 h-[2px] bg-[#00ffff]/40 shadow-[0_0_10px_#00ffff] animate-scan-line z-20" />}
              </div>
              <div className="relative h-full border-2 border-purple-500/30 bg-black rounded-sm overflow-hidden group">
                 <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-purple-900/60 px-2 py-0.5 border border-purple-400/20 rounded-sm">
                    <Eye size={10} className="text-purple-400" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Sensor_Inframerah</span>
                 </div>
                 <canvas id="palm2" ref={irCanvasRef} className="w-full h-full object-contain grayscale sepia opacity-80" />
                 {!isScanning && statusMsg === "Standby" && <div className="absolute inset-0 flex items-center justify-center bg-black/80 italic text-[10px] text-zinc-600 uppercase tracking-widest z-30">Sinyal_Offline</div>}
              </div>
           </div>
           
           <div className="flex-1 border-2 border-[#00ffff]/20 bg-zinc-950/60 p-5 rounded-sm flex flex-col gap-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#00ffff]/10 pb-3">
                 <div className="flex items-center gap-3">
                    <Zap size={18} className={isScanning ? "text-[#00ffff] animate-pulse" : "text-zinc-700"} />
                    <span className="text-[12px] font-black text-[#00ffff] uppercase tracking-widest">{activeTab === 'enrollment' ? 'Biometric_Enrollment_Status' : 'Identity_Matching_Result'}</span>
                 </div>
                 <div id="status" className="px-3 py-1 bg-[#00ffff]/10 border border-[#00ffff]/30 rounded-sm text-[9px] font-black text-[#00ffff]">SISTEM: {statusMsg.toUpperCase()}</div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                 {isProcessing ? (
                   <div className="flex flex-col items-center justify-center gap-4 py-10 opacity-60">
                      <Loader2 size={48} className="text-[#00ffff] animate-spin" />
                      <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Processing_Identification...</span>
                   </div>
                 ) : enrollResult ? (
                   <div className={`p-6 border-2 rounded-sm animate-in fade-in slide-in-from-left duration-500 flex flex-col gap-6 relative overflow-hidden group ${enrollResult.type === 'SUCCESS' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-10">{enrollResult.type === 'SUCCESS' ? <ShieldCheck size={80} className="text-emerald-400" /> : <ShieldAlert size={80} className="text-rose-400" />}</div>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-6 relative z-10">
                        <div className="flex flex-col gap-1"><span className="text-[8px] text-zinc-500 uppercase font-black">Status_Pendaftaran</span><span className={`text-xl font-black uppercase ${enrollResult.type === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>{enrollResult.status}</span></div>
                        <div className="flex flex-col gap-1"><span className="text-[8px] text-zinc-500 uppercase font-black">Subject_UID</span><span className="text-[12px] font-bold text-[#00ffff] bg-[#00ffff]/10 px-3 py-1 w-fit border border-[#00ffff]/20 rounded-sm">{enrollResult.userId}</span></div>
                        <div className="col-span-2 flex flex-col gap-1"><span className="text-[8px] text-zinc-500 uppercase font-black">Sistem_Mesej</span><span className="text-[10px] text-zinc-300 italic">{enrollResult.message}</span></div>
                      </div>
                      <div className="mt-2 pt-3 border-t border-[#00ffff]/10 text-[8px] text-zinc-600 font-bold uppercase tracking-wider">{enrollResult.timestamp}</div>
                   </div>
                 ) : matchResult ? (
                   <div className="p-5 border-2 border-emerald-500/40 bg-emerald-500/5 rounded-sm animate-in fade-in slide-in-from-left duration-500 flex flex-col lg:flex-row gap-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Hand size={120} className="text-emerald-400" /></div>
                      <div className="w-24 h-24 lg:w-32 lg:h-32 border-2 border-[#00ffff]/30 bg-black rounded-sm overflow-hidden shrink-0 relative z-10 shadow-lg"><canvas ref={resultCanvasRef} className="w-full h-full object-cover" /></div>
                      <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4 relative z-10">
                        <div className="flex flex-col gap-0.5"><span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest">Identiti_Padanan</span><span className="text-xl font-black text-white truncate">{matchResult.name}</span></div>
                        <div className="flex flex-col gap-0.5"><span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest">Status</span><div className="flex items-center gap-1.5 text-emerald-400"><UserCheck size={14} /><span className="text-lg font-black uppercase">{matchResult.status}</span></div></div>
                        <div className="flex flex-col gap-0.5"><span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest">UserID_Token</span><span className="text-[11px] font-bold text-[#00ffff] bg-[#00ffff]/10 px-2 py-0.5 w-fit border border-[#00ffff]/20 rounded-sm font-mono">{matchResult.userId}</span></div>
                        <div className="flex flex-col gap-0.5"><span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest">Alamat</span><span className="text-[10px] text-zinc-400 italic truncate max-w-[200px]">{matchResult.address}</span></div>
                      </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-20 text-zinc-800 gap-4"><Database size={64} strokeWidth={1} className="opacity-20" /><div className="flex flex-col items-center gap-1 opacity-40"><span className="text-[11px] font-black uppercase tracking-[0.5em]">Awaiting_Extraction</span><span className="text-[8px] uppercase tracking-widest">Aktifkan Sensor Untuk {activeTab === 'enrollment' ? 'Pendaftaran' : 'Identifikasi'}</span></div></div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="w-full border-[3px] border-[#00ffff]/30 bg-black overflow-hidden flex flex-col shadow-2xl flex-1 min-h-0 animate-in fade-in zoom-in-95 duration-500">
           <div className="bg-[#00ffff]/5 px-5 py-4 border-b-[3px] border-[#00ffff]/20 flex items-center gap-3 shrink-0"><FileJson size={18} className="text-[#00ffff]" /><span className="text-[12px] font-black text-[#00ffff] uppercase tracking-[0.3em]">Brankas Identiti // Vena Telapak</span></div>
           <div className="overflow-auto custom-scrollbar flex-1 bg-zinc-950/40">
             <table className="w-full text-left font-mono border-collapse min-w-[900px]">
                <thead><tr className="bg-[#00ffff]/10 text-[10px] text-white font-black uppercase sticky top-0 z-10 border-b-2 border-[#00ffff]/20"><th className="p-4">UserID</th><th className="p-4">Nama Penuh</th><th className="p-4">Alamat</th><th className="p-4 text-center">Citra IR</th><th className="p-4 text-center">Citra RGB</th><th className="p-4 text-right">Opsi</th></tr></thead>
                <tbody id="tableBody_palm" className="text-white">
                   {biometricData.map((item, idx) => (
                     <tr key={idx} className="text-[10px] border-b border-[#00ffff]/10 hover:bg-[#00ffff]/5 transition-all group">
                        <td className="p-4 text-[#00ffff] font-black">{item.UserID || item.userId}</td>
                        <td className="p-4 font-bold uppercase">{item.Name || item.name}</td>
                        <td className="p-4 text-zinc-500 italic truncate max-w-[150px]">{item.Address || item.address}</td>
                        <td className="p-4 text-center"><div className="w-12 h-12 mx-auto border border-purple-500/40 overflow-hidden bg-black shadow-sm"><img src={`data:image/jpeg;base64,${item.Image_ir}`} className="w-full h-full object-cover grayscale" /></div></td>
                        <td className="p-4 text-center"><div className="w-12 h-12 mx-auto border border-[#00ffff]/40 overflow-hidden bg-black shadow-sm"><img src={`data:image/jpeg;base64,${item.Image_rgb}`} className="w-full h-full object-cover" /></div></td>
                        <td className="p-4 text-right"><button onClick={()=>handleDelete(item.UserID)} className="text-rose-500 hover:text-white transition-all bg-rose-500/5 px-3 py-1.5 rounded-sm border border-rose-500/20 hover:border-rose-500"><Trash2 size={12} /></button></td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan-line { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(300%); opacity: 0; } }
        .animate-scan-line { animation: scan-line 3s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); }
      `}</style>
    </div>
  );
};

export default PalmVeinModule;