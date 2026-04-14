import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';

const ShootingStar = ({ delay }: { delay: number }) => {
  const top = useMemo(() => Math.random() * 70, []);
  const left = useMemo(() => Math.random() * 80, []);
  const duration = useMemo(() => 1.2 + Math.random() * 2, []);

  return (
    <div
      className="absolute w-[2px] h-[2px] bg-white rounded-full shadow-[0_0_12px_3px_rgba(255,255,255,0.9)] animate-shooting-star pointer-events-none"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
    />
  );
};

const Planet = ({ color, size, top, left, delay }: { color: string; size: string; top: string; left: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 0.4, scale: 1 }}
    transition={{ duration: 2, delay }}
    className="absolute rounded-full blur-[1px] pointer-events-none"
    style={{
      width: size,
      height: size,
      top,
      left,
      background: `radial-gradient(circle at 30% 30%, ${color}, transparent)`,
      boxShadow: `inset -5px -5px 10px rgba(0,0,0,0.5), 0 0 30px ${color}44`,
    }}
  />
);

// Genera estrellas una sola vez (3 capas de profundidad)
function generateStars(count: number, seed: number) {
  return Array.from({ length: count }, (_, i) => {
    const rng = (n: number) => (Math.sin(seed + n * 9301 + 49297) * 233280 % 1 + 1) % 1;
    return {
      id: i,
      top: rng(i * 3) * 100,
      left: rng(i * 3 + 1) * 100,
      size: rng(i * 3 + 2) * 2.2 + 0.3,
      opacity: rng(i * 5) * 0.8 + 0.2,
    };
  });
}

const SpaceBackground: React.FC = () => {
  // Tres capas: fondo tenue (400), media (200), primer plano brillante (80)
  const backStars   = useMemo(() => generateStars(400, 1), []);
  const midStars    = useMemo(() => generateStars(200, 2), []);
  const frontStars  = useMemo(() => generateStars(80,  3), []);

  return (
    <div className="fixed inset-0 bg-[#000008] overflow-hidden pointer-events-none z-0">

      {/* Capa trasera — pequeñas y tenues */}
      <div className="absolute inset-0">
        {backStars.map(s => (
          <div
            key={`b-${s.id}`}
            className="absolute bg-white rounded-full"
            style={{
              width: `${s.size * 0.6}px`,
              height: `${s.size * 0.6}px`,
              top: `${s.top}%`,
              left: `${s.left}%`,
              opacity: s.opacity * 0.4,
            }}
          />
        ))}
      </div>

      {/* Capa media */}
      <div className="absolute inset-0">
        {midStars.map(s => (
          <div
            key={`m-${s.id}`}
            className="absolute bg-white rounded-full"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              top: `${s.top}%`,
              left: `${s.left}%`,
              opacity: s.opacity * 0.65,
            }}
          />
        ))}
      </div>

      {/* Capa frontal — más grandes y brillantes */}
      <div className="absolute inset-0">
        {frontStars.map(s => (
          <div
            key={`f-${s.id}`}
            className="absolute bg-white rounded-full"
            style={{
              width: `${s.size * 1.4}px`,
              height: `${s.size * 1.4}px`,
              top: `${s.top}%`,
              left: `${s.left}%`,
              opacity: s.opacity,
              boxShadow: s.opacity > 0.8 ? `0 0 4px 1px rgba(200,220,255,0.6)` : undefined,
            }}
          />
        ))}
      </div>

      {/* Planetas */}
      <Planet color="#4f46e5" size="110px" top="12%"  left="8%"   delay={0.5} />
      <Planet color="#9333ea" size="160px" top="68%"  left="79%"  delay={1.0} />
      <Planet color="#0891b2" size="65px"  top="38%"  left="87%"  delay={1.5} />
      <Planet color="#065f46" size="80px"  top="85%"  left="15%"  delay={2.0} />
      <Planet color="#7c3aed" size="45px"  top="22%"  left="60%"  delay={2.5} />

      {/* Estrellas fugaces — 8 con delays escalonados */}
      {[0, 1.5, 3, 4.5, 6, 8, 10, 13].map((d, i) => (
        <ShootingStar key={i} delay={d} />
      ))}

      {/* Neblosas */}
      <div className="absolute top-[-15%] left-[-15%] w-[55%] h-[55%] bg-blue-900/10   rounded-full blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[55%] h-[55%] bg-purple-900/10 rounded-full blur-[140px]" />
      <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-indigo-900/8  rounded-full blur-[100px]" />
    </div>
  );
};

export default SpaceBackground;
