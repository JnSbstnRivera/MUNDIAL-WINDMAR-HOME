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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Canvas composite: pinta la bandera de cada equipo dentro de su país ──────
// Usa proyección equirectangular (misma que la textura Blue Marble) para
// recortar la silueta del país con d3.geoPath y dibujar la bandera adentro.
async function buildGlobeTexture(
  countries: any,
  teams: Team[],
  iso2Map: Record<string, string>
): Promise<string> {
  const W = 2048, H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. Textura base Blue Marble
  try {
    const base = await loadImage('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    ctx.drawImage(base, 0, 0, W, H);
  } catch {
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Proyección equirectangular alineada con la textura
  const projection = d3.geoEquirectangular()
    .scale(W / (2 * Math.PI))
    .translate([W / 2, H / 2]);

  const pathGen = d3.geoPath(projection, ctx as any);

  // 3. Pintar bandera dentro de cada país participante
  for (const team of teams) {
    const feature = countries.features.find(
      (f: any) => f.properties.ISO_A3 === team.countryCode
    );
    if (!feature) continue;

    const iso2 = iso2Map[team.countryCode];
    if (!iso2 || iso2 === '-99') continue;

    try {
      const flagImg = await loadImage(`https://flagcdn.com/w320/${iso2}.png`);

      // Bounding box del país en píxeles
      const [[minLon, minLat], [maxLon, maxLat]] = d3.geoBounds(feature);
      const topLeft     = projection([minLon, maxLat]);
      const bottomRight = projection([maxLon, minLat]);
      if (!topLeft || !bottomRight) continue;

      const [px0, py0] = topLeft;
      const [px1, py1] = bottomRight;
      const pw = px1 - px0;
      const ph = py1 - py0;

      // Descartar países con bounding box inválido (antimeridianos, etc.)
      if (pw <= 0 || ph <= 0 || pw > W * 0.75 || ph > H * 0.75) continue;

      ctx.save();

      // Recortar al contorno exacto del país
      ctx.beginPath();
      pathGen(feature);
      ctx.clip();

      // Dibujar bandera con transparencia para mezclar con el terreno
      ctx.globalAlpha = 0.68;
      ctx.drawImage(flagImg, px0, py0, pw, ph);

      // Tinte suave del color del equipo encima
      if (team.color) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = team.color;
        ctx.fillRect(px0, py0, pw, ph);
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    } catch {
      // Si no carga la bandera, dejar la textura base sin cambios
    }
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

// ─── Componente Globe ─────────────────────────────────────────────────────────
const Globe: React.FC<GlobeProps> = ({ teams, matches, onCountryClick, selectedCountryCode }) => {
  const globeEl      = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries]     = useState<any>({ features: [] });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [dimensions, setDimensions]   = useState({ width: window.innerWidth, height: window.innerHeight });
  // Empieza con Blue Marble; se actualiza con la versión con banderas cuando está lista
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

  // ── Mapa ISO3 → ISO2 a partir del GeoJSON ───────────────────────────────────
  const iso2Map = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    countries.features.forEach((f: any) => {
      const iso3 = f.properties.ISO_A3;
      const iso2 = (f.properties.ISO_A2 || '').toLowerCase();
      if (iso3 && iso2 && iso2 !== '-99') map[iso3] = iso2;
    });
    return map;
  }, [countries]);

  // ── Reconstruir textura cuando cambian equipos o colores ─────────────────────
  // (no se reconstruye en cada cambio de puntos, solo al agregar/quitar equipos)
  const teamCompositionKey = useMemo(
    () => teams.map(t => `${t.countryCode}:${t.color ?? ''}`).sort().join('|'),
    [teams]
  );

  useEffect(() => {
    if (!countries.features.length || !teams.length) return;
    buildGlobeTexture(countries, teams, iso2Map)
      .then(setGlobeTexture)
      .catch(console.error);
  }, [teamCompositionKey, iso2Map]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Marcadores HTML: badge de nombre + puntos (la bandera ya está en el mapa) ─
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

  // ── Elemento HTML del marcador ───────────────────────────────────────────────
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
    const badge = document.createElement('div');
    const activeColor = isLive ? '#4ade80' : isActive ? 'rgba(255,255,255,0.9)' : 'rgba(150,150,150,0.7)';
    badge.style.cssText = [
      'background:rgba(0,0,0,0.78)', 'backdrop-filter:blur(6px)',
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
  // Países con equipo → transparente (bandera ya está en la textura)
  // Hover/selección → overlay de color para feedback
  const getCountryColor = (d: any) => {
    const code = d.properties.ISO_A3;
    const team = teams.find(t => t.countryCode === code);
    if (selectedCountryCode === code) return 'rgba(59,130,246,0.55)';
    if (hoveredCountry    === code) return 'rgba(255,255,255,0.14)';
    if (team)                       return 'rgba(0,0,0,0)';       // transparente
    return 'rgba(0,8,24,0.18)';                                    // tinte oscuro suave
  };

  const getStrokeColor = (d: any) => {
    const code = d.properties.ISO_A3;
    const team = teams.find(t => t.countryCode === code);
    return team ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.05)';
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
          return `
            <div style="background:rgba(8,8,20,0.92);color:white;padding:8px 12px;
              border-radius:8px;border:1px solid rgba(255,255,255,0.12);
              font-family:monospace;font-size:12px;min-width:140px;">
              <b style="font-size:13px;">${d.ADMIN}</b>
              <span style="color:rgba(150,150,180,0.7);font-size:10px;"> (${d.ISO_A3})</span>
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
