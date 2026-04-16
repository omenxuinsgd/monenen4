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

// Import Modular Components
import { CONTENT_DATA } from '@/constants/contentData';
import { MatrixRain, CyberGrid, NetworkPulse } from '@/components/terminal/BackgroundAnimations';
import TypewriterText from '@/components/TypewriterText';
import TerminalView from '@/components/TerminalView';
import LoginView from '@/components/terminal/LoginView';

const GpuIcon = Cpu;

/**
 * Komponen Utama: Dashboard Keamanan Siber.
 * FIX: Memperbaiki wrapping teks agar kata tidak terpotong (word-wrap utuh)
 * dan kontainer dapat memanjang ke bawah secara dinamis.
 * FIX2: Layout stabil di semua ukuran layar (11 inch) dan zoom level (80%-100%)
 */
export default function App() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State untuk Otentikasi
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
    // Timer hanya berjalan jika sudah login
    if (!isLoggedIn) return;

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
  }, [view, isLoggedIn]);

  if (!mounted) return <div className="min-h-screen bg-black" />;

  // Render Halaman Login jika belum terotentikasi
  if (!isLoggedIn) {
    return <LoginView isDarkMode={isDarkMode} onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

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
      
      {/* Lapis Latar Belakang */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div key={`${validIdx}-${isDarkMode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
            {renderBackground()}
          </motion.div>
        </AnimatePresence>
        <div className={`absolute inset-0 z-50 bg-[length:100%_2px,3px_100%] ${isDarkMode ? 'bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,255,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))]' : 'bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(200,200,200,0.1)_50%)]'}`} />
      </div>

      {/* Header Dashboard - Fixed height untuk stabilitas */}
      <header className={`relative z-30 flex justify-between items-center px-4 sm:px-6 md:px-8 py-4 md:py-6 backdrop-blur-md border-b transition-colors duration-500 shrink-0 ${isDarkMode ? 'bg-black/40 border-[#00ffff]/20' : 'bg-white/40 border-slate-200'}`}>
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00ffff] flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            <Shield className="text-black" size={20} />
          </div>
          <span className="text-base sm:text-xl font-bold tracking-tighter uppercase text-inherit whitespace-nowrap">M-ONE <span className="text-[#00ffff]">AIO</span></span>
        </div>
        
        <nav className="flex items-center space-x-3 sm:space-x-6">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${isDarkMode ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : 'text-slate-600 hover:bg-slate-200'}`} title="Ganti Mode">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'text-[#00ffff] border-[#00ffff]/30 hover:bg-[#00ffff]/10' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`}>
            <Settings size={16} /> <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase hidden sm:inline">Pengaturan</span>
          </button>
        </nav>
      </header>

      {/* Tata Letak Hero & Card - Flex dengan overflow auto */}
      <div className="relative flex-1 flex z-10 overflow-auto min-h-0">
        <main className="flex-1 px-4 ml-6 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 relative overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div 
              key={validIdx} 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0, rotateY: mousePos.x * 3, rotateX: -mousePos.y * 3 }} 
              exit={{ opacity: 0, x: 30 }} 
              transition={{ duration: 0.5 }} 
              className="max-w-2xl lg:max-w-3xl mb-8 sm:mb-12 md:mb-20 mx-auto lg:mx-0" 
              style={{ perspective: "1000px" }}
            >
              <div className="flex mt-35 items-center space-x-2 text-[#00ffff] text-xs sm:text-sm font-bold tracking-[0.2em] mb-3 sm:mb-4">
                <span className="h-[1px] w-6 sm:w-8 bg-[#00ffff]"></span> <span>{activeData.subtitle}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic mb-4 sm:mb-6 leading-tight uppercase min-h-[60px] sm:min-h-[80px]">
                <TypewriterText text={activeData.title} />
              </h1>

              <div className={`relative p-4 sm:p-6 border-l-4 border-[#00ffff] backdrop-blur-sm mb-6 sm:mb-8 md:mb-10 transition-all duration-500 h-auto min-h-[80px] sm:min-h-[100px] flex flex-col ${isDarkMode ? 'bg-black/60 shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'bg-white/60'}`}>
                 <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-[#00ffff]/5 rotate-45 translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8" />
                 <div className={`text-xs w-[950px] sm:text-sm md:text-base lg:text-lg leading-relaxed transition-colors text-left break-normal whitespace-normal overflow-visible ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                   <TypewriterText text={activeData.description} delay={1} speed={0.015} />
                 </div>
              </div>

              <motion.button 
                onClick={() => setView('terminal')} 
                whileHover={{ scale: 1.05, skewX: -12 }} 
                className="group relative bg-[#00ffff] text-black font-black py-2.5 sm:py-3 md:py-4 px-6 sm:px-8 md:px-10 uppercase tracking-widest -skew-x-12 overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.2)] text-sm sm:text-base"
              >
                <span className="relative z-10 font-black whitespace-nowrap">Pelajari Lebih Lanjut</span>
                <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Sidebar - Hidden on smaller screens, tetap stabil di ukuran 11 inch */}
        <div className="relative hidden xl:flex shrink-0">
          <div className="absolute left-0 top-10 bottom-10 w-[5px] bg-gradient-to-b from-transparent via-[#00ffff]/50 to-transparent flex flex-col items-center justify-between py-10 z-20">
             <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full shadow-[0_0_10px_#00ffff] animate-pulse" />
             {/* <div className="flex flex-col items-center space-y-4 text-[#00ffff]/60 text-[7px] rotate-90 whitespace-nowrap tracking-[0.4em] font-black uppercase">
                <span>Grid_Menu_System_Active</span>
                <span>v.2.5.0_encryption</span>
             </div> */}
             <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full shadow-[0_0_10px_#00ffff] animate-pulse" />
          </div>

          <aside className="grid grid-rows-3 grid-flow-col gap-3 sm:gap-4 p-4 sm:p-6 md:p-8 pr-6 sm:pr-8 md:pr-12 lg:pr-16 shrink-0 overflow-y-auto" style={{ perspective: "1200px" }}>
            {CONTENT_DATA.map((item, i) => (
              <motion.div 
                key={item.id} 
                onClick={() => { setActiveIdx(i); setProgress(0); }} 
                animate={{ 
                  z: validIdx === i ? 50 : 0, 
                  rotateY: validIdx === i ? -10 : 0, 
                  scale: validIdx === i ? 1.05 : 1, 
                  opacity: validIdx === i ? 1 : 0.6 
                }} 
                className={`relative cursor-pointer group w-40 sm:w-44 md:w-48 lg:w-60 p-3 sm:p-4 transition-all duration-500 border rounded-sm ${validIdx === i ? 'bg-[#00ffff]/10 border-transparent shadow-[0_0_20px_rgba(0,255,255,0.1)]' : 'bg-transparent border-white/10 hover:bg-zinc-800/10'}`}
              >
                {validIdx === i && (
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-[-10%] bg-[conic-gradient(from_0deg,#00ffff,#00f2fe,#7000ff,#00ffff)]" />
                    <div className={`absolute inset-[2px] z-10 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`} />
                  </div>
                )}
                <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-[2px] sm:border-t-[3px] border-l-[2px] sm:border-l-[3px] border-[#00ffff]/40 group-hover:w-8 sm:group-hover:w-12 group-hover:h-8 sm:group-hover:h-12 transition-all duration-300 z-20" />
                <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-[2px] sm:border-b-[3px] border-r-[2px] sm:border-r-[3px] border-dashed border-[#00ffff]/20 group-hover:w-8 sm:group-hover:w-12 group-hover:h-8 sm:group-hover:h-12 transition-all duration-300 z-20" />
                
                <div className="relative z-20 flex flex-col items-end text-right pointer-events-none">
                  <div className={`mb-2 sm:mb-3 p-1.5 sm:p-2 rounded-sm border transition-colors ${validIdx === i ? 'bg-[#00ffff] text-black border-[#00ffff]' : (isDarkMode ? 'bg-black/40 text-[#00ffff]/60 border-[#00ffff]/20' : 'bg-white/40 text-slate-400 border-slate-200')}`}>
                    <item.Icon size={48} />
                  </div>
                  <h3 className={`text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-black uppercase tracking-widest leading-none truncate max-w-full ${validIdx === i ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-gray-400'}`}>{item.title}</h3>
                  <div className="w-full h-[1px] bg-gradient-to-l from-blue-500/30 to-transparent mb-1" />
                  <motion.div 
                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setView('terminal'); }} 
                    animate={{ x: validIdx === i ? 0 : 5, opacity: validIdx === i ? 1 : 0.4, color: validIdx === i ? '#00ffff' : '#4b5563' }} 
                    className="flex items-center space-x-1 text-[7px] sm:text-[8px] font-bold pointer-events-auto mt-1 sm:mt-2"
                  >
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-tighter whitespace-nowrap">Akses Berkas</span> <ChevronRight size={16} />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {view === 'terminal' && (
          <TerminalView data={activeData} onClose={() => setView('home')} isDarkMode={isDarkMode} />
        )}
      </AnimatePresence>

      {/* Footer - Fixed dengan wrap yang baik */}
      <footer className={`relative z-40 flex flex-col md:flex-row items-center justify-between border-t transition-colors duration-500 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 space-y-3 md:space-y-0 shrink-0 ${isDarkMode ? 'bg-black/90 border-[#00ffff]/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]'}`}>
        <div className="flex-1 flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4 md:px-6 text-left">
            {[
              { icon: Cpu, label: "Beban_CPU", val: `${stats.cpu}%`, progress: stats.cpu },
              { icon: GpuIcon, label: "Inti_GPU", val: `${stats.gpu}%`, progress: stats.gpu },
              { icon: Database, label: "Penggunaan_RAM", val: stats.ram },
              { icon: HardDrive, label: "Disk_Terpakai", val: stats.storage },
              { icon: Code2, label: "Firmware", val: stats.firmware }
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center space-x-2 sm:space-x-3 group">
                  <stat.icon size={12} className="text-[#00ffff]" />
                  <div className="flex flex-col">
                      <span className="text-[7px] sm:text-[8px] text-[#00ffff] opacity-50 font-black uppercase tracking-tighter whitespace-nowrap">{stat.label}</span>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold tabular-nums">{stat.val}</span>
                        {stat.progress && (
                          <div className="w-8 sm:w-10 md:w-12 h-1 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                            <motion.div animate={{ width: `${stat.progress}%` }} className="h-full bg-[#00ffff] shadow-[0_0_8px_#00ffff]" />
                          </div>
                        )}
                      </div>
                  </div>
              </div>
            ))}
        </div>
        
        <div className="flex items-center space-x-4 sm:space-x-6 shrink-0">
            <div className="flex space-x-1 sm:space-x-2">
               <button onClick={() => { setActiveIdx(p => (p - 1 + CONTENT_DATA.length) % CONTENT_DATA.length); setProgress(0); }} className={`p-1.5 sm:p-2 border transition-all ${isDarkMode ? 'border-[#00ffff]/30 hover:bg-[#00ffff] hover:text-black' : 'border-slate-300 hover:bg-slate-200'}`}>
                 <svg className="w-3 h-3 sm:w-4 sm:h-4 p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <button onClick={() => { setActiveIdx(p => (p + 1) % CONTENT_DATA.length); setProgress(0); }} className={`p-1.5 sm:p-2 border transition-all ${isDarkMode ? 'border-[#00ffff]/30 hover:bg-[#00ffff] hover:text-black' : 'border-slate-300 hover:bg-slate-200'}`}>
                 <svg className="w-3 h-3 sm:w-4 sm:h-4 p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
               </button>
            </div>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center relative ${isDarkMode ? 'border-[#00ffff]/20' : 'border-slate-200'}`}>
               <svg className="w-full h-full rotate-[-90deg]">
                 <circle cx="50%" cy="50%" r="42%" fill="none" stroke="currentColor" strokeWidth="2" className={isDarkMode ? "text-gray-800" : "text-slate-200"} />
                 <circle cx="50%" cy="50%" r="42%" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#00ffff]" strokeDasharray={132} strokeDashoffset={132 - (132 * progress / 100)} />
               </svg>
               <span className={`absolute text-[9px] sm:text-[10px] md:text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>{validIdx + 1}</span>
            </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 255, 0.2); border-radius: 10px; }
        
        /* Stabilkan layout di semua ukuran layar dan zoom */
        * {
          box-sizing: border-box;
        }
        
        html, body {
          overflow-x: hidden;
          width: 100%;
          position: relative;
        }
        
        /* Pastikan konten tidak overflow di zoom 80-100% */
        @media screen and (max-width: 1366px) {
          .xl\\:flex {
            display: flex !important;
          }
        }
        
        /* Stabilkan untuk layar 11 inch (sekitar 1366x768) */
        @media screen and (min-width: 1280px) and (max-width: 1366px) {
          .hidden.xl\\:flex {
            display: flex !important;
          }
        }
        
        /* Untuk zoom level 80% - 100% */
        @media screen and (min-width: 1600px) {
          .container {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}