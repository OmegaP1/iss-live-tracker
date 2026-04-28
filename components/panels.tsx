'use client';

import { useState } from 'react';
import {
  CrewProfile,
  DEORBIT,
  FUN_FACTS,
  ISS_MODULES,
  RECORDS,
  RESEARCH,
  VEHICLES,
  VISIBILITY_TAGS,
} from '@/lib/data';
import type { Location, ObserverStatus } from '@/lib/hooks';
import {
  IssFix,
  cycleEstimate,
  daysSinceCrewedStart,
  dilationMicros,
  fmt,
  haversine,
  initials,
  nf,
  predictNextPass,
  slantRange,
} from '@/lib/utils';

function SectionHead({ title, tag }: { title: string; tag?: string }) {
  return (
    <div className="section-head">
      <div className="section-title">{title}</div>
      {tag && <div className="section-tag mono">{tag}</div>}
    </div>
  );
}

export function PositionPanel({ iss, location }: { iss: IssFix | null; location: Location }) {
  return (
    <section className="section">
      <SectionHead title="Current Position" tag={location.tag} />
      <div className="pos-name">{location.name}</div>
      <div className="pos-sub">{location.sub}</div>
      <div className="pos-coords">
        <span>
          LAT <b className="mono">{iss ? fmt(iss.lat, 3) : '––.––'}</b>
        </span>
        <span>
          LON <b className="mono">{iss ? fmt(iss.lon, 3) : '––.––'}</b>
        </span>
      </div>
    </section>
  );
}

