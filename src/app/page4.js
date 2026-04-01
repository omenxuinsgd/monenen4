"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Shield, 
  Settings, 
  Sun, 
  Moon, 
  Cpu, 
  Database, 
  HardDrive, 
  Code2,
  ChevronRight
} from 'lucide-react';

/**
 * CATATAN PENTING UNTUK PROYEK LOKAL:
 * Harap pastikan file-file berikut berada di direktori yang sesuai:
 * - /constants/contentData.js
 * - /components/BackgroundAnimations.jsx
 * - /components/TypewriterText.jsx
 * - /components/TerminalView.jsx
 */

// Import Modular Components
import { CONTENT_DATA } from '@/constants/contentData';
import { MatrixRain, CyberGrid, NetworkPulse } from '@/components/terminal/BackgroundAnimations';
import TypewriterText from '@/components/TypewriterText';
import TerminalView from '@/components/TerminalView';

const GpuIcon = Cpu;

/**
 * Komponen Utama: Dashboard Keamanan Siber.
 */
export default function App() {
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [view, setView] = useState('home'); 
  const AUTO_PLAY_TIME = 10000;

  // State simulasi statistik monitoring
  const [stats, setStats] = useState({
    cpu: 24, gpu: 12, ram: "4.8 / 16.0 GB", storage: "128 / 512 GB", firmware: "v2.8.5-LTS"
  });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      if (view === 'home') {
        setActiveIdx((prev) => (prev + 1) % CONTENT_DATA.length);
        setProgress(0);
      }
    }, AUTO_PLAY_TIME);

    const progressTimer = setInterval(() => {
      if (view === 'home') {
        setProgress((prev) => Math.min(prev + (100 / (AUTO_PLAY_TIME / 100)), 100));
      }
    }, 100);

    const statsTimer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * (45 - 20) + 20),
        gpu: Math.floor(Math.random() * (30 - 10) + 10),
      }));
    }, 3000);

    const handleMouseMove = (e) => {
      setMousePos({ x: (e.clientX / window.innerWidth) - 0.5, y: (e.clientY / window.innerHeight) - 0.5 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
      clearInterval(statsTimer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [view]);

  if (!mounted) return <div className="min-h-screen bg-black" />;

  const validIdx = activeIdx >= CONTENT_DATA.length ? 0 : activeIdx;
  const activeData = CONTENT_DATA[validIdx];

  const renderBackground = () => {
    switch (activeData.bgType) {
      case 'grid': return <CyberGrid />;
      case 'pulse': return <NetworkPulse />;
      default: return <MatrixRain isLight={!isDarkMode} />;
    }
  };

  return (
    <div className={`relative min-h-screen transition-colors duration-700 font-mono overflow-hidden flex flex-col selection:bg-[#00ffff] selection:text-black ${isDarkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div key={`${validIdx}-${isDarkMode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
            {renderBackground()}
          </motion.div>
        </AnimatePresence>
        <div className={`absolute inset-0 z-50 bg-[length:100%_2px,3px_100%] ${isDarkMode ? 'bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,255,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))]' : 'bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(200,200,200,0.1)_50%)]'}`} />
      </div>

      {/* Header Dashboard */}
      <header className={`relative z-30 flex justify-between items-center px-8 py-6 backdrop-blur-md border-b transition-colors duration-500 ${isDarkMode ? 'bg-black/40 border-[#00ffff]/20' : 'bg-white/40 border-slate-200'}`}>
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-[#00ffff] flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            <Shield className="text-black" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase text-inherit">M-ONE <span className="text-[#00ffff]">AIO</span></span>
        </div>
        
        <nav className="flex items-center space-x-6">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${isDarkMode ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : 'text-slate-600 hover:bg-slate-200'}`} title="Toggle Mode">
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <button className={`flex items-center space-x-2 px-4 py-2 rounded-sm border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'text-[#00ffff] border-[#00ffff]/30 hover:bg-[#00ffff]/10' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`}>
            <Settings size={18} /> <span className="text-xs font-black tracking-[0.2em] uppercase">Settings</span>
          </button>
        </nav>
      </header>

      {/* Hero & Card Layout */}
      <div className="relative flex-1 flex z-10 overflow-hidden">
        <main className="flex-1 px-8 pt-8 md:pt-16 relative">
          <AnimatePresence mode="wait">
            <motion.div key={validIdx} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0, rotateY: mousePos.x * 5, rotateX: -mousePos.y * 5 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.5 }} className="max-w-3xl" style={{ perspective: "1000px" }}>
              <div className="flex items-center space-x-2 text-[#00ffff] text-sm font-bold tracking-[0.2em] mb-4">
                <span className="h-[1px] w-8 bg-[#00ffff]"></span> <span>{activeData.subtitle}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black italic mb-6 leading-tight uppercase min-h-[120px]">
                <TypewriterText text={activeData.title} />
              </h1>
              <div className={`relative p-6 border-l-4 border-[#00ffff] backdrop-blur-sm mb-10 overflow-hidden transition-colors ${isDarkMode ? 'bg-black/60' : 'bg-white/60'}`}>
                 <div className="absolute top-0 right-0 w-16 h-16 bg-[#00ffff]/5 rotate-45 translate-x-8 -translate-y-8" />
                 <div className={`text-sm md:text-lg leading-relaxed max-w-xl min-h-[80px] transition-colors ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                   <TypewriterText text={activeData.description} delay={1} speed={0.015} />
                 </div>
              </div>
              <motion.button onClick={() => setView('terminal')} whileHover={{ scale: 1.05, skewX: -12 }} className="group relative bg-[#00ffff] text-black font-black py-4 px-10 uppercase tracking-widest -skew-x-12 overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                <span className="relative z-10 font-black">Learn More</span>
                <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* 3D Parallax Menu Sidebar */}
        <div className="relative hidden xl:flex shrink-0">
          {/* Aesthetic HUD Border */}
          <div className="absolute left-0 top-10 bottom-10 w-[1px] bg-gradient-to-b from-transparent via-[#00ffff]/50 to-transparent flex flex-col items-center justify-between py-10 z-20">
             <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full shadow-[0_0_10px_#00ffff] animate-pulse" />
             <div className="flex flex-col items-center space-y-4 text-[#00ffff]/60 text-[7px] rotate-90 whitespace-nowrap tracking-[0.4em] font-black uppercase">
                <span>Grid_Menu_System_Active</span>
                {/* <div className="w-0.5 h-20 bg-[#00ffff]/20" /> */}
                <span>v.2.5.0_encryption</span>
             </div>
             <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full shadow-[0_0_10px_#00ffff] animate-pulse" />
          </div>

          <aside className="grid grid-rows-3 grid-flow-col gap-4 p-8 pr-16 shrink-0 overflow-y-auto" style={{ perspective: "1200px" }}>
            {CONTENT_DATA.map((item, i) => (
              <motion.div key={item.id} onClick={() => { setActiveIdx(i); setProgress(0); }} animate={{ z: validIdx === i ? 50 : 0, rotateY: validIdx === i ? -10 : 0, scale: validIdx === i ? 1.05 : 1, opacity: validIdx === i ? 1 : 0.6 }} className={`relative cursor-pointer group w-52 p-4 transition-all duration-500 border rounded-sm ${validIdx === i ? 'bg-[#00ffff]/10 border-transparent shadow-[0_0_20px_rgba(0,255,255,0.1)]' : 'bg-transparent border-white/10 hover:bg-zinc-800/10'}`}>
                {/* Efek Garis Berjalan untuk Menu Aktif */}
                {validIdx === i && (
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-[-10%] bg-[conic-gradient(from_0deg,#00ffff,#00f2fe,#7000ff,#00ffff)]" />
                    <div className={`absolute inset-[2px] z-10 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`} />
                  </div>
                )}
                {/* Siku Tebal */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#00ffff]/40 group-hover:w-12 group-hover:h-12 transition-all duration-300 z-20" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-dashed border-[#00ffff]/20 group-hover:w-12 group-hover:h-12 transition-all duration-300 z-20" />
                
                <div className="relative z-20 flex flex-col items-end text-right pointer-events-none">
                  <div className={`mb-3 p-2 rounded-sm border transition-colors ${validIdx === i ? 'bg-[#00ffff] text-black border-[#00ffff]' : (isDarkMode ? 'bg-black/40 text-[#00ffff]/60 border-[#00ffff]/20' : 'bg-white/40 text-slate-400 border-slate-200')}`}>
                    <item.Icon size={18} />
                  </div>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest ${validIdx === i ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-gray-400'}`}>{item.short}</h3>
                  <div className="w-full h-[1px] bg-gradient-to-l from-blue-500/30 to-transparent mb-1" />
                  {/* Status Dinamis Berdasarkan Menu */}
                  <p className={`text-[8px] leading-tight mb-3 ${validIdx === i ? 'text-[#00ffff]' : 'text-gray-500'}`}>0{i + 1} {item.status}</p>
                  <motion.div onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setView('terminal'); }} animate={{ x: validIdx === i ? 0 : 5, opacity: validIdx === i ? 1 : 0.4, color: validIdx === i ? '#00ffff' : '#4b5563' }} className="flex items-center space-x-1 text-[8px] font-bold pointer-events-auto mt-2">
                    <span className="uppercase tracking-tighter">Access File</span> <ChevronRight size={10} />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </aside>
        </div>
      </div>

      {/* Terminal View Overlay */}
      <AnimatePresence>
        {view === 'terminal' && (
          <TerminalView data={activeData} onClose={() => setView('home')} isDarkMode={isDarkMode} />
        )}
      </AnimatePresence>

      {/* Footer System Monitoring Dashboard */}
      <footer className={`relative z-40 flex flex-col md:flex-row items-center justify-between border-t transition-colors duration-500 px-8 py-4 space-y-4 md:space-y-0 ${isDarkMode ? 'bg-black/90 border-[#00ffff]/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]'}`}>
        <div className="flex-1 flex flex-wrap justify-center items-center gap-6 px-6">
            {[
              { icon: Cpu, label: "CPU_Load", val: `${stats.cpu}%`, progress: stats.cpu },
              { icon: GpuIcon, label: "GPU_Core", val: `${stats.gpu}%`, progress: stats.gpu },
              { icon: Database, label: "RAM_Usage", val: stats.ram },
              { icon: HardDrive, label: "Disk_Used", val: stats.storage },
              { icon: Code2, label: "Firmware", val: stats.firmware }
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center space-x-3 group">
                  <stat.icon size={14} className="text-[#00ffff]" />
                  <div className="flex flex-col">
                      <span className="text-[8px] text-[#00ffff] opacity-50 font-black uppercase tracking-tighter">{stat.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold tabular-nums">{stat.val}</span>
                        {stat.progress && (
                          <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                            <motion.div animate={{ width: `${stat.progress}%` }} className="h-full bg-[#00ffff] shadow-[0_0_8px_#00ffff]" />
                          </div>
                        )}
                      </div>
                  </div>
              </div>
            ))}
        </div>
        
        {/* Navigation Progress Circle */}
        <div className="flex items-center space-x-6 shrink-0">
            <div className="flex space-x-2">
               <button onClick={() => { setActiveIdx(p => (p - 1 + CONTENT_DATA.length) % CONTENT_DATA.length); setProgress(0); }} className={`p-2 border transition-all ${isDarkMode ? 'border-[#00ffff]/30 hover:bg-[#00ffff] hover:text-black' : 'border-slate-300 hover:bg-slate-200'}`}>
                 <svg className="w-4 h-4 p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <button onClick={() => { setActiveIdx(p => (p + 1) % CONTENT_DATA.length); setProgress(0); }} className={`p-2 border transition-all ${isDarkMode ? 'border-[#00ffff]/30 hover:bg-[#00ffff] hover:text-black' : 'border-slate-300 hover:bg-slate-200'}`}>
                 <svg className="w-4 h-4 p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
               </button>
            </div>
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative ${isDarkMode ? 'border-[#00ffff]/20' : 'border-slate-200'}`}>
               <svg className="w-full h-full rotate-[-90deg]">
                 <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2" className={isDarkMode ? "text-gray-800" : "text-slate-200"} />
                 <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#00ffff]" strokeDasharray={132} strokeDashoffset={132 - (132 * progress / 100)} />
               </svg>
               <span className={`absolute text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>{validIdx + 1}</span>
            </div>
        </div>
      </footer>

      {/* Global CSS Customizations */}
      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}