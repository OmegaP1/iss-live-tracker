// Static reference data: crew profiles, modules, fun facts, records, etc.

export type CrewProfile = {
  name: string;
  role: string;
  agency: string;
  nation: string;
  flag: string;
  mission: string;
  daysInSpace: number | null;
  note: string;
};

export type IssModule = {
  code: string;
  name: string;
  agency: string;
  year: number;
  role: string;
};

export type FunFact = { k: string; v: string; sub: string };
export type Record_ = { k: string; v: string; sub: string };
export type Research = { cat: string; n: number; desc: string };
export type Vehicle = {
  name: string;
  op: string;
  type: 'Crew' | 'Cargo';
  cap: string;
  country: string;
};
export type VisibilityTag = { label: string; icon: string; color: string; desc: string };

export const FALLBACK_CREW: CrewProfile[] = [
  {
    name: 'Oleg Kononenko',
    role: 'Commander',
    agency: 'Roscosmos',
    nation: 'Russia',
    flag: '🇷🇺',
    mission: 'Expedition 71 / Soyuz MS-25',
    daysInSpace: 1110,
    note: 'Holds the record for cumulative time in space (5+ flights).',
  },
  {
    name: 'Nikolai Chub',
    role: 'Flight Engineer',
    agency: 'Roscosmos',
    nation: 'Russia',
    flag: '🇷🇺',
    mission: 'Expedition 71 / Soyuz MS-24',
    daysInSpace: 218,
    note: 'First spaceflight; conducted Russian segment EVAs.',
  },
  {
    name: 'Tracy Caldwell Dyson',
    role: 'Flight Engineer',
    agency: 'NASA',
    nation: 'USA',
    flag: '🇺🇸',
    mission: 'Expedition 71 / Soyuz MS-25',
    daysInSpace: 366,
    note: 'PhD chemist; third long-duration mission to ISS.',
  },
  {
    name: 'Matthew Dominick',
    role: 'Pilot',
    agency: 'NASA',
    nation: 'USA',
    flag: '🇺🇸',
    mission: 'SpaceX Crew-8',
    daysInSpace: 235,
    note: 'Naval aviator; known for stunning Earth photography.',
  },
  {
    name: 'Michael Barratt',
    role: 'Mission Specialist',
    agency: 'NASA',
    nation: 'USA',
    flag: '🇺🇸',
    mission: 'SpaceX Crew-8',
    daysInSpace: 447,
    note: 'Physician specializing in space medicine research.',
  },
  {
    name: 'Jeanette Epps',
    role: 'Mission Specialist',
    agency: 'NASA',
    nation: 'USA',
    flag: '🇺🇸',
    mission: 'SpaceX Crew-8',
    daysInSpace: 235,
    note: 'Aerospace engineer; first Black woman on long ISS stay.',
  },
  {
    name: 'Alexander Grebenkin',
    role: 'Mission Specialist',
    agency: 'Roscosmos',
    nation: 'Russia',
    flag: '🇷🇺',
    mission: 'SpaceX Crew-8',
    daysInSpace: 235,
    note: 'First flight; flew on Crew Dragon under cooperative agreement.',
  },
];

export const CREW_PROFILES: Record<string, CrewProfile> = Object.fromEntries(
  FALLBACK_CREW.map((p) => [p.name, p])
);

export const ISS_MODULES: IssModule[] = [
  { code: 'ZAR', name: 'Zarya', agency: 'Roscosmos', year: 1998, role: 'Functional Cargo Block — first module' },
  { code: 'UNI', name: 'Unity', agency: 'NASA', year: 1998, role: 'Node 1 — first US connecting module' },
  { code: 'ZVE', name: 'Zvezda', agency: 'Roscosmos', year: 2000, role: 'Service Module — life support, propulsion' },
  { code: 'DES', name: 'Destiny', agency: 'NASA', year: 2001, role: 'US Laboratory — primary research lab' },
  { code: 'QST', name: 'Quest', agency: 'NASA', year: 2001, role: 'Joint Airlock — US EVA staging' },
  { code: 'PRS', name: 'Pirs/Poisk', agency: 'Roscosmos', year: 2001, role: 'Russian docking + airlock module' },
  { code: 'HAR', name: 'Harmony', agency: 'NASA', year: 2007, role: 'Node 2 — connects intl partner labs' },
  { code: 'COL', name: 'Columbus', agency: 'ESA', year: 2008, role: 'European research laboratory' },
  { code: 'KIB', name: 'Kibo', agency: 'JAXA', year: 2008, role: 'Japanese Experiment Module — largest lab' },
  { code: 'TRQ', name: 'Tranquility', agency: 'NASA', year: 2010, role: 'Node 3 — life support, exercise' },
  { code: 'CUP', name: 'Cupola', agency: 'ESA/NASA', year: 2010, role: 'Seven-window observation dome' },
  { code: 'NAU', name: 'Nauka', agency: 'Roscosmos', year: 2021, role: 'Multipurpose Russian laboratory' },
];

