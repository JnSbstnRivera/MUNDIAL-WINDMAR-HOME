import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import GlobeGL from 'react-globe.gl';
import * as d3 from 'd3';
import { Team, Match } from '../types';

interface GlobeProps {
  teams: Team[];
  matches: Match[];
  onCountryClick: (countryCode: string) => void;
  selectedCountryCode: string | null;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(59,130,246,${alpha})`;
  return `rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${alpha})`;
}

// ─── Canvas composite: pinta la bandera de cada equipo dentro de su país ──────
async function buildGlobeTexture(
  features: any[],
  teams: Team[],
  iso2Map: Record<string, string>
): Promise<string> {
  const W = 2048, H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. Textura base Blue Marble
  await new Promise<void>(resolve => {
    const base = new Image();
    base.crossOrigin = 'anonymous';
    base.onload = () => { ctx.drawImage(base, 0, 0, W, H); resolve(); };
    base.onerror = () => resolve();
    base.src = '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
  });

  // 2. Proyección equirectangular: lon[-180,180]→x[0,W], lat[90,-90]→y[0,H]
  const project = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ];

  // 3. Pintar bandera dentro de cada país participante
  for (const team of teams) {
    const feature = features.find((f: any) => f.properties.ISO_A3 === team.countryCode);
    const iso2 = iso2Map[team.countryCode];
    if (!feature || !iso2 || iso2 === '-99') continue;

    // Cargar bandera (silencioso si falla CORS)
    const flagImg = await new Promise<HTMLImageElement | null>(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `https://flagcdn.com/w320/${iso2}.png`;
    });
    if (!flagImg) continue;

    // Recopilar anillos del polígono y calcular bounding box
    let minX = W, minY = H, maxX = 0, maxY = 0;
    const rings: [number, number][][] = [];

    const processRing = (ring: number[][]) => {
      const projected = ring.map(([lon, lat]) => project(lon, lat));
      projected.forEach(([px, py]) => {
        if (px < minX) minX = px; if (px > maxX) maxX = px;
        if (py < minY) minY = py; if (py > maxY) maxY = py;
      });
      rings.push(projected as [number, number][]);
    };

    try {
      const geom = feature.geometry;
      if (geom.type === 'Polygon') {
        geom.coordinates.forEach(processRing);
      } else if (geom.type === 'MultiPolygon') {
        // Usar solo el polígono más grande para evitar islas pequeñas dispersas
        let biggest: number[][] | null = null;
        let biggestArea = 0;
        geom.coordinates.forEach((poly: number[][][]) => {
          const ring = poly[0];
          const area = Math.abs(ring.reduce((acc: number, [x, y]: number[], i: number) => {
            const next = ring[(i + 1) % ring.length];
            return acc + x * next[1] - next[0] * y;
          }, 0) / 2);
          if (area > biggestArea) { biggestArea = area; biggest = ring; }
        });
        if (biggest) processRing(biggest);
      }
    } catch { continue; }

    const pw = maxX - minX;
    const ph = maxY - minY;
    if (pw <= 0 || ph <= 0 || pw > W * 0.7) continue;

    // Clip al polígono y dibujar bandera
    ctx.save();
    ctx.beginPath();
    rings.forEach(ring => {
      ring.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
    });
    ctx.clip();
    ctx.globalAlpha = 0.72;
    ctx.drawImage(flagImg, minX, minY, pw, ph);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  try {
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
  }
}

