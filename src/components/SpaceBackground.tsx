import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ShootingStar = () => {
  const [style, setStyle] = useState({});

  const resetStar = () => {
    const top = Math.random() * 50;
    const left = Math.random() * 100;
    const duration = 1 + Math.random() * 2;
    const delay = Math.random() * 5;
    
    setStyle({
      top: `${top}%`,
      left: `${left}%`,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
    });
  };

  useEffect(() => {
    resetStar();
    const interval = setInterval(resetStar, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="absolute w-[2px] h-[2px] bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)] animate-shooting-star pointer-events-none"
      style={style}
    />
  );
};

const Planet = ({ color, size, top, left, delay }: { color: string, size: string, top: string, left: string, delay: number }) => {
  return (
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
        boxShadow: `inset -5px -5px 10px rgba(0,0,0,0.5), 0 0 20px ${color}33`
      }}
    />
  );
};

const SpaceBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#000005] overflow-hidden pointer-events-none z-0">
      {/* Static Stars */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(150)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 'px',
              height: Math.random() * 2 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random(),
            }}
          />
        ))}
      </div>

      {/* Planets */}
      <Planet color="#4f46e5" size="100px" top="15%" left="10%" delay={0.5} />
      <Planet color="#9333ea" size="150px" top="70%" left="80%" delay={1} />
      <Planet color="#0891b2" size="60px" top="40%" left="85%" delay={1.5} />

      {/* Shooting Stars */}
      <ShootingStar />
      <ShootingStar />
      <ShootingStar />
      <ShootingStar />

      {/* Nebula effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
    </div>
  );
};

export default SpaceBackground;
