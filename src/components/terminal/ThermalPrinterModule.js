"use client";
import React, { useState, useEffect } from 'react';
import { Keyboard, Activity, Printer as PrinterIcon, Loader2 } from 'lucide-react';

/**
 * ThermalPrinterModule
 * Terintegrasi dengan API Printer: print-text, print-qrcode, print-barcode, dan print-sample.
 */
const ThermalPrinterModule = ({ data, activeTab }) => {
  const [logs, setLogs] = useState([]);
  const [printText, setPrintText] = useState("");
  const [format, setFormat] = useState("text"); // text, qrcode, barcode
  const [isLoading, setIsLoading] = useState(false);
  const [activeInput, setActiveInput] = useState('text');

  // Ambil API Base URL dari environment variable
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5160";

  useEffect(() => {
    setLogs([`[SYSTEM] Thermal Printer Ready.`, `[API] Base URL: ${API_BASE_URL}`]);
  }, [API_BASE_URL]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '[ERROR]' : type === 'success' ? '[SUCCESS]' : '[INFO]';
    setLogs(prev => [...prev, `${prefix} ${message} (${timestamp})`]);
  };

  const handleKeyClick = (char) => {
    if (activeInput === 'text') setPrintText(prev => prev + char);
  };

  const handleAction = async (endpoint, body = null) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : null,
      });

      if (response.ok) {
        addLog(`Cetak ${endpoint.split('-')[1]} berhasil`, 'success');
      } else {
        const errData = await response.text();
        addLog(`Gagal: ${response.status} - ${errData}`, 'error');
      }
    } catch (error) {
      addLog(`Network Error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintSubmit = () => {
    if (!printText && format !== 'sample') {
      addLog("Input teks kosong!", "error");
      return;
    }

    // Mapping endpoint berdasarkan format
    switch (format) {
      case 'qrcode':
        handleAction('/api/printer/print-qrcode', printText);
        break;
      case 'barcode':
        handleAction('/api/printer/print-barcode', printText);
        break;
      default:
        handleAction('/api/printer/print-text', printText);
        break;
    }
  };

  return (
    <div className="flex-1 p-8 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* VISUAL STATUS */}
        {/* <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/20 bg-zinc-950 overflow-hidden group">
            <img 
              src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTlocWRmemY1c243MG93cmk4bTFsdm1heXJtMmJ2YmVybTMxODJnbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/kSxi9DiWH4Q8q1Kbql/giphy.gif " 
              alt="Printer Visual" 
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00ffff]/30 animate-scan-fast pointer-events-none" />
          </div>
          <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">Thermal_Service_V.1</span>
        </div> */}

        {/* CONFIGURATION FORM */}
        <div className="flex-1 h-[220px] border-2 border-[#00ffff]/40 bg-zinc-900/60 pt-7 px-6 pb-12 relative font-mono rounded-sm group flex flex-col justify-start gap-4 overflow-visible">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[14px] font-black uppercase z-[50]">
            {activeTab === 'text_barcode' ? 'Printing' : 'Quick Actions'}
          </div>
          
          {activeTab === 'text_barcode' ? (
            <>
              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#00ffff] font-black uppercase tracking-widest block">Select Format</label>
                  <select 
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-black border-2 border-[#00ffff]/20 text-[12px] p-2 text-white outline-none focus:border-[#00ffff] font-moono cursor-pointer"
                  >
                    <option value="text">Text Standard</option>
                    <option value="barcode">Barcode 1D</option>
                    <option value="qrcode">QR Code 2D</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#00ffff] font-black uppercase tracking-widest block">Payload Data</label>
                  <input 
                    value={printText}
                    onFocus={() => setActiveInput('text')}
                    onChange={(e) => setPrintText(e.target.value)}
                    placeholder="Masukkan data..." 
                    className="w-full bg-black border-2 border-[#00ffff]/20 p-1.5 text-[#00ffff] outline-none font-mono text-[13px] focus:border-[#00ffff] transition-colors" 
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-1">
                <button 
                  disabled={isLoading}
                  onClick={handlePrintSubmit} 
                  className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#00ffff] text-[#00ffff] text-[14px] font-black hover:bg-[#00ffff] hover:text-black uppercase active:scale-95 shadow-lg flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : <PrinterIcon size={16} />}
                  {isLoading ? 'Processing...' : 'Execute Print'}
                </button>
              </div>
              <div className="flex gap-4">
               <button 
                 onClick={() => handleAction('/api/printer/print-sample')}
                 className="flex-1 py-2.5 bg-zinc-950 border-3 border-[#00ffff]/30 text-[#00ffff] text-[14px] hover:border-[#00ffff] active:scale-95 uppercase font-black shadow-lg flex items-center justify-center gap-4"
               >
                 {isLoading ? <Loader2 size={12} className="animate-spin" /> : <PrinterIcon size={18} />}
                  {isLoading ? 'Processing...' : 'Print Sample 1'}
               </button>
               <button 
                 onClick={() => handleAction('/api/test/test-person')}
                 className="flex-1 py-2.5 bg-zinc-950 border-3 border-[#ff00ff]/30 text-[#ff00ff] text-[14px] hover:border-[#ff00ff] active:scale-95 uppercase font-black shadow-lg flex items-center justify-center gap-4"
               >
                 {isLoading ? <Loader2 size={12} className="animate-spin" /> : <PrinterIcon size={18} />}
                  {isLoading ? 'Processing...' : 'Print Sample 2'}
               </button>
            </div>
            </>
          ) : (
            <div className="flex-1 flex flex-wrap gap-2 p-1 overflow-y-auto custom-scrollbar">
               <button 
                 onClick={() => handleAction('/api/printer/print-sample')}
                 className="px-4 py-2 bg-black border border-[#00ffff]/30 text-[#00ffff] text-[9px] hover:border-[#00ffff] active:scale-95 uppercase font-black"
               >
                 Print Test Sample
               </button>
               <button 
                 onClick={() => handleAction('/api/test/test-person')}
                 className="px-4 py-2 bg-black border border-[#ff00ff]/30 text-[#ff00ff] text-[9px] hover:border-[#ff00ff] active:scale-95 uppercase font-black"
               >
                 Test Person Data
               </button>
            </div>
          )}
        </div>
      </div>

      {/* LOWER SECTION: KEYBOARD & LOGS */}
      <div className="flex-1 h-[220px] grid grid-cols-1 xl:grid-cols-1 gap-4 h-fit">
        
        {/* <div className="border-2 border-[#00ffff]/20 bg-zinc-950/80 p-4 flex flex-col rounded-sm relative text-left">
          <div className="flex justify-between items-center border-b border-[#00ffff]/10 pb-1 mb-2 font-black text-[#00ffff]/60 uppercase text-[9px] tracking-widest">
            <span>Manual_Input_Registry</span>
            <Keyboard size={12} className="text-[#00ffff]/30" />
          </div>
          <div className="grid grid-cols-10 gap-1 mt-3 select-none">
            {[...Array(30)].map((_, i) => {
              const char = String.fromCharCode(65 + i);
              return (
                <button key={i} onClick={() => handleKeyClick(char)} className="aspect-square border border-[#00ffff]/30 bg-[#00ffff]/5 text-[8px] flex items-center justify-center text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all active:scale-90">{char}</button>
              );
            })}
          </div>
          <button onClick={() => setPrintText("")} className="mt-3 py-1 border border-[#ff00ff]/40 text-[#ff00ff] text-[8px] uppercase font-bold hover:bg-[#ff00ff]/10">Clear Input</button>
        </div> */}

        <div className="border-2 border-[#00ffff]/20 bg-black/90 pl-6 p-3 flex flex-col rounded-sm relative overflow-hidden shadow-inner text-left font-mono text-[12px] text-zinc-400">
          <div className="text-[14px] text-[#00ffff] font-black mb-2 uppercase flex items-center gap-2 border-b border-[#00ffff]/10 pb-1 tracking-widest">
             <Activity size={10} className="animate-pulse" />
             <span>Logs Output</span>
          </div>
          <div className="flex-1 p-2 overflow-y-auto space-y-1 custom-scrollbar min-h-[120px]">
            {logs.slice(-10).map((log, idx) => (
              <div key={idx} className="flex gap-2 leading-none">
                <span className="opacity-20">{(idx + 1).toString().padStart(2, '0')}</span>
                <span className={log.includes('SUCCESS') ? 'text-emerald-400' : log.includes('ERROR') ? 'text-red-500' : ''}>{log}</span>
              </div>
            ))}
            <div className="animate-pulse text-[#00ffff] font-black">_</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalPrinterModule;