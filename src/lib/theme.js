// "The Road" palette as hex values, for places Tailwind classes can't reach
// (inline SVG fills, chart libraries, map layers). Same values and names as
// tailwind.config.js; change both together (docs/redesign/road-style-guide.md).
export const COLORS = {
  navy: '#0E1B33', // top areas, main dark buttons
  navy2: '#1A2B4D', // chips/pills on navy
  navyLine: '#2E4470', // borders on navy
  road: '#22355C', // unfilled road on navy
  cream: '#F5F3EE', // page/sheet background
  card: '#FFFFFF',
  cardLine: '#E2DED4',
  sand: '#E9E5DB',
  ink: '#12203A', // main text on cream
  ink2: '#4E5A72', // secondary text on cream
  inkLabel: '#5A6680',
  onNavy: '#FFFFFF',
  onNavy2: '#C9D5EE',
  onNavyLabel: '#9DB1D9',
  star: '#D63A30', // "you're here" and the one main action; never errors
  sky: '#7FA3E8', // completed stops, filled road
  correct: '#1E7A4F',
  notCorrect: '#A8460E',
};
