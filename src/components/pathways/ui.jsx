import React from 'react';
import { posterTone, POSTER_SCHEME } from '@/lib/posterTone';
import { COLORS } from '@/lib/theme';

export { posterTone, POSTER_SCHEME };

// Pathways "The Road" building blocks (docs/redesign/road-style-guide.md).
// Use these and the Tailwind tokens (navy, cream, sand, star, ink, correct,
// not-correct, ...) instead of one-off hex colors.

// Tags and chips are labels, so every tone is the same quiet sand chip; only
// results get their own color (always with an icon and words).
const NEUTRAL_TAG = 'bg-sand text-ink';
const TAG_TONES = {
  red: NEUTRAL_TAG,
  blue: NEUTRAL_TAG,
  teal: NEUTRAL_TAG,
  green: NEUTRAL_TAG,
  navy: NEUTRAL_TAG,
  sky: NEUTRAL_TAG,
  manila: NEUTRAL_TAG,
  correct: 'bg-correct-soft text-correct',
  notCorrect: 'bg-not-correct-soft text-not-correct',
};
const DOT = {
  red: 'bg-navy', blue: 'bg-navy', teal: 'bg-navy', green: 'bg-navy', navy: 'bg-navy', sky: 'bg-navy', manila: 'bg-navy',
  correct: 'bg-correct', notCorrect: 'bg-not-correct',
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
  civics: 'bg-sand',
  reading: 'bg-sand',
  writing: 'bg-sand',
  speaking: 'bg-sand',
  n400: 'bg-sand',
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
            <div key={k} className={`h-1.5 flex-1 rounded-full transition-colors ${k < current ? 'bg-navy' : k === current ? 'bg-ink-2' : 'bg-card-line'}`} />
          ))}
        </div>
      ) : (
        <div className="h-1.5 rounded-full bg-card-line overflow-hidden">
          <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// Buttons are pills, at least 44px tall. `main` is the star-red action:
// ONE per screen, 56-60px. `next` moves on (navy on cream; `onNavy` makes it
// white on navy). `second` is the outlined second choice. `link` is a text link.
const BTN = 'min-h-tap rounded-full font-semibold inline-flex items-center justify-center gap-2 text-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
const BUTTON_VARIANTS = {
  main: 'min-h-main bg-star text-white hover:bg-star-deep px-6 text-lg focus-visible:ring-navy',
  next: 'bg-navy text-white hover:bg-navy-deep px-5 text-base focus-visible:ring-navy',
  second: 'bg-transparent text-ink border-2 border-navy hover:bg-sand px-5 text-base focus-visible:ring-navy',
  link: 'text-ink underline underline-offset-4 decoration-ink/40 hover:decoration-ink px-2 text-base focus-visible:ring-navy',
};
const BUTTON_ON_NAVY = {
  main: 'min-h-main bg-star text-white hover:bg-star-deep px-6 text-lg focus-visible:ring-white focus-visible:ring-offset-navy',
  next: 'bg-white text-navy hover:bg-cream px-5 text-base focus-visible:ring-white focus-visible:ring-offset-navy',
  second: 'bg-transparent text-white border-2 border-navy-line hover:bg-navy-2 px-5 text-base focus-visible:ring-white focus-visible:ring-offset-navy',
  link: 'text-white underline underline-offset-4 decoration-white/50 hover:decoration-white px-2 text-base focus-visible:ring-white focus-visible:ring-offset-navy',
};

export function Button({ variant = 'next', onNavy = false, className = '', ...props }) {
  const look = (onNavy ? BUTTON_ON_NAVY : BUTTON_VARIANTS)[variant] || BUTTON_VARIANTS.next;
  return <button type="button" className={`${BTN} ${look} ${className}`} {...props} />;
}

// Older names, kept so every caller follows the new look.
export function PrimaryButton({ className = '', large = false, ...props }) {
  return <Button variant="next" className={`${large ? 'min-h-[52px] text-lg' : ''} ${className}`} {...props} />;
}

export function SecondaryButton(props) {
  return <Button variant="second" {...props} />;
}

export function QuietButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN} text-ink hover:bg-sand px-3 text-base focus-visible:ring-navy ${className}`} {...props} />;
}

// A chip: sand on cream, navy-2 on navy. As a button when it has onClick.
export function Chip({ onNavy = false, className = '', children, ...props }) {
  const look = onNavy ? 'bg-navy-2 text-white hover:bg-navy-line' : 'bg-sand text-ink hover:bg-sand-hover';
  if (!props.onClick) {
    return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${look} ${className}`} {...props}>{children}</span>;
  }
  return <button type="button" className={`${BTN} px-4 text-base ${look} ${onNavy ? 'focus-visible:ring-white focus-visible:ring-offset-navy' : 'focus-visible:ring-navy'} ${className}`} {...props}>{children}</button>;
}

