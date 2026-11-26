import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Amio } from '@/components/pathways/Amio';
import { COLORS } from '@/lib/theme';

// The app icon (browser tab, home screen, install): Amio smiling with the
// English language mark (the tilde), white on navy, drawn from the same
// shapes as the in-app Amio (Amio.jsx). Never edit the PNGs in public/icons
// by hand: change Amio, then run `npm run icons` (scripts/icons/), which
// writes the SVGs and PNGs and scripts/icons/icons.lock.json.
// appIcon.test.js fails when the icons no longer match Amio.

const CANVAS = 512;
const AMIO_W = 150; // Amio's viewBox is 150 × 154
const AMIO_H = 154;
// Amio's body sits 5 units left of the viewBox's middle (room for the
// listening waves on the right), so the icon moves it back to the centre.
const BODY_OFFSET = 5;

// `any` icons: rounded navy square, Amio large. `square`: full-bleed navy
// (iPhone adds its own corners; transparent corners would turn black).
// `maskable`: full-bleed with Amio inside Android's safe circle (80%).
export const ICON_SHAPES = {
  any: { amio: 0.8, corner: 112 },
  square: { amio: 0.76, corner: 0 },
  maskable: { amio: 0.58, corner: 0 },
};

export function appIconSvg(shape = 'any') {
  const { amio, corner } = ICON_SHAPES[shape];
  const size = Math.round(CANVAS * amio);
  const height = (size * AMIO_H) / AMIO_W;
  const x = (CANVAS - size) / 2 + (size * BODY_OFFSET) / AMIO_W;
  const y = (CANVAS - height) / 2;
  const markup = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={CANVAS} height={CANVAS} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
      <rect width={CANVAS} height={CANVAS} rx={corner} fill={COLORS.navy} />
      <g transform={`translate(${x} ${y})`}>
        <Amio mood="hello" lang="en" onNavy size={size} />
      </g>
    </svg>
  );
  return `${markup}\n`;
}

// Every file the script writes: [file in public/icons, shape, size or 'svg'].
export const ICON_FILES = [
  ['amio.svg', 'any', 'svg'],
  ['amio-16.png', 'any', 16],
  ['amio-32.png', 'any', 32],
  ['amio-180.png', 'square', 180],
  ['amio-192.png', 'any', 192],
  ['amio-512.png', 'any', 512],
  ['amio-512-maskable.png', 'maskable', 512],
];
