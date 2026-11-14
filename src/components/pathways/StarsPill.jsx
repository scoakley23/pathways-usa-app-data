import React from 'react';

// A gold star and a count (frame R33Today): chip-navy on the navy banner,
// white with a line border on the page.
export function StarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" fill="currentColor" />
    </svg>
  );
}

export default function StarsPill({ count = 0, onNavy = true, label, className = '' }) {
  const look = onNavy ? 'bg-chip-navy text-white' : 'bg-white text-navy border border-line';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold ${look} ${className}`}
      aria-label={label || `${count} ${count === 1 ? 'star' : 'stars'}`}
      role="img"
    >
      <StarIcon className="w-4 h-4 text-gold" />
      <span aria-hidden="true">{count}</span>
    </span>
  );
}
