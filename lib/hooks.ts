'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CREW_PROFILES,
  CrewProfile,
  FALLBACK_CREW,
} from './data';
import { IssFix, oceanFromLatLon } from './utils';

const ISS_URL = 'https://api.wheretheiss.at/v1/satellites/25544';
const CREW_URL = '/api/crew';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const POLL_MS = 5000;
const NOMINATIM_MIN_INTERVAL = 15000;
const TRAIL_MAX = 200;

export type Location = { name: string; sub: string; tag: 'GEO' | 'LAND' | 'OCEAN' };

export type ObserverStatus = 'idle' | 'requesting' | 'ok' | 'denied' | 'error';

// Live ISS telemetry + persistent trail
export function useISS() {
  const [iss, setIss] = useState<IssFix | null>(null);
  const [trail, setTrail] = useState<IssFix[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await fetch(ISS_URL);
        if (!res.ok) throw new Error('iss http ' + res.status);
        const data = await res.json();
        if (cancelled) return;
        const point: IssFix = {
          lat: Number(data.latitude),
          lon: Number(data.longitude),
          alt: Number(data.altitude),
          vel: Number(data.velocity),
          visibility: data.visibility,
          t: Date.now(),
        };
        setIss(point);
        setTrail((prev) => {
          const next = [...prev, point];
          if (next.length > TRAIL_MAX) next.shift();
          return next;
        });
        setLastUpdate(new Date());
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('ISS fetch failed:', err);
      } finally {
        if (!cancelled) timer = setTimeout(tick, POLL_MS);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { iss, trail, lastUpdate };
}

// Crew with API + fallback enrichment
export function useCrew() {
  const [crew, setCrew] = useState<CrewProfile[] | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const enrich = useCallback((apiList: { name: string; craft: string }[]): CrewProfile[] => {
    return apiList.map((p) => {
      const profile = CREW_PROFILES[p.name];
      return (
        profile || {
          name: p.name,
          role: 'Crew Member',
          agency: 'Unknown',
          nation: '—',
          flag: '🌐',
          mission: 'Active expedition',
          daysInSpace: null,
          note: 'No profile data — fetched from live API.',
        }
      );
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(CREW_URL);
        if (!res.ok) throw new Error('crew http ' + res.status);
        const data = await res.json();
        const iss = (data.people || []).filter(
          (p: { craft: string }) => p.craft === 'ISS'
        );
        if (!iss.length) throw new Error('no iss crew');
        if (!cancelled) {
          setCrew(enrich(iss));
          setIsFallback(false);
        }
      } catch {
        if (!cancelled) {
          setCrew(FALLBACK_CREW);
          setIsFallback(true);
        }
      }
    };

    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enrich]);

  return { crew, isFallback };
}

// Reverse geocode for current ISS position (rate-limited, ocean fallback).
export function useReverseGeocode(iss: IssFix | null): Location {
  const [location, setLocation] = useState<Location>({
    name: 'Locating…',
    sub: 'Awaiting first fix',
    tag: 'GEO',
  });
  const lastAtRef = useRef(0);
  const lastKeyRef = useRef('');

  const latKey = iss ? iss.lat.toFixed(1) : null;
  const lonKey = iss ? iss.lon.toFixed(1) : null;

  useEffect(() => {
    if (!iss) return;
    const { lat, lon } = iss;
    const now = Date.now();
    const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
    if (now - lastAtRef.current < NOMINATIM_MIN_INTERVAL) return;
    if (key === lastKeyRef.current) return;
    lastAtRef.current = now;
    lastKeyRef.current = key;

    let cancelled = false;
    const url = `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lon}&zoom=5&accept-language=en`;
    (async () => {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('nominatim ' + res.status);
        const data = await res.json();
        if (cancelled) return;
        if (data && data.error) throw new Error(data.error);
        const a = data.address || {};
        const primary = a.country || data.name || a.state || 'Land position';
        const parts = [a.state, a.region].filter(Boolean);
        const sub = parts.length ? parts.join(' · ') : 'Land position';
        setLocation({ name: primary, sub, tag: 'LAND' });
      } catch {
        if (cancelled) return;
        const o = oceanFromLatLon(lat, lon);
        setLocation({ name: o.name, sub: o.sub, tag: 'OCEAN' });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latKey, lonKey]);

  return location;
}

// Browser geolocation for "next pass / distance from you" features.
export function useObserverLocation() {
  const [obs, setObs] = useState<{ lat: number; lon: number } | null>(null);
  const [status, setStatus] = useState<ObserverStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('error');
      setError('Geolocation unavailable');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setObs({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatus('ok');
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        setError(err.message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  return { obs, status, error, request };
}

// Tick every N ms for live derived values.
export function useTicker(intervalMs = 1000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
