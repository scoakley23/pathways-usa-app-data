import React from 'react';

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

export const SKILL_LABEL = {
  civics: 'Civics',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  n400: 'Form N-400',
};

export function Tag({ tone = 'navy', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-button px-3 py-1.5 text-sm font-semibold ${TAG_TONES[tone] || NEUTRAL_TAG} ${className}`}>
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

// Buttons (docs/design-v2/tokens.css): 12px corners, Lexend 700, at
// least 44px tall. `main` is the ONE main action on a screen: navy (gold on navy), 56px,
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
// Amio v2 (docs/design-v2/tokens.css): the main button is navy with white
// text; on a navy screen it is gold with navy text.
const MAIN = `min-h-main mb-[5px] bg-navy text-white hover:bg-navy-2 ${MAIN_PRESS} px-6 text-lg`;
const MAIN_GOLD = `min-h-main mb-[5px] bg-gold text-navy hover:brightness-95 ${MAIN_PRESS} px-6 text-lg`;
// The main-button look for a link (a <Link> that is the screen's main action).
export const MAIN_LINK = `min-h-main mb-[5px] inline-flex items-center justify-center rounded-button bg-navy text-white hover:bg-navy-2 font-bold ${MAIN_PRESS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy`;
const LINK_LOOK = 'underline underline-offset-4 px-2 text-base';
const BUTTON_VARIANTS = {
  main: `${MAIN} focus-visible:ring-navy`,
  next: 'bg-navy text-white hover:bg-navy-deep px-5 text-base focus-visible:ring-navy',
  second: 'bg-white text-navy border border-line hover:bg-tint px-5 text-base focus-visible:ring-navy',
  link: `text-denim decoration-denim/40 hover:decoration-denim ${LINK_LOOK} focus-visible:ring-navy`,
};
const BUTTON_ON_NAVY = {
  main: `${MAIN_GOLD} focus-visible:ring-white focus-visible:ring-offset-navy`,
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
    return <span className={`inline-flex items-center gap-2 rounded-button px-3 py-1.5 text-sm font-semibold ${look} ${className}`} {...props}>{children}</span>;
  }
  return <button type="button" className={`min-h-tap rounded-button font-semibold inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 px-4 text-base ${look} ${onNavy ? 'focus-visible:ring-white focus-visible:ring-offset-navy' : 'focus-visible:ring-navy'} ${className}`} {...props}>{children}</button>;
}

// White card: 20px corners, a thin line border, no shadow.
export function Card({ className = '', padding = 'p-5', children, ...props }) {
  return <div className={`rounded-card bg-white border border-line ${padding} ${className}`} {...props}>{children}</div>;
}
export const RaisedCard = Card;

export function Eyebrow({ className = '', children }) {
  return <p className={`text-base font-semibold text-muted ${className}`} dir="auto">{children}</p>;
}

// Buttons on a navy poster: solid white, or an outline.
const POSTER_BTN = 'min-h-[48px] rounded-button px-5 inline-flex items-center justify-center gap-2 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed';
export const posterSolid = `${POSTER_BTN} bg-gold text-navy hover:brightness-95`;
export const posterOutline = `${POSTER_BTN} border border-navy-line text-white hover:bg-navy-2`;
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

// Full-bleed test/practice poster: white text on navy. `answer` shows in
// Lexend 700; `progress` ({ index, total }) adds a thin progress line;
// `children` holds the controls.
export function Poster({ label, question, answer, progress, questionAs: Q = 'h2', className = '', children, ...props }) {
  return (
    <section className={`relative rounded-card bg-navy text-white px-5 py-6 sm:px-8 sm:py-8 ${className}`} {...props}>
      {label && <p className="text-base font-semibold text-on-navy" dir="auto">{label}</p>}
      {progress && <div className="mt-3"><PosterProgress index={progress.index} total={progress.total} /></div>}
      {question && <Q className="mt-4 font-display text-[2rem] leading-[1.1] sm:text-[2.25rem]" lang="en" dir="ltr">{question}</Q>}
      {answer && <p className="mt-5 font-display text-2xl leading-snug sm:text-3xl">{answer}</p>}
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}

// The standard way to ask for a simpler explanation. `onPoster` for use on a
// navy poster.
export function ExplainSimplyButton({ onPoster = false, className = '', children = 'Explain it simply', ...props }) {
  const look = onPoster
    ? 'bg-chip-navy text-white hover:bg-chip-navy focus-visible:ring-white focus-visible:ring-offset-0'
    : 'bg-tint text-navy hover:bg-line focus-visible:ring-navy';
  return <button type="button" className={`${BTN} rounded-button px-4 text-base ${look} ${className}`} {...props}>{children}</button>;
}
