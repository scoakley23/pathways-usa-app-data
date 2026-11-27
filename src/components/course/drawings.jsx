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

// The parts a learner can tap in a tap-the-picture story check, with their
// English names (said in the feedback and to screen readers).
export const DRAWING_PARTS = {
  threeBranches: { legislative: 'The legislative branch (Congress)', executive: 'The executive branch (the President)', judicial: 'The judicial branch (the courts)' },
  amendments: { first10: 'Amendments 1 to 10: the Bill of Rights', later: 'Amendments 11 to 27' },
  powerFromPeople: { people: 'We the People', leaders: 'The leaders' },
  checksBalances: { congress: 'Congress', president: 'The President', courts: 'The courts' },
  documentsToConstitution: { declaration: 'The Declaration of Independence', articles: 'The Articles of Confederation', federalist: 'The Federalist Papers', constitution: 'The Constitution' },
  sharedPower: { national: 'The national government', states: 'The states' },
  billToLaw: { congress: 'Congress writes a bill', president: 'The President signs it', law: 'It becomes a law' },
  termLengths: { representative: 'A representative: 2 years', president: 'The President: 4 years', senator: 'A senator: 6 years' },
  presidentPowers: { sign: 'Signs bills into law', veto: 'Vetoes bills', military: 'Commander in Chief of the military', judges: 'Appoints federal judges' },
  twoTerms: { term1: 'The first four-year term', term2: 'The second four-year term', third: 'A third term (not allowed)' },
  executiveBranch: { president: 'The President', vicePresident: 'The Vice President', cabinet: 'The Cabinet', departments: 'Federal departments and agencies' },
  courtsLevels: { supreme: 'The Supreme Court', federal: 'Other federal courts' },
  federalStatePowers: { federal: 'Powers only for the federal government', states: 'Powers only for the states', tenth: 'The 10th Amendment' },
  everyoneRights: { expression: 'Freedom of expression', speech: 'Freedom of speech', assembly: 'Freedom of assembly', petition: 'Freedom to petition the government', religion: 'Freedom of religion', arms: 'The right to bear arms' },
  votingAmendments: { race: 'A male citizen of any race can vote', women: 'Women can vote', pollTax: 'No one has to pay a tax to vote', age18: 'Citizens 18 and older can vote' },
  citizensOnly: { vote: 'Vote in federal elections', office: 'Run for federal office', jury: 'Serve on a jury' },
  waysToServe: { vote: 'Vote', taxes: 'Pay taxes', law: 'Obey the law', military: 'Serve in the military', office: 'Run for office', government: 'Work for the government' },
  waysToCitizenship: { born: 'Born in the United States', naturalize: 'Naturalize', derive: 'Derive citizenship' },
  oathPromises: { loyalty: 'Give up loyalty to other countries', defend: 'Defend the Constitution', obey: 'Obey the laws of the United States', serve: 'Serve the nation if needed' },
  reasonsToCome: { freedom: 'Freedom', religion: 'Religious freedom', opportunity: 'Economic opportunity', persecution: 'Escape persecution' },
  roadToIndependence: { taxes: 'New taxes, 1760s', teaParty: 'The Boston Tea Party, 1773', declaration: 'The Declaration of Independence, July 4, 1776' },
  revolutionTimeline: { bunkerHill: 'The Battle of Bunker Hill', delaware: 'Washington crosses the Delaware', valleyForge: 'Valley Forge', yorktown: 'The British surrender at Yorktown' },
  publius: { madison: 'James Madison', hamilton: 'Alexander Hamilton', jay: 'John Jay' },
  dollarBills: { one: 'The one-dollar bill: George Washington', ten: 'The ten-dollar bill: Alexander Hamilton' },
  civilWarMap: { union: 'The Union (North)', confederacy: 'The Confederacy (South)', border: 'Border states' },
  growingCountry: { louisiana: 'The Louisiana Territory, 1803', alaska: 'Alaska, 1867' },
  wars1800s: { war1812: 'The War of 1812', mexican: 'The Mexican-American War', civil: 'The Civil War', spanish: 'The Spanish-American War' },
  civilWarEvents: { fortSumter: 'Fort Sumter, 1861', emancipation: 'The Emancipation Proclamation, 1863', gettysburg: 'The Battle of Gettysburg, 1863', appomattox: 'The surrender at Appomattox, 1865' },
  reconstructionAmendments: { thirteenth: 'The 13th Amendment: ended slavery', fourteenth: 'The 14th Amendment: citizens', fifteenth: 'The 15th Amendment: voting, 1870' },
  coldWar: { us: 'The United States', soviet: 'The Soviet Union' },
  depressionTimeline: { crash: 'The Great Crash, 1929', hardTimes: 'Hard times in the 1930s', ww2: 'World War II' },
  worldWar2Sides: { axis: 'The Axis Powers: Germany, Italy and Japan', allies: 'The Allied Powers' },
  fourElections: { roosevelt: 'Franklin Roosevelt, elected four times', limit: 'The 22nd Amendment: two terms' },
  ikeThree: { general: 'General in World War II', korea: 'President when the Korean War ended', highways: 'The Interstate highways' },
  northSouth: { korea: 'Korea', vietnam: 'Vietnam' },
  sept11Places: { newYork: 'New York City: the World Trade Center', pentagon: 'Virginia: the Pentagon', pennsylvania: 'Pennsylvania: a field' },
  middleEastWars: { gulf: 'The Persian Gulf War, 1991', afghanistan: 'The war in Afghanistan, 2001', iraq: 'The war in Iraq, 2003' },
  innovations: { lightBulb: 'Light bulb', automobile: 'Automobile', airplane: 'Airplane', skyscrapers: 'Skyscrapers', assemblyLine: 'Assembly line', moon: 'Landing on the moon' },
};

// One part of a drawing: it fades when another part is lit (`focus`). In a
// tap-the-picture check (`pick` = { onPick, disabled }) it is a button.
function Part({ id, focus, pick, drawing, children }) {
  const style = dim(focus, id);
  if (!pick) return <g style={style}>{children}</g>;
  const choose = () => { if (!pick.disabled) pick.onPick(id); };
  return (
    <g
      role="button"
      tabIndex={pick.disabled ? -1 : 0}
      aria-label={DRAWING_PARTS[drawing]?.[id] || id}
      aria-disabled={pick.disabled || undefined}
      onClick={choose}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } }}
      style={style}
      className={`${pick.disabled ? '' : 'cursor-pointer'} focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-denim`}
    >
      {children}
    </g>
  );
}

// The three branches and what each one does.
function ThreeBranches({ focus, pick } = {}) {
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
        <Part key={c.name} id={c.key} focus={focus} pick={pick} drawing="threeBranches">
          <line x1={c.x + 50} y1={44} x2={c.x + 50} y2={62} className="stroke-mid" strokeWidth="3" />
          <Box x={c.x} y={62} w={100} h={118} className="fill-white stroke-denim" />
          <T x={c.x + 50} y={86} className="fill-denim" size={13}>{c.name}</T>
          <T x={c.x + 50} y={118} size={16} weight={700}>{c.who}</T>
          <T x={c.x + 50} y={150} className="fill-muted" size={12} weight={400}>{c.what}</T>
        </Part>
      ))}
    </Frame>
  );
}

// Term lengths on one scale: representative 2, President 4, senator 6.
function TermLengths({ focus, pick } = {}) {
  const rows = [
    { key: 'representative', who: 'Representative', years: 2 },
    { key: 'president', who: 'President', years: 4 },
    { key: 'senator', who: 'Senator', years: 6 },
  ];
  const unit = 27; // px per year
  return (
    <Frame viewBox="0 0 350 160" title="Terms: a representative serves 2 years, the President 4 years, a senator 6 years">
      {rows.map((r, i) => (
        <Part key={r.who} id={r.key} focus={focus} pick={pick} drawing="termLengths"><g transform={`translate(0 ${12 + i * 46})`}>
          <T x={0} y={14} anchor="start" size={13}>{r.who}</T>
          {Array.from({ length: 6 }).map((_, k) => (
            <rect key={k} x={112 + k * unit} y={0} width={unit - 4} height={22} rx={5} className={k < r.years ? 'fill-denim' : 'fill-tint'} />
          ))}
          <T x={112 + 6 * unit + 8} y={16} anchor="start" size={13} weight={700}>{r.years} years</T>
        </g></Part>
      ))}
    </Frame>
  );
}

