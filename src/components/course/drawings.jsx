import React from 'react';

// Simple teaching drawings for course lessons (content/course/pictures.json,
// kind "drawing"). Inline SVG in the app's own colors (tokens via Tailwind
// classes, never hex), no image files. Labels are short English words and
// numbers, like the test itself; the caption under each drawing says what it
// shows and goes through translation with the lesson.

const Box = ({ x, y, w, h, className = 'fill-white stroke-line', r = 10 }) => (
  <rect x={x} y={y} width={w} height={h} rx={r} className={className} strokeWidth="2" />
);
const T = ({ x, y, children, className = 'fill-navy', size = 14, weight = 600, anchor = 'middle' }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} className={className}>{children}</text>
);

function Frame({ viewBox, title, children }) {
  return (
    <svg viewBox={viewBox} role="img" aria-label={title} className="w-full h-auto font-sans" focusable="false">
      <title>{title}</title>
      {children}
    </svg>
  );
}

// A drawing can light up one part (`focus`, used by the story player): the
// other parts fade.
const dim = (focus, key) => (focus && focus !== key ? { opacity: 0.3 } : undefined);

// The three branches and what each one does.
function ThreeBranches({ focus } = {}) {
  const cols = [
    { x: 10, key: 'legislative', name: 'Legislative', who: 'Congress', what: 'makes laws' },
    { x: 125, key: 'executive', name: 'Executive', who: 'President', what: 'carries out laws' },
    { x: 240, key: 'judicial', name: 'Judicial', who: 'Courts', what: 'explain laws' },
  ];
  return (
    <Frame viewBox="0 0 350 190" title="The three branches of government: legislative (Congress makes laws), executive (the President carries out laws), judicial (the courts explain laws)">
      <Box x={10} y={8} w={330} h={36} className="fill-navy stroke-navy" />
      <T x={175} y={31} className="fill-white">Federal government</T>
      {cols.map((c) => (
        <g key={c.name} style={dim(focus, c.key)}>
          <line x1={c.x + 50} y1={44} x2={c.x + 50} y2={62} className="stroke-mid" strokeWidth="3" />
          <Box x={c.x} y={62} w={100} h={118} className="fill-white stroke-denim" />
          <T x={c.x + 50} y={86} className="fill-denim" size={13}>{c.name}</T>
          <T x={c.x + 50} y={118} size={16} weight={700}>{c.who}</T>
          <T x={c.x + 50} y={150} className="fill-muted" size={12} weight={400}>{c.what}</T>
        </g>
      ))}
    </Frame>
  );
}

// Term lengths on one scale: representative 2, President 4, senator 6.
function TermLengths({ focus } = {}) {
  const rows = [
    { key: 'representative', who: 'Representative', years: 2 },
    { key: 'president', who: 'President', years: 4 },
    { key: 'senator', who: 'Senator', years: 6 },
  ];
  const unit = 27; // px per year
  return (
    <Frame viewBox="0 0 350 160" title="Terms: a representative serves 2 years, the President 4 years, a senator 6 years">
      {rows.map((r, i) => (
        <g key={r.who} transform={`translate(0 ${12 + i * 46})`} style={dim(focus, r.key)}>
          <T x={0} y={14} anchor="start" size={13}>{r.who}</T>
          {Array.from({ length: 6 }).map((_, k) => (
            <rect key={k} x={112 + k * unit} y={0} width={unit - 4} height={22} rx={5} className={k < r.years ? 'fill-denim' : 'fill-tint'} />
          ))}
          <T x={112 + 6 * unit + 8} y={16} anchor="start" size={13} weight={700}>{r.years} years</T>
        </g>
      ))}
    </Frame>
  );
}

// The two parts of Congress and their numbers.
function CongressNumbers({ focus } = {}) {
  const dots = (n, cols, x0, y0, size, gap, cls) => Array.from({ length: n }).map((_, i) => (
    <circle key={i} cx={x0 + (i % cols) * gap} cy={y0 + Math.floor(i / cols) * gap} r={size} className={cls} />
  ));
  return (
    <Frame viewBox="0 0 350 210" title="Congress: the Senate has 100 senators, 2 from every state; the House of Representatives has 435 voting members, more for states with more people">
      <g style={dim(focus, 'senate')}>
      <Box x={4} y={4} w={140} h={200} />
      <T x={74} y={28}>Senate</T>
      <T x={74} y={52} size={22} weight={800}>100</T>
      {dots(100, 10, 26, 72, 4, 10.5, 'fill-denim')}
      <T x={74} y={196} className="fill-muted" size={11} weight={400}>2 from every state</T>
      </g>
      <g style={dim(focus, 'house')}>
      <Box x={154} y={4} w={192} h={200} />
      <T x={250} y={28}>House</T>
      <T x={250} y={52} size={22} weight={800}>435</T>
      {dots(435, 29, 166, 68, 2.2, 5.8, 'fill-stop-read-write')}
      <T x={250} y={196} className="fill-muted" size={11} weight={400}>more for states with more people</T>
      </g>
    </Frame>
  );
}

