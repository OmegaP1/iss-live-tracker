// Pure helpers: formatters, geo math, pass prediction

export type LatLon = { lat: number; lon: number };

export type IssFix = LatLon & {
  alt: number;
  vel: number;
  visibility: string;
  t: number;
};

export const fmt = (n: number | null | undefined, d = 2): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return '––';
  return Number(n).toFixed(d);
};

export const nf = (n: number): string => new Intl.NumberFormat('en-US').format(Math.round(n));

export const nowHHMMSS = (): string => {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
};

export const orbitsToday = (): number => {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hours = (now.getTime() - midnight.getTime()) / 3600000;
  return hours * (15.5 / 24);
};

export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const oceanFromLatLon = (lat: number, lon: number) => {
  if (lat > 66) return { name: 'Arctic Ocean', sub: 'Polar region' };
  if (lat < -60) return { name: 'Southern Ocean', sub: 'Antarctic waters' };
  if (lon >= -20 && lon <= 100 && lat >= -40 && lat <= 30)
    return { name: 'Indian Ocean', sub: 'Open water' };
  if (Math.abs(lon) > 100) return { name: 'Pacific Ocean', sub: 'Open water' };
  return { name: 'Atlantic Ocean', sub: 'Open water' };
};

// Great-circle distance in km (Haversine)
export const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Slant range from observer to ISS at given altitude (km, rough sqrt approximation)
export const slantRange = (groundKm: number, altKm: number): number =>
  Math.sqrt(groundKm * groundKm + altKm * altKm);

// Approximate solar subsolar point (lat, lon) for a given Date.
export const subsolarPoint = (date?: Date): LatLon => {
  const d = date || new Date();
  const jd = d.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const L = (280.46 + 0.9856474 * jd) % 360;
  const g = (((357.528 + 0.9856003 * jd) % 360) * Math.PI) / 180;
  const lambda = ((L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * Math.PI) / 180;
  const eps = (23.439 * Math.PI) / 180;
  const decl = (Math.asin(Math.sin(eps) * Math.sin(lambda)) * 180) / Math.PI;
  const utHours = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  let subLon = -15 * (utHours - 12) + (1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  subLon = ((subLon + 540) % 360) - 180;
  return { lat: decl, lon: subLon };
};

// Day/night terminator polyline parametrized by longitude.
export const terminatorRing = (date?: Date): [number, number][] => {
  const sub = subsolarPoint(date);
  const ring: [number, number][] = [];
  const subLatR = (sub.lat * Math.PI) / 180;
  for (let lon = -180; lon <= 180; lon += 2) {
    const dLon = ((lon - sub.lon) * Math.PI) / 180;
    const lat = (Math.atan(-Math.cos(dLon) / Math.tan(subLatR)) * 180) / Math.PI;
    ring.push([lat, lon]);
  }
  return ring;
};

// Predict next pass over an observer location.
export const predictNextPass = (
  trail: IssFix[],
  obs: LatLon | null,
  opts: { horizonKm?: number } = {}
): { etaMinutes: number; peakDistanceKm: number; passMinutes: number } | null => {
  if (!obs || !trail || trail.length < 2) return null;
  const last = trail[trail.length - 1];
  const prev = trail[trail.length - 2];
  if (!last || !prev) return null;

  const dt = (last.t - prev.t) / 1000;
  if (dt <= 0) return null;

  const dLat = (last.lat - prev.lat) / dt;
  let dLon = (last.lon - prev.lon) / dt;
  if (Math.abs(last.lon - prev.lon) > 180) {
    const adj = last.lon - prev.lon > 0 ? -360 : 360;
    dLon = (last.lon - prev.lon + adj) / dt;
  }

  const horizonKm = opts.horizonKm || 1500;
  const stepSec = 30;
  const maxSec = 90 * 60;

  let lat = last.lat;
  let lon = last.lon;
  let entered = false;
  let entryT: number | null = null;
  let exitT: number | null = null;
  let peakDist = Infinity;
  let peakT: number | null = null;

  for (let t = 0; t <= maxSec; t += stepSec) {
    const d = haversine(obs.lat, obs.lon, lat, lon);
    if (d < horizonKm) {
      if (!entered) {
        entered = true;
        entryT = t;
      }
      if (d < peakDist) {
        peakDist = d;
        peakT = t;
      }
    } else if (entered && exitT === null) {
      exitT = t;
      break;
    }
    lat += dLat * stepSec;
    lon += dLon * stepSec;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;
    lon -= 0.0042 * stepSec;
    if (lat > 51.6) lat = 51.6 - (lat - 51.6);
    if (lat < -51.6) lat = -51.6 - (lat + 51.6);
  }

  if (!entered || entryT === null || peakT === null) return null;
  return {
    etaMinutes: peakT / 60,
    peakDistanceKm: peakDist,
    passMinutes: ((exitT ?? maxSec) - entryT) / 60,
  };
};

// ISS line-of-sight horizon radius on the ground.
export const horizonRadiusKm = (altKm: number): number => {
  const R = 6371;
  return R * Math.acos(R / (R + altKm));
};

// Generate a circle of points for the footprint.
export const footprintCircle = (
  lat: number,
  lon: number,
  radiusKm: number,
  steps = 90
): [number, number][] => {
  const R = 6371;
  const latR = (lat * Math.PI) / 180;
  const lonR = (lon * Math.PI) / 180;
  const d = radiusKm / R;
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const brng = (i / steps) * 2 * Math.PI;
    const lat2 = Math.asin(
      Math.sin(latR) * Math.cos(d) + Math.cos(latR) * Math.sin(d) * Math.cos(brng)
    );
    const lon2 =
      lonR +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(latR),
        Math.cos(d) - Math.sin(latR) * Math.sin(lat2)
      );
    points.push([
      (lat2 * 180) / Math.PI,
      (((lon2 * 180) / Math.PI + 540) % 360) - 180,
    ]);
  }
  return points;
};

