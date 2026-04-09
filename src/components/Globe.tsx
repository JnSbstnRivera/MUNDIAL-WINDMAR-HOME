import React, { useEffect, useRef, useState } from 'react';
import GlobeGL from 'react-globe.gl';
import * as d3 from 'd3';
import { Team } from '../types';

interface GlobeProps {
  teams: Team[];
  onCountryClick: (countryCode: string) => void;
  selectedCountryCode: string | null;
}

const Globe: React.FC<GlobeProps> = ({ teams, onCountryClick, selectedCountryCode }) => {
  const globeEl = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<any>({ features: [] });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Load GeoJSON
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, Math.max(...teams.map(t => t.points), 10)]);

  const getCountryColor = (d: any) => {
    const countryCode = d.properties.ISO_A3;
    const team = teams.find(t => t.countryCode === countryCode);
    
    if (selectedCountryCode === countryCode) return '#3b82f6'; // Blue for selected
    if (hoveredCountry === countryCode) return '#60a5fa'; // Lighter blue for hover
    if (team) return team.color || colorScale(team.points);
    return '#1f2937'; // Dark gray for non-competing
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-black overflow-hidden">
      <GlobeGL
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundColor="rgba(0,0,0,0)"
        lineHoverPrecision={0}
        polygonsData={countries.features}
        polygonSideColor={() => 'rgba(0, 100, 0, 0.15)'}
        polygonStrokeColor={() => '#111'}
        polygonCapColor={getCountryColor}
        polygonLabel={({ properties: d }: any) => `
          <div class="bg-gray-900 text-white p-2 rounded shadow-lg border border-gray-700">
            <b class="text-lg">${d.ADMIN} (${d.ISO_A3})</b>
            ${teams.find(t => t.countryCode === d.ISO_A3) 
              ? `<br/><span class="text-blue-400">Puntos: ${teams.find(t => t.countryCode === d.ISO_A3)?.points}</span>
                 <br/><span class="text-green-400">Goles: ${teams.find(t => t.countryCode === d.ISO_A3)?.goals}</span>`
              : '<br/><span class="text-gray-400">No participa</span>'}
          </div>
        `}
        onPolygonHover={(d: any) => setHoveredCountry(d ? d.properties.ISO_A3 : null)}
        onPolygonClick={(d: any) => onCountryClick(d.properties.ISO_A3)}
      />
    </div>
  );
};

export default Globe;
