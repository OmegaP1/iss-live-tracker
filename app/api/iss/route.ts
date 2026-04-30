import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PRIMARY = 'https://api.wheretheiss.at/v1/satellites/25544';
const FALLBACK = 'http://api.open-notify.org/iss-now.json';
const TIMEOUT_MS = 6000;

async function fetchWithTimeout(url: string, ms: number) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
  } finally {
    clearTimeout(id);
  }
}

export async function GET() {
  try {
    const res = await fetchWithTimeout(PRIMARY, TIMEOUT_MS);
    if (!res.ok) throw new Error('wheretheiss ' + res.status);
    const d = await res.json();
    return NextResponse.json(
      {
        lat: Number(d.latitude),
        lon: Number(d.longitude),
        alt: Number(d.altitude),
        vel: Number(d.velocity),
        visibility: d.visibility || 'daylight',
        source: 'wheretheiss',
        t: Date.now(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    try {
      const res = await fetchWithTimeout(FALLBACK, TIMEOUT_MS);
      if (!res.ok) throw new Error('open-notify ' + res.status);
      const d = await res.json();
      return NextResponse.json(
        {
          lat: Number(d.iss_position.latitude),
          lon: Number(d.iss_position.longitude),
          alt: 408,
          vel: 27600,
          visibility: 'daylight',
          source: 'open-notify',
          t: Date.now(),
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    } catch {
      return NextResponse.json(
        { error: 'iss data unreachable' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }
}
