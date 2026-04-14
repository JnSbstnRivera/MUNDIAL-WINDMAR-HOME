import React, { useMemo } from 'react';
import { motion } from 'motion/react';

// ─── Planeta decorativo ───────────────────────────────────────────────────────
const Planet = ({ color, size, top, left, delay }: {
  color: string; size: string; top: string; left: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 0.4, scale: 1 }}
    transition={{ duration: 2, delay }}
    className="absolute rounded-full blur-[1px] pointer-events-none"
    style={{
      width: size, height: size, top, left,
      background: `radial-gradient(circle at 30% 30%, ${color}, transparent)`,
      boxShadow: `inset -5px -5px 10px rgba(0,0,0,0.5), 0 0 30px ${color}44`,
    }}
  />
);

// ─── Generador determinístico de estrellas ────────────────────────────────────
// seed distinto por capa → distribución única sin Math.random en render
interface StarData {
  id: number; top: number; left: number; size: number; opacity: number;
  twinkle: boolean; twinkleDuration: number; twinkleDelay: number;
}

function generateStars(count: number, seed: number, twinkleRatio = 0): StarData[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => Math.abs((Math.sin(seed + n * 9301 + 49297) * 233280) % 1);
    const opacity = r(i * 5) * 0.8 + 0.2;
    const doTwinkle = twinkleRatio > 0 && r(i * 7 + 3) < twinkleRatio;
    return {
      id: i,
      top:             r(i * 3)     * 100,
      left:            r(i * 3 + 1) * 100,
      size:            r(i * 3 + 2) * 2.2 + 0.3,
      opacity,
      twinkle:         doTwinkle,
      twinkleDuration: 2.5 + r(i * 11) * 5,   // 2.5 – 7.5 s
      twinkleDelay:    r(i * 13)     * 9,       // 0 – 9 s
    };
  });
}

// ─── Componente principal ─────────────────────────────────────────────────────
const SpaceBackground: React.FC = () => {
  // Capa trasera: 400 estrellas muy pequeñas y tenues (sin twinkle — performance)
  const backStars  = useMemo(() => generateStars(400, 1, 0),    []);
  // Capa media: 200 estrellas medianas (sin twinkle)
  const midStars   = useMemo(() => generateStars(200, 2, 0),    []);
  // Capa frontal: 80 estrellas más grandes, ~40% hacen twinkle
  const frontStars = useMemo(() => generateStars(80,  3, 0.42), []);

  return (
    <div className="fixed inset-0 bg-[#000008] overflow-hidden pointer-events-none z-0">

      {/* ── Capa trasera ── */}
      <div className="absolute inset-0">
        {backStars.map(s => (
          <div key={`b-${s.id}`} className="absolute bg-white rounded-full"
            style={{ width: `${s.size * 0.6}px`, height: `${s.size * 0.6}px`,
              top: `${s.top}%`, left: `${s.left}%`, opacity: s.opacity * 0.4 }} />
        ))}
      </div>

      {/* ── Capa media ── */}
      <div className="absolute inset-0">
        {midStars.map(s => (
          <div key={`m-${s.id}`} className="absolute bg-white rounded-full"
            style={{ width: `${s.size}px`, height: `${s.size}px`,
              top: `${s.top}%`, left: `${s.left}%`, opacity: s.opacity * 0.65 }} />
        ))}
      </div>

      {/* ── Capa frontal con twinkle ── */}
      <div className="absolute inset-0">
        {frontStars.map(s =>
          s.twinkle ? (
            // Estrella que parpadea: escala y brilla suavemente
            <motion.div
              key={`f-${s.id}`}
              className="absolute rounded-full bg-white"
              style={{
                width:  `${s.size * 1.4}px`,
                height: `${s.size * 1.4}px`,
                top:  `${s.top}%`,
                left: `${s.left}%`,
              }}
              animate={{
                opacity:   [s.opacity * 0.2, 1, s.opacity * 0.2],
                scale:     [1, 1.9, 1],
                boxShadow: [
                  'none',
                  `0 0 8px 3px rgba(200,215,255,0.75)`,
                  'none',
                ],
              }}
              transition={{
                duration:   s.twinkleDuration,
                delay:      s.twinkleDelay,
                repeat:     Infinity,
                ease:       'easeInOut',
              }}
            />
          ) : (
            // Estrella estática normal
            <div
              key={`f-${s.id}`}
              className="absolute bg-white rounded-full"
              style={{
                width:  `${s.size * 1.4}px`,
                height: `${s.size * 1.4}px`,
                top:  `${s.top}%`,
                left: `${s.left}%`,
                opacity: s.opacity,
                boxShadow: s.opacity > 0.8 ? '0 0 4px 1px rgba(200,220,255,0.55)' : undefined,
              }}
            />
          )
        )}
      </div>

      {/* ── Planetas ── */}
      <Planet color="#4f46e5" size="110px" top="12%"  left="8%"   delay={0.5} />
      <Planet color="#9333ea" size="160px" top="68%"  left="79%"  delay={1.0} />
      <Planet color="#0891b2" size="65px"  top="38%"  left="87%"  delay={1.5} />
      <Planet color="#065f46" size="80px"  top="85%"  left="15%"  delay={2.0} />
      <Planet color="#7c3aed" size="45px"  top="22%"  left="60%"  delay={2.5} />

      {/* ── Neblosas ── */}
      <div className="absolute top-[-15%] left-[-15%] w-[55%] h-[55%] bg-blue-900/10    rounded-full blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[55%] h-[55%] bg-purple-900/10 rounded-full blur-[140px]" />
      <div className="absolute top-[30%]  left-[40%]  w-[30%] h-[30%] bg-indigo-900/8   rounded-full blur-[100px]" />
    </div>
  );
};

export default SpaceBackground;
