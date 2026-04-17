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
  AlertCircle
} from 'lucide-react';

/**
 * OCRScannerModule (REST API INTEGRATION)
 * Modul untuk ekstraksi teks dengan integrasi API parse-document.
 * Diperbarui dengan penanganan CORS dan logging yang lebih teliti.
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

  // Debugging: Pastikan environment siap
  useEffect(() => {
    console.log("[DEBUG] OCR Module Ready. Endpoint: http://localhost:8001");
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        setLogs(p => [...p, `[ERROR] Format file tidak didukung: ${file.name}`]);
        return;
      }

      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setHasBuffer(true);
      
      window.dispatchEvent(new CustomEvent('terminal:update-preview', { detail: url }));
      
      setLogs(p => [
        ...p, 
        `[FILE] Sumber baru dimuat: ${file.name}`,
        `[SYSTEM] Sinkronisasi visual ke sidebar utama via Global Event.`
      ]);
      
      setExtractedData(null);
    }
  };

  /**
   * INTEGRASI API: Parse Document
   * Diperbarui dengan mode 'cors' dan pengecekan error yang mendalam.
   */
  const handleExtract = async () => {
    if (!hasBuffer || !selectedFile) return;

    setIsProcessing(true);
    setLogs(p => [...p, `[ACTION] Mengirim dokumen ke server OCR...`]);
    
    try {
      // Step 1: Parse Document
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log("[DEBUG] Initiating POST to /parse-document");
      
      const parseResponse = await fetch('http://localhost:8001/parse-document', {
        method: 'POST',
        body: formData,
        mode: 'cors', // Menegaskan mode CORS
        // Catatan: Jangan tambahkan header 'Content-Type' secara manual saat menggunakan FormData
      });

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        throw new Error(`Server Error (${parseResponse.status}): ${errorText || 'Gagal memproses dokumen.'}`);
      }
      
      const parseResult = await parseResponse.json();
      const requestId = parseResult.request_id;
      
      setLogs(p => [...p, `[STATUS] Request ID: ${requestId.substring(0, 8)}...`]);
      setLogs(p => [...p, `[PROCESS] Mengambil hasil ekstraksi...`]);

      // Step 2: Get Result
      console.log(`[DEBUG] Initiating GET to /get-result/${requestId}`);
      
      const resultResponse = await fetch(`http://localhost:8001/get-result/${requestId}`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!resultResponse.ok) throw new Error('Gagal mengambil hasil dari server.');
      
      const resultData = await resultResponse.json();

      if (resultData.status === "success") {
        setExtractedData(resultData.data);
        setLogs(p => [...p, `[SUCCESS] Ekstraksi selesai dalam ${resultData.process_time_seconds}s.`]);
      } else {
        throw new Error(resultData.message || 'Server mengembalikan status gagal.');
      }

    } catch (error) {
      // Penanganan khusus untuk error CORS/Network
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setLogs(p => [
          ...p, 
          `[CRITICAL] CORS Policy Blocked / Server Offline.`,
          `[HELP] Pastikan backend di localhost:8000 sudah mengizinkan CORS.`
        ]);
        console.error("[CORS ERROR] Pastikan backend menambahkan CORSMiddleware untuk origin http://localhost:3000");
      } else {
        setLogs(p => [...p, `[ERROR] ${error.message}`]);
      }
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
    setLogs(p => [...p, `[SYSTEM] Buffer dikosongkan.`]);
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
                <img 
                  src={extractedData.visualization_base64} 
                  alt="OCR Visualization" 
                  className="max-w-full h-auto rounded-sm shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                  onError={(e) => {
                    console.error("Base64 Image failed to load");
                    e.target.src = "https://via.placeholder.com/400?text=Visualization+Load+Failed";
                  }}
                />
             </div>
          </div>
        );
      case 'markdown':
        return (
          <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Raw_Markdown_Source</span>
            </div>
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
    <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-8 items-start shrink-0">
        
        {/* Unit Visual Mini */}
        {/* <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0 text-right">
          <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/20 bg-zinc-950 overflow-hidden shadow-2xl group">
            <div className="w-full h-full relative">
              <img 
                src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2N3ZXg5NzV5ZW9hZHJpY2xxMjRid2Q3dGt3aTBuNWwyMWI0cTFwbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/gUNA7QH4AeLde/giphy.gif" 
                alt="OCR Scanning Animation" 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 grayscale brightness-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 border border-[#00ffff]/30 z-20">
                 <Crosshair size={8} className="text-[#00ffff] animate-pulse" />
                 <span className="text-[7px] text-[#00ffff] font-black uppercase tracking-tighter">
                   {hasBuffer ? "Target_Locked" : "Scan_Idle"}
                 </span>
              </div>

              {!hasBuffer && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                   <span className="text-[9px] text-white/40 font-black uppercase tracking-widest animate-pulse">Waiting_Input</span>
                </div>
              )}
            </div>
            
            {isProcessing && (
              <div className="absolute inset-0 bg-[#00ffff]/10 z-30 overflow-hidden">
                <div className="w-full h-1 bg-[#00ffff] shadow-[0_0_15px_#00ffff] animate-pixel-scan" />
              </div>
            )}
          </div>
          <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">Recognition_Buffer_v1</span>
        </div> */}

        {/* Panel Kontrol Capture */}
        <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-900/60 p-6 relative rounded-sm flex flex-col gap-4 shadow-2xl">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[14px] font-black uppercase z-[50] font-mono">OCR Capture Control</div>
          
          <div className="w-full text-left space-y-2">
            <label className="text-[13px] text-[#00ffff]/60 font-black block uppercase tracking-widest flex items-center gap-2 pt-4">
              <ImageIcon size={14} /> Pilih Sumber Gambar:
            </label>
            
            <div className="flex gap-2 h-10 relative">
               <button 
                 onClick={() => fileInputRef.current.click()} 
                 className={`flex-1 border-2 border-dashed text-[12px] px-4 font-black transition-all flex flex-row items-center justify-center gap-3 group ${hasBuffer ? 'border-[#00ffff] bg-[#00ffff]/10 text-[#00ffff]' : 'border-[#00ffff]/40 bg-[#00ffff]/5 text-zinc-500 hover:border-[#00ffff]/80 hover:text-[#00ffff]'}`}
               >
                  <Folder size={18} className={hasBuffer ? 'scale-110 text-[#00ffff]' : ''} />
                  <span className="tracking-widest uppercase text-center font-mono">
                    {hasBuffer ? "Ganti Gambar Sumber" : "Klik Untuk Memilih File (JPG/PNG)"}
                  </span>
               </button>
               
               {hasBuffer && (
                 <button 
                   onClick={clearBuffer}
                   className="px-4 bg-red-500/20 border-2 border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                   title="Hapus Buffer"
                 >
                   <X size={18} />
                 </button>
               )}

               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleFileChange} 
               />
            </div>
          </div>
          
          <div className="mt-2">
             <button 
                disabled={!hasBuffer || isProcessing}
                onClick={handleExtract} 
                className={`w-full py-2 text-black text-[13px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all flex items-center justify-center font-mono gap-3 ${hasBuffer && !isProcessing ? 'bg-[#00ffff] hover:brightness-125' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
             >
               {isProcessing ? (
                 <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Sedang Menganalisa...</span>
                 </>
               ) : (
                 <>
                  <Scan size={14} />
                  <span>Mulai Ekstraksi Teks</span>
                 </>
               )}
             </button>
          </div>
        </div>
      </div>

      {/* Panel Hasil Recognition dengan Navigasi Menu */}
      <div className="flex-1 flex flex-col min-h-[350px] font-mono">
        <div className="flex-1 border-2 border-[#00ffff]/40 bg-zinc-900/60 p-5 rounded-sm relative overflow-hidden flex flex-col gap-4 shadow-[0_0_20px_rgba(0,255,255,0.05)] text-left">
           <div className="absolute top-0 left-0 w-12 h-[2px] bg-[#00ffff]" />
           <div className="absolute top-0 left-0 w-[2px] h-12 bg-[#00ffff]" />
           
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#00ffff]/20 pb-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-500 animate-ping' : hasBuffer ? 'bg-[#00ffff]' : 'bg-zinc-700'}`} />
                <span className="text-[16px] pl-2 font-black text-[#00ffff] uppercase tracking-[0.2em]">Hasil Recognition</span>
              </div>
              
              {/* NAVIGATION MENU */}
              <div className="flex items-center bg-black/40 p-1 border border-[#00ffff]/20 rounded-sm">
                {[
                  { id: 'text', icon: FileText, label: 'Hasil Text' },
                  { id: 'visual', icon: TableIcon, label: 'Hasil Visualisasi' },
                  { id: 'markdown', icon: BookOpen, label: 'Markdown Resource' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSubTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-[12px] font-black uppercase tracking-tighter transition-all ${
                      subTab === item.id 
                        ? 'bg-[#00ffff] text-black shadow-[0_0_10px_rgba(0,255,255,0.5)]' 
                        : 'text-[#00ffff]/40 hover:text-[#00ffff] hover:bg-[#00ffff]/5'
                    }`}
                  >
                    <item.icon size={12} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                ))}
              </div>
           </div>

           <div className="flex-1 bg-black/80 border border-[#00ffff]/10 p-6 flex flex-col justify-start items-center rounded-sm group relative overflow-y-auto custom-scrollbar">
              {renderResultContent()}
           </div>
        </div>
      </div>
    </div>
  );
};

export default OCRScannerModule;