export const FUN_FACTS: FunFact[] = [
  { k: 'Total cost', v: '~$150B', sub: 'Most expensive object ever built' },
  { k: 'Pressurized volume', v: '916 m³', sub: 'About a Boeing 747 cabin' },
  { k: 'Mass', v: '420,000 kg', sub: '~320 cars' },
  { k: 'Solar arrays', v: '2,500 m²', sub: 'Generates 84–120 kW' },
  { k: 'Crew capacity', v: '7', sub: 'Sleeps in private cabins' },
  { k: 'Experiments', v: '4,000+', sub: 'Run since 1998' },
  { k: 'Spacewalks', v: '270+', sub: 'Total EVAs since assembly' },
  { k: 'Visiting craft', v: '250+', sub: 'Crew + cargo dockings' },
  { k: 'Distance traveled', v: '4.7B km', sub: 'Equivalent to Neptune & back' },
  { k: 'Speed', v: '28,000 km/h', sub: 'Mach 23 — orbits in 92 min' },
  { k: 'Drinking water', v: '93%', sub: 'Recycled from sweat & urine' },
  { k: 'Daily exercise', v: '2 hours', sub: 'Combats bone & muscle loss' },
];

export const RECORDS: Record_[] = [
  { k: 'Longest single ISS stay', v: '371 days', sub: 'Frank Rubio (NASA), Sep 2022 – Sep 2023' },
  { k: 'Most cumulative time in space', v: '1,110+ days', sub: 'Oleg Kononenko — across 5 missions' },
  { k: 'Longest spacewalk', v: '8 h 56 min', sub: 'Voss & Helms, STS-102, March 2001' },
  { k: 'First crewed assembly mission', v: 'Dec 1998', sub: 'STS-88 — Unity attached to Zarya' },
  { k: 'First long-duration crew', v: 'Nov 2000', sub: 'Expedition 1 — 136 day mission' },
  { k: 'Continuous human presence', v: '25+ years', sub: 'Uninterrupted since November 2, 2000' },
  { k: 'Heaviest object ever assembled', v: '420 t', sub: 'In orbit, piece by piece across 40+ flights' },
  { k: 'Closest debris encounter', v: '< 1 km', sub: 'Multiple maneuvers performed yearly' },
];

export const RESEARCH: Research[] = [
  { cat: 'Human research', n: 88, desc: 'Bone loss, muscle atrophy, vision, immunology' },
  { cat: 'Biology / biotech', n: 76, desc: 'Cell behavior, plant growth, microbes in microgravity' },
  { cat: 'Physical sciences', n: 54, desc: 'Cold atom lab, fluids, combustion, materials' },
  { cat: 'Earth & space', n: 42, desc: 'Atmospheric monitoring, lightning, dark matter (AMS-02)' },
  { cat: 'Technology demos', n: 61, desc: 'Robotics, 3D printing, comms, life support tech' },
  { cat: 'Education', n: 19, desc: 'Student experiments, ham radio, outreach' },
];

export const VEHICLES: Vehicle[] = [
  { name: 'SpaceX Crew Dragon', op: 'SpaceX', type: 'Crew', cap: '4 crew', country: 'USA' },
  { name: 'SpaceX Cargo Dragon', op: 'SpaceX', type: 'Cargo', cap: '~6,000 kg up & down', country: 'USA' },
  { name: 'Cygnus', op: 'Northrop', type: 'Cargo', cap: '~3,800 kg up only', country: 'USA' },
  { name: 'Soyuz MS', op: 'Roscosmos', type: 'Crew', cap: '3 crew', country: 'Russia' },
  { name: 'Progress MS', op: 'Roscosmos', type: 'Cargo', cap: '~2,400 kg up only', country: 'Russia' },
  { name: 'HTV-X', op: 'JAXA', type: 'Cargo', cap: '~5,800 kg up only', country: 'Japan' },
  { name: 'Dream Chaser', op: 'Sierra', type: 'Cargo', cap: '~5,000 kg up & down (upcoming)', country: 'USA' },
];

export const DEORBIT = {
  retire: '2030',
  deorbit: 'Jan 2031 (planned)',
  vehicle: 'SpaceX USDV (US Deorbit Vehicle)',
  target: 'Point Nemo, South Pacific',
  notes:
    'NASA awarded SpaceX an $843M contract in 2024 to build the USDV that will safely de-orbit the station after retirement.',
};

export const VISIBILITY_TAGS: Record<string, VisibilityTag> = {
  daylight: { label: 'Sunlit', icon: '☀', color: '#d29922', desc: 'ISS is in direct sunlight' },
  eclipsed: { label: 'In Earth shadow', icon: '🌑', color: '#6e7681', desc: "ISS is in Earth's shadow" },
  visible: { label: 'Visible from ground', icon: '👁', color: '#3fb950', desc: 'May be visible from below' },
};
