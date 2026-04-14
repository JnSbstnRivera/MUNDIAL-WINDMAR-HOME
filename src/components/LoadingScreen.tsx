import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Globe as GlobeIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CAMBIA ESTE NÚMERO PARA VER CADA ANIMACIÓN: 1, 2 ó 3
// ─────────────────────────────────────────────────────────────────────────────
export const INTRO_VARIANT: 1 | 2 | 3 = 1;

const WINDMAR_LOGO = 'https://i.postimg.cc/44pJ0vXw/logo.png';

interface LoadingScreenProps {
  ready: boolean;
  onComplete: () => void;
}

// ─── Hook de progreso ─────────────────────────────────────────────────────────
function useProgress(durationMs: number) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - start) / durationMs, 1);
      setProgress(p);
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [durationMs]);
  return progress;
}

// ─── Sección de marca: Copa + Logo Windmar (compartida entre variantes) ───────
interface BrandProps {
  delay?: number;
  trophySize?: number;
  logoHeight?: string;
  direction?: 'row' | 'col';
  animate?: boolean;
}

const BrandSection: React.FC<BrandProps> = ({
  delay = 0.2,
  trophySize = 52,
  logoHeight = 'h-12',
  direction = 'row',
  animate = true,
}) => {
  const content = (
    <div className={`flex ${direction === 'row' ? 'flex-row items-center gap-4' : 'flex-col items-center gap-3'}`}>
      {/* Copa del mundo */}
      <motion.div
        initial={animate ? { scale: 0, rotate: -180, opacity: 0 } : false}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, delay }}
        style={{ filter: 'drop-shadow(0 0 22px rgba(250,204,21,0.75))' }}
      >
        <Trophy size={trophySize} className="text-yellow-400" />
      </motion.div>

      {direction === 'row' && (
        <motion.div
          className="w-px bg-white/20 self-stretch"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: delay + 0.15, duration: 0.4 }}
        />
      )}

      {/* Logo Windmar Home */}
      <motion.img
        src={WINDMAR_LOGO}
        alt="Windmar Home"
        className={`${logoHeight} object-contain`}
        style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.25))' }}
        initial={animate ? { opacity: 0, x: direction === 'row' ? 20 : 0, y: direction === 'col' ? 10 : 0 } : false}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: delay + 0.25, duration: 0.5 }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
  return content;
};

// ═════════════════════════════════════════════════════════════════════════════
// VARIANTE 1 — BIG BANG
// Partículas explotan desde el centro · Copa + Logo · título letra a letra
// ═════════════════════════════════════════════════════════════════════════════
const TITLE_CHARS = 'MUNDIAL WINDMAR HOME'.split('');

