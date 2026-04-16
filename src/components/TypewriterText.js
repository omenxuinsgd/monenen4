"use client";
import React from 'react';
import { motion } from 'framer-motion';

/**
 * Komponen TypewriterText yang diperbarui.
 * Memastikan kata tidak terpotong di tengah (word-wrap utuh).
 */
const TypewriterText = ({ text, delay = 0, speed = 0.03, showCursor = true }) => {
  // Memecah teks menjadi array kata agar bisa dikontrol pembungkusannya
  const words = text.split(" ");
  
  // Variabel untuk melacak indeks karakter global guna sinkronisasi animasi stagger
  let charCount = 0;

  const container = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: speed, 
        delayChildren: delay 
      } 
    },
  };

  const child = {
    visible: { opacity: 1, display: "inline" },
    hidden: { opacity: 0, display: "none" },
  };

  return (
    <motion.div 
      style={{ display: "inline", whiteSpace: "normal" }} 
      variants={container} 
      initial="hidden" 
      animate="visible"
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {word.split("").map((char, charIndex) => {
            return (
              <motion.span variants={child} key={`${wordIndex}-${charIndex}`}>
                {char}
              </motion.span>
            );
          })}
          {/* Tambahkan spasi setelah kata, kecuali kata terakhir */}
          {wordIndex < words.length - 1 && (
            <motion.span variants={child} key={`space-${wordIndex}`}>
              {"\u00A0"}
            </motion.span>
          )}
        </span>
      ))}
      
      {showCursor && (
        <motion.span 
          animate={{ opacity: [0, 1, 0] }} 
          transition={{ repeat: Infinity, duration: 0.8 }} 
          className="inline-block w-[4px] h-[1em] bg-[#00ffff] ml-1 translate-y-1" 
        />
      )}
    </motion.div>
  );
};

export default TypewriterText;