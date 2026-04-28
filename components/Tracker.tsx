'use client';

import dynamic from 'next/dynamic';
import { useCrew, useISS, useObserverLocation, useReverseGeocode, useTicker } from '@/lib/hooks';
import { fmt, nf, nowHHMMSS, orbitsToday } from '@/lib/utils';
import {
  ContinuousPresencePanel,
  CrewPanel,
  CuriositiesPanel,
  CycleClockPanel,
  DeorbitPanel,
  FactsPanel,
  MissionPanel,
  ModulesPanel,
  NextPassPanel,
  OrbitalMechanicsPanel,
  PositionPanel,
  RecordsPanel,
  ResearchPanel,
  TimeDilationPanel,
  VehiclesPanel,
  VisibilityPanel,
} from './panels';

const Map = dynamic(() => import('./Map'), { ssr: false });

const TRAIL_LENGTH = 200;

function Header({
  iss,
  crewCount,
  orbits,
}: {
  iss: ReturnType<typeof useISS>['iss'];
  crewCount: number | null;
  orbits: number;
}) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="live-dot" title="Live" />
        <div className="title">
          ISS Live Tracker<span className="sub">Real-time telemetry</span>
        </div>
      </div>
      <div className="stats">
        <div className="stat">
          <div className="stat-label">Speed</div>
          <div className="stat-value mono">
            {iss ? nf(iss.vel) : '–––'}
            <span className="unit">km/h</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Altitude</div>
          <div className="stat-value mono">
            {iss ? fmt(iss.alt, 1) : '–––'}
            <span className="unit">km</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Crew</div>
          <div className="stat-value mono">{crewCount !== null ? crewCount : '–'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Orbits / day</div>
          <div className="stat-value mono">
            {fmt(orbits, 2)}
            <span className="unit">today</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer({ lastUpdate }: { lastUpdate: Date | null }) {
  return (
    <footer className="app-footer">
      <div className="left">
        Data: wheretheiss.at · open-notify.org · OpenStreetMap / Nominatim · Tiles © CARTO
      </div>
      <div className="right-controls">
        <span className="last-update mono">
          LAST UPDATE <b>{lastUpdate ? nowHHMMSS() : '––:––:––'}</b>
        </span>
      </div>
    </footer>
  );
}

export default function Tracker() {
  const { iss, trail, lastUpdate } = useISS();
  const { crew, isFallback } = useCrew();
  const location = useReverseGeocode(iss);
  const { obs, status: obsStatus, request: requestObs } = useObserverLocation();
  useTicker(1000);
  const terminatorTick = useTicker(60000);

  const orbits = orbitsToday();
  const trimmedTrail = trail.slice(-TRAIL_LENGTH);

  return (
    <div className="app">
      <Header iss={iss} crewCount={crew ? crew.length : null} orbits={orbits} />
      <main className="app-main">
        <Map
          iss={iss}
          trail={trimmedTrail}
          obs={obs}
          showTerminator
          showFootprint
          showFuture={false}
          terminatorTick={terminatorTick}
        />
        <aside className="app-sidebar">
          <PositionPanel iss={iss} location={location} />
          <VisibilityPanel iss={iss} />
          <CycleClockPanel iss={iss} />
          <NextPassPanel
            iss={iss}
            trail={trail}
            obs={obs}
            obsStatus={obsStatus}
            onRequest={requestObs}
          />
          <MissionPanel iss={iss} />
          <OrbitalMechanicsPanel iss={iss} />
          <ContinuousPresencePanel />
          <CrewPanel crew={crew} isFallback={isFallback} />
          <TimeDilationPanel crew={crew} />
          <RecordsPanel />
          <ResearchPanel />
          <VehiclesPanel />
          <ModulesPanel />
          <DeorbitPanel />
          <CuriositiesPanel />
          <FactsPanel />
        </aside>
      </main>
      <Footer lastUpdate={lastUpdate} />
    </div>
  );
}
