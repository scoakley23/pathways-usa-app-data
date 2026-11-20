import React from 'react';
import { posterTone, POSTER_SCHEME } from '@/lib/posterTone';
import { COLORS } from '@/lib/theme';

export { posterTone, POSTER_SCHEME };

// Pathways "The Road" building blocks (docs/redesign/road-style-guide.md).
// Use these and the Tailwind tokens (navy, cream, sand, star, ink, correct,
// not-correct, ...) instead of one-off hex colors.

// Tags and chips are labels, so every tone is the same quiet sand chip; only
// results get their own color (always with an icon and words).
const NEUTRAL_TAG = 'bg-tint text-navy';
const TAG_TONES = {
  red: NEUTRAL_TAG,
  blue: NEUTRAL_TAG,
  teal: NEUTRAL_TAG,
  green: NEUTRAL_TAG,
  navy: NEUTRAL_TAG,
  sky: NEUTRAL_TAG,
  manila: NEUTRAL_TAG,
  correct: 'bg-correct-bg text-correct',
  notCorrect: 'bg-not-yet-bg text-not-yet',
};
const DOT = {
  red: 'bg-navy', blue: 'bg-navy', teal: 'bg-navy', green: 'bg-navy', navy: 'bg-navy', sky: 'bg-navy', manila: 'bg-navy',
  correct: 'bg-correct', notCorrect: 'bg-not-yet',
};

