"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Folder, Activity, Wifi, WifiOff, Scan, X, RefreshCw, Database, Cpu, Clock } from 'lucide-react';

/**
 * BarcodeScannerModule (REST API INTEGRATION)
 * Modul untuk pemindaian barcode 1D/2D dengan integrasi API lokal.
 * Layout dioptimalkan dengan padding yang lebih rapat untuk efisiensi ruang.
 */
const BarcodeScannerModule = ({ data }) => {
  const [logs, setLogs] = useState([`[SYSTEM] Barcode Engine v1.0 Ready.`]);
  const [scanMode, setScanMode] = useState("Upload_File");
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hasBuffer, setHasBuffer] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/', { mode: 'cors' });
      if (res.ok) {
        setIsConnected(true);
        addLog("[SYSTEM] Connected to Barcode Server at localhost:8000");
      }
    } catch (err) {
      setIsConnected(false);
      addLog("[ERROR] Barcode Server Offline. Pastikan backend aktif.");
    }
  };

  const addLog = (msg) => {
    setLogs(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p].slice(0, 50));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addLog(`[ERROR] Format file tidak didukung: ${file.name}`);
        return;
      }

      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setHasBuffer(true);

      window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: url }));
      
      addLog(`[FILE] Sumber dimuat ke buffer: ${file.name}`);
      setScanResult(null);
    }
  };

  const handleScan = async () => {
    if (!selectedFile && scanMode === "Upload_File") {
      addLog("[WARN] Silakan pilih file terlebih dahulu.");
      return;
    }

    setIsScanning(true);
    addLog("[PROCESS] Menjalankan pemindaian algoritma 1D/2D...");
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8000/scan', {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const result = await response.json();
      
      if (result.status === "success") {
        setScanResult({
            data: result.result?.data || "N/A",
            type: result.result?.type || "Unknown",
            method: result.result?.method || "Standard",
            latency: result.latency_ms || 0
        });
        addLog(`[SUCCESS] Barcode Terdeteksi: ${result.result?.data || "No Data"}`);
      } else {
        addLog(`[ERROR] Pemindaian gagal: ${result.message || "Unknown error"}`);
      }
      
    } catch (error) {
      if (error instanceof TypeError) {
        addLog("[CRITICAL] Network Error/CORS Blocked. Periksa backend.");
      } else {
        addLog(`[ERROR] Gagal memindai: ${error.message}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const resetBuffer = () => {
    setSelectedFile(null);
    setHasBuffer(false);
    setScanResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
    addLog("[SYSTEM] Buffer visual dibersihkan.");
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
      {/* BAGIAN ATAS (Visualizer & Capture Control) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start shrink-0">
        
        {/* Unit Visual (Gojo GIF) */}
        {/* <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/20 bg-zinc-950 overflow-hidden group shadow-2xl rounded-sm">
            <img 
              src="https://media.tenor.com/5xqhfhbtx78AAAAj/gojo.gif" 
              alt="Gojo Visualizer" 
              className={`w-full h-full object-cover transition-all duration-500 ${hasBuffer ? 'opacity-100 grayscale-0 scale-105' : 'opacity-40 grayscale brightness-75'}`} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            <div className="absolute top-2 right-2 flex flex-col items-end pointer-events-none">
              <div className={`flex items-center gap-1.5 px-2 py-0.5 bg-black/80 border text-[8px] font-black uppercase tracking-widest ${isConnected ? 'text-emerald-400 border-emerald-500/50' : 'text-red-500 border-red-500/50'}`}>
                {isConnected ? <Wifi size={8} /> : <WifiOff size={8} />}
                {isConnected ? 'ONLINE' : 'OFFLINE'}
              </div>
            </div>
            <div className="absolute bottom-2 left-2 flex flex-col items-start z-10">
               <span className={`text-[9px] font-black uppercase tracking-tighter ${hasBuffer ? 'text-[#00ffff]' : 'text-zinc-500'}`}>
                 {hasBuffer ? "BUFFER_ACTIVE" : "IDLE_STATE"}
               </span>
            </div>
            {isScanning && (
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="w-full h-1 bg-[#00ffff] shadow-[0_0_15px_#00ffff] animate-pixel-scan" />
              </div>
            )}
          </div>
          <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">Local_Buffer_v1</span>
        </div> */}

        {/* Panel Kontrol Capture */}
        <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-900/60 p-5 relative rounded-sm group flex flex-col gap-4 shadow-2xl min-h-[160px]">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase z-[50] font-mono text-[14px]">Capture Control</div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1">
              <label className="text-[12px] text-[#00ffff]/60 font-black block uppercase tracking-widest flex items-center gap-2 py-1 font-mono">
                <Scan size={12} /> Mode Operasi
              </label>
              <select 
                value={scanMode} 
                onChange={(e) => setScanMode(e.target.value)} 
                className="w-full bg-black border-2 border-[#00ffff]/20 text-[12px] p-2 text-white outline-none focus:border-[#00ffff] font-mono cursor-pointer transition-colors"
              >
                <option value="Upload_File">Upload_File (Manual_Input)</option>
                <option value="Camera" disabled>Live_Camera (In_Development)</option>
              </select>
            </div>
            {scanMode === "Upload_File" && (
              <div className="flex-1 w-full space-y-1">
                <div className="flex gap-2 h-[34px]">
                  <button 
                    onClick={() => fileInputRef.current.click()} 
                    className={`flex-1 border-2 border-dashed text-[14px] font-black flex items-center justify-center gap-2 transition-all ${hasBuffer ? 'bg-[#00ffff]/20 border-[#00ffff] text-[#00ffff] font-mono' : 'bg-[#00ffff]/5 border-[#00ffff]/30 text-zinc-500 hover:border-[#00ffff]'}`}
                  >
                    <Folder size={14} />
                    <span>{hasBuffer ? 'Ganti_File' : 'Browse_PC'}</span>
                  </button>
                  {hasBuffer && (
                    <button onClick={resetBuffer} className="px-3 bg-red-500/10 border-2 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            )}
          </div>
          <div className="mt-1">
            <button 
              onClick={handleScan}
              disabled={isScanning || (!hasBuffer && scanMode === "Upload_File")}
              className={`w-full py-1.5 border-2 font-black uppercase tracking-[0.2em] text-[15px] transition-all flex items-center justify-center  font-mono gap-3 ${isScanning ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : 'bg-[#00ffff] border-[#00ffff] text-black hover:brightness-110 shadow-[0_0_15px_rgba(0,255,255,0.3)]'}`}
            >
              {isScanning ? <RefreshCw size={14} className="animate-spin" /> : <Scan size={14} />}
              <span>{isScanning ? 'Menganalisa...' : 'Mulai Scan Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tampilan Bawah: Console & Decoded Output (SINKRONISASI HORIZONTAL) */}
      <div className="flex-1 flex flex-col md:flex-row gap-10 min-h-[320px] mb-2 overflow-hidden pt-6">
        
        {/* Console Output (flex-1) */}
        <div className="w-full lg:w-[10px] md:flex-1 border-2 border-[#00ffff]/20 bg-black/90 p-4 flex flex-col rounded-sm overflow-hidden text-left font-mono text-[14px] text-zinc-400 shadow-inner">
            <div className="flex justify-between items-center border-b border-[#00ffff]/10 pb-1.5 mb-2">
              <div className="flex items-center gap-3 text-[#00ffff] uppercase font-black">
                  <Activity size={12} className="animate-pulse" />
                  <span>Console_Output</span>
              </div>
              <button onClick={() => setLogs([`[SYSTEM] Log cleared.`])} className="text-[9px] hover:text-[#00ffff] transition-colors">CLEAR_LOGS</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {logs.map((l, i) => (
                  <div key={i} className={`flex gap-3 leading-tight ${l.includes('[ERROR]') || l.includes('[CRITICAL]') ? 'text-red-400' : l.includes('[SUCCESS]') ? 'text-emerald-400' : ''}`}>
                    <span className="opacity-30">{(logs.length - i).toString().padStart(2, '0')}</span>
                    <span className="break-all">{l}</span>
                  </div>
              ))}
              {isScanning && <div className="animate-pulse text-[#00ffff]">_</div>}
            </div>
        </div>

        {/* Decoded Output (flex-1) - LEBIH LEBAR KE HORIZONTAL KANAN */}
        <div className="w-full lg:w-[1000px] md:flex-1 border-2 border-[#00ffff]/40 bg-zinc-950 flex flex-col rounded-sm relative overflow-hidden shadow-2xl min-w-0">
            {/* Header Area */}
            <div className="flex items-center gap-3 text-[#00ffff] py-2 px-4 uppercase font-black border-b border-[#00ffff]/10 relative z-10 bg-zinc-900/50 shrink-0 font-mono">
                <Database size={12} />
                <span>Decoded_Data_Stream</span>
                <div className="ml-auto opacity-20">
                  <Database size={16} />
                </div>
            </div>

            {/* Content Area - MEPET KE BORDER */}
            <div className="flex-1 flex flex-col p-0.5 gap-0.5 relative z-10 overflow-y-auto custom-scrollbar px-4">
                {scanResult ? (
                    <div className="space-y-0.5 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Data Barcode Utama - LEBAR PENUH */}
                        <div className="bg-[#00ffff]/5 border border-[#00ffff]/40 p-5 rounded-sm">
                            <span className="text-[7px] text-[#00ffff]/60 uppercase font-black tracking-[0.3em] block mb-1 underline decoration-[#00ffff]/20 underline-offset-4">Raw_Data_Value</span>
                            <div className="text-xl font-mono text-[#00ffff] break-all font-black tracking-tighter leading-none py-1">
                                {scanResult.data}
                            </div>
                        </div>

                        {/* Detail Metadata Terstruktur */}
                        <div className="grid grid-cols-1 gap-0.5 text-[10px] bg-black/40 border border-[#00ffff]/10 rounded-sm overflow-hidden">
                            <div className="flex justify-between items-center py-2 px-4 hover:bg-[#00ffff]/5 transition-colors border-b border-[#00ffff]/5">
                                <span className="text-zinc-500 uppercase flex items-center gap-3 font-black"><Cpu size={12} className="text-[#00ffff]/40" /> Symbology_Type</span>
                                <span className="text-white font-black bg-[#00ffff]/10 px-3 py-0.5 rounded-sm border border-[#00ffff]/20">{scanResult.type}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 px-4 hover:bg-[#00ffff]/5 transition-colors border-b border-[#00ffff]/5">
                                <span className="text-zinc-500 uppercase flex items-center gap-3 font-black"><Scan size={12} className="text-[#00ffff]/40" /> Engine_Method</span>
                                <span className="text-white font-black tracking-widest">{scanResult.method}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 px-4 hover:bg-[#00ffff]/5 transition-colors">
                                <span className="text-zinc-500 uppercase flex items-center gap-3 font-black"><Clock size={12} className="text-[#00ffff]/40" /> Process_Latency</span>
                                <span className="text-emerald-400 font-black bg-emerald-500/10 px-3 py-0.5 rounded-sm border border-emerald-500/20">{scanResult.latency} ms</span>
                            </div>
                        </div>

                        {/* Status Integrity Footer */}
                        <div className="px-2 py-2 bg-zinc-900/40 border border-[#00ffff]/5 rounded-sm">
                             <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden border border-[#00ffff]/10">
                                <div className="h-full bg-[#00ffff] animate-pulse shadow-[0_0_12px_#00ffff]" style={{ width: '100%' }} />
                             </div>
                             <div className="flex justify-between mt-1 px-1">
                                <span className="text-[7px] text-zinc-600 uppercase tracking-tighter font-black flex items-center gap-1">
                                  <Database size={8} /> Secure_Encryption_Active
                                </span>
                                <span className="text-[7px] text-[#00ffff]/50 font-black">VERIFIED_INTEGRITY</span>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 py-10">
                        <Scan size={40} className="text-[#00ffff] mb-3 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#00ffff]">System_Idle</span>
                        <div className="w-24 h-[1px] bg-[#00ffff]/20 mt-2" />
                        <span className="text-[7px] text-zinc-600 mt-2 uppercase tracking-[0.5em]">Waiting_For_Input</span>
                    </div>
                )}
            </div>

            {/* Aksesoris Siku untuk Kesan Cyber */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ffff]/40 z-20" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00ffff]/40 z-20" />
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModule;