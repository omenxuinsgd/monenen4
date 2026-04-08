return (
  <div className={`relative min-h-screen transition-colors duration-700 font-mono overflow-x-hidden flex flex-col selection:bg-[#00ffff] selection:text-black ${isDarkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
    
    {/* Lapis Latar Belakang - Tetap sama */}
    <div className="absolute inset-0 z-0 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div key={`${validIdx}-${isDarkMode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
          {renderBackground()}
        </motion.div>
      </AnimatePresence>
    </div>

    {/* Header Dashboard - Responsive Padding */}
    <header className={`relative z-30 flex justify-between items-center px-4 md:px-8 py-4 md:py-6 backdrop-blur-md border-b transition-colors duration-500 ${isDarkMode ? 'bg-black/40 border-[#00ffff]/20' : 'bg-white/40 border-slate-200'}`}>
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('home')}>
        <div className="w-8 h-8 md:w-10 md:h-10 bg-[#00ffff] flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          <Shield className="text-black" size={20} />
        </div>
        <span className="text-lg md:text-xl font-bold tracking-tighter uppercase text-inherit">M-ONE <span className="text-[#00ffff]">AIO</span></span>
      </div>
      
      <nav className="flex items-center space-x-2 md:space-x-6">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : 'text-slate-600 hover:bg-slate-200'}`}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className={`flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 rounded-sm border transition-all ${isDarkMode ? 'text-[#00ffff] border-[#00ffff]/30 hover:bg-[#00ffff]/10' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`}>
          <Settings size={16} /> 
          <span className="hidden sm:inline text-[10px] font-black tracking-widest uppercase">Pengaturan</span>
        </button>
      </nav>
    </header>

    {/* Tata Letak Utama - Flex Col di Mobile, Row di XL */}
    <div className="relative flex-1 flex flex-col xl:flex-row z-10 overflow-hidden">
      
      {/* Konten Hero */}
      <main className="flex-1 px-4 md:px-8 pt-8 md:pt-16 relative overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div key={validIdx} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="max-w-3xl mb-10 md:mb-20"
          >
            <div className="flex items-center space-x-2 text-[#00ffff] text-[10px] md:text-sm font-bold tracking-[0.2em] mb-4">
              <span className="h-[1px] w-6 md:w-8 bg-[#00ffff]"></span> <span>{activeData.subtitle}</span>
            </div>
            <h1 className="text-2xl md:text-5xl font-black italic mb-4 md:mb-6 leading-tight uppercase">
              <TypewriterText text={activeData.title} />
            </h1>

            <div className={`relative p-4 md:p-6 border-l-4 border-[#00ffff] backdrop-blur-sm mb-6 md:mb-10 ${isDarkMode ? 'bg-black/60' : 'bg-white/60'}`}>
               <div className="text-xs md:text-lg leading-relaxed break-words">
                 <TypewriterText text={activeData.description} speed={0.01} />
               </div>
            </div>

            <motion.button onClick={() => setView('terminal')} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto bg-[#00ffff] text-black font-black py-3 md:py-4 px-8 md:px-10 uppercase tracking-widest -skew-x-12 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              Pelajari Lebih Lanjut
            </motion.button>
          </motion.div>
        </AnimatePresence>

        {/* Mini Grid untuk Mobile/Tablet (Hanya muncul jika layar < xl) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-20 xl:hidden">
          {CONTENT_DATA.map((item, i) => (
            <div 
              key={item.id} 
              onClick={() => setActiveIdx(i)}
              className={`p-3 border rounded-sm transition-all ${validIdx === i ? 'bg-[#00ffff] text-black border-[#00ffff]' : 'bg-black/20 border-white/10'}`}
            >
              <item.Icon size={20} className="mb-2" />
              <div className="text-[10px] font-bold uppercase truncate">{item.title}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Sidebar Grid untuk Desktop (XL ke atas) */}
      <div className="hidden xl:flex shrink-0 border-l border-white/5 bg-black/20 backdrop-blur-sm">
        <aside className="grid grid-rows-3 grid-flow-col gap-4 p-8 shrink-0 overflow-y-auto">
          {/* ... (Konten kartu grid Anda tetap sama, namun pastikan ukurannya pas) */}
          {CONTENT_DATA.map((item, i) => (
            <motion.div 
              key={item.id} 
              onClick={() => setActiveIdx(i)}
              className={`relative cursor-pointer w-48 p-4 border rounded-sm transition-all ${validIdx === i ? 'border-[#00ffff] bg-[#00ffff]/5' : 'border-white/10'}`}
            >
              {/* Isi kartu tetap sama seperti kode Anda sebelumnya */}
              <div className="flex flex-col items-end text-right">
                <item.Icon size={32} className={validIdx === i ? 'text-[#00ffff]' : 'text-gray-500'} />
                <h3 className="text-[11px] mt-2 font-black uppercase">{item.title}</h3>
              </div>
            </motion.div>
          ))}
        </aside>
      </div>
    </div>

    {/* Footer - Stats Wrap untuk Mobile */}
    <footer className={`relative z-40 flex flex-col border-t transition-colors duration-500 ${isDarkMode ? 'bg-black/90 border-[#00ffff]/20' : 'bg-white border-slate-200'}`}>
      <div className="flex overflow-x-auto no-scrollbar py-3 px-4 gap-6 md:justify-center">
          {[
            { icon: Cpu, label: "CPU", val: `${stats.cpu}%` },
            { icon: GpuIcon, label: "GPU", val: `${stats.gpu}%` },
            { icon: Database, label: "RAM", val: stats.ram },
            { icon: Code2, label: "VER", val: "v2.8" }
          ].map((stat, idx) => (
            <div key={idx} className="flex items-center space-x-2 shrink-0">
                <stat.icon size={12} className="text-[#00ffff]" />
                <div className="flex flex-col">
                    <span className="text-[7px] text-[#00ffff]/50 font-black uppercase">{stat.label}</span>
                    <span className="text-[9px] font-bold">{stat.val}</span>
                </div>
            </div>
          ))}
      </div>
      
      {/* Kontrol Navigasi Bawah */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 md:hidden">
          <div className="flex space-x-4">
             <button onClick={() => setActiveIdx(p => (p - 1 + CONTENT_DATA.length) % CONTENT_DATA.length)} className="p-2 border border-[#00ffff]/30 text-[#00ffff]"><ChevronRight size={20} className="rotate-180" /></button>
             <button onClick={() => setActiveIdx(p => (p + 1) % CONTENT_DATA.length)} className="p-2 border border-[#00ffff]/30 text-[#00ffff]"><ChevronRight size={20} /></button>
          </div>
          <div className="text-[#00ffff] font-black text-sm">{validIdx + 1} / {CONTENT_DATA.length}</div>
      </div>
    </footer>
  </div>
);