export function PillButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN} bg-sand text-ink hover:bg-sand-hover px-4 text-base focus-visible:ring-navy ${className}`} {...props} />;
}

// White card on cream: 22px corners, a thin line, no shadow.
export function Card({ className = '', padding = 'p-5', children, ...props }) {
  return <div className={`rounded-card bg-white border border-card-line ${padding} ${className}`} {...props}>{children}</div>;
}
export const RaisedCard = Card;

export function Eyebrow({ className = '', children }) {
  return <p className={`text-label uppercase text-ink-label ${className}`}>{children}</p>;
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
    <Tag className={`relative bg-cream text-ink rounded-t-sheet px-4 pt-6 pb-8 sm:px-8 ${flush ? '' : '-mt-7'} ${className}`} {...props}>
      {children}
    </Tag>
  );
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
      <path d={MARK_ROADS} fill="none" stroke={white ? COLORS.onNavy : COLORS.navy} strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="70" cy="20" r={r} fill={white ? COLORS.onNavy : COLORS.star} />
    </svg>
  );
}

// Symbol + "Pathways" wordmark in Bricolage Grotesque 800. layout: horizontal
// (symbol left of word) | stacked (symbol over word). Optional descriptor
// line, e.g. "Free U.S. citizenship test practice".
export function PathwaysLockup({ layout = 'horizontal', size, tone = 'ink', descriptor, className = '' }) {
  const stacked = layout === 'stacked';
  const markSize = size ?? (stacked ? 72 : 32);
  const text = tone === 'white' ? 'text-white' : 'text-navy';
  const sub = tone === 'white' ? 'text-on-navy-2' : 'text-ink-2';
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
      <circle cx="24" cy="24" r="24" fill={COLORS.navy} />
      <path d="M13 13c5 7 8.5 14 11 22" fill="none" stroke={COLORS.onNavy} strokeWidth="4" strokeLinecap="round" />
      <path d="M35 13c-5 7-8.5 14-11 22" fill="none" stroke={COLORS.onNavy} strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="36.5" r="4" fill={COLORS.star} />
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
      <div className={`relative overflow-hidden rounded-card bg-white border border-card-line ${padding}`}>
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
export const posterSolid = `${POSTER_BTN} bg-white text-navy hover:bg-cream`;
export const posterOutline = `${POSTER_BTN} border-2 border-navy-line text-white hover:bg-navy-2`;
// Small tools on a poster (Listen, Translate) and quiet text links
// ("Type it instead"), shared by every practice card.
export const posterTool = 'min-h-11 rounded-full bg-navy-2 px-4 inline-flex items-center gap-2 text-base font-semibold text-white hover:bg-navy-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';
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
        <span key={k} aria-hidden="true" className={`h-1 flex-1 rounded-full ${k <= index ? 'bg-sky' : 'bg-road'}`} />
      ))}
    </div>
  );
}
// Older names.
export const PosterStars = PosterProgress;
export const PosterSquares = PosterProgress;

// Ruled paper: the learner's own page (white, pale blue rules, a pale
// margin line). For the Listen-and-write surface, "Explain it simply", notes
// and the N-400 screens. Line height matches the rules (`leading-[36px]`).
export function RuledPaper({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`pw-ruled relative rounded-[6px] bg-white border border-card-line ps-12 pe-5 pt-3 pb-5 text-ink ${className}`} {...props}>
      <span aria-hidden="true" className="absolute inset-y-0 start-8 w-0.5 bg-pw-margin" />
      {children}
    </Tag>
  );
}

// Full-bleed test/practice poster: white text on navy. `tone` is kept for
// older callers (posterTone) but every poster is navy. `answer` shows in
// Bricolage; `progress` ({ index, total }) adds a thin progress line;
// `children` holds the controls.
export function Poster({ tone = 'red', label, question, answer, progress, questionAs: Q = 'h2', className = '', children, ...props }) {
  return (
    <section className={`relative ${POSTER_BG[tone] || POSTER_BG.red} text-white px-5 py-8 sm:px-8 sm:py-10 ${className}`} {...props}>
      <PathwaysMark size={36} tone="white" className="absolute end-5 top-6 sm:end-8 sm:top-8" />
      {label && <p className="pe-12 text-label uppercase text-on-navy-label">{label}</p>}
      {progress && <div className="mt-3 pe-12"><PosterProgress index={progress.index} total={progress.total} /></div>}
      {question && <Q className="mt-4 font-display text-[38px] leading-[1.1] sm:text-[40px]">{question}</Q>}
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
      <div className="rounded-card bg-sand p-3 text-ink sm:p-6">{children}</div>
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
      className={`min-h-tap shrink-0 whitespace-nowrap rounded-t-lg border-t-4 border-navy px-3 text-base font-semibold text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${active ? 'bg-sand' : 'bg-cream hover:bg-sand'} ${className}`}
      {...props}
    />
  );
}

// N-400 wording, word for word (Inter, on a white card).
export function FormQuote({ item, label = 'ON THE FORM · WORD FOR WORD', className = '', children }) {
  return (
    <figure className={`rounded-card border border-card-line bg-white p-4 ${className}`}>
      <p className="text-label uppercase text-ink-label">{label}</p>
      <blockquote className="mt-2 text-base sm:text-lg font-medium leading-relaxed text-ink">{children}</blockquote>
      {item != null && <figcaption className="mt-2 text-base text-ink-2">— Form N-400, item {item}</figcaption>}
    </figure>
  );
}

// The standard way to ask for a simpler explanation. `onPoster` for use on a
// navy poster.
export function ExplainSimplyButton({ onPoster = false, className = '', children = 'Explain it simply', ...props }) {
  const look = onPoster
    ? 'bg-navy-2 text-white hover:bg-navy-line focus-visible:ring-white focus-visible:ring-offset-0'
    : 'bg-sand text-ink hover:bg-sand-hover focus-visible:ring-navy';
  return <button type="button" className={`${BTN} rounded-full px-4 text-base ${look} ${className}`} {...props}>{children}</button>;
}
