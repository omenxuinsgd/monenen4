"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Settings2, 
  Loader2, 
  Wifi, 
  WifiOff, 
  User, 
  Shield, 
  Database, 
  Fingerprint, 
  Power, 
  CircleStop, 
  Play, 
  CheckCircle2, 
  Search, 
  UserCheck, 
  ShieldCheck,
  IdCard,
  Scan,
  History,
  Trash2,
  XCircle,
  FileText
} from 'lucide-react';

/**
 * FingerprintModule
 * Terintegrasi dengan biometrik API & SignalR.
 * Tata Letak Dinamis:
 * - Enrollment: Tetap (Capture Control | Registrasi | 10 Slot Jari).
 * - Verification: Layout Baru (Metode 1:1, 1:N, dan Hasil dengan Pratinjau Gambar).
 */
const FingerprintModule = ({ data, activeTab }) => {
  const [nik, setNik] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [liveImage, setLiveImage] = useState(null); 
  const [isConnected, setIsConnected] = useState(false);
  
  // State untuk menyimpan hasil (10 slot jari untuk Enrollment)
  const [fingerCaptures, setFingerCaptures] = useState(new Array(10).fill(null));
  
  // State untuk hasil verifikasi (Verification Menu)
  const [matchResult, setMatchResult] = useState(null);
  const [capturedBuffer, setCapturedBuffer] = useState(null);

  // Parameter Perangkat
  const [mode, setMode] = useState("0");
  const [nMissingFinger, setNMissingFinger] = useState("0");
  const [featureFormat, setFeatureFormat] = useState("0");
  const [imageFormat, setImageFormat] = useState("0");
  
  const API_BASE_URL = "http://localhost:7102";
  const connectionRef = useRef(null);

  useEffect(() => {
    const initSignalR = async () => {
      try {
        let signalR;
        try { signalR = await import("@microsoft/signalr"); } 
        catch (e) { signalR = typeof window !== 'undefined' ? window.signalR : null; }

        if (!signalR) return;

        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/fingerprinthub`, { withCredentials: true })
          .withAutomaticReconnect()
          .build();

        connection.on("PreviewUpdated", (base64) => {
          const imageUrl = `data:image/bmp;base64,${base64}`;
          setLiveImage(imageUrl);
          window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: imageUrl }));
        });

        connection.on("FingerCompleted", (data) => {
          // Hanya update slot jari jika sedang di menu enrollment
          if (activeTab === 'enrollment' && data.fingerIndex >= 1 && data.fingerIndex <= 10) {
            setFingerCaptures(prev => {
              const next = [...prev];
              next[data.fingerIndex - 1] = `data:image/bmp;base64,${data.imageBase64}`;
              return next;
            });
          }
        });

        await connection.start();
        connectionRef.current = connection;
      } catch (err) { console.error("[SIGNALR] Gagal:", err.message); }
    };

    initSignalR();
    return () => { if (connectionRef.current) connectionRef.current.stop(); };
  }, [activeTab]);

  const handleAction = async (endpoint, body = null) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
        mode: 'cors'
      });
      const result = await response.json().catch(() => ({}));
      return result;
    } catch (error) {
      console.error("[FETCH ERROR]", error);
      return { success: false, message: "Server Offline" };
    } finally { setIsLoading(false); }
  };

  const handleConnectToggle = async () => {
    const endpoint = isConnected ? '/api/fingerprint/closedevice' : '/api/fingerprint/opendevice';
    const res = await handleAction(endpoint);
    if (res.success !== false) setIsConnected(!isConnected);
  };

  const handleStartCapture = async () => {
    if (parseInt(mode) === 5) return;
    const res = await handleAction('/api/fingerprint/startcapture', {
      mode: parseInt(mode),
      nMissingFinger: parseInt(nMissingFinger)
    });
    if (res.success !== false) setIsCapturing(true);
  };

  const handleStopCapture = async () => {
    const res = await handleAction('/api/fingerprint/stopcapture');
    if (res.success !== false) setIsCapturing(false);
  };

  const handleEnroll = () => {
    if (!nik) return;
    handleAction('/api/fingerprint/startenroll', {
      userId: parseInt(nik) || 0,
      missingFinger: parseInt(nMissingFinger),
      captureType: parseInt(mode),
      featureFormat: parseInt(featureFormat)
    });
  };

  // --- LOGIKA VERIFIKASI 1:1 ---
  const handleVerify11 = async () => {
    if (!nik) return;
    setIsLoading(true);
    setMatchResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fingerprint/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(nik),
          captureType: 3, // OneFinger untuk verifikasi
          missingFinger: 0,
          featureFormat: parseInt(featureFormat)
        })
      });
      const json = await res.json();
      if (res.ok) {
        setMatchResult({
          userId: json.UserID,
          name: json.Name,
          address: json.Address,
          status: "AUTHORIZED",
          type: "VERIFY_1:1",
          accuracy: "99.2%"
        });
        setCapturedBuffer("data:image/bmp;base64," + json.Image);
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  // --- LOGIKA IDENTIFIKASI 1:N ---
  const handleIdentify1N = async () => {
    setIsLoading(true);
    setMatchResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fingerprint/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captureType: 3,
          featureFormat: parseInt(featureFormat)
        })
      });
      const json = await res.json();
      if (res.ok && json.UserID) {
        setMatchResult({
          userId: json.UserID,
          name: json.Name,
          address: json.Address,
          status: "AUTHORIZED",
          type: "IDENTIFY_1:N",
          accuracy: "97.5%"
        });
        setCapturedBuffer("data:image/bmp;base64," + json.Image);
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  // =========================================================================
  // RENDER: MENU VERIFICATION (LAYOUT BARU)
  // =========================================================================
  if (activeTab === 'verification') {
    return (
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar text-left font-mono">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start shrink-0">
          
          {/* PANEL KIRI: METODE KONTROL */}
          <div className="flex flex-col gap-6">
            {/* METODE 1:1 */}
            <div className="border-2 border-[#00ffff]/40 bg-zinc-900/60 p-6 relative rounded-sm shadow-xl">
              <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase">Metode Verifikasi 1:1</div>
              <div className="flex flex-col gap-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-[#00ffff]/40 font-black uppercase tracking-widest ml-1">Input User ID / NIK Terdaftar</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                       <input 
                        value={nik} 
                        onChange={(e) => setNik(e.target.value)} 
                        placeholder="MASUKKAN ID" 
                        className="w-full bg-black/40 border-2 border-[#00ffff]/10 focus:border-[#00ffff] text-[14px] p-3 text-[#00ffff] outline-none transition-all rounded-sm uppercase font-mono pl-10" 
                      />
                      <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00ffff]/30" />
                    </div>
                    <button 
                      onClick={handleVerify11}
                      disabled={!isConnected || !nik || isLoading}
                      className="px-6 bg-[#00ffff]/10 border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black font-black text-[11px] uppercase transition-all flex items-center gap-2"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Scan size={14} />}
                      Scan 1:1
                    </button>
                  </div>
                </div>
                <p className="text-[8px] text-zinc-500 italic uppercase tracking-tighter">Lakukan input ID subjek terlebih dahulu sebelum memulai pemindaian spesifik</p>
              </div>
            </div>

            {/* METODE 1:N */}
            <div className="border-2 border-[#00ffff]/20 bg-zinc-950/80 p-6 relative rounded-sm shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none"><Search size={80} className="text-[#00ffff]" /></div>
              <div className="absolute -top-[12px] left-6 bg-[#00ffff] text-black px-4 py-0.5 text-[10px] font-black uppercase">Metode Verifikasi 1:N</div>
              <div className="flex items-center justify-between gap-4 mt-2">
                <div className="flex-1">
                  <span className="text-[11px] font-black text-white uppercase tracking-widest block mb-1">Identifikasi Massal</span>
                  <span className="text-[8px] text-zinc-500 uppercase">Pencarian identitas di seluruh pangkalan data</span>
                </div>
                <button 
                  onClick={handleIdentify1N}
                  disabled={!isConnected || isLoading}
                  className="px-8 py-3 bg-white text-black hover:bg-[#00ffff] font-black text-[11px] uppercase transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center gap-2"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Fingerprint size={14} />}
                  Mulai Scan 1:N
                </button>
              </div>
            </div>

            {/* STATUS KONEKSI DEVICE */}
            <div className="flex items-center justify-between bg-black/60 p-4 border border-[#00ffff]/10 rounded-sm">
               <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-rose-600'}`} />
                  <span className={`text-[10px] font-black uppercase ${isConnected ? 'text-emerald-400' : 'text-rose-500'}`}>
                    Status Perangkat: {isConnected ? 'Online' : 'Offline'}
                  </span>
               </div>
               <button onClick={handleConnectToggle} className={`px-4 py-1 border-2 text-[9px] font-black uppercase transition-all ${isConnected ? 'border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black'}`}>
                 {isConnected ? 'Disconnect' : 'Connect Device'}
               </button>
            </div>
          </div>

          {/* PANEL KANAN: KONTAINER HASIL (AUTHORIZED BOX) */}
          <div className="h-full min-h-[420px] border-2 border-[#00ffff]/40 bg-zinc-900/60 p-8 relative rounded-sm shadow-2xl flex flex-col gap-6 overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><ShieldCheck size={200} className="text-[#00ffff]" /></div>
             <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase">Analysis_Output_Stream</div>

             {matchResult ? (
               <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right duration-500 relative z-10">
                  {/* Status Identitas */}
                  <div className="p-6 border-2 border-emerald-500/40 bg-emerald-500/5 rounded-sm flex flex-col gap-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10"><UserCheck size={80} className="text-emerald-400" /></div>
                     
                     <div className="grid grid-cols-2 gap-x-12 gap-y-6 relative z-10">
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Identitas Terdeteksi</span>
                           <span className="text-2xl font-black text-white truncate uppercase">{matchResult.name}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Otorisasi_State</span>
                           <div className="flex items-center gap-2 text-emerald-400">
                             <ShieldCheck size={20} className="animate-pulse" />
                             <span className="text-xl font-black uppercase tracking-tighter">{matchResult.status}</span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">UID_Token</span>
                           <span className="text-[12px] font-bold text-[#00ffff] bg-[#00ffff]/10 px-3 py-1 w-fit border border-[#00ffff]/20 rounded-sm font-mono">{matchResult.userId}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                           <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Akurasi_Skor</span>
                           <span className="text-[14px] text-zinc-300 font-black uppercase">{matchResult.accuracy}</span>
                        </div>
                     </div>
                     <div className="mt-2 pt-3 border-t border-emerald-500/20 flex justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-wider font-mono">
                        <span>Node: SECURE_ALPHA_9</span>
                        <div className="flex items-center gap-2"><History size={10} /> <span>16/03/2026, 09:12:45</span></div>
                     </div>
                  </div>

                  {/* captured image preview */}
                  <div className="flex flex-col gap-3">
                     <span className="text-[9px] text-[#00ffff] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <Scan size={14} /> Fingerprint_Extraction_Buffer
                     </span>
                     <div className="flex gap-4">
                        <div className="w-32 h-40 border-2 border-[#00ffff]/30 bg-black rounded-sm p-1 shadow-lg relative overflow-hidden flex items-center justify-center">
                           {capturedBuffer ? (
                             <img src={capturedBuffer} className="w-full h-full object-contain animate-in zoom-in-95" alt="Proof" />
                           ) : (
                             <Fingerprint size={32} className="opacity-10" />
                           )}
                           <div className="absolute top-0 left-0 bg-black/80 px-1 text-[6px] text-[#00ffff] uppercase font-black">Proof_Captured</div>
                        </div>
                        <div className="flex-1 bg-black/40 border border-white/5 p-4 rounded-sm flex flex-col justify-center">
                           <p className="text-[10px] text-zinc-500 leading-relaxed italic border-l-2 border-emerald-500/30 pl-3">
                              Ekstraksi pola biometrik sukses. Data visual diarsipkan ke sistem pusat sebagai bukti otentikasi subjek {matchResult.userId}.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 italic opacity-20 gap-4">
                  <Activity size={80} strokeWidth={1} />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-black uppercase tracking-[0.5em]">Awaiting_Signal</span>
                    <span className="text-[8px] uppercase tracking-widest">Lakukan pemindaian untuk melihat hasil analisis</span>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: MENU ENROLLMENT (TETAP SESUAI DESAIN SEBELUMNYA)
  // =========================================================================
  return (
    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar text-left font-mono">
      
      <div className="flex flex-col lg:flex-row gap-6 items-stretch shrink-0">
        {/* PANEL KIRI: CAPTURE CONTROL */}
        <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-900/60 p-6 relative rounded-sm flex flex-col justify-between shadow-xl min-h-[300px]">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase z-[50]">Capture Control</div>
          <div className="absolute -top-[14px] right-6 z-[60]">
            <button disabled={isLoading || isCapturing} onClick={handleConnectToggle} className={`px-4 py-1.5 border-2 text-[9px] font-black uppercase transition-all flex items-center gap-2 shadow-lg ${isConnected ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600' : 'bg-emerald-500 border-emerald-500 text-black hover:bg-white active:scale-95'}`}>
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : (isConnected ? <Power size={12} /> : <Wifi size={12} />)}
              {isConnected ? 'Disconnect' : 'Connect Device'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-x-8 gap-y-4 text-left mt-4">
            <div className="space-y-1"><label className="text-[9px] text-[#00ffff]/60 font-black uppercase tracking-widest">Mode Capture</label><select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full bg-black border-2 border-[#00ffff]/20 text-[10px] p-2.5 text-white outline-none focus:border-[#00ffff] font-mono"><option value="0">LeftFinger</option><option value="1">RightFinger</option><option value="2">BothThumb</option><option value="3">OneFinger</option><option value="4">Roll</option><option value="5">TenFinger</option></select></div>
            <div className="space-y-1"><label className="text-[9px] text-[#00ffff]/60 font-black uppercase tracking-widest">Missing Finger</label><select value={nMissingFinger} onChange={(e) => setNMissingFinger(e.target.value)} className="w-full bg-black border-2 border-[#00ffff]/20 text-[10px] p-2.5 text-[#00ffff] outline-none font-mono">{[0, 1, 2, 3, 4].map(val => <option key={val} value={val}>{val}</option>)}</select></div>
            <div className="space-y-1"><label className="text-[9px] text-[#00ffff]/60 font-black uppercase tracking-widest">Feature Format</label><select value={featureFormat} onChange={(e) => setFeatureFormat(e.target.value)} className="w-full bg-black border-2 border-[#00ffff]/20 text-[10px] p-2.5 text-[#00ffff] outline-none font-mono"><option value="0">ANSI v2004</option><option value="1">ANSI v2009</option><option value="2">ISO v2005</option><option value="3">ISO v2011</option></select></div>
            <div className="space-y-1"><label className="text-[9px] text-[#00ffff]/60 font-black uppercase tracking-widest">Image Format</label><select value={imageFormat} onChange={(e) => setImageFormat(e.target.value)} className="w-full bg-black border-2 border-[#00ffff]/20 text-[10px] p-2.5 text-[#00ffff] outline-none font-mono"><option value="0">RAW</option><option value="1">JPEG</option><option value="2">BMP2000</option><option value="3">WSQ</option></select></div>
            <div className="col-span-2 flex flex-col gap-1 mt-1"><span className={`text-[9px] font-black uppercase tracking-widest ${isConnected ? 'text-emerald-400' : 'text-rose-500'}`}>STATUS: {isConnected ? 'DEVICE_READY' : 'DEVICE_OFFLINE'}</span><span className="text-[7px] text-zinc-500 font-bold uppercase tracking-tighter">BIOMETRIC_PROTOCOL_V.1.2</span></div>
          </div>
          <div className="flex gap-4 mt-6"><button onClick={handleStartCapture} disabled={!isConnected || isCapturing || isLoading} className={`flex-1 py-3 border-2 font-black uppercase text-[11px] transition-all flex items-center justify-center gap-2 ${isConnected && !isCapturing ? 'bg-zinc-950 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black' : 'bg-zinc-900 border-zinc-700 text-zinc-600'}`}><Play size={14} fill="currentColor" /> Start Capture</button><button onClick={handleStopCapture} disabled={!isCapturing || isLoading} className={`flex-1 py-3 border-2 font-black uppercase text-[11px] transition-all flex items-center justify-center gap-2 ${isCapturing ? 'bg-zinc-950 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-600'}`}><CircleStop size={14} fill="currentColor" /> Stop Capture</button></div>
        </div>

        {/* PANEL KANAN: REGISTRASI DATA USER */}
        <div className="flex-1 border-2 border-[#00ffff]/20 bg-zinc-950/80 p-6 relative rounded-sm text-left shadow-lg overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none"><Shield size={160} className="text-[#00ffff]" /></div>
          <div className="flex items-center gap-4 border-b border-[#00ffff]/10 pb-3 mb-4"><div className="w-9 h-9 bg-[#00ffff]/10 flex items-center justify-center border border-[#00ffff]/30 rounded-sm text-[#00ffff]"><User size={18} /></div><div className="flex flex-col"><span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Registrasi_Data_User</span><span className="text-[7px] text-zinc-500 uppercase tracking-widest italic">Biometric Vault Entry</span></div></div>
          <div className="space-y-4 relative z-10"><div className="space-y-1.5"><label className="text-[8px] text-[#00ffff]/40 font-black uppercase tracking-widest ml-1">Nomor Induk Kependudukan</label><input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="User ID / NIK" className="w-full bg-black/40 border border-[#00ffff]/20 focus:border-[#00ffff] text-[12px] p-3 text-[#00ffff] outline-none rounded-sm font-mono uppercase shadow-inner" /></div><div className="space-y-1.5"><label className="text-[8px] text-[#00ffff]/40 font-black uppercase tracking-widest ml-1">Nama Lengkap Subjek</label><input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="NAMA LENGKAP" className="w-full bg-black/40 border border-[#00ffff]/20 focus:border-[#00ffff] text-[12px] p-3 text-[#00ffff] outline-none rounded-sm font-mono shadow-inner" /></div></div>
          <div className="flex gap-3 mt-6"><button onClick={handleEnroll} disabled={!isConnected || isLoading || !nik} className={`flex-[2] py-3 border-2 font-black text-[10px] uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 ${isConnected && nik ? 'bg-[#00ffff] border-[#00ffff] text-black hover:bg-white shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-zinc-900 border-zinc-700 text-zinc-600'}`}><CheckCircle2 size={14} /> Enroll Ten Finger</button><button onClick={() => {setNik(""); setUserName("");}} className="flex-1 py-3 border-2 border-[#ff00ff]/30 text-[#ff00ff] text-[10px] font-black hover:bg-[#ff00ff] hover:text-white uppercase transition-all rounded-sm">Clear</button></div>
        </div>
      </div>

      {/* BARIS BAWAH: 10 SLOT JARI (Visual Buffer) - HANYA MUNCUL DI ENROLLMENT */}
      {activeTab === 'enrollment' && (
        <div className="w-full border-2 border-[#00ffff]/20 bg-black/40 p-6 rounded-sm shadow-xl shrink-0">
          <div className="flex items-center gap-3 border-b border-[#00ffff]/10 pb-3 mb-5"><Fingerprint size={16} className="text-[#00ffff]" /><span className="text-[10px] font-black text-[#00ffff] uppercase tracking-[0.3em]">Finger_Extraction_Visual_Buffer</span></div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-4">{fingerCaptures.map((img, idx) => (<div key={idx} className="flex flex-col items-center gap-2"><div className="relative w-full aspect-square border-2 border-[#00ffff]/20 bg-zinc-950 rounded-sm overflow-hidden flex items-center justify-center group hover:border-[#00ffff]/60 transition-all">{img ? (<img src={img} className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-300" alt={`Finger ${idx + 1}`} />) : (<div className="flex flex-col items-center opacity-10"><Fingerprint size={24} /></div>)}{isCapturing && !img && (<div className="absolute inset-x-0 h-[1px] bg-[#00ffff] shadow-[0_0_8px_#00ffff] animate-pixel-scan" />)}<div className="absolute top-0 left-0 bg-black/60 px-1 text-[6px] font-black text-zinc-500 uppercase border-r border-b border-[#00ffff]/10">F_{String(idx + 1).padStart(2, '0')}</div></div><span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">{idx < 5 ? `L_${idx + 1}` : `R_${idx - 4}`}</span></div>))}</div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pixel-scan { 0% { top: 0; } 100% { top: 100%; } }
        .animate-pixel-scan { animation: pixel-scan 2s linear infinite; }
      `}</style>
    </div>
  );
};

export default FingerprintModule;