// 538 electors, 270 to win.
function ElectoralCollege() {
  const w = 320;
  const win = (270 / 538) * w;
  return (
    <Frame viewBox="0 0 350 120" title="The Electoral College: 538 electors in all; a candidate needs 270 electoral votes to win">
      <T x={15} y={22} anchor="start" size={13}>538 electors in all</T>
      <rect x={15} y={36} width={w} height={26} rx={8} className="fill-tint" />
      <rect x={15} y={36} width={win} height={26} rx={8} className="fill-denim" />
      <line x1={15 + win} y1={28} x2={15 + win} y2={72} className="stroke-navy" strokeWidth="3" />
      <T x={15 + win} y={92} size={14} weight={800}>270 to win</T>
      <T x={15 + win} y={110} className="fill-muted" size={11} weight={400}>more than half</T>
    </Frame>
  );
}

// Nine seats on the Supreme Court.
function SupremeCourt() {
  return (
    <Frame viewBox="0 0 350 120" title="The Supreme Court has nine justices: the Chief Justice and eight associate justices">
      {Array.from({ length: 9 }).map((_, i) => {
        const chief = i === 4;
        return (
          <g key={i} transform={`translate(${23 + i * 38} 20)`}>
            <circle cx="0" cy="12" r="10" className={chief ? 'fill-navy' : 'fill-denim'} />
            <rect x="-14" y="26" width="28" height="30" rx="10" className={chief ? 'fill-navy' : 'fill-denim'} />
          </g>
        );
      })}
      <T x={175} y={98} size={13}>9 justices: the Chief Justice (center) and 8 others</T>
    </Frame>
  );
}

// A tile map of the states: one square per state (and D.C.), in roughly the
// right place. Shared by the electors map and the Civil War map.
export const STATE_TILES = {
  AK: [0, 0], ME: [10, 0],
  VT: [9, 1], NH: [10, 1],
  WA: [0, 2], ID: [1, 2], MT: [2, 2], ND: [3, 2], MN: [4, 2], IL: [5, 2], WI: [6, 2], MI: [7, 2], NY: [8, 2], RI: [9, 2], MA: [10, 2],
  OR: [0, 3], NV: [1, 3], WY: [2, 3], SD: [3, 3], IA: [4, 3], IN: [5, 3], OH: [6, 3], PA: [7, 3], NJ: [8, 3], CT: [9, 3],
  CA: [0, 4], UT: [1, 4], CO: [2, 4], NE: [3, 4], MO: [4, 4], KY: [5, 4], WV: [6, 4], VA: [7, 4], MD: [8, 4], DE: [9, 4],
  AZ: [1, 5], NM: [2, 5], KS: [3, 5], AR: [4, 5], TN: [5, 5], NC: [6, 5], SC: [7, 5], DC: [8, 5],
  OK: [3, 6], LA: [4, 6], MS: [5, 6], AL: [6, 6], GA: [7, 6],
  HI: [0, 7], TX: [3, 7], FL: [8, 7],
};
const TILE = 30;
const STEP = 32;
const tileAt = (code, x0 = 0, y0 = 0) => [x0 + STATE_TILES[code][0] * STEP, y0 + STATE_TILES[code][1] * STEP];

// Electoral votes per state (from the 2020 census; they change only after a
// new census). The test checks that they add up to 538.
export const ELECTORS = {
  AL: 9, AK: 3, AZ: 11, AR: 6, CA: 54, CO: 10, CT: 7, DE: 3, DC: 3, FL: 30, GA: 16, HI: 4, ID: 4, IL: 19, IN: 11, IA: 6, KS: 6,
  KY: 8, LA: 8, ME: 4, MD: 10, MA: 11, MI: 15, MN: 10, MS: 6, MO: 10, MT: 4, NE: 5, NV: 6, NH: 4, NJ: 14, NM: 5, NY: 28, NC: 16,
  ND: 3, OH: 17, OK: 7, OR: 8, PA: 19, RI: 4, SC: 9, SD: 3, TN: 11, TX: 40, UT: 6, VT: 3, VA: 13, WA: 12, WV: 4, WI: 10, WY: 3,
};