// The two parts of Congress and their numbers: the Senate in denim, the
// House in purple, so the two parts never look alike (no party colors).
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
      {dots(435, 29, 166, 68, 2.2, 5.8, 'fill-stop-n400')}
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
// focus "chief" lights the Chief Justice; "majority" lights 5 of the 9.
function SupremeCourt({ focus } = {}) {
  return (
    <Frame viewBox="0 0 350 120" title="The Supreme Court has nine justices: the Chief Justice and eight associate justices">
      {Array.from({ length: 9 }).map((_, i) => {
        const chief = i === 4;
        const lit = focus === 'chief' ? chief : focus === 'majority' ? i < 5 : true;
        return (
          <g key={i} transform={`translate(${23 + i * 38} 20)`} style={lit ? undefined : { opacity: 0.3 }}>
            <circle cx="0" cy="12" r="10" className={chief ? 'fill-navy' : 'fill-denim'} />
            <rect x="-14" y="26" width="28" height="30" rx="10" className={chief ? 'fill-navy' : 'fill-denim'} />
          </g>
        );
      })}
      <T x={175} y={98} size={13}>{focus === 'majority' ? 'Usually 5 of the 9 justices decide a case' : '9 justices: the Chief Justice (center) and 8 others'}</T>
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

function CivilWarMap({ focus, pick } = {}) {
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
      {Object.keys(STATE_TILES).filter((c) => !UNION.includes(c) && !CONFEDERACY.includes(c) && !BORDER.includes(c)).map((c) => {
        const st = style(c);
        return <g key={c} style={focus ? { opacity: 0.3 } : undefined}><Tile code={c} x0={x0} y0={y0} fill={st.fill} text={st.text} /></g>;
      })}
      {Object.entries(CIVIL_WAR_SIDES).map(([side, codes]) => (
        <Part key={side} id={side} focus={focus} pick={pick} drawing="civilWarMap">
          {codes.map((c) => {
            const st = style(c);
            return <Tile key={c} code={c} x0={x0} y0={y0} fill={st.fill} text={st.text} />;
          })}
        </Part>
      ))}
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
  { key: 'ww1', name: 'World War I', from: 1917, to: 1918, label: '1917–1918' },
  { key: 'ww2', name: 'World War II', from: 1941, to: 1945, label: '1941–1945' },
  { key: 'korea', name: 'Korean War', from: 1950, to: 1953, label: '1950–1953' },
  { key: 'vietnam', name: 'Vietnam War', from: 1965, to: 1973, label: '1960s–1973' },
  { key: 'gulf', name: 'Persian Gulf War', from: 1991, to: 1991, label: '1991' },
];

function WarsTimeline({ focus } = {}) {
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
          <g key={w.name} style={dim(focus, w.key)}>
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
function ColdWar({ focus, pick } = {}) {
  const sides = [
    { key: 'us', x: 4, name: 'United States', system: 'Democracy', a: 'People own farms,', b: 'factories and stores.', c: 'People choose.', cls: 'fill-white stroke-denim' },
    { key: 'soviet', x: 182, name: 'Soviet Union', system: 'Communism', a: 'The government owns', b: 'farms, factories, stores.', c: 'The government decides.', cls: 'fill-white stroke-navy' },
  ];
  return (
    <Frame viewBox="0 0 350 250" title="The Cold War, about 1947 to 1991. The United States: democracy, people own farms, factories and stores, and people choose. The Soviet Union: communism, the government owns farms, factories and stores, and the government decides. They competed with weapons, money and ideas, but never fought each other directly in a big war.">
      {sides.map((s) => (
        <Part key={s.name} id={s.key} focus={focus} pick={pick} drawing="coldWar">
          <Box x={s.x} y={4} w={164} h={140} className={s.cls} />
          <T x={s.x + 82} y={30} size={15} weight={700}>{s.name}</T>
          <rect x={s.x + 30} y={42} width={104} height={24} rx={12} className={s.name === 'United States' ? 'fill-denim' : 'fill-navy'} />
          <T x={s.x + 82} y={59} size={12} weight={700} className="fill-white">{s.system}</T>
          <T x={s.x + 82} y={88} size={12} weight={400} className="fill-muted">{s.a}</T>
          <T x={s.x + 82} y={104} size={12} weight={400} className="fill-muted">{s.b}</T>
          <T x={s.x + 82} y={128} size={12} weight={700}>{s.c}</T>
        </Part>
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
function BillToLaw({ focus, pick } = {}) {
  const steps = [
    { key: 'congress', x: 4, who: 'Congress', what: 'writes a bill' },
    { key: 'president', x: 124, who: 'President', what: 'signs it' },
    { key: 'law', x: 244, who: 'Law', what: 'for everyone' },
  ];
  return (
    <Frame viewBox="0 0 350 120" title="How a law is made: Congress writes a bill, the President signs it, and it becomes a law for the whole country">
      {steps.map((s, i) => (
        <Part key={s.key} id={s.key} focus={focus} pick={pick} drawing="billToLaw">
          <Box x={s.x} y={14} w={102} h={92} className={s.key === 'law' ? 'fill-navy stroke-navy' : 'fill-white stroke-denim'} />
          <T x={s.x + 51} y={52} size={15} weight={700} className={s.key === 'law' ? 'fill-white' : 'fill-navy'}>{s.who}</T>
          <T x={s.x + 51} y={76} size={12} weight={400} className={s.key === 'law' ? 'fill-white' : 'fill-muted'}>{s.what}</T>
          {i < 2 && <path d={`M${s.x + 106} 60 l12 0 m-5 -5 l5 5 l-5 5`} className="stroke-mid" strokeWidth="3" fill="none" />}
        </Part>
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

// One state cut into congressional districts: senators speak for the whole
// state (focus "state"), a representative for one district (focus "district").
const DISTRICTS = [
  'M20 30 L120 22 L130 95 L28 102 Z',
  'M120 22 L230 18 L226 88 L130 95 Z',
  'M230 18 L330 28 L322 110 L226 88 Z',
  'M28 102 L130 95 L138 178 L36 186 Z',
  'M130 95 L226 88 L234 170 L138 178 Z',
  'M226 88 L322 110 L314 190 L234 170 Z',
];
function StateDistricts({ focus } = {}) {
  const fill = (k) => {
    if (focus === 'state') return 'fill-denim stroke-denim';
    if (focus === 'district') return k === 4 ? 'fill-stop-n400 stroke-white' : 'fill-tint stroke-mid';
    return 'fill-tint stroke-mid';
  };
  const label = focus === 'state' ? 'Senators: the whole state' : focus === 'district' ? 'A representative: one district' : 'One state, cut into districts';
  return (
    <Frame viewBox="0 0 350 230" title="A state cut into six congressional districts. Senators speak for the whole state; a representative speaks for one district.">
      {DISTRICTS.map((d, k) => <path key={k} d={d} className={fill(k)} strokeWidth="3" strokeLinejoin="round" />)}
      {focus === 'district' && <T x={186} y={142} size={13} weight={700} className="fill-white">1 district</T>}
      {focus === 'state' && <T x={175} y={104} size={16} weight={700} className="fill-white">The whole state</T>}
      <T x={175} y={218} size={13} weight={700}>{label}</T>
    </Frame>
  );
}

// The Great Compromise: big states wanted seats by population, small states
// wanted the same number for every state; the compromise gave both.
function GreatCompromise({ focus } = {}) {
  const sides = [
    { key: 'big', x: 4, who: 'Big states wanted', what: ['More people,', 'more seats'] },
    { key: 'small', x: 182, who: 'Small states wanted', what: ['Every state', 'the same'] },
  ];
  const both = focus === 'both';
  return (
    <Frame viewBox="0 0 350 250" title="The Great Compromise: big states wanted more seats for more people; small states wanted every state to have the same number. The compromise gave both: the House by population, and two senators for every state.">
      {sides.map((s) => (
        <g key={s.key} style={focus && !both ? (focus === s.key ? undefined : { opacity: 0.3 }) : undefined}>
          <Box x={s.x} y={4} w={164} h={110} className="fill-white stroke-denim" />
          <T x={s.x + 82} y={30} size={13} weight={600} className="fill-muted">{s.who}</T>
          <T x={s.x + 82} y={60} size={16} weight={700}>{s.what[0]}</T>
          <T x={s.x + 82} y={82} size={16} weight={700}>{s.what[1]}</T>
        </g>
      ))}
      <g style={focus && !both ? { opacity: 0.3 } : undefined}>
        <path d="M86 118 L150 150 M264 118 L200 150" className="stroke-mid" strokeWidth="3" fill="none" />
        <Box x={40} y={150} w={270} h={92} className="fill-navy stroke-navy" />
        <T x={175} y={174} size={13} weight={600} className="fill-white">The Great Compromise: both</T>
        <T x={175} y={200} size={14} weight={700} className="fill-white">House: by population</T>
        <T x={175} y={224} size={14} weight={700} className="fill-white">Senate: 2 for every state</T>
      </g>
    </Frame>
  );
}

// A simple person (head and body) for the drawings below.
const Person = ({ cx, cy, className = 'fill-denim' }) => (
  <g>
    <circle cx={cx} cy={cy} r={5} className={className} />
    <rect x={cx - 6} y={cy + 6} width={12} height={10} rx={4} className={className} />
  </g>
);
// A straight line from (x1, y1) to (x2, y2) with an arrowhead at the end.
const arrowPath = (x1, y1, x2, y2) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (t) => `${(x2 - 8 * Math.cos(a + t)).toFixed(1)} ${(y2 - 8 * Math.sin(a + t)).toFixed(1)}`;
  return `M${x1} ${y1} L${x2} ${y2} M${h(0.6)} L${x2} ${y2} L${h(-0.6)}`;
};
const Arrow = ({ d }) => <path d={d} className="stroke-denim" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />;

// The Constitution and its 27 amendments; the first 10 are the Bill of Rights.
function Amendments({ focus, pick } = {}) {
  const first = Array.from({ length: 10 }, (_, i) => i + 1);
  const later = Array.from({ length: 17 }, (_, i) => i + 11);
  const tile = (n, x, y, on) => (
    <g key={n}>
      <rect x={x} y={y} width={20} height={22} rx={4} className={on ? 'fill-gold stroke-navy' : 'fill-sky-soft stroke-denim'} strokeWidth="2" />
      <T x={x + 10} y={y + 16} size={12} weight={700}>{n}</T>
    </g>
  );
  const lit = focus === 'all' ? undefined : focus;
  return (
    <Frame viewBox="0 0 350 172" title="The Constitution has 27 amendments. The first 10 amendments, added in 1791, are the Bill of Rights.">
      <Box x={4} y={8} w={108} h={156} className="fill-navy stroke-navy" />
      <T x={58} y={78} size={14} weight={700} className="fill-white">Constitution</T>
      <T x={58} y={100} size={13} weight={400} className="fill-white">1787</T>
      <T x={235} y={22} size={15} weight={700}>27 amendments</T>
      <Part id="first10" focus={lit} pick={pick} drawing="amendments">
        <rect x={120} y={32} width={228} height={66} rx={8} className="fill-gold-soft" />
        {first.map((n, i) => tile(n, 124 + i * 22, 38, true))}
        <T x={234} y={88} size={12} weight={700}>Bill of Rights · 1791</T>
      </Part>
      <Part id="later" focus={lit} pick={pick} drawing="amendments">
        <rect x={120} y={104} width={228} height={62} rx={8} className="fill-white" />
        {later.slice(0, 9).map((n, i) => tile(n, 124 + i * 22, 110, false))}
        {later.slice(9).map((n, i) => tile(n, 124 + i * 22, 138, false))}
      </Part>
    </Frame>
  );
}

// We the People: the people vote for leaders, and the leaders make laws for
// the people. The government's power comes from the people.
function PowerFromPeople({ focus, pick } = {}) {
  return (
    <Frame viewBox="0 0 350 200" title="We the People: the people vote for leaders, and the leaders make laws for the people. The government gets its power from the people.">
      <Part id="people" focus={focus} pick={pick} drawing="powerFromPeople">
        <Box x={4} y={56} w={140} h={88} className="fill-sky-soft stroke-denim" />
        {[34, 56, 78, 100, 122].map((cx) => <Person key={cx} cx={cx} cy={76} />)}
        <T x={74} y={124} size={14} weight={700}>We the People</T>
        <Arrow d="M74 50 C 74 16, 276 16, 276 46 m-6 -8 l6 8 l6 -8" />
        <T x={175} y={22} size={13} weight={600} className="fill-muted">vote for</T>
      </Part>
      <Part id="leaders" focus={focus} pick={pick} drawing="powerFromPeople">
        <Box x={206} y={56} w={140} h={88} className="fill-navy stroke-navy" />
        <circle cx={276} cy={80} r={7} className="fill-gold" />
        <T x={276} y={108} size={14} weight={700} className="fill-white">Leaders</T>
        <T x={276} y={128} size={12} weight={400} className="fill-white">speak for the people</T>
        <Arrow d="M276 150 C 276 186, 74 186, 74 154 m-6 8 l6 -8 l6 8" />
        <T x={175} y={192} size={13} weight={600} className="fill-muted">make laws for</T>
      </Part>
    </Frame>
  );
}

// Checks and balances: each branch can check the others.
function ChecksBalances({ focus, pick } = {}) {
  const boxes = [
    { key: 'congress', x: 4, y: 8, w: 160, fill: 'fill-sky-soft', who: 'Congress', what: ['writes laws'] },
    { key: 'president', x: 186, y: 8, w: 160, fill: 'fill-gold-soft', who: 'President', what: ['can veto a law'] },
    { key: 'courts', x: 55, y: 152, w: 240, fill: 'fill-denim-soft', who: 'Courts', what: ['can decide a law goes', 'against the Constitution'] },
  ];
  return (
    <Frame viewBox="0 0 350 232" title="Checks and balances: Congress writes laws, the President can veto a law, and the courts can decide a law goes against the Constitution. Each branch checks the others.">
      <path d="M84 74 L175 152 M266 74 L175 152 M164 41 L186 41" className="stroke-denim" strokeWidth="3" fill="none" />
      <rect x={95} y={100} width={160} height={28} rx={8} className="fill-gold" />
      <T x={175} y={119} size={12} weight={700}>Each checks the others</T>
      {boxes.map((b) => (
        <Part key={b.key} id={b.key} focus={focus} pick={pick} drawing="checksBalances">
          <Box x={b.x} y={b.y} w={b.w} h={b.what.length > 1 ? 74 : 66} className={`${b.fill} stroke-denim`} />
          <T x={b.x + b.w / 2} y={b.y + 26} size={15} weight={700}>{b.who}</T>
          {b.what.map((line, i) => (
            <T key={line} x={b.x + b.w / 2} y={b.y + 48 + i * 17} size={12} weight={400}>{line}</T>
          ))}
        </Part>
      ))}
    </Frame>
  );
}

// Older documents the writers of the Constitution learned from.
function DocumentsToConstitution({ focus, pick } = {}) {
  const docs = [
    { key: 'declaration', x: 4, toX: 120, lines: ['Declaration of', 'Independence'] },
    { key: 'articles', x: 120, toX: 175, lines: ['Articles of', 'Confederation'] },
    { key: 'federalist', x: 236, toX: 230, lines: ['Federalist', 'Papers'] },
  ];
  return (
    <Frame viewBox="0 0 350 220" title="The writers of the Constitution learned from older documents: the Declaration of Independence, the Articles of Confederation and the Federalist Papers. The Constitution was written in 1787.">
      {docs.map((d) => (
        <Part key={d.key} id={d.key} focus={focus} pick={pick} drawing="documentsToConstitution">
          <Box x={d.x} y={8} w={110} h={72} className="fill-gold-soft stroke-denim" />
          <T x={d.x + 55} y={40} size={13} weight={700}>{d.lines[0]}</T>
          <T x={d.x + 55} y={60} size={13} weight={700}>{d.lines[1]}</T>
          <Arrow d={arrowPath(d.x + 55, 86, d.toX, 134)} />
        </Part>
      ))}
      <Part id="constitution" focus={focus} pick={pick} drawing="documentsToConstitution">
        <Box x={75} y={140} w={200} h={72} className="fill-navy stroke-navy" />
        <T x={175} y={172} size={15} weight={700} className="fill-white">Constitution</T>
        <T x={175} y={194} size={13} weight={400} className="fill-white">1787</T>
      </Part>
    </Frame>
  );
}

// A federal republic: the Constitution is the highest law, and power is
// shared between the national government and the states.
function SharedPower({ focus, pick } = {}) {
  const sides = [
    { key: 'national', x: 4, fill: 'fill-sky-soft', lines: ['National', 'government'] },
    { key: 'states', x: 186, fill: 'fill-gold-soft', lines: ['The', 'states'] },
  ];
  return (
    <Frame viewBox="0 0 350 200" title="The Constitution is the highest law. Power is shared between the national government and the states.">
      <Box x={75} y={8} w={200} h={56} className="fill-navy stroke-navy" />
      <T x={175} y={32} size={15} weight={700} className="fill-white">Constitution</T>
      <T x={175} y={52} size={12} weight={400} className="fill-white">the highest law</T>
      <path d="M130 64 L84 110 M220 64 L266 110" className="stroke-denim" strokeWidth="3" fill="none" />
      <rect x={113} y={80} width={124} height={26} rx={8} className="fill-gold" />
      <T x={175} y={98} size={12} weight={700}>power is shared</T>
      {sides.map((s) => (
        <Part key={s.key} id={s.key} focus={focus} pick={pick} drawing="sharedPower">
          <Box x={s.x} y={114} w={160} h={78} className={`${s.fill} stroke-denim`} />
          <T x={s.x + 80} y={148} size={15} weight={700}>{s.lines[0]}</T>
          <T x={s.x + 80} y={170} size={15} weight={700}>{s.lines[1]}</T>
        </Part>
      ))}
    </Frame>
  );
}

// What the President does: four powers around the President.
function PresidentPowers({ focus, pick } = {}) {
  const cards = [
    { key: 'sign', x: 4, y: 6, fill: 'fill-sky-soft', lines: ['Signs bills', 'into law'] },
    { key: 'veto', x: 186, y: 6, fill: 'fill-gold-soft', lines: ['Vetoes bills', 'says no to a bill'] },
    { key: 'military', x: 4, y: 162, fill: 'fill-denim-soft', lines: ['Commander in Chief', 'leads the military'] },
    { key: 'judges', x: 186, y: 162, fill: 'fill-sky-soft', lines: ['Appoints', 'federal judges'] },
  ];
  return (
    <Frame viewBox="0 0 350 230" title="Powers of the President: signs bills into law, vetoes bills, is Commander in Chief of the military, and appoints federal judges">
      <path d="M84 68 L140 92 M266 68 L210 92 M84 162 L140 138 M266 162 L210 138" className="stroke-denim" strokeWidth="3" fill="none" />
      <Box x={115} y={90} w={120} h={50} className="fill-navy stroke-navy" />
      <T x={175} y={121} size={15} weight={700} className="fill-white">President</T>
      {cards.map((c) => (
        <Part key={c.key} id={c.key} focus={focus} pick={pick} drawing="presidentPowers">
          <Box x={c.x} y={c.y} w={160} h={62} className={`${c.fill} stroke-denim`} />
          <T x={c.x + 80} y={c.y + 27} size={13} weight={700}>{c.lines[0]}</T>
          <T x={c.x + 80} y={c.y + 47} size={12} weight={400}>{c.lines[1]}</T>
        </Part>
      ))}
    </Frame>
  );
}

// Two terms at most (the 22nd Amendment): 4 years + 4 years, no third term.
function TwoTerms({ focus, pick } = {}) {
  const terms = [
    { key: 'term1', x: 4, label: 'Term 1' },
    { key: 'term2', x: 120, label: 'Term 2' },
  ];
  return (
    <Frame viewBox="0 0 350 150" title="A President can serve two four-year terms, eight years in all. There is no third term. This rule is in the 22nd Amendment.">
      {terms.map((t) => (
        <Part key={t.key} id={t.key} focus={focus} pick={pick} drawing="twoTerms">
          <Box x={t.x} y={8} w={108} h={74} className="fill-gold stroke-navy" />
          <T x={t.x + 54} y={38} size={15} weight={700}>{t.label}</T>
          <T x={t.x + 54} y={62} size={13} weight={600}>4 years</T>
        </Part>
      ))}
      <Part id="third" focus={focus} pick={pick} drawing="twoTerms">
        <rect x={236} y={8} width={110} height={74} rx={10} className="fill-white stroke-denim" strokeWidth="2" strokeDasharray="6 5" />
        <path d="M252 20 L330 70 M330 20 L252 70" className="stroke-denim" strokeWidth="3" />
        <T x={291} y={100} size={12} weight={600}>No third term</T>
      </Part>
      <rect x={4} y={114} width={226} height={30} rx={8} className="fill-navy" />
      <T x={117} y={134} size={13} weight={700} className="fill-white">22nd Amendment: two terms</T>
    </Frame>
  );
}

// The executive branch: the President, the Vice President, the Cabinet and
// the federal departments and agencies.
function ExecutiveBranch({ focus, pick } = {}) {
  return (
    <Frame viewBox="0 0 350 252" title="The executive branch: the President; the Vice President; the Cabinet, which advises the President, with members like the Secretary of State and the Attorney General; and federal departments and agencies">
      <path d="M175 50 L175 200" className="stroke-denim" strokeWidth="3" />
      <Part id="president" focus={focus} pick={pick} drawing="executiveBranch">
        <Box x={100} y={6} w={150} h={44} className="fill-navy stroke-navy" />
        <T x={175} y={33} size={15} weight={700} className="fill-white">President</T>
      </Part>
      <Part id="vicePresident" focus={focus} pick={pick} drawing="executiveBranch">
        <Box x={100} y={62} w={150} h={40} className="fill-sky-soft stroke-denim" />
        <T x={175} y={87} size={14} weight={700}>Vice President</T>
      </Part>
      <Part id="cabinet" focus={focus} pick={pick} drawing="executiveBranch">
        <Box x={4} y={114} w={342} h={74} className="fill-gold-soft stroke-denim" />
        <T x={175} y={136} size={14} weight={700}>Cabinet: advises the President</T>
        <rect x={14} y={148} width={156} height={30} rx={8} className="fill-white" />
        <T x={92} y={168} size={12} weight={600}>Secretary of State</T>
        <rect x={180} y={148} width={156} height={30} rx={8} className="fill-white" />
        <T x={258} y={168} size={12} weight={600}>Attorney General</T>
      </Part>
      <Part id="departments" focus={focus} pick={pick} drawing="executiveBranch">
        <Box x={4} y={200} w={342} h={46} className="fill-denim-soft stroke-denim" />
        <T x={175} y={228} size={14} weight={700}>Federal departments and agencies</T>
      </Part>
    </Frame>
  );
}

// The judicial branch: the Supreme Court and the other federal courts.
function CourtsLevels({ focus, pick } = {}) {
  return (
    <Frame viewBox="0 0 350 204" title="The judicial branch: the Supreme Court, the highest court, and the other federal courts. Courts explain laws and decide disagreements about the law.">
      <path d="M175 62 L175 96" className="stroke-denim" strokeWidth="3" />
      <Part id="supreme" focus={focus} pick={pick} drawing="courtsLevels">
        <Box x={75} y={6} w={200} h={56} className="fill-navy stroke-navy" />
        <T x={175} y={31} size={15} weight={700} className="fill-white">Supreme Court</T>
        <T x={175} y={51} size={12} weight={400} className="fill-white">the highest court</T>
      </Part>
      <Part id="federal" focus={focus} pick={pick} drawing="courtsLevels">
        <Box x={4} y={96} w={342} h={48} className="fill-sky-soft stroke-denim" />
        <T x={175} y={126} size={14} weight={700}>Other federal courts</T>
      </Part>
      <rect x={4} y={158} width={342} height={38} rx={8} className="fill-gold" />
      <T x={175} y={182} size={13} weight={700}>Courts explain laws and decide disagreements</T>
    </Frame>
  );
}

// Powers only for the federal government, only for the states, and the
// 10th Amendment.
function FederalStatePowers({ focus, pick } = {}) {
  const cols = [
    { key: 'federal', x: 4, fill: 'fill-sky-soft', head: 'Federal only', items: ['Print money', 'Declare war', 'Make treaties'] },
    { key: 'states', x: 180, fill: 'fill-gold-soft', head: 'States only', items: ['Schools', 'Police', 'Driver’s licenses'] },
  ];
  return (
    <Frame viewBox="0 0 350 250" title="Some powers are only for the federal government, like printing money, declaring war and making treaties. Some are only for the states, like schools, police and driver's licenses. The 10th Amendment: powers not given to the federal government belong to the states or to the people.">
      {cols.map((c) => (
        <Part key={c.key} id={c.key} focus={focus} pick={pick} drawing="federalStatePowers">
          <Box x={c.x} y={6} w={166} h={150} className={`${c.fill} stroke-denim`} />
          <T x={c.x + 83} y={32} size={15} weight={700}>{c.head}</T>
          {c.items.map((it, i) => (
            <g key={it}>
              <rect x={c.x + 12} y={46 + i * 34} width={142} height={28} rx={8} className="fill-white" />
              <T x={c.x + 83} y={65 + i * 34} size={13} weight={600}>{it}</T>
            </g>
          ))}
        </Part>
      ))}
      <Part id="tenth" focus={focus} pick={pick} drawing="federalStatePowers">
        <Box x={4} y={168} w={342} h={76} className="fill-navy stroke-navy" />
        <T x={175} y={192} size={14} weight={700} className="fill-white">10th Amendment</T>
        <T x={175} y={213} size={12} weight={400} className="fill-white">Powers not given to the federal government</T>
        <T x={175} y={232} size={12} weight={400} className="fill-white">belong to the states or to the people</T>
      </Part>
    </Frame>
  );
}

// A box with a bold first line and smaller lines under it (Unit 3 drawings).
function LabelTile({ x, y, w, h, fill = 'fill-white', lines }) {
  const [head, ...rest] = lines;
  const total = 20 + rest.length * 17;
  const top = y + (h - total) / 2 + 14;
  return (
    <g>
      <Box x={x} y={y} w={w} h={h} className={`${fill} stroke-denim`} />
      <T x={x + w / 2} y={top} size={14} weight={700}>{head}</T>
      {rest.map((line, i) => <T key={line} x={x + w / 2} y={top + 20 + i * 17} size={12} weight={400}>{line}</T>)}
    </g>
  );
}
const SOFT = ['fill-sky-soft', 'fill-gold-soft', 'fill-denim-soft'];

// Rights of everyone living in the United States.
function EveryoneRights({ focus, pick } = {}) {
  const tiles = [
    { key: 'expression', lines: ['Expression', 'ideas in many ways'] },
    { key: 'speech', lines: ['Speech', 'say what you think'] },
    { key: 'assembly', lines: ['Assembly', 'meet in a peaceful group'] },
    { key: 'petition', lines: ['Petition', 'ask the government'] },
    { key: 'religion', lines: ['Religion', 'any religion, or none'] },
    { key: 'arms', lines: ['Bear arms', '2nd Amendment'] },
  ];
  return (
    <Frame viewBox="0 0 350 244" title="Rights of everyone living in the United States: freedom of expression, of speech, of assembly, to petition the government and of religion, and the right to bear arms">
      {tiles.map((t, i) => (
        <Part key={t.key} id={t.key} focus={focus} pick={pick} drawing="everyoneRights">
          <LabelTile x={i % 2 ? 180 : 4} y={6 + Math.floor(i / 2) * 80} w={166} h={72} fill={SOFT[i % 3]} lines={t.lines} />
        </Part>
      ))}
    </Frame>
  );
}

// The four amendments about who can vote.
function VotingAmendments({ focus, pick } = {}) {
  const rows = [
    { key: 'race', n: '15th', text: 'A male citizen of any race' },
    { key: 'women', n: '19th', text: 'Women can vote' },
    { key: 'pollTax', n: '24th', text: 'No tax to vote (no poll tax)' },
    { key: 'age18', n: '26th', text: 'Citizens 18 and older' },
  ];
  return (
    <Frame viewBox="0 0 350 228" title="Four amendments about who can vote: the 15th, a male citizen of any race; the 19th, women; the 24th, no poll tax; the 26th, citizens 18 and older">
      {rows.map((r, i) => (
        <Part key={r.key} id={r.key} focus={focus} pick={pick} drawing="votingAmendments">
          <Box x={4} y={6 + i * 56} w={342} h={48} className={`${SOFT[i % 3]} stroke-denim`} />
          <rect x={12} y={14 + i * 56} width={62} height={32} rx={8} className="fill-navy" />
          <T x={43} y={35 + i * 56} size={13} weight={700} className="fill-white">{r.n}</T>
          <T x={86} y={35 + i * 56} anchor="start" size={14} weight={700}>{r.text}</T>
        </Part>
      ))}
    </Frame>
  );
}

// What only U.S. citizens can do.
function CitizensOnly({ focus, pick } = {}) {
  const tiles = [
    { key: 'vote', x: 4, lines: ['Vote', 'in federal', 'elections'] },
    { key: 'office', x: 120, lines: ['Run', 'for federal', 'office'] },
    { key: 'jury', x: 236, lines: ['Serve', 'on a jury'] },
  ];
  return (
    <Frame viewBox="0 0 350 172" title="Only U.S. citizens can vote in federal elections, run for federal office and serve on a jury">
      <Box x={4} y={6} w={342} h={40} className="fill-navy stroke-navy" />
      <T x={175} y={31} size={14} weight={700} className="fill-white">Only U.S. citizens can</T>
      {tiles.map((t, i) => (
        <Part key={t.key} id={t.key} focus={focus} pick={pick} drawing="citizensOnly">
          <LabelTile x={t.x} y={56} w={110} h={110} fill={SOFT[i % 3]} lines={t.lines} />
        </Part>
      ))}
    </Frame>
  );
}

// Ways Americans can serve their country.
function WaysToServe({ focus, pick } = {}) {
  const tiles = [
    { key: 'vote', lines: ['Vote'] },
    { key: 'taxes', lines: ['Pay', 'taxes'] },
    { key: 'law', lines: ['Obey', 'the law'] },
    { key: 'military', lines: ['Serve in', 'the military'] },
    { key: 'office', lines: ['Run', 'for office'] },
    { key: 'government', lines: ['Work for', 'the government'] },
  ];
  return (
    <Frame viewBox="0 0 350 196" title="Ways to serve the country: vote, pay taxes, obey the law, serve in the military, run for office, work for the government">
      {tiles.map((t, i) => (
        <Part key={t.key} id={t.key} focus={focus} pick={pick} drawing="waysToServe">
          <LabelTile x={4 + (i % 3) * 116} y={6 + Math.floor(i / 3) * 96} w={110} h={88} fill={SOFT[i % 3]} lines={t.lines} />
        </Part>
      ))}
    </Frame>
  );
}

// The three ways to become a U.S. citizen (no advice about anyone's case).
function WaysToCitizenship({ focus, pick } = {}) {
  const cols = [
    { key: 'born', x: 4, lines: ['Born', 'in the U.S.', '14th Amendment'] },
    { key: 'naturalize', x: 120, lines: ['Naturalize', 'apply, interview', 'and test, Oath'] },
    { key: 'derive', x: 236, lines: ['Derive', 'for example,', 'from a parent'] },
  ];
  return (
    <Frame viewBox="0 0 350 216" title="Three ways to become a U.S. citizen: be born in the United States, under the 14th Amendment; naturalize; or derive citizenship, for example from a parent. For your own case, talk to a lawyer first.">
      {cols.map((c, i) => (
        <Part key={c.key} id={c.key} focus={focus} pick={pick} drawing="waysToCitizenship">
          <LabelTile x={c.x} y={6} w={110} h={130} fill={SOFT[i % 3]} lines={c.lines} />
        </Part>
      ))}
      <rect x={4} y={148} width={342} height={60} rx={10} className="fill-gold" />
      <T x={175} y={172} size={14} weight={700}>Your own case?</T>
      <T x={175} y={194} size={13} weight={600}>Talk to a lawyer first.</T>
    </Frame>
  );
}

// Promises in the Oath of Allegiance.
function OathPromises({ focus, pick } = {}) {
  const tiles = [
    { key: 'loyalty', lines: ['Give up loyalty', 'to other countries'] },
    { key: 'defend', lines: ['Defend', 'the Constitution'] },
    { key: 'obey', lines: ['Obey the laws', 'of the United States'] },
    { key: 'serve', lines: ['Serve the nation', 'if needed'] },
  ];
  return (
    <Frame viewBox="0 0 350 216" title="Promises in the Oath of Allegiance: give up loyalty to other countries, defend the Constitution, obey the laws of the United States, and serve the nation if needed">
      {tiles.map((t, i) => (
        <Part key={t.key} id={t.key} focus={focus} pick={pick} drawing="oathPromises">
          <LabelTile x={i % 2 ? 180 : 4} y={6 + Math.floor(i / 2) * 106} w={166} h={98} fill={SOFT[i % 3]} lines={t.lines} />
        </Part>
      ))}
    </Frame>
  );
}

// Unit 4. Why people came to the American colonies.
function ReasonsToCome({ focus, pick } = {}) {
  const tiles = [
    { key: 'freedom', lines: ['Freedom'] },
    { key: 'religion', lines: ['Religious', 'freedom'] },
    { key: 'opportunity', lines: ['Economic', 'opportunity'] },
    { key: 'persecution', lines: ['Escape', 'persecution'] },
  ];
  return (
    <Frame viewBox="0 0 350 228" title="Why people came to the American colonies: freedom, religious freedom, economic opportunity, or to escape persecution">
      <Box x={4} y={6} w={342} h={40} className="fill-navy stroke-navy" />
      <T x={175} y={31} size={14} weight={700} className="fill-white">Why people came to the colonies</T>
      {tiles.map((t, i) => (
        <Part key={t.key} id={t.key} focus={focus} pick={pick} drawing="reasonsToCome">
          <LabelTile x={i % 2 ? 180 : 4} y={56 + Math.floor(i / 2) * 86} w={166} h={78} fill={SOFT[i % 3]} lines={t.lines} />
        </Part>
      ))}
    </Frame>
  );
}

// Unit 4. The road to independence: new taxes, the Boston Tea Party, the
// Declaration of Independence.
function RoadToIndependence({ focus, pick } = {}) {
  const rows = [
    { key: 'taxes', when: '1760s', head: 'New taxes', sub: 'the Stamp Act, a tax on tea' },
    { key: 'teaParty', when: '1773', head: 'Boston Tea Party', sub: 'tea thrown into the harbor' },
    { key: 'declaration', when: '1776', head: 'Declaration of Independence', sub: 'adopted on July 4, 1776' },
  ];
  return (
    <Frame viewBox="0 0 350 214" title="The road to independence: new taxes in the 1760s, like the Stamp Act and a tax on tea; the Boston Tea Party in 1773; the Declaration of Independence, adopted on July 4, 1776">
      {rows.map((r, i) => (
        <Part key={r.key} id={r.key} focus={focus} pick={pick} drawing="roadToIndependence">
          <Box x={4} y={6 + i * 72} w={342} h={58} className={`${i === 2 ? 'fill-gold' : SOFT[i % 3]} stroke-denim`} />
          <rect x={12} y={19 + i * 72} width={66} height={32} rx={8} className="fill-navy" />
          <T x={45} y={40 + i * 72} size={13} weight={700} className="fill-white">{r.when}</T>
          <T x={88} y={30 + i * 72} anchor="start" size={14} weight={700}>{r.head}</T>
          <T x={88} y={50 + i * 72} anchor="start" size={12} weight={400}>{r.sub}</T>
          {i < 2 && <Arrow d={arrowPath(45, 54 + i * 72, 45, 76 + i * 72)} />}
        </Part>
      ))}
    </Frame>
  );
}

// Unit 4. Four events of the American Revolution, in order.
function RevolutionTimeline({ focus, pick } = {}) {
  const rows = [
    { key: 'bunkerHill', text: 'Battle of Bunker Hill' },
    { key: 'delaware', text: 'Washington crosses the Delaware' },
    { key: 'valleyForge', text: 'Valley Forge' },
    { key: 'yorktown', text: 'The British surrender at Yorktown' },
  ];
  return (
    <Frame viewBox="0 0 350 268" title="The American Revolution, led by George Washington and the Continental Army: the Battle of Bunker Hill, Washington crossing the Delaware, Valley Forge, and the British surrender at Yorktown">
      <Box x={4} y={6} w={342} h={40} className="fill-navy stroke-navy" />
      <T x={175} y={31} size={14} weight={700} className="fill-white">The Revolutionary War</T>
      {rows.map((r, i) => (
        <Part key={r.key} id={r.key} focus={focus} pick={pick} drawing="revolutionTimeline">
          <Box x={4} y={56 + i * 52} w={342} h={44} className={`${i === 3 ? 'fill-gold' : SOFT[i % 3]} stroke-denim`} />
          <circle cx={30} cy={78 + i * 52} r={14} className="fill-navy" />
          <T x={30} y={83 + i * 52} size={13} weight={700} className="fill-white">{i + 1}</T>
          <T x={54} y={83 + i * 52} anchor="start" size={14} weight={700}>{r.text}</T>
        </Part>
      ))}
    </Frame>
  );
}

// Unit 4. The three writers of the Federalist Papers, under one name.
function Publius({ focus, pick } = {}) {
  const writers = [
    { key: 'madison', x: 4, lines: ['James', 'Madison'] },
    { key: 'hamilton', x: 120, lines: ['Alexander', 'Hamilton'] },
    { key: 'jay', x: 236, lines: ['John', 'Jay'] },
  ];
  return (
    <Frame viewBox="0 0 350 214" title="James Madison, Alexander Hamilton and John Jay wrote the Federalist Papers under one name: Publius">
      {writers.map((w, i) => (
        <Part key={w.key} id={w.key} focus={focus} pick={pick} drawing="publius">
          <Box x={w.x} y={6} w={110} h={112} className={`${SOFT[i % 3]} stroke-denim`} />
          <Person cx={w.x + 55} cy={28} />
          <T x={w.x + 55} y={78} size={14} weight={700}>{w.lines[0]}</T>
          <T x={w.x + 55} y={98} size={14} weight={700}>{w.lines[1]}</T>
          <Arrow d={arrowPath(w.x + 55, 124, 175, 146)} />
        </Part>
      ))}
      <Box x={75} y={150} w={200} h={58} className="fill-navy stroke-navy" />
      <T x={175} y={176} size={15} weight={700} className="fill-white">“Publius”</T>
      <T x={175} y={196} size={12} weight={400} className="fill-white">The Federalist Papers</T>
    </Frame>
  );
}

// Unit 4. Who is on the one-dollar and ten-dollar bills (plain bills: no
// seals, no portraits).
function DollarBills({ focus, pick } = {}) {
  const bills = [
    { key: 'one', y: 6, n: '1', name: 'George Washington', fill: 'fill-sky-soft' },
    { key: 'ten', y: 112, n: '10', name: 'Alexander Hamilton', fill: 'fill-gold-soft' },
  ];
  return (
    <Frame viewBox="0 0 350 214" title="George Washington is on the one-dollar bill. Alexander Hamilton is on the ten-dollar bill.">
      {bills.map((b) => (
        <Part key={b.key} id={b.key} focus={focus} pick={pick} drawing="dollarBills">
          <Box x={4} y={b.y} w={342} h={96} className={`${b.fill} stroke-denim`} />
          <rect x={12} y={b.y + 8} width={326} height={80} rx={6} className="fill-none stroke-denim" strokeWidth="1.5" />
          <T x={34} y={b.y + 34} size={18} weight={800}>{b.n}</T>
          <T x={316} y={b.y + 80} size={18} weight={800}>{b.n}</T>
          <ellipse cx={92} cy={b.y + 48} rx={28} ry={34} className="fill-white stroke-denim" strokeWidth="2" />
          <Person cx={92} cy={b.y + 38} />
          <T x={136} y={b.y + 44} anchor="start" size={14} weight={700}>{b.n === '1' ? 'One dollar' : 'Ten dollars'}</T>
          <T x={136} y={b.y + 66} anchor="start" size={13} weight={600}>{b.name}</T>
        </Part>
      ))}
    </Frame>
  );
}

// Unit 5. Rows with a navy tag on the left (a year or a number), a headline
// and a short line under it; one tappable part per row.
function TagRows({ drawing, title, header, rows, focus, pick, rowH = 58 }) {
  const top = header ? 56 : 6;
  return (
    <Frame viewBox={`0 0 350 ${top + rows.length * (rowH + 8)}`} title={title}>
      {header && <Box x={4} y={6} w={342} h={40} className="fill-navy stroke-navy" />}
      {header && <T x={175} y={31} size={14} weight={700} className="fill-white">{header}</T>}
      {rows.map((r, i) => {
        const y = top + i * (rowH + 8);
        return (
          <Part key={r.key} id={r.key} focus={focus} pick={pick} drawing={drawing}>
            <Box x={4} y={y} w={342} h={rowH} className={`${r.gold ? 'fill-gold' : SOFT[i % 3]} stroke-denim`} />
            <rect x={12} y={y + (rowH - 32) / 2} width={66} height={32} rx={8} className="fill-navy" />
            <T x={45} y={y + rowH / 2 + 5} size={13} weight={700} className="fill-white">{r.tag}</T>
            <T x={88} y={y + (r.sub ? rowH / 2 - 4 : rowH / 2 + 5)} anchor="start" size={14} weight={700}>{r.head}</T>
            {r.sub && <T x={88} y={y + rowH / 2 + 15} anchor="start" size={12} weight={400}>{r.sub}</T>}
          </Part>
        );
      })}
    </Frame>
  );
}

// Unit 5. The country grows: the Louisiana Territory (1803) and Alaska (1867).
function GrowingCountry({ focus, pick } = {}) {
  return (
    <TagRows
      drawing="growingCountry" focus={focus} pick={pick} header="The country grows"
      title="The country grows: in 1803 the United States bought the Louisiana Territory from France, and the country doubled in size. In 1867 it bought Alaska, now the largest state."
      rows={[
        { key: 'louisiana', tag: '1803', head: 'Louisiana Territory', sub: 'bought from France: the country doubled' },
        { key: 'alaska', tag: '1867', head: 'Alaska', sub: 'bought: now the largest state' },
      ]}
    />
  );
}

// Unit 5. Four wars the United States fought in the 1800s.
function Wars1800s({ focus, pick } = {}) {
  return (
    <TagRows
      drawing="wars1800s" focus={focus} pick={pick} header="Wars of the 1800s" rowH={44}
      title="Wars the United States fought in the 1800s: the War of 1812, the Mexican-American War, the Civil War (1861 to 1865) and the Spanish-American War"
      rows={[
        { key: 'war1812', tag: '1', head: 'War of 1812' },
        { key: 'mexican', tag: '2', head: 'Mexican-American War' },
        { key: 'civil', tag: '3', head: 'Civil War · 1861–1865' },
        { key: 'spanish', tag: '4', head: 'Spanish-American War' },
      ]}
    />
  );
}

// Unit 5. Important events of the Civil War, in order.
function CivilWarEvents({ focus, pick } = {}) {
  return (
    <TagRows
      drawing="civilWarEvents" focus={focus} pick={pick} header="The Civil War · 1861–1865"
      title="Events of the Civil War: Fort Sumter in 1861, where the war began; the Emancipation Proclamation in 1863; the Battle of Gettysburg in 1863, a Union win; and Lee's surrender at Appomattox in 1865, which ended the war"
      rows={[
        { key: 'fortSumter', tag: '1861', head: 'Fort Sumter', sub: 'the war begins' },
        { key: 'emancipation', tag: '1863', head: 'Emancipation Proclamation', sub: 'freed the slaves in the Confederate states' },
        { key: 'gettysburg', tag: '1863', head: 'Battle of Gettysburg', sub: 'a big Union win in Pennsylvania' },
        { key: 'appomattox', tag: '1865', head: 'Appomattox', sub: 'Lee surrenders: the war ends', gold: true },
      ]}
    />
  );
}

// Unit 5. The amendments added after the Civil War.
function ReconstructionAmendments({ focus, pick } = {}) {
  return (
    <TagRows
      drawing="reconstructionAmendments" focus={focus} pick={pick} header="After the Civil War"
      title="Amendments after the Civil War: the 13th ended slavery; the 14th says all persons born or naturalized in the United States are citizens; the 15th, in 1870, says a man cannot be kept from voting because of his race"
      rows={[
        { key: 'thirteenth', tag: '13th', head: 'Ended slavery' },
        { key: 'fourteenth', tag: '14th', head: 'Citizens', sub: 'all persons born or naturalized here' },
        { key: 'fifteenth', tag: '15th', head: 'Voting · 1870', sub: 'no ban because of a man’s race' },
      ]}
    />
  );
}

// Unit 6. The Great Depression, from the crash to World War II.
function DepressionTimeline({ focus, pick } = {}) {
  return (
    <TagRows
      drawing="depressionTimeline" focus={focus} pick={pick} header="The Great Depression"
      title="The Great Depression: it started with the stock market crash of 1929, the Great Crash. In the 1930s banks closed, people lost jobs and homes, and waited in bread lines. It lasted about ten years, until World War II."
      rows={[
        { key: 'crash', tag: '1929', head: 'The Great Crash', sub: 'the stock market crash' },
        { key: 'hardTimes', tag: '1930s', head: 'Hard times', sub: 'banks close, jobs lost, bread lines' },
        { key: 'ww2', tag: '1939', head: 'World War II begins', sub: 'about ten years later, it ends' },
      ]}
    />
  );
}

// Unit 6. The two sides of World War II.
function WorldWar2Sides({ focus, pick } = {}) {
  const sides = [
    { key: 'axis', x: 4, head: 'Axis Powers', lines: ['Germany', 'Italy', 'Japan'], fill: 'fill-white', text: 'fill-navy' },
    { key: 'allies', x: 182, head: 'Allied Powers', lines: ['England', 'France', 'Russia', 'United States (1941)'], fill: 'fill-navy', text: 'fill-white' },
  ];
  return (
    <Frame viewBox="0 0 350 188" title="World War II, 1939 to 1945. The Axis Powers: Germany, Italy and Japan. The Allied Powers: England, France and Russia; the United States joined them in 1941.">
      {sides.map((s) => (
        <Part key={s.key} id={s.key} focus={focus} pick={pick} drawing="worldWar2Sides">
          <Box x={s.x} y={6} w={164} h={150} className={`${s.fill} stroke-denim`} />
          <T x={s.x + 82} y={34} size={15} weight={700} className={s.text}>{s.head}</T>
          {s.lines.map((l, i) => <T key={l} x={s.x + 82} y={64 + i * 22} size={13} weight={i === 3 ? 700 : 400} className={s.text}>{l}</T>)}
        </Part>
      ))}
      <T x={175} y={178} size={13} weight={600}>World War II · 1939–1945</T>
    </Frame>
  );
}

// Unit 6. Franklin Roosevelt was elected four times; after him, the 22nd
// Amendment allows two terms.
function FourElections({ focus, pick } = {}) {
  const years = ['1932', '1936', '1940', '1944'];
  return (
    <Frame viewBox="0 0 350 176" title="Franklin Roosevelt was elected President four times: 1932, 1936, 1940 and 1944. After him, the 22nd Amendment limited Presidents to two terms.">
      <Part id="roosevelt" focus={focus} pick={pick} drawing="fourElections">
        <Box x={4} y={6} w={342} h={92} className="fill-gold-soft stroke-denim" />
        <T x={175} y={30} size={14} weight={700}>Franklin Roosevelt: elected 4 times</T>
        {years.map((y, i) => (
          <g key={y}>
            <rect x={20 + i * 80} y={44} width={70} height={40} rx={8} className="fill-gold stroke-navy" strokeWidth="2" />
            <T x={55 + i * 80} y={69} size={13} weight={700}>{y}</T>
          </g>
        ))}
      </Part>
      <Part id="limit" focus={focus} pick={pick} drawing="fourElections">
        <Box x={4} y={108} w={342} h={62} className="fill-navy stroke-navy" />
        <T x={175} y={134} size={14} weight={700} className="fill-white">After him: the 22nd Amendment</T>
        <T x={175} y={156} size={13} weight={400} className="fill-white">A President can serve two terms</T>
      </Part>
    </Frame>
  );
}

// Unit 6. Three things to remember about Dwight Eisenhower.
function IkeThree({ focus, pick } = {}) {
  const tiles = [
    { key: 'general', x: 4, lines: ['General', 'in World', 'War II'] },
    { key: 'korea', x: 120, lines: ['President', 'when the', 'Korean War', 'ended'] },
    { key: 'highways', x: 236, lines: ['Interstate', 'highways'] },
  ];
  return (
    <Frame viewBox="0 0 350 172" title="Dwight Eisenhower, Ike: a general in World War II, the 34th President, President when the Korean War ended, and he signed the law that built the Interstate highways">
      <Box x={4} y={6} w={342} h={40} className="fill-navy stroke-navy" />
      <T x={175} y={31} size={14} weight={700} className="fill-white">“Ike”: the 34th President</T>
      {tiles.map((t, i) => (
        <Part key={t.key} id={t.key} focus={focus} pick={pick} drawing="ikeThree">
          <LabelTile x={t.x} y={56} w={110} h={110} fill={SOFT[i % 3]} lines={t.lines} />
        </Part>
      ))}
    </Frame>
  );
}

// Unit 6. Korea and Vietnam: a communist North against the South; the United
// States helped the South (plain boxes, not maps).
function NorthSouth({ focus, pick } = {}) {
  const rows = [
    { key: 'korea', y: 6, name: 'Korea · 1950', north: 'North Korea', south: 'South Korea', verb: ['invaded'] },
    { key: 'vietnam', y: 112, name: 'Vietnam', north: 'North Vietnam', south: 'South Vietnam', verb: ['fought to', 'take over'] },
  ];
  return (
    <Frame viewBox="0 0 350 212" title="Korea: in 1950, communist North Korea invaded South Korea. Vietnam: communist North Vietnam fought to take over South Vietnam. In both wars the United States helped the South, to stop the spread of communism.">
      {rows.map((r) => (
        <Part key={r.key} id={r.key} focus={focus} pick={pick} drawing="northSouth">
          <Box x={4} y={r.y} w={342} h={98} className="fill-sky-soft stroke-denim" />
          <T x={175} y={r.y + 22} size={14} weight={700}>{r.name}</T>
          <rect x={14} y={r.y + 34} width={120} height={52} rx={8} className="fill-navy" />
          <T x={74} y={r.y + 56} size={13} weight={700} className="fill-white">{r.north}</T>
          <T x={74} y={r.y + 75} size={12} weight={400} className="fill-white">communist</T>
          <Arrow d={arrowPath(140, r.y + 60, 206, r.y + 60)} />
          {r.verb.map((v, k) => <T key={v} x={175} y={r.y + 80 + k * 13} size={11} weight={600}>{v}</T>)}
          <rect x={216} y={r.y + 34} width={120} height={52} rx={8} className="fill-white stroke-denim" strokeWidth="2" />
          <T x={276} y={r.y + 56} size={13} weight={700}>{r.south}</T>
          <T x={276} y={r.y + 75} size={12} weight={400}>U.S. helped</T>
        </Part>
      ))}
    </Frame>
  );
}

// Unit 6. Where the September 11, 2001 attacks happened (places only).
function Sept11Places({ focus, pick } = {}) {
  return (
    <TagRows
      drawing="sept11Places" focus={focus} pick={pick} header="September 11, 2001"
      title="On September 11, 2001, terrorists took over planes. Two crashed into the World Trade Center in New York City, one into the Pentagon in Virginia, and one in a field in Pennsylvania."
      rows={[
        { key: 'newYork', tag: 'NY', head: 'New York City', sub: 'the World Trade Center · two planes' },
        { key: 'pentagon', tag: 'VA', head: 'Virginia', sub: 'the Pentagon · one plane' },
        { key: 'pennsylvania', tag: 'PA', head: 'Pennsylvania', sub: 'a field · one plane' },
      ]}
    />
  );
}

// Unit 6. Wars in the Middle East.
function MiddleEastWars({ focus, pick } = {}) {
  return (
    <TagRows
      drawing="middleEastWars" focus={focus} pick={pick} header="Wars in the Middle East"
      title="In 1991, the Persian Gulf War forced the Iraqi military out of Kuwait. In 2001, after the September 11 attacks, the war in Afghanistan began, part of the War on Terror. In 2003, the war in Iraq began."
      rows={[
        { key: 'gulf', tag: '1991', head: 'Persian Gulf War', sub: 'forced Iraq out of Kuwait' },
        { key: 'afghanistan', tag: '2001', head: 'War in Afghanistan', sub: 'part of the War on Terror' },
        { key: 'iraq', tag: '2003', head: 'War in Iraq' },
      ]}
    />
  );
}

// Unit 6. American innovations, each with a simple outline icon.
const INNOVATION_ICONS = {
  bulb: <g><circle cx={0} cy={-6} r={11} /><path d="M-5 6 h10 M-4 11 h8" /></g>,
  car: <g><path d="M-20 6 v-8 l6 -8 h22 l8 8 h4 v8 z" /><circle cx={-11} cy={7} r={4} /><circle cx={11} cy={7} r={4} /></g>,
  plane: <g><path d="M-20 0 h40 M2 0 l-10 -12 M2 0 l-10 12 M-16 0 l-5 -7 M-16 0 l-5 7" /></g>,
  skyscraper: <g><path d="M-14 14 v-22 h10 v22 M-4 14 v-30 h10 v30 M6 14 v-18 h9 v18 M-18 14 h36" /></g>,
  assembly: <g><path d="M-22 8 h44" /><rect x={-18} y={-6} width={10} height={10} rx={2} /><rect x={-5} y={-6} width={10} height={10} rx={2} /><rect x={8} y={-6} width={10} height={10} rx={2} /><circle cx={-16} cy={12} r={2} /><circle cx={16} cy={12} r={2} /></g>,
  moon: <g><path d="M4 -14 a14 14 0 1 0 0 28 a11 11 0 1 1 0 -28 z" /></g>,
};
function Innovations({ focus, pick } = {}) {
  const tiles = [
    { key: 'lightBulb', icon: 'bulb', lines: ['Light bulb'] },
    { key: 'automobile', icon: 'car', lines: ['Automobile'] },
    { key: 'airplane', icon: 'plane', lines: ['Airplane'] },
    { key: 'skyscrapers', icon: 'skyscraper', lines: ['Skyscrapers'] },
    { key: 'assemblyLine', icon: 'assembly', lines: ['Assembly line'] },
    { key: 'moon', icon: 'moon', lines: ['Moon landing', '1969'] },
  ];
  return (
    <Frame viewBox="0 0 350 196" title="American innovations: the light bulb, the automobile, the airplane, skyscrapers, the assembly line, and the first landing on the moon in 1969">
      {tiles.map((t, i) => {
        const x = 4 + (i % 3) * 116;
        const y = 6 + Math.floor(i / 3) * 96;
        return (
          <Part key={t.key} id={t.key} focus={focus} pick={pick} drawing="innovations">
            <Box x={x} y={y} w={110} h={88} className={`${SOFT[i % 3]} stroke-denim`} />
            <g transform={`translate(${x + 55} ${y + 30})`} className="stroke-navy" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{INNOVATION_ICONS[t.icon]}</g>
            {t.lines.map((l, k) => <T key={l} x={x + 55} y={y + 64 + k * 16} size={k ? 12 : 13} weight={k ? 400 : 700}>{l}</T>)}
          </Part>
        );
      })}
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
  stateDistricts: StateDistricts,
  greatCompromise: GreatCompromise,
  amendments: Amendments,
  powerFromPeople: PowerFromPeople,
  checksBalances: ChecksBalances,
  documentsToConstitution: DocumentsToConstitution,
  sharedPower: SharedPower,
  presidentPowers: PresidentPowers,
  twoTerms: TwoTerms,
  executiveBranch: ExecutiveBranch,
  courtsLevels: CourtsLevels,
  federalStatePowers: FederalStatePowers,
  everyoneRights: EveryoneRights,
  votingAmendments: VotingAmendments,
  citizensOnly: CitizensOnly,
  waysToServe: WaysToServe,
  waysToCitizenship: WaysToCitizenship,
  oathPromises: OathPromises,
  reasonsToCome: ReasonsToCome,
  roadToIndependence: RoadToIndependence,
  revolutionTimeline: RevolutionTimeline,
  publius: Publius,
  dollarBills: DollarBills,
  growingCountry: GrowingCountry,
  wars1800s: Wars1800s,
  civilWarEvents: CivilWarEvents,
  reconstructionAmendments: ReconstructionAmendments,
  depressionTimeline: DepressionTimeline,
  worldWar2Sides: WorldWar2Sides,
  fourElections: FourElections,
  ikeThree: IkeThree,
  northSouth: NorthSouth,
  sept11Places: Sept11Places,
  middleEastWars: MiddleEastWars,
  innovations: Innovations,
};

// The parts each drawing can light up (story scenes' `focus`).
export const DRAWING_FOCUS = {
  threeBranches: ['legislative', 'executive', 'judicial'],
  termLengths: ['representative', 'president', 'senator'],
  congressNumbers: ['senate', 'house'],
  billToLaw: ['congress', 'president', 'law'],
  seatsByPopulation: ['senators', 'house'],
  stateDistricts: ['state', 'district'],
  greatCompromise: ['big', 'small', 'both'],
  amendments: ['first10', 'later', 'all'],
  powerFromPeople: ['people', 'leaders'],
  checksBalances: ['congress', 'president', 'courts'],
  documentsToConstitution: ['declaration', 'articles', 'federalist', 'constitution'],
  sharedPower: ['national', 'states'],
  presidentPowers: ['sign', 'veto', 'military', 'judges'],
  twoTerms: ['term1', 'term2', 'third'],
  executiveBranch: ['president', 'vicePresident', 'cabinet', 'departments'],
  courtsLevels: ['supreme', 'federal'],
  federalStatePowers: ['federal', 'states', 'tenth'],
  supremeCourt: ['chief', 'majority'],
  everyoneRights: ['expression', 'speech', 'assembly', 'petition', 'religion', 'arms'],
  votingAmendments: ['race', 'women', 'pollTax', 'age18'],
  citizensOnly: ['vote', 'office', 'jury'],
  waysToServe: ['vote', 'taxes', 'law', 'military', 'office', 'government'],
  waysToCitizenship: ['born', 'naturalize', 'derive'],
  oathPromises: ['loyalty', 'defend', 'obey', 'serve'],
  reasonsToCome: ['freedom', 'religion', 'opportunity', 'persecution'],
  roadToIndependence: ['taxes', 'teaParty', 'declaration'],
  revolutionTimeline: ['bunkerHill', 'delaware', 'valleyForge', 'yorktown'],
  publius: ['madison', 'hamilton', 'jay'],
  dollarBills: ['one', 'ten'],
  civilWarMap: ['union', 'confederacy', 'border'],
  growingCountry: ['louisiana', 'alaska'],
  wars1800s: ['war1812', 'mexican', 'civil', 'spanish'],
  civilWarEvents: ['fortSumter', 'emancipation', 'gettysburg', 'appomattox'],
  reconstructionAmendments: ['thirteenth', 'fourteenth', 'fifteenth'],
  warsTimeline: ['ww1', 'ww2', 'korea', 'vietnam', 'gulf'],
  coldWar: ['us', 'soviet'],
  depressionTimeline: ['crash', 'hardTimes', 'ww2'],
  worldWar2Sides: ['axis', 'allies'],
  fourElections: ['roosevelt', 'limit'],
  ikeThree: ['general', 'korea', 'highways'],
  northSouth: ['korea', 'vietnam'],
  sept11Places: ['newYork', 'pentagon', 'pennsylvania'],
  middleEastWars: ['gulf', 'afghanistan', 'iraq'],
  innovations: ['lightBulb', 'automobile', 'airplane', 'skyscrapers', 'assemblyLine', 'moon'],
};