// Skills no longer have their own colors: every skill is navy (solid) or
// sand (light). The maps stay so older callers keep working.
export const SKILL_TONE = {
  civics: 'navy',
  reading: 'navy',
  writing: 'navy',
  speaking: 'navy',
  n400: 'navy',
};
export const SKILL_BG = {
  civics: 'bg-tint',
  reading: 'bg-tint',
  writing: 'bg-tint',
  speaking: 'bg-tint',
  n400: 'bg-tint',
};
// Solid fill, for tabs, strips and tiles.
export const SKILL_COLOR = {
  civics: 'bg-navy',
  reading: 'bg-navy',
  writing: 'bg-navy',
  speaking: 'bg-navy',
  n400: 'bg-navy',
};
// Text on the solid fill.
export const SKILL_ON = {
  civics: 'text-white',
  reading: 'text-white',
  writing: 'text-white',
  speaking: 'text-white',
  n400: 'text-white',
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
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${DOT[SKILL_TONE[skill]] || DOT.navy} ${className}`} aria-hidden="true" />;
}

export function SkillTag({ skill, className = '' }) {
  return <Tag tone={SKILL_TONE[skill]} className={className}>{SKILL_LABEL[skill]}</Tag>;
}

export function Tag({ tone = 'navy', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${TAG_TONES[tone] || NEUTRAL_TAG} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${DOT[tone] || DOT.navy}`} aria-hidden="true" />
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
            <div key={k} className={`h-1.5 flex-1 rounded-full transition-colors ${k < current ? 'bg-navy' : k === current ? 'bg-muted' : 'bg-line'}`} />
          ))}
        </div>
      ) : (
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// Buttons (docs/redesign/amio-style-guide.md): 16px corners, Lexend 700, at
// least 44px tall. `main` is the ONE main action on a screen: denim, 56px,
// a 2.5px navy-deep outline and a 5px navy-deep "lip" under it
// (docs/design-v2/tokens.css); pressed, it sinks into the lip. `second` is white with
// a line border. `link` (also `text-link`) is a text link. `next` stays navy
// for screens not yet redone (`onNavy` makes it white on navy).
//
// Height: `min-h-tap` (44px) and `min-h-main` (56px) must never sit on the same
// button: the built CSS puts `.min-h-tap` last, so it would win and main
// buttons would be 44px. Main buttons get only `min-h-main`; all others `min-h-tap`.
const BTN_LOOK = 'font-bold inline-flex items-center justify-center gap-2 text-center transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
const BTN_BASE = `min-h-tap ${BTN_LOOK}`;
const BTN = `${BTN_BASE} rounded-button`;
const MAIN_BTN = `${BTN_LOOK} rounded-button`;
export const MAIN_PRESS = 'border-[2.5px] border-navy-deep shadow-lip active:translate-y-[5px] active:shadow-none motion-reduce:active:translate-y-0 motion-reduce:active:shadow-lip disabled:active:translate-y-0 disabled:active:shadow-lip';
const MAIN = `min-h-main mb-[5px] bg-denim text-white hover:bg-denim-deep ${MAIN_PRESS} px-6 text-lg`;
// The main-button look for a link (a <Link> that is the screen's main action).
export const MAIN_LINK = `min-h-main mb-[5px] inline-flex items-center justify-center rounded-button bg-denim text-white hover:bg-denim-deep font-bold ${MAIN_PRESS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy`;
const LINK_LOOK = 'underline underline-offset-4 px-2 text-base';
const BUTTON_VARIANTS = {
  main: `${MAIN} focus-visible:ring-navy`,
  next: 'bg-navy text-white hover:bg-navy-deep px-5 text-base focus-visible:ring-navy',
  second: 'bg-white text-navy border border-line hover:bg-tint px-5 text-base focus-visible:ring-navy',
  link: `text-denim decoration-denim/40 hover:decoration-denim ${LINK_LOOK} focus-visible:ring-navy`,
};
const BUTTON_ON_NAVY = {
  main: `${MAIN} focus-visible:ring-white focus-visible:ring-offset-navy`,
  next: 'bg-white text-navy hover:bg-paper px-5 text-base focus-visible:ring-white focus-visible:ring-offset-navy',
  second: 'bg-transparent text-white border border-chip-navy hover:bg-chip-navy px-5 text-base focus-visible:ring-white focus-visible:ring-offset-navy',
  link: `text-white decoration-white/50 hover:decoration-white ${LINK_LOOK} focus-visible:ring-white focus-visible:ring-offset-navy`,
};
const VARIANT_NAMES = { 'text-link': 'link' };

export function Button({ variant = 'next', onNavy = false, className = '', ...props }) {
  const name = VARIANT_NAMES[variant] || variant;
  const looks = onNavy ? BUTTON_ON_NAVY : BUTTON_VARIANTS;
  const known = Object.prototype.hasOwnProperty.call(looks, name);
  const look = known ? looks[name] : BUTTON_VARIANTS.next;
  const base = known && name === 'main' ? MAIN_BTN : BTN;
  return <button type="button" className={`${base} ${look} ${className}`} {...props} />;
}

// Older names, kept so every caller follows the new look.
export function PrimaryButton({ className = '', large = false, ...props }) {
  return <Button variant="next" className={`${large ? 'min-h-[52px] text-lg' : ''} ${className}`} {...props} />;
}

export function SecondaryButton(props) {
  return <Button variant="second" {...props} />;
}

export function QuietButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN} text-navy hover:bg-tint px-3 text-base focus-visible:ring-navy ${className}`} {...props} />;
}

// A chip: white with a line border, fully rounded; chip-navy on the navy
// banner. A button (at least 44px) when it has onClick.
export function Chip({ onNavy = false, className = '', children, ...props }) {
  const look = onNavy ? 'bg-chip-navy text-white hover:bg-navy-deep' : 'bg-white text-navy border border-line hover:bg-tint';
  if (!props.onClick) {
    return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${look} ${className}`} {...props}>{children}</span>;
  }
  return <button type="button" className={`min-h-tap rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 px-4 text-base ${look} ${onNavy ? 'focus-visible:ring-white focus-visible:ring-offset-navy' : 'focus-visible:ring-navy'} ${className}`} {...props}>{children}</button>;
}

export function PillButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN_BASE} rounded-full bg-tint text-navy hover:bg-line px-4 text-base focus-visible:ring-navy ${className}`} {...props} />;
}

// White card: 20px corners, a thin line border, no shadow.
export function Card({ className = '', padding = 'p-5', children, ...props }) {
  return <div className={`rounded-card bg-white border border-line ${padding} ${className}`} {...props}>{children}</div>;
}
export const RaisedCard = Card;

export function Eyebrow({ className = '', children }) {
  return <p className={`text-label uppercase text-muted ${className}`}>{children}</p>;
}

// --- The split screen ----------------------------------------------------
// Every main screen is split: a navy top says WHAT this is (title, question,
// where you are); a cream sheet with 28px top corners below holds what you DO.

export function NavyTop({ as: Tag = 'section', className = '', children, ...props }) {
  return <Tag className={`bg-navy text-white px-4 pt-6 pb-10 sm:px-8 ${className}`} {...props}>{children}</Tag>;
}

// The cream sheet. It overlaps the navy top by its corner radius so the
// corners show; `flush` turns that off.
export function CreamSheet({ as: Tag = 'section', flush = false, className = '', children, ...props }) {
  return (
    <Tag className={`relative bg-paper text-navy rounded-t-sheet px-4 pt-6 pb-8 sm:px-8 ${flush ? '' : '-mt-7'} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

