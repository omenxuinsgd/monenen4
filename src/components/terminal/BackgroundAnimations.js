"use client";
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const MatrixRain = ({ isLight }) => {
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

export const CyberGrid = () => (
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

export const NetworkPulse = () => (
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