"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Terminal, 
  AlertTriangle, 
  Fingerprint, 
  Bug, 
  Zap, 
  Cloud, 
  Network,
  Settings,
  Sun,
  Moon,
  Cpu,
  Activity,
  HardDrive,
  Database,
  Code2,
  X,
  Maximize2,
  Minimize2,
  ChevronRight,
  User,
  Globe,
  Wifi
} from 'lucide-react';

// Alias untuk Ikon GPU (menggunakan Cpu icon dari Lucide karena tampilan chip yang serupa)
const GpuIcon = Cpu;

// --- KOMPONEN LATAR BELAKANG ANIMASI ---

const MatrixRain = ({ isLight }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const columns = Math.floor(canvas.width / 20);
    const drops = new Array(columns).fill(1);
    const str = "01010101010101010101";

    const draw = () => {
      ctx.fillStyle = isLight ? "rgba(248, 250, 252, 0.1)" : "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ffff"; 
      ctx.font = "15px monospace";
      for (let i = 0; i < drops.length; i++) {
        const text = str[Math.floor(Math.random() * str.length)];
        ctx.fillText(text, i * 20, drops[i] * 20);
        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, [isLight]);
  return <canvas ref={canvasRef} className="absolute inset-0 opacity-20 pointer-events-none" />;
};

const CyberGrid = () => (
  <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
    <div 
      className="absolute inset-0" 
      style={{
        backgroundImage: 'linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        transform: 'perspective(500px) rotateX(60deg) translateY(-100px)',
        transformOrigin: 'top'
      }}
    />
    <motion.div 
      animate={{ y: [0, 50] }}
      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent"
    />
  </div>
);

const NetworkPulse = () => (
  <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 2, opacity: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: i * 1.3 }}
        className="absolute w-[500px] h-[500px] border border-[#00ffff] rounded-full"
      />
    ))}
  </div>
);

// --- DATA KONTEN UTAMA ---