function Tile({ code, x0, y0, fill, text = 'fill-white', sub }) {
  const [x, y] = tileAt(code, x0, y0);
  return (
    <g>
      <rect x={x} y={y} width={TILE} height={TILE} rx={5} className={fill} strokeWidth="1.5" />
      <T x={x + TILE / 2} y={y + (sub == null ? 19 : 13)} size={12} weight={700} className={text}>{code}</T>
      {sub != null && <T x={x + TILE / 2} y={y + 26} size={12} weight={500} className={text}>{sub}</T>}
    </g>
  );
}

// Each state's electors on a tile map, then how the vote works.
function ElectorsMap() {
  const x0 = 2;
  const y0 = 2;
  const steps = [['You vote'], ['Your state’s', 'electors vote'], ['270 of 538', 'wins']];
  return (
    <Frame viewBox="0 0 354 330" title="A map of the states with each state's number of electors. California has 54, Texas 40, Florida 30, New York 28; the smallest states and Washington, D.C. have 3. You vote, your state's electors vote, and 270 of 538 electoral votes wins.">
      {Object.keys(STATE_TILES).map((c) => (
        <Tile key={c} code={c} x0={x0} y0={y0} sub={ELECTORS[c]} fill={ELECTORS[c] >= 15 ? 'fill-navy stroke-navy' : 'fill-denim stroke-denim'} />
      ))}
      <T x={x0 + 4 * STEP + 4} y={y0 + 7 * STEP + 13} anchor="start" size={12} weight={400} className="fill-muted">Number = the</T>
      <T x={x0 + 4 * STEP + 4} y={y0 + 7 * STEP + 27} anchor="start" size={12} weight={400} className="fill-muted">state’s electors</T>
      {steps.map((lines, i) => (
        <g key={lines.join(' ')} transform={`translate(${2 + i * 118} 274)`}>
          <Box x={0} y={0} w={108} h={50} className={i === 2 ? 'fill-navy stroke-navy' : 'fill-white stroke-denim'} />
          {lines.map((line, k) => (
            <T key={line} x={54} y={lines.length === 1 ? 30 : 22 + k * 16} size={12} weight={700} className={i === 2 ? 'fill-white' : 'fill-navy'}>{line}</T>
          ))}
          {i < 2 && <path d="M110 25 l8 0" className="stroke-mid" strokeWidth="3" />}
        </g>
      ))}
    </Frame>
  );
}

// The Union, the Confederacy and the border states in 1861. Union blue and
// Confederate red, as Civil War maps are usually drawn: the one place red
// fills a drawing (the owner's choice; `red-text` so white labels can be read).
const CONFEDERACY = ['SC', 'MS', 'FL', 'AL', 'GA', 'LA', 'TX', 'VA', 'AR', 'NC', 'TN'];
const BORDER = ['DE', 'MD', 'KY', 'MO', 'WV'];
const UNION = ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'KS', 'CA', 'OR', 'DC'];
export const CIVIL_WAR_SIDES = { union: UNION, confederacy: CONFEDERACY, border: BORDER };

function CivilWarMap() {
  const x0 = 2;
  const y0 = 2;
  const style = (c) => {
    if (UNION.includes(c)) return { fill: 'fill-denim stroke-denim' };
    if (CONFEDERACY.includes(c)) return { fill: 'fill-red-text stroke-red-text' };
    if (BORDER.includes(c)) return { fill: 'fill-tint stroke-denim', text: 'fill-navy' };
    return { fill: 'fill-white stroke-line', text: 'fill-muted' };
  };
  const [sx, sy] = tileAt('SC', x0, y0);
  const legend = [
    ['fill-denim stroke-denim', 'The Union (North)'],
    ['fill-red-text stroke-red-text', 'The Confederacy (South)'],
    ['fill-tint stroke-denim', 'Border states: slavery, but stayed'],
    ['fill-white stroke-line', 'Not states yet'],
  ];
  return (
    <Frame viewBox="0 0 354 360" title="A map of the states during the Civil War. The Union in the North; the Confederacy in the South: South Carolina, Mississippi, Florida, Alabama, Georgia, Louisiana, Texas, Virginia, Arkansas, North Carolina and Tennessee; border states with slavery that stayed in the Union: Delaware, Maryland, Kentucky, Missouri and West Virginia. The war began at Fort Sumter, South Carolina.">
      {Object.keys(STATE_TILES).map((c) => {
        const st = style(c);
        return <Tile key={c} code={c} x0={x0} y0={y0} fill={st.fill} text={st.text} />;
      })}
      <circle cx={sx + TILE - 4} cy={sy + TILE - 4} r={7} className="fill-white stroke-navy" strokeWidth="3" />
      <path d={`M${sx + TILE + 2} ${sy + TILE + 2} L${sx + STEP + 6} ${sy + STEP + 8}`} className="stroke-navy" strokeWidth="2" />
      <T x={sx + STEP + 8} y={sy + STEP + 20} anchor="start" size={12} weight={700}>Fort Sumter</T>
      {legend.map(([cls, label], i) => (
        <g key={label} transform={`translate(${4} ${276 + i * 20})`}>
          <rect x={0} y={0} width={16} height={16} rx={4} className={cls} strokeWidth="1.5" />
          <T x={24} y={13} anchor="start" size={12} weight={500}>{label}</T>
        </g>
      ))}
    </Frame>
  );
}