// Forward ground track simulation (next N minutes), antimeridian-split into segments.
export const futureGroundTrack = (trail: IssFix[], minutes = 90): [number, number][][] => {
  if (!trail || trail.length < 2) return [];
  const last = trail[trail.length - 1];
  const prev = trail[trail.length - 2];
  const dt = (last.t - prev.t) / 1000;
  if (dt <= 0) return [];
  const dLat = (last.lat - prev.lat) / dt;
  let lonDelta = last.lon - prev.lon;
  if (Math.abs(lonDelta) > 180) lonDelta += lonDelta > 0 ? -360 : 360;
  const dLon = lonDelta / dt;

  const segments: [number, number][][] = [];
  let current: [number, number][] = [];
  let lat = last.lat;
  let lon = last.lon;
  const stepSec = 30;
  const totalSec = minutes * 60;
  let prevLon = lon;
  for (let t = 0; t <= totalSec; t += stepSec) {
    if (current.length && Math.abs(lon - prevLon) > 180) {
      segments.push(current);
      current = [];
    }
    current.push([lat, lon]);
    prevLon = lon;
    lat += dLat * stepSec;
    lon += dLon * stepSec - 0.0042 * stepSec;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;
    if (lat > 51.6) lat = 51.6 - (lat - 51.6);
    if (lat < -51.6) lat = -51.6 - (lat + 51.6);
  }
  if (current.length > 1) segments.push(current);
  return segments;
};

// Approximate cycle-phase estimate from visibility flag (display only).
export const cycleEstimate = (
  visibility: string
): { phase: 'shadow' | 'sunlight'; untilFlip: string; next: string } => {
  if (visibility === 'eclipsed') return { phase: 'shadow', untilFlip: '~25 min', next: 'sunrise' };
  return { phase: 'sunlight', untilFlip: '~30 min', next: 'sunset' };
};

// Time-dilation: ~25.4 microseconds per day slower for ISS crew.
export const dilationMicros = (daysInSpace: number): number => daysInSpace * 25.4;

// Days since November 2, 2000 (continuous human presence).
export const daysSinceCrewedStart = (): number => {
  const start = new Date('2000-11-02T00:00:00Z');
  return Math.floor((Date.now() - start.getTime()) / 86400000);
};
