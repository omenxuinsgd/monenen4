"use client";
import React, { useRef, useState, useEffect } from 'react';
import { 
  Folder, 
  Image as ImageIcon, 
  Scan, 
  X, 
  FileText, 
  RefreshCw, 
  Crosshair,
  BookOpen,
  Table as TableIcon,
  Download,
  AlertCircle,
  Camera,
  Wifi,
  WifiOff,
  Play,
  Square,
  Key
} from 'lucide-react';

/**
 * OCRScannerModule (REST API + SDK Camera INTEGRATION)
 * Modul untuk ekstraksi teks dengan opsi kamera perangkat (SDK) atau upload file.
 * Diperbarui: Sinkronisasi penuh preview streaming ke sidebar utama saat kamera aktif.
 */
const OCRScannerModule = ({ 
  data, 
  setLogs 
}) => {
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [subTab, setSubTab] = useState('text'); 
  const [hasBuffer, setHasBuffer] = useState(false);

  // --- STATE UNTUK INTEGRASI KAMERA SDK ---
  const [inputMode, setInputMode] = useState('file'); // 'file' atau 'camera'
  const [connStatus, setConnStatus] = useState({ cmd: false, mc: false });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [lastFrame, setLastFrame] = useState(null); 
  const [license, setLicense] = useState("");
  const [isLicenseActive, setIsLicenseActive] = useState(false);
  
  const wsCmd = useRef(null);
  const wsMc = useRef(null);

  // Inisialisasi & Cleanup
  useEffect(() => {
    console.log("[DEBUG] OCR Module Ready. Endpoint: http://localhost:8001");
    return () => {
      // Tutup koneksi dan bersihkan preview saat pindah modul
      if (wsCmd.current) wsCmd.current.close();
      if (wsMc.current) wsMc.current.close();
      window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
    };
  }, []);

  // Reset preview saat ganti mode input
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
    if (isCameraOpen) {
      toggleCamera(); // Tutup kamera jika sedang terbuka saat pindah mode
    }
  }, [inputMode]);

  // --- LOGIKA KONEKSI SDK ---
  const connectSDK = (type) => {
    const ports = { cmd: 25014, mc: 9999 };
    const url = `ws://127.0.0.1:${ports[type]}/`;

    try {
      const ws = new WebSocket(url);
      ws.onopen = () => {
        setConnStatus(prev => ({ ...prev, [type]: true }));
        setLogs(p => [...p, `[SDK] Terhubung ke Service ${type.toUpperCase()}`]);
        
        if (type === 'mc') {
          ws.onmessage = (e) => {
            const base64Data = 'data:image/jpeg;base64,' + e.data;
            setLastFrame(base64Data);
            // KIRIM STREAM KE SIDEBAR UTAMA
            window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: base64Data }));
          };
        }

        if (type === 'cmd') {
          ws.onmessage = (e) => {
            try {
              const res = JSON.parse(e.data);
              if (res.id === 2) { // Response inisialisasi
                if (res.error === 0 || res.error === 9) {
                  setIsLicenseActive(true);
                  setLogs(p => [...p, `[SUCCESS] Lisensi SDK Berhasil Diaktifkan.`]);
                } else {
                  setLogs(p => [...p, `[ERROR] Aktivasi Lisensi Gagal: Kode ${res.error}`]);
                }
              }
            } catch (err) {}
          };
        }
      };
      ws.onclose = () => {
        setConnStatus(prev => ({ ...prev, [type]: false }));
        if (type === 'mc') window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
      };
      if (type === 'cmd') wsCmd.current = ws;
      if (type === 'mc') wsMc.current = ws;
    } catch (e) {
      setLogs(p => [...p, `[ERROR] SDK Connection Failed: ${e.message}`]);
    }
  };

  const handleInitSDK = () => {
    if (wsCmd.current?.readyState === WebSocket.OPEN) {
      setLogs(p => [...p, `[ACTION] Mengirim permintaan lisensi...`]);
      wsCmd.current.send(JSON.stringify({ id: 1, license: license }));
    } else {
      setLogs(p => [...p, `[ERROR] Hubungkan CMD Service terlebih dahulu.`]);
    }
  };

  const toggleCamera = () => {
    if (!connStatus.cmd || !isLicenseActive) {
      setLogs(p => [...p, `[ERROR] Pastikan SDK terhubung dan Lisensi Aktif.`]);
      return;
    }
    if (isCameraOpen) {
      wsCmd.current.send(JSON.stringify({ id: 11, index: 0 }));
      setIsCameraOpen(false);
      setLogs(p => [...p, `[SDK] Kamera dinonaktifkan.`]);
      window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
    } else {
      wsCmd.current.send(JSON.stringify({ id: 9, index: 0 }));
      setIsCameraOpen(true);
      setLogs(p => [...p, `[SDK] Membuka aliran video ke sidebar...`]);
    }
  };

  const base64ToFile = (base64String, filename) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCaptureFromCamera = () => {
    if (!lastFrame) {
      setLogs(p => [...p, `[ERROR] Tidak ada frame streaming untuk ditangkap.`]);
      return;
    }
    const file = base64ToFile(lastFrame, "camera_capture.jpg");
    setSelectedFile(file);
    setHasBuffer(true);
    setLogs(p => [...p, `[SYSTEM] Frame dikunci. Siap untuk ekstraksi OCR.`]);
    
    // Tampilkan frame statis hasil capture di sidebar (bukan streaming lagi)
    window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: lastFrame }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setLogs(p => [...p, `[ERROR] Format file tidak didukung.`]);
        return;
      }
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setHasBuffer(true);
      window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: url }));
      setLogs(p => [...p, `[FILE] Memuat berkas: ${file.name}`]);
      setExtractedData(null);
    }
  };

  /**
   * INTEGRASI API: Parse Document
   */
  const handleExtract = async () => {
    if (!hasBuffer || !selectedFile) return;
    setIsProcessing(true);
    setLogs(p => [...p, `[ACTION] Mengirim data ke mesin OCR...`]);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const parseResponse = await fetch('http://localhost:8001/parse-document', {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        throw new Error(`Server Error (${parseResponse.status}): ${errorText}`);
      }
      
      const parseResult = await parseResponse.json();
      const requestId = parseResult.request_id;
      const resultResponse = await fetch(`http://localhost:8001/get-result/${requestId}`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!resultResponse.ok) throw new Error('Gagal mengambil hasil ekstraksi.');
      const resultData = await resultResponse.json();

      if (resultData.status === "success") {
        setExtractedData(resultData.data);
        setLogs(p => [...p, `[SUCCESS] OCR Berhasil dalam ${resultData.process_time_seconds}s.`]);
      } else {
        throw new Error(resultData.message || 'Status ekstraksi gagal.');
      }
    } catch (error) {
      setLogs(p => [...p, `[ERROR] ${error.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearBuffer = () => {
    setHasBuffer(false);
    setSelectedFile(null);
    window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: null }));
    setExtractedData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setLogs(p => [...p, `[SYSTEM] Buffer terminal dikosongkan.`]);
  };

  const renderResultContent = () => {
    if (!extractedData) {
      return (
        <div className="text-center w-full">
          <span className="text-[14px] text-zinc-600 uppercase block mb-3 tracking-[0.3em] font-black italic">
            [ {isProcessing ? "PROCESSING_STREAM" : "WAITING_FOR_DATA"} ]
          </span>
          <div className="px-4 py-4 border border-[#00ffff]/5 bg-[#00ffff]/5 inline-block min-w-[200px]">
            <h4 className="text-[14px] font-mono text-[#00ffff]/40 uppercase tracking-widest italic text-center">
              {isProcessing ? "Menghubungi Server..." : "--- Buffer Kosong ---"}
            </h4>
          </div>
        </div>
      );
    }

    switch (subTab) {
      case 'visual':
        return (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="text-[10px] text-[#00ffff]/60 uppercase mb-4 font-black flex items-center gap-2">
                <Download size={12} /> Visualization_Output_Buffer
             </div>
             <div className="border-2 border-[#00ffff]/20 p-2 bg-black/40 rounded-sm">
                <img src={extractedData.visualization_base64} alt="OCR Visualization" className="max-w-full h-auto rounded-sm shadow-[0_0_20px_rgba(0,255,255,0.1)]" />
             </div>
          </div>
        );
      case 'markdown':
        return (
          <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-auto custom-scrollbar">
            <pre className="text-[12px] font-mono text-zinc-400 bg-black/40 p-4 border border-zinc-800 rounded-sm leading-relaxed whitespace-pre-wrap">
              {extractedData.markdown_source}
            </pre>
          </div>
        );
      default:
        return (
          <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-2">
            {extractedData.text.map((line, i) => (
              <div key={i} className="flex gap-4 items-start font-mono group">
                <span className="text-[10px] text-zinc-700 w-6 shrink-0 mt-1">{(i+1).toString().padStart(2, '0')}</span>
                <span className="text-[14px] text-[#00ffff] group-hover:bg-[#00ffff]/10 px-1 transition-colors">{line}</span>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar text-left">
      <div className="flex flex-col lg:flex-row gap-8 items-start shrink-0">
        
        {/* Panel Kontrol OCR */}
        <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-900/60 p-6 relative rounded-sm flex flex-col gap-4 shadow-2xl w-full">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[14px] font-black uppercase z-[50] font-mono shadow-[4px_4px_0px_#00ffff]">OCR Processing Terminal</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* OPSI INPUT METHOD (KOLOM KIRI) */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] text-[#00ffff]/60 font-black block uppercase tracking-widest">Metode_Input:</label>
                <select 
                  value={inputMode}
                  onChange={(e) => setInputMode(e.target.value)}
                  className="w-full bg-black border-2 border-[#00ffff]/20 p-2.5 text-[#00ffff] text-[12px] font-black uppercase outline-none focus:border-[#00ffff] transition-all cursor-pointer"
                >
                  <option value="file">📂 Upload Berkas Gambar</option>
                  <option value="camera">📷 Live Camera (SDK Device)</option>
                </select>
              </div>
            </div>

            {/* AREA AKSI INPUT (KOLOM KANAN) */}
            <div className="space-y-4">
              <label className="text-[11px] text-[#00ffff]/60 font-black block uppercase tracking-widest">Status_Kontrol_Terminal:</label>
              
              {inputMode === 'file' ? (
                <div className="flex gap-2 h-11 relative">
                  <button 
                    onClick={() => fileInputRef.current.click()} 
                    className={`flex-1 border-2 border-dashed text-[12px] px-4 font-black transition-all flex flex-row items-center justify-center gap-3 group ${hasBuffer ? 'border-[#00ffff] bg-[#00ffff]/10 text-[#00ffff]' : 'border-[#00ffff]/40 bg-[#00ffff]/5 text-zinc-500 hover:text-[#00ffff]'}`}
                  >
                    <Folder size={18} />
                    <span>{hasBuffer ? "Ganti Gambar" : "Pilih File"}</span>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              ) : (
                <div className="flex flex-col xl:flex-row gap-2">
                  {/* TOMBOL KONEKSI SDK */}
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => connectSDK('cmd')} className={`px-4 py-2 text-[10px] font-black uppercase border-2 transition-all ${connStatus.cmd ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_#10b98144]' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                      {connStatus.cmd ? <Wifi size={12} className="inline mr-2" /> : <WifiOff size={12} className="inline mr-2" />} Connect CMD
                    </button>
                    <button onClick={() => connectSDK('mc')} className={`px-4 py-2 text-[10px] font-black uppercase border-2 transition-all ${connStatus.mc ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_#10b98144]' : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                      Media Link
                    </button>
                  </div>

                  {/* KODE LISENSI */}
                  <div className="flex-1 flex gap-1 h-9 min-w-0 animate-in slide-in-from-right-1 duration-300">
                    <div className="bg-black/40 border border-[#00ffff]/20 flex items-center px-2.5 text-[#00ffff]/40 shrink-0">
                      <Key size={12} />
                    </div>
                    <input 
                      type="text" 
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      placeholder="Kode Lisensi..."
                      className="flex-1 min-w-0 bg-black border-y border-[#00ffff]/20 px-3 text-[11px] text-white outline-none focus:border-[#00ffff]/60 font-mono"
                    />
                    <button 
                      onClick={handleInitSDK}
                      disabled={!connStatus.cmd}
                      className="px-4 bg-white text-black font-black text-[9px] uppercase hover:bg-zinc-200 transition-all disabled:opacity-20 border-y border-r border-[#00ffff]/20 shrink-0"
                    >
                      INIT
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KONTROL KAMERA (START/STOP & CAPTURE) - Memanjang penuh sejajar Metode_Input */}
          {inputMode === 'camera' && (
            <div className="mt-4 flex gap-2 h-11 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <button 
                onClick={toggleCamera}
                disabled={!connStatus.cmd || !isLicenseActive}
                className={`flex-1 border-2 text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-all ${isCameraOpen ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_#ef444433]' : 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff] disabled:opacity-20 hover:bg-[#00ffff]/20'}`}
              >
                {isCameraOpen ? <Square size={14} /> : <Play size={14} />}
                {isCameraOpen ? "Stop Camera Preview" : "Start Camera Preview"}
              </button>
              <button 
                onClick={handleCaptureFromCamera}
                disabled={!isCameraOpen}
                className={`px-6 border-2 font-black text-[11px] uppercase transition-all ${isCameraOpen ? 'bg-[#00ffff] text-black border-[#00ffff] hover:brightness-110 shadow-[0_0_15px_#00ffff33]' : 'bg-black border-zinc-800 text-zinc-600'}`}
              >
                Capture Frame
              </button>
            </div>
          )}

          {hasBuffer && (
            <div className="mt-4 flex items-center justify-between bg-[#00ffff]/5 border border-[#00ffff]/20 px-3 py-1.5 rounded-sm">
              <span className="text-[9px] text-[#00ffff] font-mono truncate max-w-[250px]">SOURCE: {selectedFile?.name || "captured_frame.jpg"}</span>
              <button onClick={clearBuffer} className="text-red-500 hover:text-red-400 transition-colors"><X size={14} /></button>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-[#00ffff]/10">
             <button 
                disabled={!hasBuffer || isProcessing}
                onClick={handleExtract} 
                className={`w-full py-3.5 text-black text-[14px] font-black uppercase tracking-[0.4em] shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all flex items-center justify-center font-mono gap-3 rounded-sm ${hasBuffer && !isProcessing ? 'bg-[#00ffff] hover:scale-[1.01] active:scale-95' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
             >
               {isProcessing ? <><RefreshCw size={16} className="animate-spin" /> Sedang Menganalisa...</> : <><Scan size={16} /> Jalankan Ekstraksi OCR</>}
             </button>
          </div>
        </div>
      </div>

      {/* Panel Hasil */}
      <div className="flex-1 flex flex-col min-h-[400px] font-mono">
        <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-900/60 p-5 rounded-sm relative flex flex-col gap-4 shadow-xl">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#00ffff]/20 pb-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-500 animate-ping' : hasBuffer ? 'bg-[#00ffff]' : 'bg-zinc-700'}`} />
                <span className="text-[16px] pl-1 font-black text-[#00ffff] uppercase tracking-[0.2em]">Recognition_Output_Log</span>
              </div>
              
              <div className="flex items-center bg-black/40 p-1 border border-[#00ffff]/20 rounded-sm">
                {[
                  { id: 'text', icon: FileText, label: 'Text' },
                  { id: 'visual', icon: TableIcon, label: 'Visual' },
                  { id: 'markdown', icon: BookOpen, label: 'Markdown' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSubTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-black uppercase transition-all ${subTab === item.id ? 'bg-[#00ffff] text-black shadow-[0_0_10px_#00ffff88]' : 'text-[#00ffff]/40 hover:text-[#00ffff]'}`}
                  >
                    <item.icon size={12} /> {item.label}
                  </button>
                ))}
              </div>
           </div>
           <div className="flex-1 bg-black/80 border border-[#00ffff]/10 p-6 flex flex-col justify-start items-center rounded-sm relative overflow-y-auto custom-scrollbar">
              {renderResultContent()}
           </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); }
      `}</style>
    </div>
  );
};

export default OCRScannerModule;