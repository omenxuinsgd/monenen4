"use client";
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  RefreshCw, 
  ShieldCheck,
  User,
  MapPin,
  IdCard,
  Send,
  Database,
  Trash2,
  FileText,
  Loader2
} from 'lucide-react';

/**
 * SignPadModule (API INTEGRATED & ERROR OPTIMIZED)
 * Logika: 
 * 1. Area visual mini TETAP GIF selamanya.
 * 2. Klik 'Simpan Data' -> API Registrasi Wajah -> Mengaktifkan Sidebar Kiri.
 * 3. Klik 'SAVE' di Sidebar -> API Enroll Signature -> Masuk Tabel Otomatis.
 * Perbaikan: Mengganti placeholder eksternal dengan SVG Data URI untuk mencegah ERR_NAME_NOT_RESOLVED.
 */
const SignPadModule = ({ data }) => {
  const [logs, setLogs] = useState([`[SYSTEM] Registration Hub v1.4.5 Online.`]);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [regData, setRegData] = useState({ userId: "", fullName: "", address: "" });
  
  // Placeholder Signature (SVG Base64) agar tidak bergantung pada koneksi internet
  const placeholderSign = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSIzMCI+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtc2l6ZT0iOCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZHk9Ii4zZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5PX0lNRzwvdGV4dD48L3N2Zz4=";

  const [userList, setUserList] = useState([
    {
      id: "91931",
      name: "nuyyy",
      address: "sadasdasd",
      image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Kirsch_Signature.png",
      date: "2026-03-05 12:19:13"
    }
  ]);

  const API_BASE = "http://localhost:5160"; 

  useEffect(() => {
    console.log("[DEBUG] SignPadModule Initialized. Waiting for signature capture event.");

    const handleCaptureComplete = async (event) => {
        const signatureBase64 = event.detail;
        
        if (!signatureBase64) {
            console.error("[DEBUG] Error: No signature data found in event.");
            addLog("Gagal menangkap tanda tangan: Data kosong.", "error");
            return;
        }

        setIsApiLoading(true);
        addLog("Memproses pendaftaran tanda tangan...", "info");

        try {
            // 1. Konversi Base64 ke Blob
            const resBlob = await fetch(signatureBase64);
            const blob = await resBlob.blob();

            if (!blob) throw new Error("Failed to create blob from signature");

            // 2. Siapkan FormData
            const formData = new FormData();
            formData.append("image", blob, "signature.png");
            formData.append("userId", regData.userId);

            // 3. Eksekusi Request POST
            const res = await fetch(`${API_BASE}/api/palm/enroll_sign`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("[API ERROR]", errorText);
                addLog(`Enroll failed: ${res.status}`, "error");
                return;
            }

            const json = await res.json();
            console.log("[API SUCCESS]", json);
            addLog("Sinkronisasi biometrik sukses!", "success");

            // 4. Update Tabel Lokal (Langsung tampilkan)
            const newUserRecord = {
                id: regData.userId,
                name: regData.fullName,
                address: regData.address || "-",
                image: signatureBase64, 
                date: new Date().toISOString().replace('T', ' ').split('.')[0]
            };

            setUserList(prev => [newUserRecord, ...prev]);
            addLog(`User [${regData.fullName}] berhasil didaftarkan.`, "success");

            // 5. Reset Form
            handleResetAll();

        } catch (err) {
            console.error("[SERVER ERROR]", err);
            addLog(`Server error: ${err.message}`, "error");
        } finally {
            setIsApiLoading(false);
        }
    };

    window.addEventListener('signpad:capture-complete', handleCaptureComplete);
    return () => window.removeEventListener('signpad:capture-complete', handleCaptureComplete);
  }, [regData]); 

  // --- SINKRONISASI LOG KE SIDEBAR ---
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scanner:logs-sync', { detail: logs }));
  }, [logs]);
  

  const addLog = (msg, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '[ERROR]' : type === 'success' ? '[SUCCESS]' : '[INFO]';
    setLogs(p => [`${prefix} ${msg} (${timestamp})`, ...p].slice(0, 100));
  };

  const handleRegister = async () => {
    if (!regData.userId || !regData.fullName) {
      addLog("Gagal: User ID dan Nama wajib diisi!", "error");
      return;
    }
    setIsDataSaved(true);
    window.dispatchEvent(new CustomEvent('signpad:data-ready'));
    addLog("Data disimpan. Silakan tanda tangan di sidebar.", "success");
  };

  const handleResetAll = () => {
    setRegData({ userId: "", fullName: "", address: "" });
    setIsDataSaved(false);
    window.dispatchEvent(new CustomEvent('signpad:data-reset')); 
  };

  const handleDeleteUser = (id) => {
    setUserList(prev => prev.filter(u => u.id !== id));
    addLog(`ID [${id}] dihapus dari vault.`, "info");
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-8 items-start shrink-0">
        {/* <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/30 bg-zinc-950 overflow-hidden shadow-2xl rounded-sm group">
             <img 
                src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2N3ZXg5NzV5ZW9hZHJpY2xxMjRid2Q3dGt3aTBuNWwyMWI0cTFwbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/gUNA7QH4AeLde/giphy.gif" 
                alt="Standby GIF" 
                className={`w-full h-full object-cover transition-all duration-700 ${isDataSaved ? 'opacity-100 grayscale-0' : 'opacity-60 grayscale brightness-125'}`} 
             />
             <div className="absolute top-2 right-2 z-20">
              <div className={`flex items-center gap-1.5 px-2 py-0.5 bg-black/80 border border-emerald-500/50 text-[7px] text-emerald-400 font-black uppercase tracking-widest`}>
                <Wifi size={8} /> ONLINE
              </div>
            </div>
            {isApiLoading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30">
                    <Loader2 size={24} className="text-[#00ffff] animate-spin mb-2" />
                    <span className="text-[8px] text-[#00ffff] font-black uppercase tracking-widest">Processing...</span>
                </div>
            )}
          </div>
          <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">Sign_Buffer_v1</span>
        </div> */}

        <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-900/60 p-5 relative rounded-sm flex font-mono flex-col shadow-2xl min-h-[160px]">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[16px] font-black uppercase z-[50]">Registrasi Data User</div>
          <div className="grid grid-cols-3 gap-x-4 text-left font-mono py-4">
            <div className="space-y-1">
              <label className="text-[12px] text-[#00ffff]/60 uppercase font-black tracking-widest flex items-center gap-1"><IdCard size={14} /> User_ID / NIK</label>
              <input disabled={isDataSaved || isApiLoading} type="text" value={regData.userId} onChange={(e) => setRegData({...regData, userId: e.target.value})} placeholder="ID Number..." className={`w-full bg-black border border-[#00ffff]/20 p-2 text-[14px] text-[#00ffff] outline-none focus:border-[#00ffff]/60 transition-all ${isDataSaved ? 'opacity-40' : ''}`} />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-[#00ffff]/60 uppercase font-black tracking-widest flex items-center gap-1"><User size={14} /> Full_Name</label>
              <input disabled={isDataSaved || isApiLoading} type="text" value={regData.fullName} onChange={(e) => setRegData({...regData, fullName: e.target.value})} placeholder="Name..." className={`w-full bg-black border border-[#00ffff]/20 p-2 text-[14px] text-white outline-none focus:border-[#00ffff]/60 uppercase transition-all ${isDataSaved ? 'opacity-40' : ''}`} />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-[#00ffff]/60 uppercase font-black tracking-widest flex items-center gap-1"><MapPin size={14} /> Address</label>
              <input disabled={isDataSaved || isApiLoading} type="text" value={regData.address} onChange={(e) => setRegData({...regData, address: e.target.value})} placeholder="Street..." className={`w-full bg-black border border-[#00ffff]/20 p-2 text-[14px] text-zinc-400 outline-none focus:border-[#00ffff]/60 transition-all ${isDataSaved ? 'opacity-40' : ''}`} />
            </div>
          </div>
          <div className="mt-auto pt-3 flex gap-4">
             <button onClick={handleRegister} disabled={isDataSaved || isApiLoading} className={`flex-1 py-1.5 font-black text-[16px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,255,0.2)] ${!isDataSaved && !isApiLoading ? 'bg-[#00ffff] text-black hover:brightness-110 active:scale-95' : 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'}`}>
                {isApiLoading ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} 
                {isDataSaved ? "WAITING_SIGNATURE" : "Simpan Data"}
             </button>
             <button disabled={isApiLoading} onClick={handleResetAll} className="px-6 py-1.5 border border-red-500/40 text-red-500 text-[16px] font-black uppercase hover:bg-red-500/10 transition-all active:scale-95">Reset</button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[300px] mb-2 overflow-hidden font-mono">
        {/* <div className="md:flex-[1] border-2 border-[#00ffff]/20 bg-black/90 p-4 flex flex-col rounded-sm text-left font-mono text-zinc-400 shadow-inner overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#00ffff]/10 pb-1.5 mb-2">
              <div className="flex items-center gap-2 text-[#00ffff] uppercase font-black text-[16px]"><Activity size={12} className="animate-pulse" /><span>Biometric_Console</span></div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 text-[12px]">
              {logs.map((l, i) => (
                  <div key={i} className={`flex gap-3 leading-tight ${l.includes('[SUCCESS]') ? 'text-emerald-400' : l.includes('[ERROR]') ? 'text-red-400' : ''}`}>
                    <span className="opacity-20 shrink-0 font-bold">{(logs.length - i).toString().padStart(2, '0')}</span>
                    <span className="break-all">{l}</span>
                  </div>
              ))}
            </div>
        </div> */}

        <div className="md:flex-[2.5] border-2 border-[#00ffff]/40 bg-zinc-950 flex flex-col rounded-sm relative overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 text-[#00ffff] py-2 px-4 uppercase font-black border-b border-[#00ffff]/10 bg-zinc-900/50 shrink-0">
                <Database size={12} />
                <span>Personal Biometric Data</span>
                <div className="ml-auto opacity-40"><FileText size={14} /></div>
            </div>
            
            <div className="flex-1 overflow-x-auto custom-scrollbar p-2 bg-black/40">
                 <table className="w-full text-left font-mono text-[12px] border-collapse">
                    <thead>
                        <tr className="text-zinc-500 border-b border-[#00ffff]/10">
                            <th className="py-2 px-3 uppercase font-black tracking-widest">UserID</th>
                            <th className="py-2 px-3 uppercase font-black tracking-widest">Name</th>
                            <th className="py-2 px-3 uppercase font-black tracking-widest">Address</th>
                            <th className="py-2 px-3 uppercase font-black tracking-widest text-center">Image</th>
                            <th className="py-2 px-3 uppercase font-black tracking-widest">Date</th>
                            <th className="py-2 px-3 uppercase font-black tracking-widest text-right">Option</th>
                        </tr>
                    </thead>
                    <tbody className="text-white">
                        {userList.map((user, idx) => (
                            <tr key={idx} className="border-b border-[#00ffff]/5 hover:bg-[#00ffff]/5 transition-colors group">
                                <td className="py-3 px-3 text-[#00ffff] font-black">{user.id}</td>
                                <td className="py-3 px-3 uppercase font-bold">{user.name}</td>
                                <td className="py-3 px-3 text-zinc-400 max-w-[150px] truncate italic">{user.address}</td>
                                <td className="py-1 px-3">
                                    <div className="flex justify-center">
                                        <div className="p-0.5 border border-white/10 bg-white/5 rounded-sm overflow-hidden">
                                            <img 
                                              src={user.image} 
                                              alt="Signature" 
                                              className="h-10 w-auto min-w-[60px] object-contain bg-white/80 grayscale group-hover:grayscale-0 transition-all" 
                                              onError={(e) => { 
                                                // Mencegah loop jika placeholder itu sendiri gagal (meskipun ini local data URI)
                                                if (e.target.src !== placeholderSign) {
                                                  e.target.src = placeholderSign; 
                                                }
                                              }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-3 text-zinc-500 whitespace-nowrap">{user.date}</td>
                                <td className="py-3 px-3 text-right">
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-400 font-black flex items-center justify-end gap-1 ml-auto">
                                        <Trash2 size={10} /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 {userList.length === 0 && (
                   <div className="py-12 text-center text-zinc-700 uppercase tracking-[0.5em] italic opacity-40">--- No Records Found ---</div>
                 )}
            </div>

            <div className="px-4 py-1.5 bg-zinc-900/40 border-t border-[#00ffff]/10 flex justify-between items-center shrink-0">
               <span className="text-[7px] text-zinc-500 uppercase font-bold flex items-center gap-1"><ShieldCheck size={8}/> Authentication_Active</span>
               <span className="text-[7px] text-[#00ffff]/40 font-black uppercase tracking-widest">Vault_v1.4.5</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SignPadModule;