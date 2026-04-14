import React, { useMemo } from 'react';
import { motion } from 'motion/react';

// ─── Meteoro individual ───────────────────────────────────────────────────────
// Todos viajan en la misma dirección (rotate 32°) → lluvia de meteoros armónica
interface MeteorProps {
  startTop: number;
  startLeft: number;
  length: number;
  delay: number;
  duration: number;
}

const Meteor: React.FC<MeteorProps> = ({ startTop, startLeft, length, delay, duration }) => (
  <div
    className="absolute pointer-events-none animate-meteor"
    style={{
      top: `${startTop}%`,
      left: `${startLeft}%`,
      width: length,
      height: '1.5px',
      // Degradado: transparente en la cola, brillante en la cabeza
      background: 'linear-gradient(90deg, transparent 0%, rgba(200,225,255,0.3) 40%, rgba(220,235,255,0.95) 100%)',
      borderRadius: '0 2px 2px 0',
      boxShadow: '0 0 5px rgba(180,210,255,0.55)',
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
    }}
  />
);

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

// ─── Generador determinístico de estrellas (sin Math.random en render) ────────
function generateStars(count: number, seed: number) {
  return Array.from({ length: count }, (_, i) => {
    const rng = (n: number) => (Math.sin(seed + n * 9301 + 49297) * 233280 % 1 + 1) % 1;
    return {
      id: i,
      top:     rng(i * 3)     * 100,
      left:    rng(i * 3 + 1) * 100,
      size:    rng(i * 3 + 2) * 2.2 + 0.3,
      opacity: rng(i * 5)     * 0.8 + 0.2,
    };
  });
}

// ─── Datos de meteoros fijos (useMemo → no se recalculan en cada render) ──────
// Posiciones distribuidas en la mitad superior-izquierda de la pantalla.
// Todos salen desde arriba/izquierda y viajan hacia abajo-derecha.
const METEOR_DATA = Array.from({ length: 14 }, (_, i) => {
  // Semilla pseudoaleatoria determinística
  const rng = (n: number) => (Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1;
  const r = (n: number) => Math.abs(rng(n));
  return {
    id: i,
    startTop:  r(1) * 55,              // 0–55% desde arriba
    startLeft: r(2) * 70,              // 0–70% desde la izquierda
    length:    70 + r(3) * 130,        // 70–200px de largo
    duration:  7  + r(4) * 6,          // 7–13s por ciclo (85% invisible)
    delay:     i  * 1.4 + r(5) * 2.5, // escalonados para que no salgan todos juntos
  };
});

// ─── Componente principal ─────────────────────────────────────────────────────
const SpaceBackground: React.FC = () => {
  const backStars  = useMemo(() => generateStars(400, 1), []);
  const midStars   = useMemo(() => generateStars(200, 2), []);
  const frontStars = useMemo(() => generateStars(80,  3), []);

  return (
    <div className="fixed inset-0 bg-[#000008] overflow-hidden pointer-events-none z-0">

      {/* Capa trasera — pequeñas y tenues */}
      <div className="absolute inset-0">
        {backStars.map(s => (
          <div key={`b-${s.id}`} className="absolute bg-white rounded-full"
            style={{ width: `${s.size * 0.6}px`, height: `${s.size * 0.6}px`,
              top: `${s.top}%`, left: `${s.left}%`, opacity: s.opacity * 0.4 }} />
        ))}
      </div>

      {/* Capa media */}
      <div className="absolute inset-0">
        {midStars.map(s => (
          <div key={`m-${s.id}`} className="absolute bg-white rounded-full"
            style={{ width: `${s.size}px`, height: `${s.size}px`,
              top: `${s.top}%`, left: `${s.left}%`, opacity: s.opacity * 0.65 }} />
        ))}
      </div>

      {/* Capa frontal — más grandes y brillantes */}
      <div className="absolute inset-0">
        {frontStars.map(s => (
          <div key={`f-${s.id}`} className="absolute bg-white rounded-full"
            style={{
              width: `${s.size * 1.4}px`, height: `${s.size * 1.4}px`,
              top: `${s.top}%`, left: `${s.left}%`, opacity: s.opacity,
              boxShadow: s.opacity > 0.8 ? '0 0 4px 1px rgba(200,220,255,0.6)' : undefined,
            }} />
        ))}
      </div>

      {/* Planetas */}
      <Planet color="#4f46e5" size="110px" top="12%"  left="8%"   delay={0.5} />
      <Planet color="#9333ea" size="160px" top="68%"  left="79%"  delay={1.0} />
      <Planet color="#0891b2" size="65px"  top="38%"  left="87%"  delay={1.5} />
      <Planet color="#065f46" size="80px"  top="85%"  left="15%"  delay={2.0} />
      <Planet color="#7c3aed" size="45px"  top="22%"  left="60%"  delay={2.5} />

      {/* Lluvia de meteoros — dirección unificada, efecto armónico */}
      {METEOR_DATA.map(m => (
        <Meteor key={m.id} {...m} />
      ))}

      {/* Neblosas */}
      <div className="absolute top-[-15%] left-[-15%] w-[55%] h-[55%] bg-blue-900/10    rounded-full blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[55%] h-[55%] bg-purple-900/10 rounded-full blur-[140px]" />
      <div className="absolute top-[30%]  left-[40%]  w-[30%] h-[30%] bg-indigo-900/8   rounded-full blur-[100px]" />
    </div>
  );
};

export default SpaceBackground;