// The five wars of the 1900s on one timeline.
export const WARS_1900S = [
  { name: 'World War I', from: 1917, to: 1918, label: '1917–1918' },
  { name: 'World War II', from: 1941, to: 1945, label: '1941–1945' },
  { name: 'Korean War', from: 1950, to: 1953, label: '1950–1953' },
  { name: 'Vietnam War', from: 1965, to: 1973, label: '1960s–1973' },
  { name: 'Persian Gulf War', from: 1991, to: 1991, label: '1991' },
];

function WarsTimeline() {
  const left = 18;
  const width = 316;
  const x = (year) => left + ((year - 1900) / 100) * width;
  return (
    <Frame viewBox="0 0 350 250" title="A timeline of the 1900s with five wars: World War I 1917 to 1918, World War II 1941 to 1945, the Korean War 1950 to 1953, the Vietnam War in the 1960s to 1973, and the Persian Gulf War in 1991">
      {WARS_1900S.map((w, i) => {
        const y = 14 + i * 38;
        const x1 = x(w.from);
        const barW = Math.max(6, x(w.to + 1) - x1);
        const right = x1 > 220;
        return (
          <g key={w.name}>
            <rect x={x1} y={y + 18} width={barW} height={12} rx={4} className="fill-denim" />
            <line x1={x1} y1={y + 30} x2={x1} y2={214} className="stroke-mid" strokeWidth="1" strokeDasharray="3 3" />
            <T x={right ? x1 + barW : x1} y={y + 12} anchor={right ? 'end' : 'start'} size={12} weight={700}>{w.name}</T>
            <T x={right ? x1 - 6 : x1 + barW + 6} y={y + 28} anchor={right ? 'end' : 'start'} size={12} weight={400} className="fill-muted">{w.label}</T>
          </g>
        );
      })}
      <line x1={left} y1={214} x2={left + width} y2={214} className="stroke-navy" strokeWidth="3" />
      {[1900, 1925, 1950, 1975, 2000].map((yr) => (
        <g key={yr}>
          <line x1={x(yr)} y1={208} x2={x(yr)} y2={220} className="stroke-navy" strokeWidth="2" />
          <T x={x(yr)} y={238} size={12} weight={600}>{yr}</T>
        </g>
      ))}
    </Frame>
  );
}

// The Cold War: two rivals with two systems, 1947 to 1991.
function ColdWar() {
  const sides = [
    { x: 4, name: 'United States', system: 'Democracy', a: 'People own farms,', b: 'factories and stores.', c: 'People choose.', cls: 'fill-white stroke-denim' },
    { x: 182, name: 'Soviet Union', system: 'Communism', a: 'The government owns', b: 'farms, factories, stores.', c: 'The government decides.', cls: 'fill-white stroke-navy' },
  ];
  return (
    <Frame viewBox="0 0 350 250" title="The Cold War, about 1947 to 1991. The United States: democracy, people own farms, factories and stores, and people choose. The Soviet Union: communism, the government owns farms, factories and stores, and the government decides. They competed with weapons, money and ideas, but never fought each other directly in a big war.">
      {sides.map((s) => (
        <g key={s.name}>
          <Box x={s.x} y={4} w={164} h={140} className={s.cls} />
          <T x={s.x + 82} y={30} size={15} weight={700}>{s.name}</T>
          <rect x={s.x + 30} y={42} width={104} height={24} rx={12} className={s.name === 'United States' ? 'fill-denim' : 'fill-navy'} />
          <T x={s.x + 82} y={59} size={12} weight={700} className="fill-white">{s.system}</T>
          <T x={s.x + 82} y={88} size={12} weight={400} className="fill-muted">{s.a}</T>
          <T x={s.x + 82} y={104} size={12} weight={400} className="fill-muted">{s.b}</T>
          <T x={s.x + 82} y={128} size={12} weight={700}>{s.c}</T>
        </g>
      ))}
      <T x={175} y={164} size={12} weight={600}>Rivals: weapons, money and ideas.</T>
      <T x={175} y={180} size={12} weight={400} className="fill-muted">No big war between them.</T>
      <line x1={20} y1={210} x2={330} y2={210} className="stroke-navy" strokeWidth="3" />
      <rect x={60} y={202} width={230} height={16} rx={6} className="fill-denim" />
      <T x={175} y={196} size={12} weight={700}>The Cold War</T>
      <T x={60} y={236} size={12} weight={600}>1947</T>
      <T x={290} y={236} size={12} weight={600}>1991</T>
    </Frame>
  );
}