// --- Logo --------------------------------------------------------------

// "Merging roads": a long road and a shorter side road merge and bend toward
// one dot. Geometry from docs/redesign/assets/pathways-mark*.svg. Only the
// lesson posters show it now, all white (Amio v2: red is Amio only, and the
// header and Welcome show Amio; the old PathwaysLockup and the red dot are
// gone). At 24px and below it uses the heavier small geometry. Decorative
// unless `label` is given.
const MARK_ROADS = 'M18 108C30 86 44 72 62 64M102 90C90 86 76 76 62 64M62 64C74 56 79 44 73 32';

export function PathwaysMark({ size = 40, label, className = '' }) {
  const small = size <= 24;
  const stroke = small ? 14 : 12;
  const r = small ? 13 : 12;
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true, focusable: 'false' };
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={`shrink-0 ${className}`} {...a11y}>
      <path d={MARK_ROADS} fill="none" stroke={COLORS.white} strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="70" cy="20" r={r} fill={COLORS.white} />
    </svg>
  );
}

// --- Cards, posters, folder ----------------------------------------------

// White index card. `tab`: a navy label above the card (`tabSkill` is kept
// for older callers). `rule`: a thin navy top rule.
export function IndexCard({ tab, tabSkill = 'n400', rule = false, padding = 'p-5', className = '', children, ...props }) {
  return (
    <div className={className} {...props}>
      {tab && (
        <span className={`ms-4 inline-block rounded-t-lg px-3 py-1 text-sm font-semibold ${SKILL_COLOR[tabSkill] || SKILL_COLOR.n400} ${SKILL_ON[tabSkill] || SKILL_ON.n400}`}>
          {tab}
        </span>
      )}
      <div className={`relative overflow-hidden rounded-card bg-white border border-line ${padding}`}>
        {rule && <span className="absolute inset-x-0 top-0 h-1 bg-navy" aria-hidden="true" />}
        {children}
      </div>
    </div>
  );
}

// Posters are navy whatever their tone (no alternating colors any more).
const POSTER_BG = { red: 'bg-navy', blue: 'bg-navy' };

// Buttons on a navy poster: solid white, or an outline.
const POSTER_BTN = 'min-h-[48px] rounded-full px-5 inline-flex items-center justify-center gap-2 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed';
export const posterSolid = `${POSTER_BTN} bg-white text-navy hover:bg-paper`;
export const posterOutline = `${POSTER_BTN} border-2 border-chip-navy text-white hover:bg-chip-navy`;
// Small tools on a poster (Listen, Translate) and quiet text links
// ("Type it instead"), shared by every practice card.
export const posterTool = 'min-h-11 rounded-full bg-chip-navy px-4 inline-flex items-center gap-2 text-base font-semibold text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';
export const posterLink = 'min-h-11 inline-flex items-center gap-2 text-base font-semibold text-white underline underline-offset-4 decoration-white/60 hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded';
// The one big white action button on a poster (microphone, play).
export const posterBigButton = 'relative w-[104px] h-[104px] rounded-full bg-white text-navy grid place-items-center disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60';

// Quiet progress on a poster run: one thin white segment per card, filled
// up to the current card. No stars, colors or text (the label carries
// "2 of 6"); results show only on the end-of-run summary. Hidden for long runs.
export function PosterProgress({ index = 0, total = 0, className = '' }) {
  if (!total || total > 24) return null;
  return (
    <div
      className={`flex gap-1 ${className}`}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={Math.min(index + 1, total)}
      aria-label={`Card ${Math.min(index + 1, total)} of ${total}`}
    >
      {Array.from({ length: total }, (_, k) => (
        <span key={k} aria-hidden="true" className={`h-1 flex-1 rounded-full ${k <= index ? 'bg-gold' : 'bg-chip-navy'}`} />
      ))}
    </div>
  );
}
// Older names.
export const PosterStars = PosterProgress;
export const PosterSquares = PosterProgress;