const CONTENT_DATA = [
  { id: 0, short: "OFFENSIVE", title: "Offensive Security", subtitle: "SOLUSI KEAMANAN INFORMASI", description: "Transformasi visi keamanan melalui pengujian manual. Buka tingkat wawasan baru ke dalam keamanan sistem Anda dengan analisis ahli kami.", bgType: 'matrix', tag: "Manual Testing", Icon: Shield, image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" },
  { id: 1, short: "VULN SCAN", title: "Vulnerability Assessment", subtitle: "MANAJEMEN KERENTANAN", description: "Identifikasi dan prioritaskan potensi kelemahan. Pemindaian otomatis dan manual kami mengungkap kerentanan tersembunyi sebelum penyerang menemukannya.", bgType: 'grid', tag: "Automated Scanning", Icon: Search, image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800" },
  { id: 2, short: "PENTEST", title: "Pentesting", subtitle: "LAYANAN UJI PENETRASI", description: "Simulasi serangan dunia nyata untuk menguji pertahanan Anda. Kami mensimulasikan serangan siber canggih untuk mengevaluasi kekuatan lingkungan IT Anda.", bgType: 'pulse', tag: "Security Audit", Icon: Terminal, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc48?auto=format&fit=crop&q=80&w=800" },
  { id: 3, short: "PHISHING", title: "Phishing Attack Simulation", subtitle: "SOLUSI REKAYASA SOSIAL", description: "Simulasi phishing inovatif untuk keamanan yang lebih cerdas. Perkuat pertahanan Anda terhadap serangan target manusia dengan penilaian simulasi kami.", bgType: 'matrix', tag: "Human Defense", Icon: AlertTriangle, image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=800" },
  { id: 4, short: "FORENSICS", title: "Digital Forensics", subtitle: "INVESTIGASI INSIDEN SIBER", description: "Menganalisis dan memulihkan data dari bukti digital. Tim kami membantu mengungkap jejak serangan dan memberikan laporan forensik yang mendalam.", bgType: 'grid', tag: "Evidence Recovery", Icon: Fingerprint, image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" },
  { id: 5, short: "MALWARE", title: "Malware Analysis", subtitle: "REVERSE ENGINEERING", description: "Membedah kode berbahaya untuk memahami perilakunya. Kami membantu mendeteksi, menganalisis, dan memitigasi ancaman malware yang kompleks.", bgType: 'pulse', tag: "Threat Intel", Icon: Bug, image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800" },
  { id: 6, short: "INCIDENT", title: "Incident Response", subtitle: "RESPONS ANCAMAN CEPAT", description: "Tindakan cepat untuk meminimalkan dampak serangan. Kami menyediakan layanan respons 24/7 untuk menghentikan pelanggaran data dan memulihkan operasi.", bgType: 'matrix', tag: "Rapid Response", Icon: Zap, image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800" },
  { id: 7, short: "CLOUD SEC", title: "Cloud Security", subtitle: "KEAMANAN INFRASTRUKTUR AWAN", description: "Mengamankan beban kerja Anda di AWS, Azure, dan GCP. Kami memastikan konfigurasi cloud Anda bebas dari celah keamanan dan patuh terhadap standar.", bgType: 'grid', tag: "Infrastructure", Icon: Cloud, image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800" },
  { id: 8, short: "NETWORK", title: "Network Defense", subtitle: "PROTEKSI JARINGAN", description: "Mengamankan perimeter dan jaringan internal. Kami mengimplementasikan deteksi intrusi dan pencegahan untuk menjaga lalu lintas data tetap aman.", bgType: 'pulse', tag: "Perimeter Sec", Icon: Network, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc48?auto=format&fit=crop&q=80&w=800" }
];

// --- KOMPONEN TEKS MENGETIK ---

const TypewriterText = ({ text, delay = 0, speed = 0.03, showCursor = true }) => {
  const words = text.split("");
  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: speed, delayChildren: delay } },
  };
  const child = {
    visible: { opacity: 1, display: "inline" },
    hidden: { opacity: 0, display: "none" },
  };

  return (
    <motion.div style={{ display: "flex", flexWrap: "wrap" }} variants={container} initial="hidden" animate="visible">
      {words.map((char, index) => (
        <motion.span variants={child} key={index}>{char === " " ? "\u00A0" : char}</motion.span>
      ))}
      {showCursor && (
        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-[3px] h-[1em] bg-[#00ffff] ml-1 translate-y-1" />
      )}
    </motion.div>
  );
};

// --- KOMPONEN TERMINAL EDEX-UI STYLE ---

const TerminalView = ({ data, stats, onClose, isDarkMode }) => {
    const [lines, setLines] = useState([]);
    
    useEffect(() => {
        const bootSequence = [
            `> INITIALIZING ${data.short}_PROTOCOL...`,
            `> ESTABLISHING SECURE HANDSHAKE... OK`,
            `> MOUNTING ENCRYPTED VOLUMES... DONE`,
            `> FETCHING METADATA FOR: ${data.title}`,
            `> STATUS: ACCESS_GRANTED`,
            `----------------------------------------`,
            `Welcome to Blackhat OS v2.8.5`,
            `Current User: root@bhe-terminal`,
            `Security Clearances: OMEGA-LEVEL`
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < bootSequence.length) {
                setLines(prev => [...prev, bootSequence[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 300);
        return () => clearInterval(interval);
    }, [data]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 z-[100] flex flex-col rounded-lg overflow-hidden border border-[#00ffff]/30 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,255,255,0.1)]"
            style={{ background: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)' }}
        >
            {/* Terminal Header (Mac Style) */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'bg-zinc-900/80 border-white/10' : 'bg-zinc-100/80 border-black/10'}`}>
                <div className="flex space-x-2">
                    <div onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-400 transition-colors" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex items-center space-x-2">
                    <Terminal size={14} className="text-[#00ffff]" />
                    <span className={`text-[10px] font-black tracking-widest uppercase ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                        BHE_TERMINAL // {data.short}
                    </span>
                </div>
                <div className="flex space-x-4">
                    <Minimize2 size={14} className="text-zinc-500" />
                    <Maximize2 size={14} className="text-zinc-500" />
                </div>
            </div>

            {/* Terminal Body (eDEX Layout) */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Column: Output & CLI */}
                <div className="flex-1 flex flex-col bg-black/40 border border-[#00ffff]/10 p-4 font-mono text-xs overflow-hidden relative">
                    <div className="absolute top-2 right-2 text-[8px] text-[#00ffff]/30 animate-pulse">TERMINAL_ACTIVE</div>
                    <div className="flex-1 overflow-y-auto space-y-1 mb-4 custom-scrollbar">
                        {lines.map((line, idx) => (
                            <div key={idx} className={(line?.includes('OK') || line?.includes('DONE')) ? 'text-[#00ffff]' : 'text-zinc-400'}>
                                {line}
                            </div>
                        ))}
                        <div className="pt-4 text-[#00ffff] font-bold">DESCRIPTION:</div>
                        <div className="text-zinc-300 leading-relaxed max-w-2xl italic">
                            {data.description}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 text-[#00ffff]">
                        <ChevronRight size={14} />
                        <span className="animate-pulse">_</span>
                    </div>
                </div>

                {/* Right Column: Visuals & HUD */}
                <div className="w-96 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Image Viewer */}
                    <div className="relative aspect-video border border-[#00ffff]/20 overflow-hidden group">
                        <img src={data.image} alt={data.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                        <div className="absolute bottom-2 left-2 flex flex-col">
                            <span className="text-[10px] font-bold text-[#00ffff]">TARGET_VISUAL</span>
                            <span className="text-[8px] text-zinc-500 uppercase">CAM_ID: 08-XRAY</span>
                        </div>
                        <div className="absolute top-0 right-0 p-1 bg-[#00ffff]/20">
                            <Activity size={12} className="text-[#00ffff] animate-pulse" />
                        </div>
                    </div>

                    {/* HUD Stats */}
                    <div className={`p-4 border border-[#00ffff]/10 ${isDarkMode ? 'bg-zinc-900/50' : 'bg-zinc-50'}`}>
                        <div className="text-[9px] font-black text-[#00ffff] mb-4 tracking-widest uppercase flex items-center justify-between">
                            <span>System_Analysis</span>
                            <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-[#00ffff]" />
                                <div className="w-1 h-1 bg-[#00ffff]/40" />
                                <div className="w-1 h-1 bg-[#00ffff]/10" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-500">THREAT_LEVEL:</span>
                                <span className="text-red-500 font-bold tracking-tighter">CRITICAL_92%</span>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-red-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2 text-[9px]">
                                <div className="flex flex-col border-l border-[#00ffff]/20 pl-2">
                                    <span className="text-zinc-500 uppercase">Latency</span>
                                    <span className="text-white">12ms</span>
                                </div>
                                <div className="flex flex-col border-l border-[#00ffff]/20 pl-2">
                                    <span className="text-zinc-500 uppercase">Encryption</span>
                                    <span className="text-[#00ffff]">RSA-4096</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Realtime Graph Simulation */}
                    <div className="h-24 flex items-end justify-between px-2 gap-1 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <motion.div 
                                key={i}
                                animate={{ height: [10, Math.random() * 40 + 20, 10] }}
                                transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                                className="w-full bg-[#00ffff]/20 border-t border-[#00ffff]"
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Terminal Footer */}
            <div className={`px-4 py-2 border-t text-[8px] font-mono flex justify-between ${isDarkMode ? 'bg-zinc-900/50 border-white/5 text-zinc-500' : 'bg-zinc-100 border-black/5 text-zinc-400'}`}>
                <div className="flex space-x-6">
                    <span className="flex items-center space-x-1"><Globe size={10} /> <span>IP: 192.168.1.104</span></span>
                    <span className="flex items-center space-x-1"><User size={10} /> <span>USER: AUTHORIZED_ONLY</span></span>
                    <span className="flex items-center space-x-1"><Wifi size={10} /> <span>SIGNAL: SECURE_MESH</span></span>
                </div>
                <div>ESTIMATED_DECRYPTION: 00:04:12</div>
            </div>
        </motion.div>
    );
};

// --- APLIKASI UTAMA ---

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [view, setView] = useState('home'); // 'home' or 'terminal'
  const AUTO_PLAY_TIME = 10000;

  const [stats, setStats] = useState({
    cpu: 24,
    gpu: 12,
    ram: "4.8 / 16.0 GB",
    storage: "128 / 512 GB",
    firmware: "v2.8.5-LTS"
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
  const activeData = CONTENT_DATA[validIdx] || CONTENT_DATA[0];

  const renderBackground = () => {
    switch (activeData.bgType) {
      case 'grid': return <CyberGrid />;
      case 'pulse': return <NetworkPulse />;
      default: return <MatrixRain isLight={!isDarkMode} />;
    }
  };

  return (
    <div className={`relative min-h-screen transition-colors duration-700 font-mono overflow-hidden flex flex-col selection:bg-[#00ffff] selection:text-black ${isDarkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Latar Belakang */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${validIdx}-${isDarkMode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {renderBackground()}
          </motion.div>
        </AnimatePresence>
        <div className={`absolute inset-0 pointer-events-none z-50 bg-[length:100%_2px,3px_100%] ${isDarkMode ? 'bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,0,255,0.03),rgba(0,0,255,0.01),rgba(0,0,255,0.03))]' : 'bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(200,200,200,0.1)_50%)]'}`} />
      </div>

      {/* Header Navigasi */}
      <header className={`relative z-30 flex justify-between items-center px-8 py-6 backdrop-blur-md border-b transition-colors duration-500 ${isDarkMode ? 'bg-black/40 border-[#00ffff]/20' : 'bg-white/40 border-slate-200'}`}>
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-[#00ffff] flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            <Shield className="text-black" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase text-inherit">
            Blackhat <span className="text-[#00ffff]">Ethical</span>
          </span>
        </div>
        
        <nav className="flex items-center space-x-6">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${isDarkMode ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : 'text-slate-600 hover:bg-slate-200'}`}
            title="Toggle Mode"
          >
            {isDarkMode ? <Sun size={22} strokeWidth={2.5} /> : <Moon size={22} strokeWidth={2.5} />}
          </button>
          
          <button className={`flex items-center space-x-2 px-4 py-2 rounded-sm border transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'text-[#00ffff] border-[#00ffff]/30 hover:bg-[#00ffff]/10' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`}>
            <Settings size={18} strokeWidth={2.5} />
            <span className="text-xs font-black tracking-[0.2em] uppercase">Settings</span>
          </button>
        </nav>
      </header>

      {/* Area Konten Utama */}
      <div className="relative flex-1 flex z-10 overflow-hidden">
        <main className="flex-1 px-8 pt-8 md:pt-16 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={validIdx}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0, rotateY: mousePos.x * 5, rotateX: -mousePos.y * 5 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
              style={{ perspective: "1000px" }}
            >
              <div className="flex items-center space-x-2 text-[#00ffff] text-sm font-bold tracking-[0.2em] mb-4">
                <span className="h-[1px] w-8 bg-[#00ffff]"></span>
                <span>{activeData.subtitle}</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black italic mb-6 leading-tight uppercase min-h-[120px]">
                <TypewriterText text={activeData.title} />
              </h1>

              <div className={`relative p-6 border-l-4 border-[#00ffff] backdrop-blur-sm mb-10 overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black/60' : 'bg-white/60'}`}>
                 <div className="absolute top-0 right-0 w-16 h-16 bg-[#00ffff]/5 rotate-45 translate-x-8 -translate-y-8" />
                 <div className={`text-sm md:text-lg leading-relaxed max-w-xl min-h-[80px] transition-colors duration-500 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                   <TypewriterText text={activeData.description} delay={1} speed={0.015} />
                 </div>
              </div>

              <motion.button
                onClick={() => setView('terminal')}
                whileHover={{ scale: 1.05, skewX: -12 }}
                whileTap={{ scale: 0.95 }}
                className="group relative bg-[#00ffff] text-black font-black py-4 px-10 uppercase tracking-widest -skew-x-12 overflow-hidden"
              >
                <span className="relative z-10">Learn More</span>
                <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* MENU PARALLAX 3D */}
        <div className="relative hidden xl:flex shrink-0">
          <div className="absolute left-0 top-10 bottom-10 w-[1px] bg-gradient-to-b from-transparent via-[#00ffff]/50 to-transparent flex flex-col items-center justify-between py-10 z-20">
             <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full shadow-[0_0_10px_#00ffff] animate-pulse" />
             <div className="flex flex-col items-center space-y-4">
                <span className="text-[7px] rotate-90 whitespace-nowrap text-[#00ffff]/60 tracking-[0.4em] font-black uppercase">Grid_Menu_System_Active</span>
                <div className="w-0.5 h-20 bg-[#00ffff]/20" />
                <span className="text-[7px] rotate-90 whitespace-nowrap text-[#00ffff]/60 tracking-[0.4em] font-black uppercase">v.2.5.0_encryption</span>
             </div>
             <div className="w-1.5 h-1.5 bg-[#00ffff] rounded-full shadow-[0_0_10px_#00ffff] animate-pulse" />
          </div>

          <aside className="grid grid-rows-3 grid-flow-col gap-4 p-8 pr-16 shrink-0 overflow-y-auto" style={{ perspective: "1200px" }}>
            {CONTENT_DATA.map((item, i) => (
              <motion.div
                key={item.id}
                onClick={() => { setActiveIdx(i); setProgress(0); }}
                animate={{
                  z: validIdx === i ? 50 : 0,
                  rotateY: validIdx === i ? -10 : 0,
                  scale: validIdx === i ? 1.05 : 1,
                  opacity: validIdx === i ? 1 : 0.6,
                }}
                whileHover={{ scale: 1.08, opacity: 1 }}
                className={`relative cursor-pointer group w-52 p-4 transition-all duration-500 border overflow-hidden h-fit rounded-sm
                  ${validIdx === i ? 'bg-[#00ffff]/10' : 'bg-transparent border-white/10 hover:bg-zinc-800/10'}`}
                style={{
                    borderColor: validIdx === i ? 'transparent' : undefined
                }}
              >
                {validIdx === i && (
                  <>
                    <div className="absolute inset-0 z-0">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="absolute inset-[-10%] bg-[conic-gradient(from_0deg,#00ffff,#00f2fe,#7000ff,#00ffff)]" 
                      />
                    </div>
                    <div className={`absolute inset-[2px] z-10 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`} />
                  </>
                )}

                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#00ffff]/40 group-hover:w-12 group-hover:h-12 transition-all duration-300 z-20" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-dashed border-[#00ffff]/20 group-hover:w-12 group-hover:h-12 transition-all duration-300 z-20" />

                <div className="relative z-20 flex flex-col items-end text-right pointer-events-none">
                  <div className={`mb-3 p-2 rounded-sm border transition-colors ${validIdx === i ? 'bg-[#00ffff] text-black border-[#00ffff]' : (isDarkMode ? 'bg-black/40 text-[#00ffff]/60 border-[#00ffff]/20' : 'bg-white/40 text-slate-400 border-slate-200')}`}>
                    <item.Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className={`text-[7px] font-black tracking-[0.2em] mb-1 ${validIdx === i ? 'text-[#00ffff]' : 'text-[#00ffff]/50'}`}>{item.tag}</span>
                  <h3 className={`text-[10px] font-black uppercase tracking-widest leading-none mb-2 ${validIdx === i ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-gray-400'}`}>{item.short}</h3>
                  <div className="w-full h-[1px] bg-gradient-to-l from-blue-500/30 to-transparent mb-1" />
                  <p className={`text-[8px] leading-tight mb-3 ${validIdx === i ? 'text-[#00ffff]' : 'text-gray-500'}`}>0{i + 1} System Secure</p>
                  <motion.div 
                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setView('terminal'); }}
                    animate={{ x: validIdx === i ? 0 : 5, opacity: validIdx === i ? 1 : 0.4, color: validIdx === i ? '#00ffff' : '#4b5563' }} 
                    className="flex items-center space-x-1 text-[8px] font-bold pointer-events-auto"
                  >
                    <span className="uppercase tracking-tighter">Access File</span>
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8" /></svg>
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
          <TerminalView 
            data={activeData} 
            stats={stats} 
            onClose={() => setView('home')} 
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      {/* Footer System Monitoring Dashboard */}
      <footer className={`relative z-40 flex flex-col md:flex-row items-center justify-between border-t transition-colors duration-500 px-8 py-4 space-y-4 md:space-y-0 ${isDarkMode ? 'bg-black/90 border-[#00ffff]/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]'}`}>
        <div className="flex items-center space-x-6 text-[10px] font-black tracking-widest shrink-0">
            <div className="flex flex-col">
                <span className="text-[#00ffff] opacity-50 uppercase">Active_Session</span>
                <span className={isDarkMode ? "text-white" : "text-slate-900"}>{activeData.short}_PROTOCOL</span>
            </div>
            <div className="w-[1px] h-8 bg-[#00ffff]/20" />
            <div className="flex flex-col">
                <span className="text-[#00ffff] opacity-50 uppercase">Encryption_State</span>
                <span className="text-[#00ffff] animate-pulse">ACTIVE_SSL_READY</span>
            </div>
        </div>

        {/* Monitoring Dashboard Center */}
        <div className="flex-1 flex flex-wrap justify-center items-center gap-6 px-6">
            <div className="flex items-center space-x-3 group">
                <Cpu size={14} className="text-[#00ffff]" />
                <div className="flex flex-col">
                    <span className="text-[8px] text-[#00ffff]/50 uppercase font-black">CPU_Load</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold tabular-nums w-8">{stats.cpu}%</span>
                        <div className="w-16 h-1 bg-[#00ffff]/10 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${stats.cpu}%` }} className="h-full bg-[#00ffff] shadow-[0_0_8px_#00ffff]" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-3 group">
                <GpuIcon size={14} className="text-[#00ffff]" />
                <div className="flex flex-col">
                    <span className="text-[8px] text-[#00ffff]/50 uppercase font-black">GPU_Core</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold tabular-nums w-8">{stats.gpu}%</span>
                        <div className="w-16 h-1 bg-[#00ffff]/10 rounded-full overflow-hidden">
                            <motion.div animate={{ width: `${stats.gpu}%` }} className="h-full bg-[#00ffff] shadow-[0_0_8px_#00ffff]" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-3 group">
                <Database size={14} className="text-[#00ffff]" />
                <div className="flex flex-col">
                    <span className="text-[8px] text-[#00ffff]/50 uppercase font-black">RAM_Usage</span>
                    <span className="text-[10px] font-bold">{stats.ram}</span>
                </div>
            </div>
            <div className="flex items-center space-x-3 group">
                <HardDrive size={14} className="text-[#00ffff]" />
                <div className="flex flex-col">
                    <span className="text-[8px] text-[#00ffff]/50 uppercase font-black">Disk_Used</span>
                    <span className="text-[10px] font-bold">{stats.storage}</span>
                </div>
            </div>
            <div className="flex items-center space-x-3 group">
                <Code2 size={14} className="text-[#00ffff]" />
                <div className="flex flex-col">
                    <span className="text-[8px] text-[#00ffff]/50 uppercase font-black">Firmware_Ver</span>
                    <span className="text-[10px] font-bold text-[#00ffff]">{stats.firmware}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center space-x-6 shrink-0">
            <div className="flex space-x-2">
               <button onClick={() => { setActiveIdx(p => (p - 1 + CONTENT_DATA.length) % CONTENT_DATA.length); setProgress(0); }} className={`p-2 border transition-all ${isDarkMode ? 'border-[#00ffff]/30 hover:bg-[#00ffff] hover:text-black' : 'border-slate-300 hover:bg-slate-200 text-slate-600'}`}>
                 <svg className="w-4 h-4 p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <button onClick={() => { setActiveIdx(p => (p + 1) % CONTENT_DATA.length); setProgress(0); }} className={`p-2 border transition-all ${isDarkMode ? 'border-[#00ffff]/30 hover:bg-[#00ffff] hover:text-black' : 'border-slate-300 hover:bg-slate-200 text-slate-600'}`}>
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

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}