// How a law is made: Congress writes a bill, the President signs it, it
// becomes a law.
function BillToLaw({ focus } = {}) {
  const steps = [
    { key: 'congress', x: 4, who: 'Congress', what: 'writes a bill' },
    { key: 'president', x: 124, who: 'President', what: 'signs it' },
    { key: 'law', x: 244, who: 'Law', what: 'for everyone' },
  ];
  return (
    <Frame viewBox="0 0 350 120" title="How a law is made: Congress writes a bill, the President signs it, and it becomes a law for the whole country">
      {steps.map((s, i) => (
        <g key={s.key} style={dim(focus, s.key)}>
          <Box x={s.x} y={14} w={102} h={92} className={s.key === 'law' ? 'fill-navy stroke-navy' : 'fill-white stroke-denim'} />
          <T x={s.x + 51} y={52} size={15} weight={700} className={s.key === 'law' ? 'fill-white' : 'fill-navy'}>{s.who}</T>
          <T x={s.x + 51} y={76} size={12} weight={400} className={s.key === 'law' ? 'fill-white' : 'fill-muted'}>{s.what}</T>
          {i < 2 && <path d={`M${s.x + 106} 60 l12 0 m-5 -5 l5 5 l-5 5`} className="stroke-mid" strokeWidth="3" fill="none" />}
        </g>
      ))}
    </Frame>
  );
}

// A small state and a big state: the same 2 senators, more representatives
// for the state with more people.
function SeatsByPopulation({ focus } = {}) {
  const states = [
    { x: 4, name: 'A small state', people: 2, reps: 1 },
    { x: 180, name: 'A big state', people: 8, reps: 6 },
  ];
  const person = (cx, cy, k, cls) => (
    <g key={k}>
      <circle cx={cx} cy={cy} r={5} className={cls} />
      <rect x={cx - 6} y={cy + 6} width={12} height={10} rx={4} className={cls} />
    </g>
  );
  return (
    <Frame viewBox="0 0 350 230" title="A small state and a big state both have 2 senators. The big state, with more people, has more representatives in the House.">
      {states.map((s) => (
        <g key={s.name}>
          <Box x={s.x} y={4} w={166} h={222} />
          <T x={s.x + 83} y={26} size={14} weight={700}>{s.name}</T>
          <T x={s.x + 83} y={46} size={12} weight={400} className="fill-muted">{s.people === 2 ? 'fewer people' : 'more people'}</T>
          <g style={dim(focus, 'senators')}>
            <T x={s.x + 83} y={76} size={12}>Senators: 2</T>
            {[0, 1].map((k) => person(s.x + 70 + k * 26, 90, k, 'fill-denim'))}
          </g>
          <g style={dim(focus, 'house')}>
            <T x={s.x + 83} y={142} size={12}>Representatives: {s.reps}</T>
            {Array.from({ length: s.reps }).map((_, k) => person(s.x + 83 + ((k % 6) - (Math.min(s.reps, 6) - 1) / 2) * 22, 158, k, 'fill-stop-read-write'))}
          </g>
        </g>
      ))}
    </Frame>
  );
}

export const DRAWINGS = {
  threeBranches: ThreeBranches,
  termLengths: TermLengths,
  congressNumbers: CongressNumbers,
  electoralCollege: ElectoralCollege,
  supremeCourt: SupremeCourt,
  electorsMap: ElectorsMap,
  civilWarMap: CivilWarMap,
  warsTimeline: WarsTimeline,
  coldWar: ColdWar,
  billToLaw: BillToLaw,
  seatsByPopulation: SeatsByPopulation,
};

// The parts each drawing can light up (story scenes' `focus`).
export const DRAWING_FOCUS = {
  threeBranches: ['legislative', 'executive', 'judicial'],
  termLengths: ['representative', 'president', 'senator'],
  congressNumbers: ['senate', 'house'],
  billToLaw: ['congress', 'president', 'law'],
  seatsByPopulation: ['senators', 'house'],
};
