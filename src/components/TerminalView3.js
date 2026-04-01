"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Activity, 
  User, 
  Globe, 
  Wifi,
  Fingerprint,
  Keyboard,
  Power,
  Home,
  FolderOpen,
  Printer,
  FileText,
  Barcode as BarcodeIcon,
  ChevronRight,
  Scan,
  Upload,
  Folder,
  ClipboardType
} from 'lucide-react';

/**
 * =============================================================================
 * 1. COMPONENT: TerminalShell (REUSABLE LAYOUT)
 * Kerangka luar terminal: Header, Sidebar Kiri, Banner Judul, dan Tab Navigasi.
 * Perbaikan: Navigasi Tab paralel slanted searah backslash (\ \).
 * =============================================================================
 */
const TerminalShell = ({ 
  data, 
  onClose, 
  isDarkMode, 
  activeTab, 
  setActiveTab, 
  tabs, 
  leftColumn, 
  children 
}) => {
  const shortTitle = data?.short?.split(' ')[0] || "SYSTEM";
  const fullTitle = data?.title || "TERMINALIZER";

  const NavTab = ({ id, label, isActive, onClick, index }) => {
    const isFirst = index === 0;
    
    // Pola kemiringan paralel searah backslash (\ \) sesuai instruksi
    const polyOuter = isFirst 
      ? "polygon(0 0, calc(100% - 20px) 0, 100% 100%, 0 100%)" 
      : "polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)";
    
    const polyInner = isFirst 
      ? "polygon(2px 2px, calc(100% - 22px) 2px, calc(100% - 2px) calc(100% - 2px), 2px calc(100% - 2px))"
      : "polygon(1px 2px, calc(100% - 22px) 2px, calc(100% - 2px) calc(100% - 2px), 21px calc(100% - 2px))";

    return (
      <button 
        onClick={() => onClick(id)}
        className={`relative h-11 px-16 flex items-center justify-center transition-all duration-300 ${isFirst ? '' : '-ml-[20px]'} ${isActive ? 'z-20' : 'z-10'}`}
        style={{ minWidth: '200px' }}
      >
        <div className="absolute inset-0 bg-[#00ffff]/40" style={{ clipPath: polyOuter }} />
        <div className={`absolute inset-0 transition-colors duration-300 ${isActive ? 'bg-[#00ffff]' : 'bg-zinc-950'}`} style={{ clipPath: polyInner }} />
        <span className={`relative z-30 text-[10px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-black' : 'text-[#00ffff]/40'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-2 z-[100] flex flex-col rounded-sm overflow-hidden border-2 border-[#00ffff]/60 shadow-[0_0_60px_rgba(0,255,255,0.25)] font-pixel"
      style={{ 
        background: isDarkMode ? 'rgba(4, 6, 10, 0.98)' : 'rgba(235, 245, 255, 0.98)',
        imageRendering: 'pixelated'
      }}
    >
      {/* HEADER TOP BAR */}
      <div className={`flex items-center justify-between px-6 py-3 border-b-2 shadow-lg ${isDarkMode ? 'bg-[#1a1a2e] border-[#00ffff]/30' : 'bg-zinc-300 border-black/10'}`}>
        <div className="flex space-x-3 w-48">
          <div onClick={onClose} className="w-4 h-4 rounded-full bg-[#ff5f56] cursor-pointer hover:scale-110 shadow-inner" />
          <div className="w-4 h-4 rounded-full bg-[#ffbd2e]" />
          <div className="w-4 h-4 rounded-full bg-[#27c93f]" />
        </div>
        <div className="text-[11px] tracking-[0.4em] font-black text-[#00ffff] uppercase drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]">
          {fullTitle} // V.2.8.5
        </div>
        <div className="w-48 flex justify-end">
           <Power size={18} className="text-red-500 animate-pulse cursor-pointer" onClick={onClose} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6 text-left">
        {leftColumn}
        
        <div className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0">
          {/* BANNER JUDUL */}
          <div className="relative py-2 px-10 border-2 border-[#00ffff]/20 bg-gradient-to-r from-[#00ffff]/5 to-transparent rounded-sm overflow-hidden shrink-0">
            <h2 className="text-7xl tracking-[0.05em] font-arcade leading-none uppercase banner-title truncate">
              {`> ${shortTitle}`}
            </h2>
            <Terminal size={120} className="absolute right-[-20px] top-[-20px] text-[#00ffff] opacity-5 -rotate-12" />
          </div>

          {/* AREA TAB & KONTEN MODUL */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex items-end h-11 w-fit relative z-30 overflow-visible">
              {tabs.map((tab, idx) => (
                <NavTab 
                  key={tab.id}
                  id={tab.id} 
                  label={tab.label} 
                  index={idx}
                  isActive={activeTab === tab.id} 
                  onClick={setActiveTab} 
                />
              ))}
            </div>
            
            <div className="flex-1 flex flex-col border-x-2 border-b-2 border-[#00ffff]/40 bg-black/60 rounded-sm shadow-2xl relative overflow-hidden">
              <div className="h-[2px] w-full bg-[#00ffff]/40 shrink-0" />
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className={`px-8 py-3 border-t-2 flex justify-between items-center text-[10px] font-black ${isDarkMode ? 'bg-zinc-950/90 border-[#00ffff]/30' : 'bg-zinc-100'}`}>
        <div className="flex space-x-12 text-zinc-600 uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2"><Globe size={14} className="text-[#00ffff]/50" /> 127.0.0.1</span>
          <span className="flex items-center gap-2"><User size={14} className="text-[#00ffff]/50" /> root_access</span>
          <span className="flex items-center gap-2"><Wifi size={14} className="text-[#00ffff]/50" /> mesh_secure</span>
        </div>
        <div className="text-[#00ffff] drop-shadow-[0_0_5px_#00ffff] tracking-[0.5em] font-black uppercase">
          System_Synchronized
        </div>
      </div>

      <style jsx global>{`
        @font-face { font-family: 'ArcadeClassic'; src: url('/fonts/ARCADECLASSIC.TTF'); }
        .font-arcade { font-family: 'ArcadeClassic', 'Courier New', cursive; }
        .font-pixel { font-family: 'Courier New', Courier, monospace; letter-spacing: -0.02em; }
        .banner-title {
          background: linear-gradient(to right, #5495e8, #7d8be2, #aa78d5, #cd65bb, #e15b9c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(4px 4px 0px rgba(45, 54, 102, 0.8));
        }
        @keyframes scan-fast { from { transform: translateY(-100%); } to { transform: translateY(500%); } }
        .animate-scan-fast { animation: scan-fast 3s linear infinite; }
        @keyframes pixel-scan { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(500px); opacity: 0; } }
        .animate-pixel-scan { animation: pixel-scan 5s linear infinite; }
        .animate-spin-slow { animation: spin 30s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); border-radius: 10px; }
        
        /* BREADCRUMB PATH ARROWS (RUNCING & TAJAM) */
        .path-arrow-start { 
          clip-path: polygon(0% 0%, calc(100% - 18px) 0%, 100% 50%, calc(100% - 18px) 100%, 0% 100%); 
        }
        /* Penyesuaian agar ujung path terakhir juga runcing lancip */
        .path-arrow-nested, .path-arrow-end { 
          clip-path: polygon(0% 0%, 18px 50%, 0% 100%, calc(100% - 18px) 100%, 100% 50%, calc(100% - 18px) 0%); 
        }
      `}</style>
    </motion.div>
  );
};

/**
 * =============================================================================
 * 2. COMPONENT: FingerprintModule
 * =============================================================================
 */
const FingerprintModule = ({ data }) => {
  const [logs, setLogs] = useState([]);
  const [nik, setNik] = useState("");
  const [userName, setUserName] = useState("");
  const [identifierKey, setIdentifierKey] = useState("");
  const [activeInput, setActiveInput] = useState('nik');
  const [isConnected, setIsConnected] = useState(false);

  const shortTitle = data?.short?.split(' ')[0] || "SYSTEM";

  const handleKeyClick = (char) => {
    if (activeInput === 'nik') setNik(prev => prev + char);
    else if (activeInput === 'name') setUserName(prev => prev + char);
    else if (activeInput === 'identifier') setIdentifierKey(prev => prev + char);
  };

  const handleConnectToggle = () => {
    const newStatus = !isConnected;
    setIsConnected(newStatus);
    const timestamp = new Date().toLocaleTimeString();
    const message = newStatus 
      ? `[DEVICE] ${shortTitle} TERHUBUNG pada ${timestamp}` 
      : `[DEVICE] ${shortTitle} TERPUTUS pada ${timestamp}`;
    setLogs(prev => [...prev, message]);
  };

  return (
    <div className="flex-1 p-8 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/20 bg-zinc-950 overflow-hidden group">
            <img 
              src={isConnected 
                ? "https://cdn.dribbble.com/userupload/23642809/file/original-129fd5d25fa96a3437877562aa243ad6.gif" 
                : "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcm0zcDUyM2Yxazh2ZzJvN3NuaTkxMjh0NHU3djZqemYzbWFvZWp2OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/5Akl9i8YiMbl5RFvGO/giphy.gif"
              } 
              alt="Biometric Status" 
              className={`w-full h-full object-cover transition-opacity duration-500 ${isConnected ? 'opacity-80' : 'opacity-40'}`} 
            />
            <div className="absolute inset-0 flex flex-col items-end justify-start text-right p-4 pointer-events-none">
              <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-tight">Device Is</span>
              <span className={`text-[12px] font-black uppercase tracking-tighter mt-1 animate-pulse ${isConnected ? 'text-emerald-400' : 'text-red-500'}`}>{isConnected ? 'Connected' : 'Disconnected'}</span>
              
              <div className="flex h-1.5 w-20 border border-zinc-800 my-2 justify-end">
                {['#000', '#ff0', '#0ff', '#f0f', '#fff'].map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
              </div>

              <button onClick={handleConnectToggle} className={`pointer-events-auto px-4 py-1.5 border-2 text-[9px] font-black uppercase active:scale-95 shadow-lg ${isConnected ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' : 'border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black'}`}>{isConnected ? 'Disconnect' : 'Connect'}</button>
            </div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00ffff]/30 animate-scan-fast pointer-events-none" />
          </div>
          <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">Finger_Registry_V.1</span>
        </div>

        <div className="flex-1 h-[155px] border-2 border-[#00ffff]/40 bg-zinc-900/60 pt-6 px-6 pb-12 relative rounded-sm group flex flex-col justify-start gap-4 overflow-visible">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase z-[50]">Capture</div>
          <div className="grid grid-cols-2 gap-6 text-left">
            <div className="space-y-1.5">
              <label className="text-[9px] text-[#00ffff] font-black tracking-widest block uppercase">Select Mode</label>
              <select className="w-full bg-black border-2 border-[#00ffff]/20 text-[10px] p-2 text-white outline-none focus:border-[#00ffff] font-pixel cursor-pointer transition-colors"><option>Standard_Credential_ID</option></select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-[#00ffff] font-black tracking-widest block uppercase">Identifier Key</label>
              <input 
                value={identifierKey} 
                onFocus={() => setActiveInput('identifier')} 
                onChange={(e) => setIdentifierKey(e.target.value)}
                placeholder="Enter Serial / NIK..."
                className={`w-full bg-black border-2 transition-all text-[10px] p-2 text-[#00ffff] outline-none font-mono ${activeInput === 'identifier' ? 'border-[#00ffff]' : 'border-[#00ffff]/20'}`} 
              />
            </div>
          </div>
          <div className="flex gap-4 mt-1"><button className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#00ffff] text-[#00ffff] text-[10px] font-black uppercase shadow-md active:scale-95">Start</button><button className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#ff00ff] text-[#ff00ff] text-[10px] font-black uppercase shadow-md active:scale-95">Stop</button></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-fit">
        <div className="border-2 border-[#00ffff]/20 bg-zinc-950/80 p-4 flex flex-col rounded-sm text-left relative">
          <div className="flex justify-between items-center border-b border-[#00ffff]/10 pb-1 mb-2 font-black text-[#00ffff]/60 uppercase text-[9px] tracking-widest">
            <span>Registry_Manual</span>
            <Keyboard size={12} className="text-[#00ffff]/30" />
          </div>
          <div className="flex flex-col gap-3 font-pixel">
            <div className={`border-b-2 transition-colors ${activeInput === 'nik' ? 'border-[#00ffff]' : 'border-[#00ffff]/20'}`}>
              <input value={nik} onFocus={() => setActiveInput('nik')} onChange={(e) => setNik(e.target.value)} placeholder="Please Enter Your NIK" className="w-full bg-transparent text-[10px] p-1 text-[#00ffff] outline-none" />
            </div>
            <div className={`border-b-2 transition-colors ${activeInput === 'name' ? 'border-[#00ffff]' : 'border-[#00ffff]/20'}`}>
              <input value={userName} onFocus={() => setActiveInput('name')} onChange={(e) => setUserName(e.target.value)} placeholder="Please Enter Your Name" className="w-full bg-transparent text-[10px] p-1 text-[#00ffff] outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-10 gap-1 mt-3 select-none">
            {[...Array(30)].map((_, i) => <div key={i} onClick={() => handleKeyClick(String.fromCharCode(65 + i))} className="aspect-square border border-[#00ffff]/30 bg-[#00ffff]/5 text-[8px] flex items-center justify-center text-[#00ffff] hover:bg-[#00ffff] hover:text-black cursor-pointer active:scale-90 transition-all">{String.fromCharCode(65 + i)}</div>)}
          </div>
          <div className="flex gap-2 mt-3">
             <button className="flex-1 py-1.5 border-2 border-[#00ffff] text-[#00ffff] text-[9px] font-black hover:bg-[#00ffff] hover:text-black uppercase shadow-sm active:scale-95">Submit</button>
             <button onClick={() => {setNik(""); setUserName(""); setIdentifierKey("");}} className="flex-1 py-1.5 border-2 border-[#ff00ff] text-[#ff00ff] text-[9px] font-black hover:bg-[#ff00ff] hover:text-white uppercase shadow-sm active:scale-95">Cancel</button>
          </div>
        </div>

        <div className="border-2 border-[#00ffff]/20 bg-black/90 p-4 flex flex-col rounded-sm text-left text-zinc-400 font-mono text-[10px] overflow-hidden shadow-inner">
          <div className="flex items-center gap-2 text-[#00ffff] mb-2 uppercase font-black tracking-widest border-b border-[#00ffff]/10 pb-1">
            <Activity size={10} className="animate-pulse" />
            <span>Console_Buffer</span>
          </div>
          <div className="flex-1 overflow-hidden space-y-1">
            {logs.slice(-5).map((log, idx) => (
              <div key={idx} className="flex gap-2 leading-none">
                <span className="opacity-30">{(idx+1).toString().padStart(2,'0')}</span>
                <span className={log.includes('Connected') || log.includes('TERHUBUNG') ? 'text-[#00ffff]' : log.includes('Disconnected') || log.includes('TERPUTUS') ? 'text-red-400' : ''}>{log}</span>
              </div>
            ))}
            <div className="animate-pulse text-[#00ffff] font-black">_</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * =============================================================================
 * 3. COMPONENT: ThermalPrinterModule
 * =============================================================================
 */
const ThermalPrinterModule = ({ data, activeTab }) => {
  const [logs, setLogs] = useState([]);
  const [printText, setPrintText] = useState("");
  const [activeInput, setActiveInput] = useState('text');

  useEffect(() => {
    setLogs([`[SYSTEM] Thermal Printer Ready.`, `[STATUS] Buffer Clear.`]);
  }, []);

  const handleKeyClick = (char) => {
    if (activeInput === 'text') setPrintText(prev => prev + char);
  };

  const handlePrint = () => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[PRINT] Processing: ${printText || 'Sample Ticket'}...`, `[SUCCESS] Printed at ${timestamp}`]);
  };

  return (
    <div className="flex-1 p-8 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/20 bg-zinc-950 overflow-hidden group">
            <img 
              src="https://cdn.dribbble.com/userupload/15139046/file/original-5975d9e5163e79788f28849767220977.gif" 
              alt="Printer Visual" 
              className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
            />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00ffff]/30 animate-scan-fast pointer-events-none" />
          </div>
          <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">Thermal_Print_V.2</span>
        </div>

        <div className="flex-1 h-[155px] border-2 border-[#00ffff]/40 bg-zinc-900/60 pt-6 px-6 pb-12 relative rounded-sm group flex flex-col justify-start gap-4 overflow-visible">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase z-[50]">
            {activeTab === 'text_barcode' ? 'Print Config' : 'Sample Library'}
          </div>
          
          {activeTab === 'text_barcode' ? (
            <>
              <div className="grid grid-cols-2 gap-6 text-left z-0">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-[#00ffff] font-black uppercase tracking-widest block">Format</label>
                  <select className="w-full bg-black border-2 border-[#00ffff]/20 text-[10px] p-2 text-white outline-none focus:border-[#00ffff] font-pixel cursor-pointer">
                    <option>Text_Standard_60mm</option>
                    <option>Barcode_EAN13</option>
                    <option>QRCode_Dynamic</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-[#00ffff] font-black uppercase tracking-widest block">Input Text</label>
                  <input 
                    value={printText}
                    onFocus={() => setActiveInput('text')}
                    onChange={(e) => setPrintText(e.target.value)}
                    placeholder="Type via keyboard..." 
                    className={`w-full bg-black border-2 transition-all text-[10px] p-2 text-[#00ffff] outline-none font-mono ${activeInput === 'text' ? 'border-[#00ffff]' : 'border-[#00ffff]/20'}`} 
                  />
                </div>
              </div>
              <div className="flex gap-4 font-pixel z-0 mt-1">
                <button onClick={handlePrint} className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#00ffff] text-[#00ffff] text-[10px] font-black hover:bg-[#00ffff] hover:text-black transition-all uppercase active:scale-95 shadow-lg">Print Now</button>
                <button onClick={() => setPrintText("")} className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#ff00ff] text-[#ff00ff] text-[10px] font-black hover:bg-[#ff00ff] hover:text-white transition-all uppercase active:scale-95 shadow-lg">Clear</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-wrap gap-2 p-1 overflow-y-auto custom-scrollbar">
               {['Invoice_001', 'Log_Report_A', 'Barcode_ID_Test', 'QR_Digital_Key'].map(s => (
                 <button key={s} onClick={handlePrint} className="px-3 py-1 bg-black border border-[#00ffff]/30 text-[#00ffff]/60 text-[8px] hover:border-[#00ffff] hover:text-[#00ffff] transition-all uppercase font-black active:scale-95">
                   {s}
                 </button>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-fit">
        <div className="border-2 border-[#00ffff]/20 bg-zinc-950/80 p-4 flex flex-col rounded-sm relative text-left">
          <div className="flex justify-between items-center border-b border-[#00ffff]/10 pb-1 mb-2 font-black text-[#00ffff]/60 uppercase text-[9px] tracking-widest">
            <span>Printer_Registry</span>
            <Keyboard size={12} className="text-[#00ffff]/30" />
          </div>
          <div className="grid grid-cols-10 gap-1 mt-3 select-none">
            {[...Array(30)].map((_, i) => {
              const char = String.fromCharCode(65 + i);
              return (
                <div key={i} onClick={() => handleKeyClick(char)} className="aspect-square border border-[#00ffff]/30 bg-[#00ffff]/5 text-[8px] flex items-center justify-center text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all cursor-pointer active:scale-90">{char}</div>
              );
            })}
          </div>
        </div>

        <div className="border-2 border-[#00ffff]/20 bg-black/90 p-4 flex flex-col rounded-sm relative overflow-hidden shadow-inner text-left font-mono text-[10px] text-zinc-400">
          <div className="text-[9px] text-[#00ffff] font-black mb-2 uppercase flex items-center gap-2 border-b border-[#00ffff]/10 pb-1 tracking-widest">
             <Activity size={10} className="animate-pulse" />
             <span>Print_Queue</span>
          </div>
          <div className="flex-1 overflow-hidden space-y-1">
            {logs.slice(-5).map((log, idx) => (
              <div key={idx} className="flex gap-2 leading-none">
                <span className="opacity-20">{(idx + 1).toString().padStart(2, '0')}</span>
                <span className={log.includes('SUCCESS') ? 'text-[#00ffff]' : ''}>{log}</span>
              </div>
            ))}
            <div className="animate-pulse text-[#00ffff] font-black">_</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * =============================================================================
 * 4. COMPONENT: BarcodeScannerModule
 * =============================================================================
 */
const BarcodeScannerModule = ({ data }) => {
  const [logs, setLogs] = useState([]);
  const [scanMode, setScanMode] = useState("Camera");
  const [isConnected, setIsConnected] = useState(false);
  const fileInputRef = useRef(null);

  const handleConnectToggle = () => {
    const newStatus = !isConnected;
    setIsConnected(newStatus);
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[SCANNER] ${newStatus ? 'ONLINE' : 'OFFLINE'} pada ${timestamp}`]);
  };

  const handleFileBrowse = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-10 items-start shrink-0">
        {/* GIF AREA WITH STATUS BARCODE */}
        <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/20 bg-zinc-950 overflow-hidden group">
            <img 
              src={isConnected 
                ? "https://cdn.dribbble.com/userupload/11267440/file/original-4d437e61e0e8e604f8e6e58b1a3782b7.gif" 
                : "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3NueG50MGJ2ZWZ5dWNxZ3R6ZTF3ZTN1Nnd3NTh3ZTN1Nnd3NTh3ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/vFhIOWC9S4GzM7T0yC/giphy.gif"
              } 
              alt="Scanner Status" 
              className={`w-full h-full object-cover transition-opacity duration-500 ${isConnected ? 'opacity-80' : 'opacity-40'}`} 
            />
            <div className="absolute inset-0 flex flex-col items-end justify-start text-right p-4 pointer-events-none">
              <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-tight">Scanner Is</span>
              <span className={`text-[12px] font-black uppercase tracking-tighter mt-1 animate-pulse ${isConnected ? 'text-emerald-400' : 'text-red-500'}`}>{isConnected ? 'Active' : 'Offline'}</span>
              <button onClick={handleConnectToggle} className="pointer-events-auto mt-4 px-4 py-1.5 border-2 text-[9px] font-black uppercase active:scale-95 shadow-lg border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black">
                {isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
          <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">Scanner_System_V.1</span>
        </div>

        {/* CAPTURE FORM */}
        <div className="flex-1 h-[155px] border-2 border-[#00ffff]/40 bg-zinc-900/60 pt-6 px-6 pb-12 relative rounded-sm group flex flex-col justify-start gap-4 overflow-visible">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase z-[50]">Capture</div>
          <div className="flex gap-6 items-end z-0">
            <div className="flex-1 space-y-1.5">
              <label className="text-[9px] text-[#00ffff] font-black tracking-widest block uppercase">Select Mode</label>
              <select 
                value={scanMode}
                onChange={(e) => setScanMode(e.target.value)}
                className="w-full bg-black border-2 border-[#00ffff]/20 text-[10px] p-2 text-white outline-none focus:border-[#00ffff] font-pixel cursor-pointer"
              >
                <option value="Camera">Camera</option>
                <option value="Upload_File">Upload_File</option>
              </select>
            </div>

            {scanMode === "Upload_File" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 space-y-1.5"
              >
                <label className="text-[9px] text-[#00ffff] font-black tracking-widest block uppercase opacity-50">Local Access</label>
                <button 
                  onClick={handleFileBrowse}
                  className="w-full bg-[#00ffff]/10 border-2 border-dashed border-[#00ffff]/40 text-[10px] p-2 text-[#00ffff] font-black hover:bg-[#00ffff]/20 hover:border-[#00ffff] transition-all flex items-center justify-center gap-2"
                >
                  <Folder size={12} />
                  <span>Browse_PC</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" />
              </motion.div>
            )}
          </div>
          
          <div className="flex gap-4 mt-2">
            <button className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#00ffff] text-[#00ffff] text-[10px] font-black uppercase shadow-md active:scale-95">Start</button>
            <button className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#ff00ff] text-[#ff00ff] text-[10px] font-black uppercase shadow-md active:scale-95">Stop</button>
          </div>
        </div>
      </div>

      {/* CONSOLE BUFFER - EXPANDED */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <div className="flex-1 border-2 border-[#00ffff]/20 bg-black/90 p-5 flex flex-col rounded-sm relative overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] text-left text-zinc-400 font-mono text-[11px]">
          <div className="flex items-center gap-3 text-[#00ffff] mb-4 uppercase font-black tracking-[0.2em] border-b border-[#00ffff]/10 pb-2">
            <Activity size={12} className="animate-pulse" />
            <span>Console_Buffer_Output</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {logs.map((log, idx) => (
                <div key={idx} className="flex gap-3 leading-tight items-start">
                    <span className="text-[#00ffff]/30 text-[9px] w-6 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                    <span className={log.includes('ONLINE') ? 'text-[#00ffff] drop-shadow(0 0 5px #00ffff44)' : log.includes('OFFLINE') ? 'text-red-400' : ''}>{log}</span>
                </div>
            ))}
            <div className="animate-pulse text-[#00ffff] font-black h-4 mt-1">_</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * =============================================================================
 * 5. COMPONENT: OCRScannerModule (NEW)
 * =============================================================================
 */
const OCRScannerModule = ({ data }) => {
  const [logs, setLogs] = useState([]);
  const [scanMode, setScanMode] = useState("Camera");
  const [isConnected, setIsConnected] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLogs([`[SYSTEM] OCR Recognition Engine Loaded.`, `[STATUS] Ready to capture document.`]);
  }, []);

  const handleConnectToggle = () => {
    const newStatus = !isConnected;
    setIsConnected(newStatus);
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[OCR_SYSTEM] ${newStatus ? 'SCANNER_CONNECTED' : 'SCANNER_DISCONNECTED'} at ${timestamp}`]);
  };

  const handleFileBrowse = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-10 items-start shrink-0">
        {/* GIF AREA WITH STATUS OCR */}
        <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/20 bg-zinc-950 overflow-hidden group">
            <img 
              src={isConnected 
                ? "https://cdn.dribbble.com/userupload/11132644/file/original-b9c1d6365f57c617e4e1352a9e3f3a8b.gif" 
                : "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3NueG50MGJ2ZWZ5dWNxZ3R6ZTF3ZTN1Nnd3NTh3ZTN1Nnd3NTh3ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/5Akl9i8YiMbl5RFvGO/giphy.gif"
              } 
              alt="OCR Status" 
              className={`w-full h-full object-cover transition-opacity duration-500 ${isConnected ? 'opacity-80' : 'opacity-40'}`} 
            />
            <div className="absolute inset-0 flex flex-col items-end justify-start text-right p-4 pointer-events-none">
              <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-tight">OCR Engine</span>
              <span className={`text-[12px] font-black uppercase tracking-tighter mt-1 animate-pulse ${isConnected ? 'text-emerald-400' : 'text-red-500'}`}>{isConnected ? 'Active' : 'Offline'}</span>
              <button onClick={handleConnectToggle} className="pointer-events-auto mt-4 px-4 py-1.5 border-2 text-[9px] font-black uppercase active:scale-95 shadow-lg border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black">
                {isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
          <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">OCR_Recognition_V.1</span>
        </div>

        {/* CAPTURE FORM */}
        <div className="flex-1 h-[155px] border-2 border-[#00ffff]/40 bg-zinc-900/60 pt-6 px-6 pb-12 relative rounded-sm group flex flex-col justify-start gap-4 overflow-visible">
          <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase z-[50]">OCR Capture</div>
          <div className="flex gap-6 items-end z-0">
            <div className="flex-1 space-y-1.5">
              <label className="text-[9px] text-[#00ffff] font-black tracking-widest block uppercase">Capture Mode</label>
              <select 
                value={scanMode}
                onChange={(e) => setScanMode(e.target.value)}
                className="w-full bg-black border-2 border-[#00ffff]/20 text-[10px] p-2 text-white outline-none focus:border-[#00ffff] font-pixel cursor-pointer"
              >
                <option value="Camera">Camera</option>
                <option value="Upload_File">Upload_File</option>
              </select>
            </div>

            {scanMode === "Upload_File" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 space-y-1.5"
              >
                <label className="text-[9px] text-[#00ffff] font-black tracking-widest block uppercase opacity-50">Local File</label>
                <button 
                  onClick={handleFileBrowse}
                  className="w-full bg-[#00ffff]/10 border-2 border-dashed border-[#00ffff]/40 text-[10px] p-2 text-[#00ffff] font-black hover:bg-[#00ffff]/20 hover:border-[#00ffff] transition-all flex items-center justify-center gap-2"
                >
                  <Folder size={12} />
                  <span>Select_File</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" />
              </motion.div>
            )}
          </div>
          
          <div className="flex gap-4 mt-2">
            <button className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#00ffff] text-[#00ffff] text-[10px] font-black uppercase shadow-md active:scale-95">Recognize</button>
            <button className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#ff00ff] text-[#ff00ff] text-[10px] font-black uppercase shadow-md active:scale-95">Clear</button>
          </div>
        </div>
      </div>

      {/* CONSOLE BUFFER - EXPANDED */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <div className="flex-1 border-2 border-[#00ffff]/20 bg-black/90 p-5 flex flex-col rounded-sm relative overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] text-left text-zinc-400 font-mono text-[11px]">
          <div className="flex items-center gap-3 text-[#00ffff] mb-4 uppercase font-black tracking-[0.2em] border-b border-[#00ffff]/10 pb-2">
            <Activity size={12} className="animate-pulse" />
            <span>OCR_Process_Logs</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {logs.map((log, idx) => (
                <div key={idx} className="flex gap-3 leading-tight items-start">
                    <span className="text-[#00ffff]/30 text-[9px] w-6 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                    <span className={log.includes('CONNECTED') ? 'text-[#00ffff]' : ''}>{log}</span>
                </div>
            ))}
            <div className="animate-pulse text-[#00ffff] font-black h-4 mt-1">_</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * =============================================================================
 * 6. COMPONENT: TerminalView (MAIN ENTRY POINT)
 * =============================================================================
 */
const TerminalView = (props) => {
  const isPrinter = props.data?.short?.includes("PRINTER");
  const isBarcode = props.data?.short?.includes("BARCODE");
  const isOCR = props.data?.short?.includes("OCR");
  
  // Tab sesuai Modul
  const tabs = isOCR
    ? [{ id: 'ocr_scanner', label: 'OCR Scanner', type: 'enroll' }]
    : isBarcode
      ? [{ id: 'barcode_scanner', label: 'Barcode Scanner', type: 'enroll' }]
      : isPrinter 
        ? [
            { id: 'text_barcode', label: 'Text & Barcode', type: 'enroll' },
            { id: 'sample', label: 'Sample', type: 'verify' }
          ]
        : [
            { id: 'enrollment', label: 'Enrollment', type: 'enroll' },
            { id: 'verification', label: 'Verification', type: 'verify' }
          ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const shortTitle = props.data?.short?.split(' ')[0] || "SYSTEM";

  // Visual Sidebar Kiri (Modular)
  const LeftColumn = (
    <div className="w-[500px] flex flex-col items-start shrink-0">
      <div className="relative w-full aspect-square border-2 border-[#00ffff]/40 bg-black overflow-hidden rounded-sm group mb-4">
        <img src={props.data?.image} alt="Target Visual" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000 scale-110" style={{ imageRendering: 'pixelated' }} />
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff]/50 animate-pixel-scan z-20" />
        <div className="absolute bottom-6 left-6 flex flex-col z-30 font-pixel">
          <span className="text-[11px] bg-[#00ffff] text-black px-2 py-0.5 font-black uppercase tracking-tighter w-fit">LOCKED_ID: {shortTitle}</span>
          <span className="text-[8px] text-white/60 font-mono mt-1 tracking-widest uppercase bg-black/60 px-2 py-0.5 w-fit">Encryption_RSA_Active</span>
        </div>
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#00ffff]/80" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#00ffff]/80" />
      </div>
      
      <div className="flex h-5 w-full border-2 border-[#00ffff]/40 overflow-hidden mb-4 shadow-lg">
         {['#082e2e', '#0d4a4a', '#126666', '#178282', '#00ffff', '#ff00ff', '#cc00cc', '#990099', '#ffffff', '#999999', '#444444', '#222222'].map((color, i) => (
           <div key={i} className="flex-1" style={{ backgroundColor: color }} />
         ))}
      </div>

      {!isPrinter && (
        <>
          {/* BREADCRUMB PATH (RUNCING & TAJAM) */}
          <div className="flex h-8 w-fit font-mono text-[9px] uppercase tracking-tighter items-stretch mb-6">
             <div className="flex items-center px-4 pr-8 bg-[#178282] text-white relative z-10 path-arrow-start shadow-lg">
                <Home size={12} strokeWidth={2.5} />
             </div>
             <div className="flex items-center pl-9 pr-8 bg-[#0d4a4a] text-zinc-300 relative z-20 -ml-[18px] path-arrow-nested">
                <span className="font-black">team</span>
             </div>
             {/* Segmen terakhir jalur folder runcing tajam */}
             <div className="flex items-center pl-9 pr-10 bg-[#082e2e] text-[#00ffff]/90 relative z-30 -ml-[18px] path-arrow-end border-y border-[#00ffff]/10">
                <FolderOpen size={10} className="mr-2 opacity-60" />
                <span className="whitespace-nowrap tracking-widest">local/bin/vault/{shortTitle}</span>
             </div>
          </div>

          {/* AREA DI BAWAH PATH */}
          {(isBarcode || isOCR) ? (
            /* CARD HASIL PEMBACAAN (BARCODE & OCR) */
            <div className="w-full border-2 border-[#00ffff]/40 bg-zinc-900/60 p-5 rounded-sm relative overflow-hidden flex flex-col gap-4 shadow-[0_0_20px_rgba(0,255,255,0.05)] h-fit">
               <div className="absolute top-0 left-0 w-12 h-[2px] bg-[#00ffff]" />
               <div className="absolute top-0 left-0 w-[2px] h-12 bg-[#00ffff]" />
               
               <div className="flex justify-between items-center border-b border-[#00ffff]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#00ffff] animate-pulse rounded-full" />
                    <span className="text-[10px] font-black text-[#00ffff] uppercase tracking-[0.2em]">{isOCR ? 'OCR Recognition Result' : 'Scanner Decode Result'}</span>
                  </div>
                  {isOCR ? <ClipboardType size={14} className="text-[#00ffff]/60" /> : <BarcodeIcon size={14} className="text-[#00ffff]/60" />}
               </div>

               <div className="flex-1 bg-black/80 border border-[#00ffff]/10 p-6 flex flex-col justify-center items-center min-h-[120px] rounded-sm group relative">
                  <div className="absolute top-2 left-2 text-[6px] text-zinc-700 uppercase font-bold tracking-tighter">Recognition_Output_V.1</div>
                  <div className="text-center w-full">
                    <span className="text-[8px] text-zinc-500 uppercase block mb-3 tracking-[0.3em] font-black italic opacity-50">[ SYSTEM_READY ]</span>
                    <div className="px-4 py-2 border border-[#00ffff]/5 bg-[#00ffff]/5 inline-block min-w-[150px]">
                      <h4 className="text-[18px] font-mono text-[#00ffff] break-all uppercase leading-none tracking-tighter drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">
                        {"--- EMPTY ---"}
                      </h4>
                    </div>
                  </div>
               </div>

               <div className="flex justify-between items-center text-[8px] font-black">
                  <span className="text-zinc-500 uppercase tracking-widest">Confidence: 100%</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#00ffff] uppercase">Lang: EN/ID</span>
                    <Scan size={10} className="text-[#00ffff] opacity-40" />
                  </div>
               </div>
            </div>
          ) : (
            /* GRID GAMBAR UNTUK FINGERPRINT */
            <div className="grid grid-cols-4 gap-4 w-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square border-2 border-[#00ffff]/20 bg-zinc-900/50 flex items-center justify-center hover:bg-[#00ffff]/20 transition-all cursor-crosshair group relative overflow-hidden">
                  <div className="absolute inset-0 bg-black opacity-40" />
                  <Fingerprint size={28} className="text-[#00ffff]/20 group-hover:text-[#00ffff]/80 transition-colors z-10" />
                  <div className="absolute bottom-1 right-1 text-[6px] text-white/20 font-bold">#{i+1}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <TerminalShell 
      {...props} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      tabs={tabs}
      leftColumn={LeftColumn}
    >
      {isOCR 
        ? <OCRScannerModule {...props} />
        : isBarcode 
          ? <BarcodeScannerModule {...props} />
          : isPrinter 
            ? <ThermalPrinterModule {...props} activeTab={activeTab} />
            : <FingerprintModule {...props} activeTab={activeTab} />
      }
    </TerminalShell>
  );
};

export default TerminalView;