import React, { useEffect, useRef, useState, useMemo } from 'react';
import GlobeGL from 'react-globe.gl';
import * as d3 from 'd3';
import { Team, Match } from '../types';

interface GlobeProps {
  teams: Team[];
  matches: Match[];
  onCountryClick: (countryCode: string) => void;
  selectedCountryCode: string | null;
}

// Convierte hex #rrggbb → rgba(r,g,b,a) para polígonos semi-transparentes
function hexToRgba(hex: string, alpha: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(59,130,246,${alpha})`;
  return `rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${alpha})`;
}

const Globe: React.FC<GlobeProps> = ({ teams, matches, onCountryClick, selectedCountryCode }) => {
  const globeEl    = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<any>({ features: [] });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width:  window.innerWidth,
    height: window.innerHeight,
  });

  // ── Resize observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      if (entries[0]) setDimensions({
        width:  entries[0].contentRect.width,
        height: entries[0].contentRect.height,
      });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ── Cargar GeoJSON ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(setCountries);
  }, []);

  // ── Auto-rotate ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate      = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  // ── Marcadores de bandera ──────────────────────────────────────────────────
  // Calcula centroide geográfico de cada equipo usando el GeoJSON ya cargado.
  // isLive: hay un partido en estado 'live' para ese equipo.
  // isActive: el equipo tiene algún partido registrado (independiente del estado).
  const teamMarkers = useMemo(() => {
    if (!countries.features.length) return [];
    return teams.map(team => {
      const feature = countries.features.find(
        (f: any) => f.properties.ISO_A3 === team.countryCode
      );
      if (!feature) return null;
      try {
        const [lng, lat] = d3.geoCentroid(feature as any);
        const iso2 = (feature.properties.ISO_A2 || '').toLowerCase();
        if (!iso2 || iso2 === '-99') return null;

        const isLive = matches.some(
          m => (m.teamAId === team.id || m.teamBId === team.id) && m.status === 'live'
        );
        const isActive = team.points > 0 || matches.some(
          m => m.teamAId === team.id || m.teamBId === team.id
        );
        return { team, lat, lng, iso2, isLive, isActive };
      } catch {
        return null;
      }
    }).filter(Boolean);
  }, [teams, matches, countries]);

  // ── Color de polígonos ─────────────────────────────────────────────────────
  // Semi-transparente para que la textura Blue Marble sea visible debajo.
  const getCountryColor = (d: any) => {
    const code = d.properties.ISO_A3;
    const team = teams.find(t => t.countryCode === code);
    if (selectedCountryCode === code) return 'rgba(59,130,246,0.75)';
    if (hoveredCountry    === code) return 'rgba(96,165,250,0.55)';
    if (team) return hexToRgba(team.color || '#3b82f6', 0.52);
    return 'rgba(0, 8, 24, 0.22)'; // Casi transparente → textura visible
  };

  // ── Elemento HTML para cada marcador de bandera ───────────────────────────
  const buildFlagElement = (d: any): HTMLElement => {
    const { team, iso2, isLive, isActive } = d;

    // Contenedor
    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'transform:translate(-50%,-110%)',
      'pointer-events:none',
      'gap:3px',
    ].join(';');

    // Indicador "EN VIVO" encima de la bandera
    if (isLive) {
      const live = document.createElement('div');
      live.style.cssText = [
        'background:rgba(220,38,38,0.9)',
        'color:white',
        'font-size:7px',
        'font-weight:900',
        'letter-spacing:0.12em',
        'padding:1px 5px',
        'border-radius:2px',
        'font-family:monospace',
      ].join(';');
      live.textContent = '● EN VIVO';
      wrap.appendChild(live);
    }

    // Bandera
    const img = document.createElement('img');
    img.src            = `https://flagcdn.com/w40/${iso2}.png`;
    img.referrerPolicy = 'no-referrer';
    img.style.cssText  = [
      'width:36px',
      'height:24px',
      'object-fit:cover',
      'border-radius:3px',
      `border:1.5px solid ${isLive ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.25)'}`,
      `box-shadow:0 2px 10px rgba(0,0,0,0.8)`,
      `filter:${!isActive ? 'grayscale(100%) brightness(0.45)' : 'none'}`,
      isLive ? 'animation:pulse-flag 1s ease-in-out infinite alternate' : '',
    ].join(';');

    // Badge de puntos
    const badge = document.createElement('div');
    badge.style.cssText = [
      'background:rgba(0,0,0,0.78)',
      'backdrop-filter:blur(4px)',
      'padding:1px 5px',
      'border-radius:3px',
      `font-size:${team.name.length > 8 ? '8px' : '9px'}`,
      `color:${isLive ? '#4ade80' : isActive ? 'rgba(255,255,255,0.85)' : 'rgba(150,150,150,0.7)'}`,
      'white-space:nowrap',
      'font-weight:700',
      'font-family:monospace',
      'letter-spacing:0.04em',
      `border:1px solid ${isLive ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.1)'}`,
    ].join(';');
    badge.textContent = `${team.name} · ${team.points}pts`;

    wrap.appendChild(img);
    wrap.appendChild(badge);
    return wrap;
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-black overflow-hidden">
      <GlobeGL
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}

        // ── Textura Blue Marble + relieve + atmósfera ──────────────────────
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.14}
        backgroundColor="rgba(0,0,0,0)"

        // ── Polígonos de países ────────────────────────────────────────────
        lineHoverPrecision={0}
        polygonsData={countries.features}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => 'rgba(0,40,100,0.18)'}
        polygonStrokeColor={() => 'rgba(255,255,255,0.07)'}
        polygonLabel={({ properties: d }: any) => {
          const team = teams.find(t => t.countryCode === d.ISO_A3);
          return `
            <div style="background:rgba(8,8,20,0.92);color:white;padding:8px 12px;
              border-radius:8px;border:1px solid rgba(255,255,255,0.12);
              font-family:monospace;font-size:12px;min-width:140px;">
              <b style="font-size:13px;">${d.ADMIN}</b>
              <span style="color:rgba(150,150,180,0.8);font-size:10px;"> (${d.ISO_A3})</span>
              ${team
                ? `<br/><span style="color:#60a5fa;">▲ ${team.points} puntos</span>
                   <br/><span style="color:#34d399;">⚽ ${team.goals} goles</span>
                   <br/><span style="color:rgba(180,180,180,0.6);font-size:10px;">${team.callCenterGroup || ''}</span>`
                : '<br/><span style="color:rgba(120,120,120,0.7);">No participa</span>'
              }
            </div>`;
        }}
        onPolygonHover={(d: any) => setHoveredCountry(d ? d.properties.ISO_A3 : null)}
        onPolygonClick={(d: any) => onCountryClick(d.properties.ISO_A3)}

        // ── Marcadores HTML de banderas ────────────────────────────────────
        htmlElementsData={teamMarkers}
        htmlLat={(d: any) => d.lat}
        htmlLng={(d: any) => d.lng}
        htmlAltitude={0.01}
        htmlElement={buildFlagElement}
        htmlTransitionDuration={0}
      />
    </div>
  );
};

export default Globe;