// Ruled paper: the learner's own page (white, pale blue rules, a pale
// margin line). For the Listen-and-write surface, "Explain it simply", notes
// and the N-400 screens. Line height matches the rules (`leading-[2.25rem]`).
export function RuledPaper({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`pw-ruled relative rounded-[6px] bg-white border border-line ps-12 pe-5 pt-3 pb-5 text-navy ${className}`} {...props}>
      <span aria-hidden="true" className="absolute inset-y-0 start-8 w-0.5 bg-line" />
      {children}
    </Tag>
  );
}

// Full-bleed test/practice poster: white text on navy. `tone` is kept for
// older callers (posterTone) but every poster is navy. `answer` shows in
// Lexend 700; `progress` ({ index, total }) adds a thin progress line;
// `children` holds the controls.
export function Poster({ tone = 'red', label, question, answer, progress, questionAs: Q = 'h2', className = '', children, ...props }) {
  return (
    <section className={`relative ${POSTER_BG[tone] || POSTER_BG.red} text-white px-5 py-8 sm:px-8 sm:py-10 ${className}`} {...props}>
      <PathwaysMark size={36} className="absolute end-5 top-6 sm:end-8 sm:top-8" />
      {label && <p className="pe-12 text-label uppercase text-on-navy">{label}</p>}
      {progress && <div className="mt-3 pe-12"><PosterProgress index={progress.index} total={progress.total} /></div>}
      {question && <Q className="mt-4 font-display text-[2.375rem] leading-[1.1] sm:text-[2.5rem]">{question}</Q>}
      {answer && <p className="mt-5 font-display text-2xl leading-snug sm:text-3xl">{answer}</p>}
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}

// N-400 folder: a sand panel with navy section tabs (no manila or section
// colors any more). `tabs`: a row of FolderTab buttons on top.
export function Folder({ tabs, className = '', children, ...props }) {
  return (
    <div className={className} {...props}>
      {tabs && <div className="flex items-end gap-1.5 overflow-x-auto px-2">{tabs}</div>}
      <div className="rounded-card bg-tint p-3 text-navy sm:p-6">{children}</div>
    </div>
  );
}

// A section tab on the folder. `tone` is kept for older callers. The active
// tab joins the folder.
// eslint-disable-next-line no-unused-vars
export function FolderTab({ tone = 'navy', active = false, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-current={active ? 'true' : undefined}
      className={`min-h-tap shrink-0 whitespace-nowrap rounded-t-lg border-t-4 border-navy px-3 text-base font-semibold text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${active ? 'bg-tint' : 'bg-paper hover:bg-tint'} ${className}`}
      {...props}
    />
  );
}

// N-400 wording, word for word (Lexend, on a white card).
export function FormQuote({ item, label = 'ON THE FORM · WORD FOR WORD', className = '', children }) {
  return (
    <figure className={`rounded-card border border-line bg-white p-4 ${className}`}>
      <p className="text-label uppercase text-muted">{label}</p>
      <blockquote className="mt-2 text-base sm:text-lg font-medium leading-relaxed text-navy">{children}</blockquote>
      {item != null && <figcaption className="mt-2 text-base text-muted">— Form N-400, item {item}</figcaption>}
    </figure>
  );
}

// The standard way to ask for a simpler explanation. `onPoster` for use on a
// navy poster.
export function ExplainSimplyButton({ onPoster = false, className = '', children = 'Explain it simply', ...props }) {
  const look = onPoster
    ? 'bg-chip-navy text-white hover:bg-chip-navy focus-visible:ring-white focus-visible:ring-offset-0'
    : 'bg-tint text-navy hover:bg-line focus-visible:ring-navy';
  return <button type="button" className={`${BTN} rounded-full px-4 text-base ${look} ${className}`} {...props}>{children}</button>;
}
