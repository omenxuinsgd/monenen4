"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Power, Globe, User, Wifi } from 'lucide-react';

/**
 * TerminalShell
 * Komponen layout dasar untuk semua modul terminal.
 * Fokus: Mempertahankan Banner Judul dengan font Arcade Classic.
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
  // Mengambil kata pertama dari short title untuk estetika banner yang besar
  const shortTitle = data?.short?.split(' ')[0] || "SYSTEM";
  const fullTitle = data?.title || "TERMINALIZER";

  const NavTab = ({ id, label, isActive, onClick, index }) => {
    const isFirst = index === 0;
    
    // Pola kemiringan paralel searah backslash (\ \)
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
        <span className={`relative z-30 text-[15px] font-black font-mono uppercase tracking-[0.1em] ${isActive ? 'text-black' : 'text-[#00ffff]/40'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-2 z-[100] flex flex-col rounded-sm overflow-hidden border-2 border-[#00ffff]/60 shadow-[0_0_60px_rgba(0,255,255,0.25)] font-pixel"
      style={{ background: isDarkMode ? 'rgba(4, 6, 10, 0.98)' : 'rgba(235, 245, 255, 0.98)', imageRendering: 'pixelated' }}
    >
      {/* HEADER */}
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
          {/* BANNER JUDUL (ARCADE CLASSIC FONT) */}
          <div className="relative py-2 px-10 mt-0.5 border-2 border-t-6 border-[#00ffff]/20 bg-gradient-to-r from-[#00ffff]/5 to-transparent rounded-sm overflow-hidden shrink-0">
            <h2 className="text-4xl tracking-[0.05em] font-arcade leading-none uppercase banner-title truncate">
              {`> ${shortTitle}`}
            </h2>
            <Terminal size={120} className="absolute right-[-20px] top-[-20px] text-[#00ffff] opacity-5 -rotate-12" />
          </div>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex items-end h-11 w-fit relative z-30 overflow-visibl">
              {tabs.map((tab, idx) => (
                <NavTab key={tab.id} id={tab.id} label={tab.label} index={idx} isActive={activeTab === tab.id} onClick={setActiveTab} />
              ))}
            </div>
            
            <div className="flex-1 flex flex-col border-x-2 border-b-2 border-[#00ffff]/40 bg-black/60 rounded-sm shadow-2xl relative overflow-hidden">
              <div className="h-[2px] w-full bg-[#00ffff]/40 shrink-0 pb-1 mb-2" />
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
        /* Menghubungkan font Arcade Classic */
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
      `}</style>
    </motion.div>
  );
};

export default TerminalShell;