const V1_BigBang: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const progress = useProgress(3600);

  useEffect(() => {
    if (progress >= 1) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
  }, [progress, onDone]);

  const particles = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => {
      const angle = (i / 70) * Math.PI * 2;
      const dist  = 180 + Math.random() * 420;
      const colors = ['#60a5fa', '#34d399', '#ffffff', '#a78bfa', '#fbbf24'];
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size:  1.2 + Math.random() * 3,
        delay: Math.random() * 0.6,
        color: colors[i % colors.length],
        trail: Math.random() > 0.6,
      };
    }), []
  );

  const shootingStars = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * window.innerWidth  * 1.5,
      startY: (Math.random() - 0.5) * window.innerHeight * 1.5,
      angle:  Math.random() * 360,
      delay:  0.2 + Math.random() * 2.5,
    })), []
  );

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[100] overflow-hidden">

      {/* Estrellas radiales de inicio */}
      {shootingStars.map(s => (
        <motion.div key={`ss-${s.id}`} className="absolute"
          style={{ width: 80 + Math.random() * 120, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(150,200,255,0.9))',
            left: '50%', top: '50%', transformOrigin: 'right center', rotate: s.angle }}
          initial={{ x: s.startX, y: s.startY, opacity: 0, scaleX: 0 }}
          animate={{ x: 0, y: 0, opacity: [0, 0.9, 0], scaleX: [0, 1, 0] }}
          transition={{ duration: 0.8, delay: s.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Partículas burst */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {particles.map(p => (
          <motion.div key={p.id} className="absolute rounded-full"
            style={{ width: p.size, height: p.size, background: p.color,
              boxShadow: p.trail ? `0 0 6px 2px ${p.color}88` : undefined }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: p.x, y: p.y, opacity: [0, 1, 1, 0], scale: [0, 1.5, 1, 0] }}
            transition={{ duration: 2.8, delay: p.delay, ease: [0.2, 0.8, 0.4, 1] }}
          />
        ))}
      </div>

      {/* Glow central */}
      <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.3] }} transition={{ duration: 1.5 }}>
        <div className="w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 65%)' }} />
      </motion.div>

      {/* Contenido central */}
      <div className="flex flex-col items-center gap-6 z-10 px-6">

        {/* Copa + Logo Windmar */}
        <BrandSection delay={0.2} trophySize={56} logoHeight="h-20" direction="row" />

        {/* Título letra por letra */}
        <div className="flex flex-wrap justify-center leading-tight max-w-sm md:max-w-xl mt-1">
          {TITLE_CHARS.map((char, i) => (
            <motion.span key={i} className="text-2xl md:text-4xl font-black"
              style={char !== ' ' ? {
                background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              } : { display: 'inline-block', width: '0.35em' }}
              initial={{ opacity: 0, y: 28, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.045, type: 'spring', stiffness: 280, damping: 18 }}>
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </div>

        {/* Subtítulo */}
        <motion.p className="text-[11px] tracking-[0.35em] text-gray-500 uppercase font-medium"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1 }}>
          Competencia de Equipos · 2026
        </motion.p>

        {/* Barra de progreso */}
        <motion.div className="w-64 md:w-80"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}>
          <div className="h-[3px] bg-gray-800 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                boxShadow: '0 0 14px rgba(59,130,246,0.9)' }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.05, ease: 'linear' }} />
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-2 font-mono tracking-widest uppercase">
            {progress < 0.98 ? 'Iniciando...' : '¡Listo!'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// VARIANTE 2 — WARP SPEED
// Hiperespacio → flash → Copa + Logo + contador digital cian
// ═════════════════════════════════════════════════════════════════════════════
const V2_WarpSpeed: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const progress = useProgress(3000);
  const [phase, setPhase] = useState<'warp' | 'arrive'>('warp');

  useEffect(() => {
    const t = setTimeout(() => setPhase('arrive'), 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (progress >= 1) { const t = setTimeout(onDone, 600); return () => clearTimeout(t); }
  }, [progress, onDone]);

  const streaks = useMemo(() =>
    Array.from({ length: 100 }, (_, i) => ({
      id: i, angle: (i / 100) * 360, length: 60 + Math.random() * 220,
      delay: Math.random() * 0.4, opacity: 0.25 + Math.random() * 0.75,
      color: i % 4 === 0 ? '#22d3ee' : i % 4 === 1 ? '#60a5fa' : '#ffffff',
    })), []
  );

  const bgStars = useMemo(() =>
    Array.from({ length: 220 }, (_, i) => ({
      id: i, top: Math.random() * 100, left: Math.random() * 100,
      size: 0.5 + Math.random() * 1.8, delay: Math.random() * 0.6, opacity: 0.2 + Math.random() * 0.8,
    })), []
  );

  return (
    <div className="fixed inset-0 bg-[#000008] flex items-center justify-center z-[100] overflow-hidden">
      {bgStars.map(s => (
        <motion.div key={s.id} className="absolute rounded-full bg-white"
          style={{ width: s.size, height: s.size, top: `${s.top}%`, left: `${s.left}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'arrive' ? s.opacity : 0 }}
          transition={{ delay: phase === 'arrive' ? s.delay * 0.4 : 0, duration: 0.4 }} />
      ))}

      <AnimatePresence>
        {phase === 'warp' && (
          <motion.div key="warp" className="absolute inset-0 flex items-center justify-center"
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {streaks.map(s => (
              <motion.div key={s.id}
                style={{ position: 'absolute', height: 1, width: s.length,
                  background: `linear-gradient(90deg, ${s.color}00, ${s.color})`,
                  left: '50%', top: '50%', transformOrigin: '0% 50%',
                  rotate: s.angle, opacity: s.opacity, boxShadow: `0 0 4px ${s.color}66` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1, 1, 0] }}
                transition={{ duration: 1.2, delay: s.delay, times: [0, 0.3, 0.7, 1], ease: 'easeInOut' }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'arrive' && (
          <motion.div key="flash" className="absolute inset-0 bg-white pointer-events-none"
            initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'arrive' && (
          <motion.div key="content" className="flex flex-col items-center gap-7 z-10"
            initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>

            {/* Copa + Logo */}
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}>
              <BrandSection delay={0} trophySize={44} logoHeight="h-18" direction="row" animate={false} />
            </motion.div>

            {/* Texto MUNDIAL */}
            <motion.div className="text-center -mt-2"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="text-3xl md:text-5xl font-black tracking-widest text-white uppercase"
                style={{ textShadow: '0 0 30px rgba(255,255,255,0.3)' }}>MUNDIAL</div>
              <div className="text-sm md:text-base font-bold tracking-[0.3em] uppercase mt-1"
                style={{ color: '#22d3ee', textShadow: '0 0 16px rgba(34,211,238,0.8)' }}>
                Competencia de Equipos · 2026
              </div>
            </motion.div>

            {/* Contador digital */}
            <motion.div className="font-mono font-black tabular-nums leading-none"
              style={{ fontSize: 'clamp(3rem,10vw,5rem)', color: '#22d3ee',
                textShadow: '0 0 24px rgba(34,211,238,0.9)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {String(Math.round(progress * 100)).padStart(3, '0')}
              <span className="text-2xl" style={{ color: '#0e7490' }}>%</span>
            </motion.div>

            {/* Barra */}
            <motion.div className="w-64 md:w-96 space-y-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              <div className="h-px bg-cyan-900/60 relative overflow-visible">
                <motion.div className="absolute top-0 left-0 h-px"
                  style={{ background: 'linear-gradient(90deg,#0e7490,#22d3ee)', boxShadow: '0 0 10px rgba(34,211,238,1)' }}
                  animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.05, ease: 'linear' }} />
                <motion.div className="absolute top-[-3px] w-1.5 h-1.5 rounded-full bg-cyan-300"
                  style={{ boxShadow: '0 0 8px rgba(34,211,238,1)' }}
                  animate={{ left: `${progress * 100}%` }} transition={{ duration: 0.05, ease: 'linear' }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono tracking-widest" style={{ color: '#164e63' }}>
                <span>TRANSMISIÓN</span><span>EN VIVO · 2026</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// VARIANTE 3 — GALAXY FORMATION
// Estrellas orbitan · anillo SVG · Copa + Logo debajo del anillo
// ═════════════════════════════════════════════════════════════════════════════
const STATUS_MSGS = ['Sincronizando equipos...', 'Conectando en vivo...', '¡Bienvenido al Mundial!'];

const V3_Galaxy: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const progress = useProgress(3600);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setMsgIdx(1), 1400);
    const t2 = setTimeout(() => setMsgIdx(2), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (progress >= 1) { const t = setTimeout(onDone, 800); return () => clearTimeout(t); }
  }, [progress, onDone]);

  const stars = useMemo(() =>
    Array.from({ length: 280 }, (_, i) => ({
      id: i, top: Math.random() * 100, left: Math.random() * 100,
      size: 0.4 + Math.random() * 2.2, delay: Math.random() * 1.8,
      opacity: 0.15 + Math.random() * 0.85, twinkle: Math.random() > 0.7,
    })), []
  );

  const orbitRings = [
    { count: 12, radius: 110, speed: 12, tilt: 0.35, color: '#60a5fa' },
    { count: 18, radius: 160, speed: 18, tilt: 0.55, color: '#a78bfa' },
    { count: 8,  radius: 200, speed: 8,  tilt: 0.2,  color: '#34d399' },
  ];

  const orbitStars = useMemo(() =>
    orbitRings.flatMap((ring, ri) =>
      Array.from({ length: ring.count }, (_, i) => {
        const angle = (i / ring.count) * Math.PI * 2;
        return { id: `${ri}-${i}`, angle, radius: ring.radius, tilt: ring.tilt,
          speed: ring.speed, color: ring.color, size: 1.5 + Math.random() * 2.5, delay: Math.random() * 2 };
      })
    ), []
  );

  const R = 58, circ = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 bg-[#000005] flex items-center justify-center z-[100] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[65%] h-[65%] bg-violet-900/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[65%] h-[65%] bg-indigo-900/15 rounded-full blur-[130px]" />
      </div>

      {stars.map(s => (
        <motion.div key={s.id} className="absolute rounded-full bg-white"
          style={{ width: s.size, height: s.size, top: `${s.top}%`, left: `${s.left}%` }}
          initial={{ opacity: 0 }}
          animate={s.twinkle
            ? { opacity: [0, s.opacity, s.opacity * 0.3, s.opacity, 0], scale: [0.8, 1, 0.8, 1, 0.8] }
            : { opacity: s.opacity }}
          transition={{ delay: s.delay, duration: s.twinkle ? 3 + Math.random() * 3 : 0.5,
            repeat: s.twinkle ? Infinity : 0, repeatType: 'loop' }} />
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        {orbitStars.map(s => (
          <motion.div key={s.id} className="absolute rounded-full"
            style={{ width: s.size, height: s.size, background: s.color, boxShadow: `0 0 4px ${s.color}88` }}
            animate={{
              x: [Math.cos(s.angle)*s.radius, Math.cos(s.angle+Math.PI*2)*s.radius],
              y: [Math.sin(s.angle)*s.radius*s.tilt, Math.sin(s.angle+Math.PI*2)*s.radius*s.tilt],
              opacity: [0.15, 0.9, 0.15],
            }}
            transition={{ duration: s.speed, repeat: Infinity, ease: 'linear', delay: s.delay }} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-5 z-10">
        {/* Anillo circular de progreso con copa adentro */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="absolute inset-0" width="176" height="176" viewBox="0 0 140 140"
            style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
            <motion.circle cx="70" cy="70" r={R} fill="none" stroke="url(#galaxyGrad)"
              strokeWidth="3.5" strokeLinecap="round" strokeDasharray={circ}
              animate={{ strokeDashoffset: circ * (1 - progress) }}
              transition={{ duration: 0.08, ease: 'linear' }} />
            <defs>
              <linearGradient id="galaxyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <motion.div className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 180 }}>
            <Trophy size={34} className="text-yellow-400"
              style={{ filter: 'drop-shadow(0 0 14px rgba(250,204,21,0.75))' }} />
            <span className="text-sm font-mono font-bold text-gray-400">{Math.round(progress * 100)}%</span>
          </motion.div>
        </div>

        {/* Logo Windmar bajo el anillo */}
        <motion.img src={WINDMAR_LOGO} alt="Windmar Home" className="h-16 object-contain"
          style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }} referrerPolicy="no-referrer" />

        {/* Título */}
        <motion.div className="text-center"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 160 }}>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight"
            style={{ background: 'linear-gradient(135deg,#c4b5fd,#ffffff,#6ee7b7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 22px rgba(167,139,250,0.45))' }}>
            MUNDIAL
          </h1>
          <p className="text-xs md:text-sm tracking-[0.45em] font-medium mt-1 uppercase"
            style={{ color: '#a78bfa', textShadow: '0 0 12px rgba(167,139,250,0.6)' }}>
            Windmar Home · 2026
          </p>
        </motion.div>

        {/* Mensaje de estado */}
        <AnimatePresence mode="wait">
          <motion.p key={msgIdx} className="text-[11px] tracking-[0.25em] uppercase font-mono"
            style={{ color: '#4b5563' }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
            {STATUS_MSGS[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// WRAPPER — controla salida y pasa ready al hijo correcto
// ═════════════════════════════════════════════════════════════════════════════
const LoadingScreen: React.FC<LoadingScreenProps> = ({ ready, onComplete }) => {
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (animDone && ready) onComplete();
  }, [animDone, ready, onComplete]);

  return (
    <AnimatePresence>
      {!(animDone && ready) && (
        <motion.div key="loading-screen" className="fixed inset-0 z-[100]"
          exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: 'easeInOut' }}>
          {INTRO_VARIANT === 1 && <V1_BigBang  onDone={() => setAnimDone(true)} />}
          {INTRO_VARIANT === 2 && <V2_WarpSpeed onDone={() => setAnimDone(true)} />}
          {INTRO_VARIANT === 3 && <V3_Galaxy   onDone={() => setAnimDone(true)} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
