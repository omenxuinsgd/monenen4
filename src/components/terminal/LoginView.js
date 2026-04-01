"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  User, 
  Loader2, 
  AlertCircle, 
  ChevronRight, 
  CheckCircle2,
  Scan
} from 'lucide-react';

/**
 * Komponen CyberSpider
 * Laba-laba robotik yang bergerak secara acak di layar.
 * Diperbaiki: Menggunakan functional update untuk menghindari infinite re-render loop.
 */
const CyberSpider = () => {
  const [pos, setPos] = useState({ x: 10, y: 10 });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const moveSpider = () => {
      setPos(prevPos => {
        const nextX = Math.random() * (window.innerWidth - 120);
        const nextY = Math.random() * (window.innerHeight - 120);
        
        // Hitung rotasi menuju target berdasarkan posisi sebelumnya
        const angle = Math.atan2(nextY - prevPos.y, nextX - prevPos.x) * (180 / Math.PI) + 90;
        
        // Update rotasi secara terpisah
        setRotation(angle);
        
        return { x: nextX, y: nextY };
      });
    };

    // Jalankan pemindahan pertama kali
    moveSpider();
    
    // Set interval untuk pergerakan selanjutnya
    const interval = setInterval(moveSpider, 4000 + Math.random() * 3000);
    
    return () => clearInterval(interval);
  }, []); // Dependency array kosong untuk mencegah loop pembaruan state

  return (
    <motion.div
      animate={{ x: pos.x, y: pos.y, rotate: rotation }}
      transition={{ duration: 3.5, ease: "easeInOut" }}
      className="absolute z-0 pointer-events-none opacity-40"
      style={{ width: 80, height: 80 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_#00ffff]">
        {/* Kaki Laba-laba dengan animasi wiggle */}
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            {/* Kaki Kiri */}
            <motion.path
              d={`M50 50 L10 ${20 + i * 20}`}
              stroke="#00ffff"
              strokeWidth="4"
              fill="none"
              animate={{ d: [`M50 50 L10 ${20 + i * 20}`, `M50 50 L5 ${25 + i * 20}`, `M50 50 L10 ${20 + i * 20}`] }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
            />
            {/* Kaki Kanan */}
            <motion.path
              d={`M50 50 L90 ${20 + i * 20}`}
              stroke="#00ffff"
              strokeWidth="4"
              fill="none"
              animate={{ d: [`M50 50 L90 ${20 + i * 20}`, `M50 50 L95 ${25 + i * 20}`, `M50 50 L90 ${20 + i * 20}`] }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
            />
          </React.Fragment>
        ))}
        {/* Tubuh Laba-laba */}
        <circle cx="50" cy="50" r="14" fill="#00ffff" />
        <circle cx="50" cy="35" r="10" fill="#00ffff" />
        {/* Mata Gading */}
        <circle cx="46" cy="32" r="2.5" fill="black" />
        <circle cx="54" cy="32" r="2.5" fill="black" />
      </svg>
    </motion.div>
  );
};

/**
 * Komponen Animasi Hujan Biner (Matrix Rain)
 */
const BinaryRain = ({ isLight }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);
    const binary = "01";
    const draw = () => {
      ctx.fillStyle = isLight ? "rgba(248, 250, 252, 0.15)" : "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ffff"; 
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = binary[Math.floor(Math.random() * binary.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 35);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isLight]);
  return <canvas ref={canvasRef} className="absolute inset-0 opacity-20 pointer-events-none" />;
};

/**
 * Komponen Grid Cyber
 */
const CyberGrid = () => (
  <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
    <div 
      className="absolute inset-0" 
      style={{
        backgroundImage: 'linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        transform: 'perspective(600px) rotateX(60deg) translateY(-100px)',
        transformOrigin: 'top'
      }}
    />
    <motion.div 
      animate={{ y: [0, 60] }}
      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-transparent"
    />
  </div>
);

