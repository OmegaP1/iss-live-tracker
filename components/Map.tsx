'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  IssFix,
  footprintCircle,
  futureGroundTrack,
  horizonRadiusKm,
  terminatorRing,
} from '@/lib/utils';

type Props = {
  iss: IssFix | null;
  trail: IssFix[];
  obs: { lat: number; lon: number } | null;
  showTerminator: boolean;
  showFootprint: boolean;
  showFuture: boolean;
  terminatorTick: number;
};

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TRAIL_COLOR = '#58a6ff';

export default function Map({
  iss,
  trail,
  obs,
  showTerminator,
  showFootprint,
  showFuture,
  terminatorTick,
}: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const issMarkerRef = useRef<L.Marker | null>(null);
  const obsMarkerRef = useRef<L.Marker | null>(null);
  const trailLayersRef = useRef<L.Polyline[]>([]);
  const termLayerRef = useRef<L.Polyline | null>(null);
  const footprintRef = useRef<L.Polygon | null>(null);
  const futureLayersRef = useRef<L.Polyline[]>([]);
  const firstFixRef = useRef(true);

  // Initialize map once
  useEffect(() => {
    if (!mapEl.current) return;
    const map = L.map(mapEl.current, {
      zoomControl: true,
      worldCopyJump: false,
      minZoom: 2,
      maxZoom: 8,
      preferCanvas: true,
      zoomSnap: 0.25,
      maxBounds: [
        [-85, -180],
        [85, 180],
      ],
      maxBoundsViscosity: 1.0,
    }).setView([0, 0], 3);

    mapRef.current = map;

    tileLayerRef.current = L.tileLayer(TILE_URL, {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
      noWrap: true,
      bounds: [
        [-85, -180],
        [85, 180],
      ],
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update ISS marker + trail + footprint + future track
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !iss) return;

    const issIcon = L.divIcon({
      className: 'iss-icon-wrap',
      html: `<div class="iss-pulse"></div><div class="iss-marker">🛰️</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (issMarkerRef.current) {
      map.removeLayer(issMarkerRef.current);
    }
    issMarkerRef.current = L.marker([iss.lat, iss.lon], {
      icon: issIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    if (firstFixRef.current) {
      map.setView([iss.lat, iss.lon], 3);
      firstFixRef.current = false;
    }

    // Rebuild trail with antimeridian split
    trailLayersRef.current.forEach((l) => map.removeLayer(l));
    trailLayersRef.current = [];
    if (trail.length >= 2) {
      const segments: [number, number][][] = [];
      let current: [number, number][] = [[trail[0].lat, trail[0].lon]];
      for (let i = 1; i < trail.length; i++) {
        const prev = trail[i - 1];
        const cur = trail[i];
        if (Math.abs(cur.lon - prev.lon) > 180) {
          segments.push(current);
          current = [];
        }
        current.push([cur.lat, cur.lon]);
      }
      if (current.length > 1) segments.push(current);

      segments.forEach((seg, idx) => {
        if (seg.length < 2) return;
        const isLast = idx === segments.length - 1;
        const layer = L.polyline(seg, {
          color: TRAIL_COLOR,
          weight: 2,
          opacity: isLast ? 0.85 : 0.55,
          dashArray: '4 6',
          lineCap: 'round',
        }).addTo(map);
        trailLayersRef.current.push(layer);
      });
    }

    // Footprint circle
    if (footprintRef.current) {
      map.removeLayer(footprintRef.current);
      footprintRef.current = null;
    }
    if (showFootprint) {
      const r = horizonRadiusKm(iss.alt);
      const ring = footprintCircle(iss.lat, iss.lon, r);
      footprintRef.current = L.polygon(ring, {
        color: TRAIL_COLOR,
        weight: 1,
        opacity: 0.5,
        fillColor: TRAIL_COLOR,
        fillOpacity: 0.06,
        dashArray: '3 4',
      }).addTo(map);
    }

    // Future ground track
    futureLayersRef.current.forEach((l) => map.removeLayer(l));
    futureLayersRef.current = [];
    if (showFuture) {
      const segs = futureGroundTrack(trail, 90);
      segs.forEach((seg) => {
        if (seg.length < 2) return;
        const layer = L.polyline(seg, {
          color: '#bc8cff',
          weight: 1.5,
          opacity: 0.55,
          dashArray: '2 5',
          lineCap: 'round',
        }).addTo(map);
        futureLayersRef.current.push(layer);
      });
    }
  }, [iss, trail, showFootprint, showFuture]);

  // Observer marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (obsMarkerRef.current) {
      map.removeLayer(obsMarkerRef.current);
      obsMarkerRef.current = null;
    }
    if (obs) {
      const icon = L.divIcon({
        className: 'obs-icon-wrap',
        html: '<div class="obs-marker"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      obsMarkerRef.current = L.marker([obs.lat, obs.lon], { icon }).addTo(map);
    }
  }, [obs]);

  // Day/night terminator
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (termLayerRef.current) {
      map.removeLayer(termLayerRef.current);
      termLayerRef.current = null;
    }
    if (showTerminator) {
      const ring = terminatorRing(new Date());
      termLayerRef.current = L.polyline(ring, {
        color: '#d29922',
        weight: 1.5,
        opacity: 0.6,
        dashArray: '2 4',
      }).addTo(map);
    }
  }, [showTerminator, terminatorTick]);

  const focusISS = () => {
    if (!mapRef.current || !iss) return;
    mapRef.current.setView([iss.lat, iss.lon], 3, { animate: true });
  };

  return (
    <div className="map-wrap">
      <div ref={mapEl} id="map" />
      <button className="map-btn" onClick={focusISS} title="Center on ISS">
        ⊕ Center on ISS
      </button>
    </div>
  );
}
