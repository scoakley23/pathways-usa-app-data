import React from 'react';
import { posterTone, POSTER_SCHEME } from '@/lib/posterTone';
import { outcomesLabel } from '@/lib/practiceResults';

export { posterTone, POSTER_SCHEME };

// Pathways brand kit building blocks (docs/redesign/brand-spec.md). Use these
// instead of one-off hex colors so the whole app stays consistent
// (tokens: tailwind `pw.*`).

const TAG_TONES = {
  red: 'bg-pw-red-soft text-pw-red-ink',
  blue: 'bg-pw-blue-soft text-pw-civics',
  teal: 'bg-pw-teal-soft text-pw-reading',
  green: 'bg-pw-green-soft text-pw-writing',
  navy: 'bg-pw-soft text-pw-navy',
  sky: 'bg-pw-sky/40 text-pw-navy',
  manila: 'bg-pw-manila/70 text-pw-navy',
};
const DOT = {
  red: 'bg-pw-red-ink', blue: 'bg-pw-civics', teal: 'bg-pw-reading', green: 'bg-pw-writing', navy: 'bg-pw-navy',
  sky: 'bg-pw-sky ring-1 ring-pw-navy/40', manila: 'bg-pw-manila ring-1 ring-pw-navy/40',
};

// One color per interview skill, the same everywhere (Practice tiles, Today,
// tabs, tags): Reading = blue, Writing = Sky, Civics = Red ink, Speaking =
// Ink, N-400 = Manila. (The `pw-civics` token is the blue; its name predates
// this scheme.) Sky and Manila are light: they always take ink text.
export const SKILL_TONE = {
  civics: 'red',
  reading: 'blue',
  writing: 'sky',
  speaking: 'navy',
  n400: 'manila',
};
export const SKILL_BG = {
  civics: 'bg-pw-red-soft',
  reading: 'bg-pw-blue-soft',
  writing: 'bg-pw-sky/30',
  speaking: 'bg-pw-soft',
  n400: 'bg-pw-manila/50',
};
// Solid skill color, for tabs, strips and tiles.
export const SKILL_COLOR = {
  civics: 'bg-pw-red-ink',
  reading: 'bg-pw-civics',
  writing: 'bg-pw-sky',
  speaking: 'bg-pw-navy',
  n400: 'bg-pw-manila',
};
// Text on the solid skill color (all ≥ 4.5:1).
export const SKILL_ON = {
  civics: 'text-white',
  reading: 'text-white',
  writing: 'text-pw-navy',
  speaking: 'text-white',
  n400: 'text-pw-navy',
};
export const SKILL_LABEL = {
  civics: 'Civics',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  n400: 'Form N-400',
};

// Small colored dot for a skill, for lists where a full tag is too loud.
export function SkillDot({ skill, className = '' }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${DOT[SKILL_TONE[skill]]} ${className}`} aria-hidden="true" />;
}

export function SkillTag({ skill, className = '' }) {
  return <Tag tone={SKILL_TONE[skill]} className={className}>{SKILL_LABEL[skill]}</Tag>;
}

export function Tag({ tone = 'navy', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${TAG_TONES[tone]} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}

// Segments for short flows; a single bar when there are many steps.
export function SegmentedProgress({ current, total, label }) {
  const pct = total ? Math.round(((current + 1) / total) * 100) : 0;
  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-label={label}>
      {total <= 12 ? (
        <div className="flex gap-1.5">
          {Array.from({ length: total }, (_, k) => (
            <div key={k} className={`h-1.5 flex-1 rounded-full transition-colors ${k < current ? 'bg-pw-navy' : k === current ? 'bg-pw-muted' : 'bg-pw-line'}`} />
          ))}
        </div>
      ) : (
        <div className="h-1.5 rounded-full bg-pw-line overflow-hidden">
          <div className="h-full rounded-full bg-pw-navy transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

const BTN = 'min-h-[44px] rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2';

export function PrimaryButton({ className = '', large = false, ...props }) {
  return <button type="button" className={`${BTN} bg-pw-navy text-white hover:bg-pw-navy-deep px-5 ${large ? 'min-h-[52px] text-lg' : 'text-base'} ${className}`} {...props} />;
}

export function SecondaryButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN} bg-white text-pw-navy border-2 border-pw-navy hover:bg-pw-soft px-4 text-base ${className}`} {...props} />;
}

export function QuietButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN} text-pw-navy hover:bg-pw-soft px-3 text-base ${className}`} {...props} />;
}

export function PillButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN} rounded-full bg-pw-soft text-pw-navy hover:bg-pw-soft-hover px-4 text-base ${className}`} {...props} />;
}

export function RaisedCard({ className = '', padding = 'p-5', children, ...props }) {
  return <div className={`rounded-[14px] bg-white border border-pw-line shadow-raised ${padding} ${className}`} {...props}>{children}</div>;
}