export function MissionPanel({ iss }: { iss: IssFix | null }) {
  return (
    <section className="section">
      <SectionHead title="Mission Data" tag="25544" />
      <div className="grid-2">
        <div className="data-cell">
          <div className="lbl">Latitude</div>
          <div className="val mono">
            {iss ? fmt(iss.lat, 3) : '––.––'}
            <span className="unit">°</span>
          </div>
        </div>
        <div className="data-cell">
          <div className="lbl">Longitude</div>
          <div className="val mono">
            {iss ? fmt(iss.lon, 3) : '––.––'}
            <span className="unit">°</span>
          </div>
        </div>
        <div className="data-cell">
          <div className="lbl">Altitude</div>
          <div className="val mono">
            {iss ? fmt(iss.alt, 1) : '–––'}
            <span className="unit">km</span>
          </div>
        </div>
        <div className="data-cell">
          <div className="lbl">Orbit period</div>
          <div className="val mono">
            92<span className="unit">min</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function VisibilityPanel({ iss }: { iss: IssFix | null }) {
  if (!iss) return null;
  const tag =
    VISIBILITY_TAGS[iss.visibility] || {
      label: iss.visibility || 'Unknown',
      icon: '·',
      color: '#8b96a5',
      desc: 'Visibility unknown',
    };
  return (
    <section className="section">
      <SectionHead title="Sun Status" tag="LIVE" />
      <div className="vis-row">
        <div className="vis-icon" style={{ color: tag.color }}>
          {tag.icon}
        </div>
        <div className="vis-text">
          <div className="vis-label" style={{ color: tag.color }}>
            {tag.label}
          </div>
          <div className="vis-desc">{tag.desc}</div>
        </div>
      </div>
    </section>
  );
}

function CrewMember({
  p,
  palette,
  expanded,
  onToggle,
}: {
  p: CrewProfile;
  palette: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`crew-card ${expanded ? 'open' : ''}`} onClick={onToggle}>
      <div className="crew-row">
        <div className="avatar" style={{ background: palette }}>
          {initials(p.name)}
        </div>
        <div className="crew-info">
          <div className="crew-name">
            {p.name} <span className="flag">{p.flag}</span>
          </div>
          <div className="crew-craft">
            {p.role} · {p.agency}
          </div>
        </div>
        <div className="chev">{expanded ? '–' : '+'}</div>
      </div>
      {expanded && (
        <div className="crew-detail">
          <div className="crew-meta">
            <div>
              <span className="k">Mission</span>
              <span className="v">{p.mission}</span>
            </div>
            <div>
              <span className="k">Nation</span>
              <span className="v">{p.nation}</span>
            </div>
            {p.daysInSpace !== null && (
              <div>
                <span className="k">Days in space</span>
                <span className="v mono">{p.daysInSpace}</span>
              </div>
            )}
          </div>
          <div className="crew-note">{p.note}</div>
        </div>
      )}
    </div>
  );
}

export function CrewPanel({
  crew,
  isFallback,
}: {
  crew: CrewProfile[] | null;
  isFallback: boolean;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const palettes = [
    'linear-gradient(135deg,#1f6feb,#6e40c9)',
    'linear-gradient(135deg,#3fb950,#1f6feb)',
    'linear-gradient(135deg,#d29922,#e85d75)',
    'linear-gradient(135deg,#bc8cff,#1f6feb)',
    'linear-gradient(135deg,#39c5cf,#3fb950)',
    'linear-gradient(135deg,#e85d75,#bc8cff)',
    'linear-gradient(135deg,#d29922,#3fb950)',
  ];

  return (
    <section className="section">
      <SectionHead
        title="Crew on Board"
        tag={crew ? String(crew.length).padStart(2, '0') : '––'}
      />
      <div className="crew-list">
        {!crew && (
          <div className="crew-row">
            <div className="avatar">··</div>
            <div className="crew-info">
              <div className="crew-name skeleton">loading crew</div>
            </div>
          </div>
        )}
        {crew &&
          crew.map((p, i) => (
            <CrewMember
              key={p.name}
              p={p}
              palette={palettes[i % palettes.length]}
              expanded={expandedIdx === i}
              onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
            />
          ))}
      </div>
      {isFallback && (
        <div className="crew-fallback-note">
          // using cached roster — live API unreachable
        </div>
      )}
    </section>
  );
}

export function NextPassPanel({
  iss,
  trail,
  obs,
  obsStatus,
  onRequest,
}: {
  iss: IssFix | null;
  trail: IssFix[];
  obs: { lat: number; lon: number } | null;
  obsStatus: ObserverStatus;
  onRequest: () => void;
}) {
  if (obsStatus !== 'ok' || !obs) {
    return (
      <section className="section">
        <SectionHead title="Pass Over You" tag="GEO" />
        <div className="pass-empty">
          <div className="pass-empty-text">
            {obsStatus === 'denied' && 'Location denied — enable in browser to predict passes.'}
            {obsStatus === 'error' && 'Location unavailable on this device.'}
            {(obsStatus === 'idle' || obsStatus === 'requesting') &&
              'Share your location to predict the next ISS overhead pass and live distance.'}
          </div>
          {(obsStatus === 'idle' || obsStatus === 'requesting') && (
            <button
              className="btn"
              onClick={onRequest}
              disabled={obsStatus === 'requesting'}
            >
              {obsStatus === 'requesting' ? 'Locating…' : 'Use my location'}
            </button>
          )}
        </div>
      </section>
    );
  }

  const ground = iss ? haversine(obs.lat, obs.lon, iss.lat, iss.lon) : null;
  const slant = iss && ground !== null ? slantRange(ground, iss.alt) : null;
  const pass = predictNextPass(trail, obs);

  return (
    <section className="section">
      <SectionHead title="Pass Over You" tag="GEO" />
      <div className="grid-2">
        <div className="data-cell">
          <div className="lbl">Ground distance</div>
          <div className="val mono">
            {ground !== null ? nf(ground) : '––'}
            <span className="unit">km</span>
          </div>
        </div>
        <div className="data-cell">
          <div className="lbl">Slant range</div>
          <div className="val mono">
            {slant !== null ? nf(slant) : '––'}
            <span className="unit">km</span>
          </div>
        </div>
      </div>
      <div className="pass-block">
        {pass ? (
          <>
            <div className="pass-eta">
              <div className="pass-eta-num mono">{fmt(pass.etaMinutes, 0)}</div>
              <div className="pass-eta-lbl">min until closest approach</div>
            </div>
            <div className="pass-meta">
              <span>
                peak <b className="mono">{nf(pass.peakDistanceKm)} km</b>
              </span>
              <span>
                duration <b className="mono">~{fmt(pass.passMinutes, 0)} min</b>
              </span>
            </div>
          </>
        ) : (
          <div className="pass-meta-empty">No pass within next 90 minutes.</div>
        )}
      </div>
      <div className="obs-coords mono">
        OBSERVER {fmt(obs.lat, 3)}°, {fmt(obs.lon, 3)}°
      </div>
    </section>
  );
}

export function ModulesPanel() {
  const [expanded, setExpanded] = useState(false);
  const list = expanded ? ISS_MODULES : ISS_MODULES.slice(0, 5);
  return (
    <section className="section">
      <SectionHead title="Station Modules" tag={String(ISS_MODULES.length)} />
      <div className="modules">
        {list.map((m) => (
          <div className="module-row" key={m.code}>
            <div className="module-code mono">{m.code}</div>
            <div className="module-info">
              <div className="module-name">
                {m.name} <span className="module-year mono">{m.year}</span>
              </div>
              <div className="module-role">{m.role}</div>
              <div className="module-agency">{m.agency}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="link-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? '– show fewer' : `+ ${ISS_MODULES.length - 5} more modules`}
      </button>
    </section>
  );
}

export function CuriositiesPanel() {
  return (
    <section className="section">
      <SectionHead title="Curiosities" tag="REF" />
      <div className="curio-grid">
        {FUN_FACTS.map((f) => (
          <div className="curio" key={f.k}>
            <div className="curio-v mono">{f.v}</div>
            <div className="curio-k">{f.k}</div>
            <div className="curio-sub">{f.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FactsPanel() {
  const facts: [string, string][] = [
    ['Speed', '7.66 km/s'],
    ['Altitude', '~408 km'],
    ['Orbit time', '~92 min'],
    ['Orbits / day', '~15.5'],
    ['Sunrises / day', '16'],
    ['Operational since', 'Nov 1998'],
    ['Length', '109 m'],
  ];
  return (
    <section className="section">
      <SectionHead title="Quick Facts" tag="REF" />
      <div className="facts">
        {facts.map(([k, v]) => (
          <div className="fact" key={k}>
            <span className="fact-key">{k}</span>
            <span className="fact-val mono">{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function OrbitalMechanicsPanel({ iss }: { iss: IssFix | null }) {
  const periodSec = iss
    ? Math.round(2 * Math.PI * Math.sqrt(Math.pow(6371 + iss.alt, 3) / 398600.4418))
    : null;
  const periodMin = periodSec ? (periodSec / 60).toFixed(2) : '92.00';
  return (
    <section className="section">
      <SectionHead title="Orbital Mechanics" tag="ORB" />
      <div className="grid-2">
        <div className="data-cell">
          <div className="lbl">Inclination</div>
          <div className="val mono">
            51.6<span className="unit">°</span>
          </div>
        </div>
        <div className="data-cell">
          <div className="lbl">Period (live)</div>
          <div className="val mono">
            {periodMin}
            <span className="unit">min</span>
          </div>
        </div>
        <div className="data-cell">
          <div className="lbl">Δv to orbit</div>
          <div className="val mono">
            9.4<span className="unit">km/s</span>
          </div>
        </div>
        <div className="data-cell">
          <div className="lbl">Decay rate</div>
          <div className="val mono">
            ~2<span className="unit">km/mo</span>
          </div>
        </div>
      </div>
      <div className="orb-note">
        Decays from atmospheric drag — periodic reboosts from Progress / Cygnus thrusters maintain
        altitude.
      </div>
    </section>
  );
}

export function CycleClockPanel({ iss }: { iss: IssFix | null }) {
  if (!iss) return null;
  const cyc = cycleEstimate(iss.visibility);
  return (
    <section className="section">
      <SectionHead title="Day/Night Cycle" tag="92m" />
      <div className="cycle-row">
        <div className="cycle-phase">
          <div className={`cycle-dot ${cyc.phase}`}></div>
          <div className="cycle-text">
            <div className="cycle-now">
              Currently in {cyc.phase === 'shadow' ? "Earth's shadow" : 'sunlight'}
            </div>
            <div className="cycle-next">
              Next {cyc.next} {cyc.untilFlip}
            </div>
          </div>
        </div>
      </div>
      <div className="cycle-fact">
        Crew see <b>16 sunrises and 16 sunsets</b> every 24 hours — a new dawn every ~92 minutes.
      </div>
    </section>
  );
}

export function TimeDilationPanel({ crew }: { crew: CrewProfile[] | null }) {
  if (!crew) return null;
  const totalDays = crew.reduce((s, p) => s + (p.daysInSpace || 0), 0);
  const micros = dilationMicros(totalDays);
  return (
    <section className="section">
      <SectionHead title="Relativistic Aging" tag="Δt" />
      <div className="dilation">
        <div className="dilation-num mono">
          {micros.toFixed(1)}
          <span className="unit"> µs</span>
        </div>
        <div className="dilation-lbl">slower than ground time</div>
      </div>
      <div className="dilation-desc">
        Combined across the current crew&apos;s <b className="mono">{totalDays}</b> total days in
        space. ISS clocks tick ~25 µs/day slower than Earth&apos;s surface — special relativity
        (orbital speed) outweighs the general-relativity boost from being higher in Earth&apos;s
        gravity well.
      </div>
    </section>
  );
}

export function ContinuousPresencePanel() {
  const days = daysSinceCrewedStart();
  const years = (days / 365.25).toFixed(2);
  return (
    <section className="section">
      <SectionHead title="Continuous Human Presence" tag="LIVE" />
      <div className="presence">
        <div className="presence-num mono">{days.toLocaleString()}</div>
        <div className="presence-lbl">days uninterrupted</div>
      </div>
      <div className="presence-sub">
        Since <b>November 2, 2000</b> — <b className="mono">{years}</b> years. Humans have
        continuously lived off-planet ever since Expedition 1 docked.
      </div>
    </section>
  );
}

export function RecordsPanel() {
  const [idx, setIdx] = useState(0);
  const r = RECORDS[idx];
  return (
    <section className="section">
      <SectionHead title="Records & Milestones" tag={`${idx + 1}/${RECORDS.length}`} />
      <div className="record">
        <div className="record-v mono">{r.v}</div>
        <div className="record-k">{r.k}</div>
        <div className="record-sub">{r.sub}</div>
      </div>
      <div className="record-nav">
        <button
          className="link-btn"
          onClick={() => setIdx((idx - 1 + RECORDS.length) % RECORDS.length)}
        >
          ← prev
        </button>
        <button className="link-btn" onClick={() => setIdx((idx + 1) % RECORDS.length)}>
          next →
        </button>
      </div>
    </section>
  );
}

export function ResearchPanel() {
  const total = RESEARCH.reduce((s, r) => s + r.n, 0);
  return (
    <section className="section">
      <SectionHead title="Active Research" tag={String(total)} />
      <div className="research">
        {RESEARCH.map((r) => (
          <div className="research-row" key={r.cat}>
            <div className="research-bar">
              <div className="research-fill" style={{ width: `${(r.n / 88) * 100}%` }}></div>
            </div>
            <div className="research-text">
              <div className="research-head">
                <span className="research-cat">{r.cat}</span>
                <span className="research-n mono">{r.n}</span>
              </div>
              <div className="research-desc">{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VehiclesPanel() {
  return (
    <section className="section">
      <SectionHead title="Visiting Vehicles" tag={String(VEHICLES.length)} />
      <div className="vehicles">
        {VEHICLES.map((v) => (
          <div className="vehicle-row" key={v.name}>
            <div className={`vehicle-tag ${v.type === 'Crew' ? 'crew' : 'cargo'}`}>
              {v.type === 'Crew' ? '👥' : '📦'}
            </div>
            <div className="vehicle-info">
              <div className="vehicle-name">{v.name}</div>
              <div className="vehicle-meta">
                {v.op} · {v.country} · {v.cap}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DeorbitPanel() {
  const target = new Date('2031-01-01T00:00:00Z');
  const daysLeft = Math.floor((target.getTime() - Date.now()) / 86400000);
  return (
    <section className="section">
      <SectionHead title="End of Mission" tag="2031" />
      <div className="deorbit">
        <div className="deorbit-num mono">{daysLeft.toLocaleString()}</div>
        <div className="deorbit-lbl">days until planned deorbit</div>
      </div>
      <div className="deorbit-meta">
        <div>
          <span className="k">Retire</span>
          <span className="v">{DEORBIT.retire}</span>
        </div>
        <div>
          <span className="k">Deorbit</span>
          <span className="v">{DEORBIT.deorbit}</span>
        </div>
        <div>
          <span className="k">Vehicle</span>
          <span className="v">{DEORBIT.vehicle}</span>
        </div>
        <div>
          <span className="k">Splashdown</span>
          <span className="v">{DEORBIT.target}</span>
        </div>
      </div>
      <div className="deorbit-note">{DEORBIT.notes}</div>
    </section>
  );
}