// ─── Componente Globe ─────────────────────────────────────────────────────────
const Globe: React.FC<GlobeProps> = ({ teams, matches, onCountryClick, selectedCountryCode }) => {
  const globeEl      = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries]     = useState<any>({ features: [] });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [dimensions, setDimensions]   = useState({ width: window.innerWidth, height: window.innerHeight });
  const [globeTexture, setGlobeTexture] = useState(
    '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
  );

  // ── Resize ──────────────────────────────────────────────────────────────────
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

  // ── GeoJSON ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(setCountries);
  }, []);

  // ── Auto-rotate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate      = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  // ── Mapa ISO3 → ISO2 ────────────────────────────────────────────────────────
  const iso2Map = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    countries.features.forEach((f: any) => {
      const iso3 = f.properties.ISO_A3;
      const iso2 = (f.properties.ISO_A2 || '').toLowerCase();
      if (iso3 && iso2 && iso2 !== '-99') map[iso3] = iso2;
    });
    return map;
  }, [countries]);

  // ── Reconstruir textura cuando cambian equipos o países ─────────────────────
  const teamCompositionKey = useMemo(
    () => teams.map(t => `${t.countryCode}:${t.color ?? ''}`).sort().join('|'),
    [teams]
  );

  useEffect(() => {
    if (!countries.features.length || !teams.length) return;
    buildGlobeTexture(countries.features, teams, iso2Map)
      .then(setGlobeTexture)
      .catch(console.error);
  }, [teamCompositionKey, iso2Map]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Marcadores HTML: solo badge nombre + puntos (sin bandera flotante) ───────
  const teamMarkers = useMemo(() => {
    if (!countries.features.length) return [];
    return teams.map(team => {
      const feature = countries.features.find(
        (f: any) => f.properties.ISO_A3 === team.countryCode
      );
      if (!feature) return null;
      try {
        const [lng, lat] = d3.geoCentroid(feature as any);
        const isLive = matches.some(
          m => (m.teamAId === team.id || m.teamBId === team.id) && m.status === 'live'
        );
        const isActive = team.points > 0 || matches.some(
          m => m.teamAId === team.id || m.teamBId === team.id
        );
        return { team, lat, lng, isLive, isActive };
      } catch { return null; }
    }).filter(Boolean);
  }, [teams, matches, countries]);

  // ── Elemento HTML del marcador (solo badge, sin bandera) ─────────────────────
  const buildMarker = useCallback((d: any): HTMLElement => {
    const { team, isLive, isActive } = d;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);pointer-events:none;gap:2px;';

    // Badge EN VIVO
    if (isLive) {
      const live = document.createElement('div');
      live.style.cssText = [
        'background:rgba(220,38,38,0.92)', 'color:white', 'font-size:7px',
        'font-weight:900', 'letter-spacing:0.12em', 'padding:1px 5px',
        'border-radius:2px', 'font-family:monospace',
        'animation:pulse-flag 1s ease-in-out infinite alternate',
      ].join(';');
      live.textContent = '● EN VIVO';
      wrap.appendChild(live);
    }

    // Badge nombre + puntos
    const activeColor = isLive ? '#4ade80' : isActive ? 'rgba(255,255,255,0.9)' : 'rgba(150,150,150,0.7)';
    const badge = document.createElement('div');
    badge.style.cssText = [
      'background:rgba(0,0,0,0.75)', 'backdrop-filter:blur(6px)',
      'padding:2px 7px', 'border-radius:4px',
      `font-size:${team.name.length > 8 ? '8px' : '9px'}`,
      `color:${activeColor}`, 'white-space:nowrap', 'font-weight:700',
      'font-family:monospace', 'letter-spacing:0.04em',
      `border:1px solid ${isLive ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.12)'}`,
    ].join(';');
    badge.textContent = `${team.name}  ${team.points}pts`;
    wrap.appendChild(badge);
    return wrap;
  }, []);

  // ── Color de polígono ────────────────────────────────────────────────────────
  const getCountryColor = (d: any) => {
    const code = d.properties.ISO_A3;
    const team = teams.find(t => t.countryCode === code);
    if (selectedCountryCode === code) return 'rgba(59,130,246,0.45)';
    if (hoveredCountry    === code) return 'rgba(255,255,255,0.18)';
    if (team)                       return 'rgba(0,0,0,0)';
    return 'rgba(0,8,24,0.18)';
  };

  const getStrokeColor = (d: any) => {
    const code = d.properties.ISO_A3;
    const team = teams.find(t => t.countryCode === code);
    return team ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.05)';
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-black overflow-hidden">
      <GlobeGL
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}

        globeImageUrl={globeTexture}
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.14}
        backgroundColor="rgba(0,0,0,0)"

        lineHoverPrecision={0}
        polygonsData={countries.features}
        polygonCapColor={getCountryColor}
        polygonSideColor={() => 'rgba(0,40,100,0.15)'}
        polygonStrokeColor={getStrokeColor}
        polygonLabel={({ properties: d }: any) => {
          const team = teams.find(t => t.countryCode === d.ISO_A3);
          const leaderLine = team?.leader
            ? `<div style="display:flex;align-items:center;gap:6px;margin-top:5px;">
                <span style="color:#94a3b8;font-size:11px;">Líder</span>
                <span style="color:#e2e8f0;font-size:12px;font-weight:600;">${team.leader}</span>
               </div>`
            : '';
          return `
            <div style="
              background:rgba(10,12,26,0.96);
              color:white;
              padding:10px 14px;
              border-radius:10px;
              border:1px solid rgba(255,255,255,0.10);
              font-family:Inter,system-ui,-apple-system,sans-serif;
              min-width:160px;
              box-shadow:0 4px 20px rgba(0,0,0,0.6);
            ">
              <div style="font-size:14px;font-weight:700;color:#f1f5f9;line-height:1.3;">${d.ADMIN}</div>
              ${team ? `
                <div style="width:100%;height:1px;background:rgba(255,255,255,0.08);margin:6px 0;"></div>
                <div style="display:flex;align-items:baseline;gap:6px;">
                  <span style="color:#60a5fa;font-size:22px;font-weight:900;line-height:1;">${team.points}</span>
                  <span style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">puntos</span>
                </div>
                ${leaderLine}
              ` : `
                <div style="color:#475569;font-size:11px;margin-top:4px;">No participa</div>
              `}
            </div>`;
        }}
        onPolygonHover={(d: any) => setHoveredCountry(d ? d.properties.ISO_A3 : null)}
        onPolygonClick={(d: any) => onCountryClick(d.properties.ISO_A3)}

        htmlElementsData={teamMarkers}
        htmlLat={(d: any) => d.lat}
        htmlLng={(d: any) => d.lng}
        htmlAltitude={0.01}
        htmlElement={buildMarker}
        htmlTransitionDuration={0}
      />
    </div>
  );
};

export default Globe;
