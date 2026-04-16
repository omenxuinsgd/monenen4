"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Activity, 
  ChevronRight, 
  User, 
  Globe, 
  Wifi,
  Monitor,
  Fingerprint,
  Cpu,
  Keyboard,                               
    if (activeInput === 'nik') {
      setNik(prev => prev + char);
    } else if (activeInput === 'name') {
      setUserName(prev => prev + char);
    } else if (activeInput === 'identifier') {
      setIdentifierKey(prev => prev + char);
    }
  };

  // Fungsi Toggle Koneksi Perangkat
  const handleConnectToggle = () => {
    const newStatus = !isConnected;
    setIsConnected(newStatus);
    
    // Tambahkan log sistem saat status berubah
    const timestamp = new Date().toLocaleTimeString();
    const message = newStatus 
      ? `[DEVICE] ${shortTitle} TERHUBUNG pada ${timestamp}` 
      : `[DEVICE] ${shortTitle} TERPUTUS pada ${timestamp}`;
    
    setLogs(prev => [...prev, message]);  
  };

  // Maskot Dino Pixel Art (Didefinisikan namun saat ini digantikan GIF)
  const PixelDino = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor" className="text-white opacity-90">
      <path d="M7 2v2h2v2H7v2H5v2H3v2h2v2h2v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2V8h-2V6h-2V4h-2V2H7z M17 8h2v2h-2V8z M11 10h2v2h-2v-2z" />
    </svg>
  );

  // Helper untuk merender Tab dengan Slant Paralel (\ \)
  const NavTab = ({ id, label, isActive, onClick, type }) => {
    const isEnroll = type === 'enroll';
    
    // Pola kemiringan sejajar ke kanan (\)
    const polyOuter = isEnroll 
      ? "polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%)" 
      : "polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0 100%)";
    
    const polyInner = isEnroll 
      ? "polygon(2px 2px, calc(100% - 2px) 2px, calc(100% - 21px) calc(100% - 2px), 2px calc(100% - 2px))"
      : "polygon(22px 2px, calc(100% - 2px) 2px, calc(100% - 21px) calc(100% - 2px), 1px calc(100% - 2px))";

    return (
      <button 
        onClick={() => onClick(id)}
        className={`relative h-11 px-16 flex items-center justify-center transition-all duration-300 ${isEnroll ? '' : '-ml-[21px]'} ${isActive ? 'z-20' : 'z-10'}`}
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
        
        {/* KOLOM KIRI (Visual Identity) */}
        <div className="w-[500px] flex flex-col items-start shrink-0">
          <div className="relative w-full aspect-square border-2 border-[#00ffff]/40 bg-black overflow-hidden rounded-sm group mb-4">
            <img 
              src={data?.image || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"} 
              alt="Visual ID" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000 scale-110" 
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffff]/50 animate-pixel-scan z-20" />
            <div className="absolute bottom-6 left-6 flex flex-col z-30 font-pixel">
              <span className="text-[11px] bg-[#00ffff] text-black px-2 py-0.5 font-black uppercase tracking-tighter w-fit">LOCKED_ID: {shortTitle}</span>
              <span className="text-[8px] text-white/60 font-mono mt-1 tracking-widest uppercase bg-black/60 px-2 py-0.5 w-fit">Encryption_RSA_Active</span>
            </div>
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#00ffff]/80" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#00ffff]/80" />
          </div>

          <div className="flex h-5 w-full border-2 border-[#00ffff]/40 overflow-hidden mb-4">
             {['#082e2e', '#0d4a4a', '#126666', '#178282', '#00ffff', '#ff00ff', '#cc00cc', '#990099', '#ffffff', '#999999', '#444444', '#222222'].map((color, i) => (
               <div key={i} className="flex-1" style={{ backgroundColor: color }} />
             ))}
          </div>

          <div className="flex h-8 w-fit font-mono text-[9px] uppercase tracking-tighter items-stretch mb-6">
             <div className="flex items-center px-4 bg-[#178282] text-white relative z-10 path-arrow-start shadow-lg">
                <Home size={12} strokeWidth={2.5} />
             </div>
             <div className="flex items-center pl-7 pr-4 bg-[#0d4a4a] text-zinc-300 relative z-20 -ml-[10px] path-arrow-nested">
                <span className="font-black">team</span>
             </div>
             <div className="flex items-center pl-7 pr-7 bg-[#082e2e] text-[#00ffff]/90 relative z-30 -ml-[10px] path-arrow-nested border-y border-[#00ffff]/10">
                <FolderOpen size={10} className="mr-2 opacity-60" />
                <span className="whitespace-nowrap tracking-widest">local/bin/vault/{shortTitle}</span>
             </div>
          </div>

          <div className="grid grid-cols-4 gap-4 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square border-2 border-[#00ffff]/20 bg-zinc-900/50 flex items-center justify-center hover:bg-[#00ffff]/20 transition-all cursor-crosshair group relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-40" />
                <Fingerprint size={28} className="text-[#00ffff]/20 group-hover:text-[#00ffff]/80 transition-colors z-10" />
                <div className="absolute bottom-1 right-1 text-[6px] text-white/20 font-bold">#{i+1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0">
          
          {/* BANNER JUDUL */}
          <div className="relative py-2 px-10 border-2 border-[#00ffff]/20 bg-gradient-to-r from-[#00ffff]/5 to-transparent rounded-sm overflow-hidden shrink-0">
            <h2 className="text-7xl tracking-[0.05em] font-arcade leading-none uppercase banner-title truncate">
              {`> ${shortTitle}`}
            </h2>
            <Terminal size={120} className="absolute right-[-20px] top-[-20px] text-[#00ffff] opacity-5 -rotate-12" />
          </div>

          {/* Interface Panel Utama */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* Baris Navigasi Tab */}
            <div className="flex items-end h-11 w-fit relative z-30 overflow-visible">
              <NavTab id="enrollment" label="Enrollment" type="enroll" isActive={activeTab === 'enrollment'} onClick={setActiveTab} />
              <NavTab id="verification" label="Verification" type="verify" isActive={activeTab === 'verification'} onClick={setActiveTab} />
            </div>
            
            {/* Box Konten Utama */}
            <div className="flex-1 flex flex-col border-x-2 border-b-2 border-[#00ffff]/40 bg-black/60 rounded-sm shadow-2xl relative overflow-hidden">
              
              {/* Baseline Divider */}
              <div className="h-[2px] w-full bg-[#00ffff]/40 shrink-0" />

              <div className="flex-1 p-8 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                
                {/* Bagian Konten Atas (Status Device & Capture) */}
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                  
                  {/* DEVICE STATUS AREA */}
                  <div className="w-full lg:w-[190px] flex flex-col items-center gap-2 shrink-0">
                     <div className="relative w-full aspect-[1.25/1] border-2 border-[#00ffff]/20 bg-zinc-950 overflow-hidden group">
                        {/* Background GIF Dinamis */}
                        <img 
                          src={isConnected 
                            ? "https://cdn.dribbble.com/userupload/23642809/file/original-129fd5d25fa96a3437877562aa243ad6.gif" 
                            : "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcm0zcDUyM2Yxazh2ZzJvN3NuaTkxMjh0NHU3djZqemYzbWFvZWp2OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/5Akl9i8YiMbl5RFvGO/giphy.gif"
                          } 
                          alt="Device Status Animation" 
                          className={`w-full h-full object-cover transition-opacity duration-500 ${isConnected ? 'opacity-80' : 'opacity-40'}`}
                        />
                        
                        {/* Overlay Elemen Pojok KANAN Atas */}
                        <div className="absolute inset-0 flex flex-col items-end justify-start text-right p-4 pointer-events-none">
                           <div className="mb-2">
                              <span className="text-[9px] text-zinc-400 font-black uppercase block tracking-widest leading-tight">Device</span>
                              <span className="text-[9px] text-zinc-400 font-black uppercase block tracking-widest leading-tight">Is</span>
                              <span className={`text-[12px] font-black uppercase tracking-tighter mt-1 animate-pulse ${isConnected ? 'text-emerald-400' : 'text-red-500'}`}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                              </span>
                           </div>
                           
                           {/* Color Bar Palette */}
                           <div className="flex h-1.5 w-20 border border-zinc-800 mb-4 justify-end">
                              {['#000', '#ff0000', '#ccff00', '#ffcc00', '#00ffff', '#ff9999', '#99ffcc', '#fff'].map((c, i) => (
                                <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                              ))}
                           </div>

                           {/* Tombol Connect / Disconnect */}
                           <button 
                             onClick={handleConnectToggle}
                             className={`pointer-events-auto px-4 py-1.5 border-2 text-[9px] font-black transition-all uppercase active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.2)]
                               ${isConnected 
                                 ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' 
                                 : 'border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black'
                               }`}
                           >
                              {isConnected ? 'Disconnect' : 'Connect'}
                           </button>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00ffff]/30 animate-scan-fast pointer-events-none" />
                     </div>
                     <span className="text-[8px] text-[#00ffff]/40 font-bold uppercase tracking-[0.3em]">Device_Registry_V.1</span>
                  </div>

                  {/* FORM AREA (CAPTURE) */}
                  <div className="flex-1 h-[155px] border-2 border-[#00ffff]/40 bg-zinc-900/60 pt-6 px-6 pb-12 relative rounded-sm group flex flex-col justify-start gap-4 overflow-visible">
                     <div className="absolute -top-[12px] left-6 bg-white text-black px-4 py-0.5 text-[10px] font-black uppercase shadow-[0_0_10px_rgba(255,255,255,0.4)] z-[50]">
                        Capture
                     </div>
                     <div className="grid grid-cols-2 gap-6 text-left z-0">
                        <div className="space-y-1.5">
                           <label className="text-[9px] text-[#00ffff] font-black uppercase tracking-widest block">Select Mode</label>
                           <select className="w-full bg-black border-2 border-[#00ffff]/20 text-[10px] p-2 text-white outline-none focus:border-[#00ffff] rounded-none cursor-pointer font-pixel">
                              <option>Standard_Credential_ID</option>
                              <option>Encrypted_Vault_Access</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] text-[#00ffff] font-black uppercase tracking-widest block">Identifier Key</label>
                           <input 
                             value={identifierKey}
                             onFocus={() => setActiveInput('identifier')}
                             onChange={(e) => setIdentifierKey(e.target.value)}
                             placeholder="Enter Serial / NIK..." 
                             className={`w-full bg-black border-2 transition-all text-[10px] p-2 text-[#00ffff] outline-none placeholder:text-zinc-800 rounded-none font-mono ${activeInput === 'identifier' ? 'border-[#00ffff]' : 'border-[#00ffff]/20'}`} 
                           />
                        </div>
                     </div>
                     <div className="flex gap-4 font-pixel z-0 mt-1">
                        <button className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#00ffff] text-[#00ffff] text-[10px] font-black hover:bg-[#00ffff] hover:text-black transition-all uppercase shadow-lg active:scale-95">Start</button>
                        <button className="flex-1 py-1.5 bg-zinc-950 border-2 border-[#ff00ff] text-[#ff00ff] text-[10px] font-black hover:bg-[#ff00ff] hover:text-white transition-all uppercase shadow-lg active:scale-95">Stop</button>
                     </div>
                  </div>
                </div>

                {/* Dashboard Bawah (Registry & Console) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-fit">
                   
                   {/* REGISTRY MANUAL */}
                   <div className="border-2 border-[#00ffff]/20 bg-zinc-950/80 p-4 flex flex-col rounded-sm relative text-left">
                      <div className="flex justify-between items-center border-b border-[#00ffff]/10 pb-1 mb-2">
                         <span className="text-[9px] font-black text-[#00ffff]/60 uppercase tracking-widest">Registry_Manual</span>
                         <Keyboard size={12} className="text-[#00ffff]/30" />
                      </div>
                      
                      <div className="flex flex-col gap-3 font-pixel">
                         <div className={`flex flex-col gap-1 border-b-2 transition-all duration-300 ${activeInput === 'nik' ? 'border-[#00ffff]' : 'border-[#00ffff]/20'}`}>
                            <input 
                              value={nik}
                              onFocus={() => setActiveInput('nik')}
                              onChange={(e) => setNik(e.target.value)}
                              placeholder="Enter Your NIK" 
                              className="w-full bg-transparent text-[10px] p-1 text-[#00ffff] outline-none" 
                           />
                         </div>
                         <div className={`flex flex-col gap-1 border-b-2 transition-all duration-300 ${activeInput === 'name' ? 'border-[#00ffff]' : 'border-[#00ffff]/20'}`}>
                            <input 
                              value={userName}
                              onFocus={() => setActiveInput('name')}
                              onChange={(e) => setUserName(e.target.value)}
                              placeholder="Enter Your Name" 
                              className="w-full bg-transparent text-[10px] p-1 text-[#00ffff] outline-none" 
                           />
                         </div>
                      </div>

                      <div className="grid grid-cols-10 gap-1 mt-3 select-none">
                         {[...Array(30)].map((_, i) => {
                           const char = String.fromCharCode(65 + i);
                           return (
                             <div 
                               key={i} 
                               onClick={() => handleKeyClick(char)}
                               className="aspect-square border border-[#00ffff]/30 bg-[#00ffff]/5 text-[8px] flex items-center justify-center text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all cursor-pointer active:scale-90"
                             >
                                {char}
                             </div>
                           );
                         })}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                         <button className="flex-1 py-1.5 border-2 border-[#00ffff] text-[#00ffff] text-[9px] font-black hover:bg-[#00ffff] hover:text-black transition-all shadow-md uppercase active:scale-95">Submit</button>
                         <button onClick={() => {setNik(""); setUserName(""); setIdentifierKey("");}} className="flex-1 py-1.5 border-2 border-[#ff00ff] text-[#ff00ff] text-[9px] font-black hover:bg-[#ff00ff] hover:text-white transition-all shadow-md uppercase active:scale-95">Cancel</button>
                      </div>
                   </div>

                   {/* CONSOLE BUFFER */}
                   <div className="border-2 border-[#00ffff]/20 bg-black/90 p-4 flex flex-col rounded-sm relative overflow-hidden shadow-inner text-left">
                      <div className="text-[9px] text-zinc-500 font-black mb-2 uppercase flex items-center justify-between">
                         <div className="flex items-center gap-2 text-[#00ffff]">
                            <Activity size={10} className="animate-pulse" />
                            <span>Console_Buffer</span>
                         </div>
                         <span className="text-[7px] opacity-40 uppercase tracking-widest font-mono">Kernel_Stable</span>
                      </div>
                      <div className="flex-1 font-mono text-[10px] overflow-hidden text-zinc-400 space-y-1">
                         {logs.slice(-4).map((log, idx) => (
                           <div key={idx} className="flex gap-3 leading-none items-start">
                             <span className="text-[#00ffff]/40 text-[8px] font-bold">{(idx + 1).toString().padStart(2, '0')}</span>
                             <span className={log?.includes('Connected') || log?.includes('OK') ? 'text-[#00ffff]' : log?.includes('Disconnected') ? 'text-red-400' : ''}>
                               {log}
                             </span>
                           </div>
                         ))}
                         <div className="animate-pulse text-[#00ffff] font-black">_</div>
                      </div>
                   </div>

                </div>
              </div>
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
        @font-face {
          font-family: 'ArcadeClassic';
          src: url('/fonts/ARCADECLASSIC.TTF');
        }
        .font-arcade {
          font-family: 'ArcadeClassic', 'Courier New', cursive;
        }
        .font-pixel {
          font-family: 'Courier New', Courier, monospace;
          letter-spacing: -0.02em;
        }
        .banner-title {
          background: linear-gradient(to right, #5495e8, #7d8be2, #aa78d5, #cd65bb, #e15b9c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(4px 4px 0px rgba(45, 54, 102, 0.8));
        }
        @keyframes scan-fast {
          from { transform: translateY(-100%); }
          to { transform: translateY(500%); }
        }
        .animate-scan-fast { animation: scan-fast 3s linear infinite; }
        @keyframes pixel-scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(500px); opacity: 0; }
        }
        .animate-pixel-scan { animation: pixel-scan 5s linear infinite; }
        .animate-spin-slow { animation: spin 30s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .path-arrow-start { clip-path: polygon(0% 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 0% 100%); }
        .path-arrow-nested { clip-path: polygon(0% 0%, 10px 50%, 0% 100%, calc(100% - 10px) 100%, 100% 50%, calc(100% - 10px) 0%); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); border-radius: 10px; }
      `}</style>
    </motion.div>
  );
};

export default TerminalView;