export function Eyebrow({ className = '', children }) {
  return <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-pw-muted ${className}`}>{children}</p>;
}

// --- Logo and Vía --------------------------------------------------------

// "Merging roads": a long road and a shorter side road merge and bend toward
// one dot. Geometry from docs/redesign/assets/pathways-mark*.svg.
const MARK_ROADS = 'M18 108C30 86 44 72 62 64M102 90C90 86 76 76 62 64M62 64C74 56 79 44 73 32';

// tone: ink (navy roads, red dot) | white (for red or blue posters: all white).
// At 24px and below it uses the heavier small geometry. Decorative unless
// `label` is given.
export function PathwaysMark({ size = 40, tone = 'ink', label, className = '' }) {
  const small = size <= 24;
  const white = tone === 'white';
  const stroke = small ? 14 : white ? 12 : 10;
  const r = small ? 13 : white ? 12 : 10;
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true, focusable: 'false' };
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`shrink-0 ${className}`} {...a11y}>
      <path d={MARK_ROADS} fill="none" stroke={white ? '#FFFFFF' : '#14264A'} strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="70" cy="20" r={r} fill={white ? '#FFFFFF' : '#D9483F'} />
    </svg>
  );
}

// Symbol + "Pathways" wordmark in Instrument Serif. layout: horizontal
// (symbol left of word) | stacked (symbol over word). Optional descriptor
// line, e.g. "Free U.S. citizenship test practice".
export function PathwaysLockup({ layout = 'horizontal', size, tone = 'ink', descriptor, className = '' }) {
  const stacked = layout === 'stacked';
  const markSize = size ?? (stacked ? 72 : 32);
  const text = tone === 'white' ? 'text-white' : 'text-pw-navy';
  const sub = tone === 'white' ? 'text-white' : 'text-pw-muted';
  return (
    <div className={`${stacked ? 'flex flex-col items-center text-center gap-2' : 'flex items-center gap-2.5'} ${className}`}>
      <PathwaysMark size={markSize} tone={tone} />
      <div className={stacked ? '' : 'min-w-0'}>
        <span className={`block font-display leading-none ${text}`} style={{ fontSize: Math.round(markSize * (stacked ? 0.66 : 0.95)) }}>
          Pathways
        </span>
        {descriptor && <span className={`mt-1 block text-base ${sub}`}>{descriptor}</span>}
      </div>
    </div>
  );
}

// Vía's V mark: two paths meeting at a red dot, pointing down. Vía is always
// this mark, never a face or photo. Decorative unless `label` is given
// (e.g. "Vía · AI tutor").
export function ViaMark({ size = 48, label, className = '' }) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true, focusable: 'false' };
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={`shrink-0 ${className}`} {...a11y}>
      <circle cx="24" cy="24" r="24" fill="#14264A" />
      <path d="M13 13c5 7 8.5 14 11 22" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <path d="M35 13c-5 7-8.5 14-11 22" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="36.5" r="4" fill="#D9483F" />
    </svg>
  );
}

// --- Cards, posters, folder ----------------------------------------------

// White index card. `tab`: a colored label above the card (`tabSkill` picks
// the subject color). `rule`: a thin red top rule.
export function IndexCard({ tab, tabSkill = 'n400', rule = false, padding = 'p-5', className = '', children, ...props }) {
  return (
    <div className={className} {...props}>
      {tab && (
        <span className={`ml-4 inline-block rounded-t-lg px-3 py-1 text-sm font-semibold ${SKILL_COLOR[tabSkill] || SKILL_COLOR.n400} ${SKILL_ON[tabSkill] || SKILL_ON.n400}`}>
          {tab}
        </span>
      )}
      <div className={`relative overflow-hidden rounded-[14px] bg-white border border-pw-line shadow-raised ${padding}`}>
        {rule && <span className="absolute inset-x-0 top-0 h-1 bg-pw-red" aria-hidden="true" />}
        {children}
      </div>
    </div>
  );
}

const POSTER_BG = { red: 'bg-pw-red-ink', blue: 'bg-pw-civics' };

// Buttons on a red or blue poster: solid white, or a white outline.
const POSTER_BTN = 'min-h-[48px] rounded-full px-5 inline-flex items-center justify-center gap-2 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed';
export const posterSolid = `${POSTER_BTN} bg-white text-pw-navy hover:bg-pw-soft`;
export const posterOutline = `${POSTER_BTN} border-2 border-white text-white hover:bg-white/10`;

// One star per card on a poster run. Upcoming cards are white stars, the
// current one is an outline, and a finished card takes its result color:
// green (right), yellow (almost) or red (missed). `results[k]` is 'right' |
// 'close' | 'missed' (lib/practiceResults); a passed card with no result
// stays white. Never torches or the Statue of Liberty. Hidden for long runs.
const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z';
const STAR_FILL = { right: 'fill-pw-go', close: 'fill-pw-almost', missed: 'fill-pw-miss' };
export function PosterStars({ index = 0, total = 0, results = [], className = '' }) {
  if (!total || total > 24) return null;
  return (
    <div className={`flex flex-wrap items-center gap-0.5 ${className}`} role="img" aria-label={outcomesLabel(index, total, results)}>
      {Array.from({ length: total }, (_, k) => {
        const current = k === index;
        const fill = results[k] ? STAR_FILL[results[k]] : current ? 'fill-transparent' : 'fill-white';
        return (
          <svg key={k} viewBox="0 0 24 24" className={current ? 'w-[22px] h-[22px]' : 'w-[17px] h-[17px]'} aria-hidden="true">
            <path d={STAR} className={`${fill} stroke-white`} strokeWidth={current ? 2.2 : 1.4} strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
}
// Older name.
export const PosterSquares = PosterStars;

// Ruled paper: the learner's own page (white, pale blue rules, a pale
// margin line). For the Listen-and-write surface, "Explain it simply", notes
// and the N-400 screens. Line height matches the rules (`leading-[36px]`).
export function RuledPaper({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`pw-ruled relative rounded-[6px] bg-white ps-12 pe-5 pt-3 pb-5 text-pw-navy shadow-[0_6px_18px_rgba(20,38,74,0.12)] ${className}`} {...props}>
      <span aria-hidden="true" className="absolute inset-y-0 start-8 w-0.5 bg-pw-margin" />
      {children}
    </Tag>
  );
}

// Full-bleed test/practice poster: white text on Red ink (≈ 5.6:1) or Civics
// blue (≈ 8.5:1). Use posterTone(index) to alternate. `answer` shows in
// Instrument Serif italic; `progress` ({ index, total }) adds the squares;
// `children` holds the controls.
export function Poster({ tone = 'red', label, question, answer, progress, questionAs: Q = 'h2', className = '', children, ...props }) {
  return (
    <section className={`relative ${POSTER_BG[tone] || POSTER_BG.red} text-white px-5 py-8 sm:px-8 sm:py-10 ${className}`} {...props}>
      <PathwaysMark size={36} tone="white" className="absolute right-5 top-6 sm:right-8 sm:top-8" />
      {label && <p className="pr-12 text-sm font-semibold uppercase tracking-[0.14em]">{label}</p>}
      {progress && <PosterStars {...progress} className="mt-3 pr-12" />}
      {question && <Q className="mt-4 text-[2rem] leading-tight font-bold sm:text-5xl">{question}</Q>}
      {answer && <p className="mt-5 font-display italic text-2xl leading-snug sm:text-3xl">{answer}</p>}
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}

const FOLDER_TAB_TONE = {
  navy: 'border-pw-navy',
  civics: 'border-pw-civics',
  reading: 'border-pw-reading',
  writing: 'border-pw-writing',
  speaking: 'border-pw-speaking',
  plum: 'border-pw-plum',
  sky: 'border-pw-sky',
};

// Manila folder (N-400 only). `tabs`: a row of FolderTab buttons on top.
export function Folder({ tabs, className = '', children, ...props }) {
  return (
    <div className={className} {...props}>
      {tabs && <div className="flex items-end gap-1.5 overflow-x-auto px-2">{tabs}</div>}
      <div className="rounded-[14px] bg-pw-manila p-3 text-pw-navy shadow-raised sm:p-6">{children}</div>
    </div>
  );
}

// A colored section tab on the folder. The active tab joins the folder.
export function FolderTab({ tone = 'navy', active = false, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-current={active ? 'true' : undefined}
      className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-t-lg border-t-4 px-3 text-base font-semibold text-pw-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy ${FOLDER_TAB_TONE[tone] || FOLDER_TAB_TONE.navy} ${active ? 'bg-pw-manila' : 'bg-pw-linen hover:bg-pw-manila'} ${className}`}
      {...props}
    />
  );
}

// N-400 wording, word for word, in Courier Prime.
export function FormQuote({ item, label = 'ON THE FORM · WORD FOR WORD', className = '', children }) {
  return (
    <figure className={`rounded-[10px] border border-pw-line bg-white p-4 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pw-muted">{label}</p>
      <blockquote className="mt-2 font-form text-base sm:text-lg leading-relaxed text-pw-navy">{children}</blockquote>
      {item != null && <figcaption className="mt-2 text-base text-pw-muted">— Form N-400, item {item}</figcaption>}
    </figure>
  );
}

// The standard way to ask for a simpler explanation. `onPoster` for use on a
// red or blue poster (white outline).
export function ExplainSimplyButton({ onPoster = false, className = '', children = 'Explain it simply', ...props }) {
  const look = onPoster
    ? 'border-2 border-white text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-0'
    : 'bg-pw-soft text-pw-navy hover:bg-pw-soft-hover';
  return <button type="button" className={`${BTN} rounded-full px-4 text-base ${look} ${className}`} {...props}>{children}</button>;
}