const LoginView = ({ onLoginSuccess, isDarkMode }) => {
  const [formData, setFormData] = useState({ userId: '', accessKey: '' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setStatus('authenticating');
    setErrorMsg('');
    setTimeout(() => {
      if (formData.userId === 'admin' && formData.accessKey === 'm-one-2026') {
        setStatus('success');
        setTimeout(() => onLoginSuccess(), 1200);
      } else {
        setStatus('error');
        setErrorMsg('AKSES_DITOLAK: KREDENSIAL_TIDAK_TERDAFTAR');
      }
    }, 2500);
  };

  const StatusIcon = () => {
    switch (status) {
      case 'authenticating': return <Loader2 className="text-black animate-spin" size={32} />;
      case 'success': return <CheckCircle2 className="text-black" size={32} />;
      case 'error': return <AlertCircle className="text-black animate-pulse" size={32} />;
      default: return <Shield className="text-black" size={32} />;
    }
  };

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center font-mono overflow-hidden transition-colors duration-1000 ${isDarkMode ? 'bg-[#050505] text-[#00ffff]' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Background Layers */}
      <BinaryRain isLight={!isDarkMode} />
      <CyberGrid />
      
      {/* Tambahkan beberapa Laba-laba Cyber (Ukuran lebih besar) */}
      <CyberSpider />
      <CyberSpider />
      <CyberSpider />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

      {/* Main Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-md perspective-1000 z-10"
      >
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[2px] bg-[#00ffff]/40 z-20 pointer-events-none blur-[2px]"
        />

        <div className={`relative p-10 border-2 backdrop-blur-2xl rounded-sm z-10 overflow-hidden ${isDarkMode ? 'bg-black/80 border-[#00ffff]/30 shadow-[0_0_80px_rgba(0,255,255,0.15)]' : 'bg-white/90 border-slate-300 shadow-2xl'}`}>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00ffff] m-2" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00ffff] m-2" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00ffff] m-2" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00ffff] m-2" />

          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div 
              animate={status === 'authenticating' ? { scale: [1, 1.1, 1], rotateY: [0, 180, 360] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-20 h-20 flex items-center justify-center rounded-sm mb-6 relative ${status === 'success' ? 'bg-emerald-400 shadow-emerald-500/50' : status === 'error' ? 'bg-red-500 shadow-red-500/50' : 'bg-[#00ffff] shadow-[#00ffff]/50'} shadow-[0_0_30px_rgba(0,0,0,0.2)]`}
            >
              <StatusIcon />
              <div className="absolute inset-0 border-2 border-current rounded-sm animate-ping opacity-20" />
            </motion.div>
            
            <h1 className="text-3xl font-black uppercase tracking-[0.3em] mb-2 italic text-inherit">
              M-ONE <span className={isDarkMode ? 'text-[#00ffff]' : 'text-blue-600'}>AIO</span>
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#00ffff]/10 border border-[#00ffff]/20 rounded-full">
               <Scan size={10} className="animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Menunggu_Otentikasi_Terminal</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-2 group">
              <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
                <User size={12} className="text-[#00ffff]" /> ID_OPERATOR
              </label>
              <div className="relative">
                <input 
                  required
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  disabled={status === 'authenticating' || status === 'success'}
                  placeholder="Ketik ID Admin..."
                  className={`w-full bg-black/40 border-2 p-4 text-sm outline-none transition-all placeholder:text-zinc-700 ${isDarkMode ? 'border-[#00ffff]/20 focus:border-[#00ffff] text-[#00ffff]' : 'border-slate-300 focus:border-slate-900 text-slate-900'}`}
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
                <Lock size={12} className="text-[#00ffff]" /> KUNCI_ENKRIPSI
              </label>
              <div className="relative">
                <input 
                  required
                  type="password"
                  value={formData.accessKey}
                  onChange={(e) => setFormData({...formData, accessKey: e.target.value})}
                  disabled={status === 'authenticating' || status === 'success'}
                  placeholder="••••••••"
                  className={`w-full bg-black/40 border-2 p-4 text-sm outline-none transition-all placeholder:text-zinc-700 ${isDarkMode ? 'border-[#00ffff]/20 focus:border-[#00ffff] text-[#00ffff]' : 'border-slate-300 focus:border-slate-900 text-slate-900'}`}
                />
              </div>
            </div>

            <AnimatePresence>
              {status === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 text-red-500 text-[11px] font-black uppercase bg-red-500/10 p-3 border-l-4 border-red-500"
                >
                  <AlertCircle size={16} />
                  <span className="leading-tight">{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              type="submit"
              whileHover={status === 'idle' ? { scale: 1.02, skewX: -3 } : {}}
              whileTap={{ scale: 0.98 }}
              disabled={status === 'authenticating' || status === 'success'}
              className={`w-full py-5 font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 relative overflow-hidden ${
                status === 'success' 
                ? 'bg-emerald-500 text-white shadow-emerald-500/40' 
                : status === 'error'
                ? 'bg-red-600 text-white shadow-red-600/40'
                : 'bg-[#00ffff] text-black hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] shadow-[#00ffff]/20 shadow-lg'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {status === 'authenticating' ? 'MENGANGLISA_DATA...' : status === 'success' ? 'AKSES_DITERIMA' : 'MULAI_SESI_BARU'}
                <ChevronRight size={18} className={status === 'authenticating' ? 'animate-bounce' : ''} />
              </span>
              <motion.div 
                animate={{ left: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 bottom-0 w-20 bg-white/30 skew-x-12"
              />
            </motion.button>
          </form>

          <div className="mt-10 pt-6 border-t border-[#00ffff]/10 flex justify-between items-end text-[8px] font-bold opacity-30 uppercase tracking-[0.2em]">
            <div className="flex flex-col gap-1">
              <span>ALGORITMA: AES_256_BIT</span>
              <span>NODE: JAKARTA_V2_A1</span>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-[#00ffff] animate-pulse">TERMINAL_AKTIF</span>
              <span>SIAP_EKSEKUSI</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none z-[50]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(0,255,0,0.01),rgba(0,0,255,0.01))] bg-[length:100%_4px,4px_100%]" />
        <div className="absolute top-10 left-10 w-20 h-20 border-t-4 border-l-4 border-[#00ffff]/20" />
        <div className="absolute bottom-10 right-10 w-20 h-20 border-b-4 border-r-4 border-[#00ffff]/20" />
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default LoginView;