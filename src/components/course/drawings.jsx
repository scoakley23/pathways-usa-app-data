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

// The three branches and what each one does.
function ThreeBranches() {
  const cols = [
    { x: 10, name: 'Legislative', who: 'Congress', what: 'makes laws' },
    { x: 125, name: 'Executive', who: 'President', what: 'carries out laws' },
    { x: 240, name: 'Judicial', who: 'Courts', what: 'explain laws' },
  ];
  return (
    <Frame viewBox="0 0 350 190" title="The three branches of government: legislative (Congress makes laws), executive (the President carries out laws), judicial (the courts explain laws)">
      <Box x={10} y={8} w={330} h={36} className="fill-navy stroke-navy" />
      <T x={175} y={31} className="fill-white">Federal government</T>
      {cols.map((c) => (
        <g key={c.name}>
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
function TermLengths() {
  const rows = [
    { who: 'Representative', years: 2 },
    { who: 'President', years: 4 },
    { who: 'Senator', years: 6 },
  ];
  const unit = 27; // px per year
  return (
    <Frame viewBox="0 0 350 160" title="Terms: a representative serves 2 years, the President 4 years, a senator 6 years">
      {rows.map((r, i) => (
        <g key={r.who} transform={`translate(0 ${12 + i * 46})`}>
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
function CongressNumbers() {
  const dots = (n, cols, x0, y0, size, gap, cls) => Array.from({ length: n }).map((_, i) => (
    <circle key={i} cx={x0 + (i % cols) * gap} cy={y0 + Math.floor(i / cols) * gap} r={size} className={cls} />
  ));
  return (
    <Frame viewBox="0 0 350 210" title="Congress: the Senate has 100 senators, 2 from every state; the House of Representatives has 435 voting members, more for states with more people">
      <Box x={4} y={4} w={140} h={200} />
      <T x={74} y={28}>Senate</T>
      <T x={74} y={52} size={22} weight={800}>100</T>
      {dots(100, 10, 26, 72, 4, 10.5, 'fill-denim')}
      <T x={74} y={196} className="fill-muted" size={11} weight={400}>2 from every state</T>
      <Box x={154} y={4} w={192} h={200} />
      <T x={250} y={28}>House</T>
      <T x={250} y={52} size={22} weight={800}>435</T>
      {dots(435, 29, 166, 68, 2.2, 5.8, 'fill-stop-read-write')}
      <T x={250} y={196} className="fill-muted" size={11} weight={400}>more for states with more people</T>
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

export const DRAWINGS = {
  threeBranches: ThreeBranches,
  termLengths: TermLengths,
  congressNumbers: CongressNumbers,
  electoralCollege: ElectoralCollege,
  supremeCourt: SupremeCourt,
};
