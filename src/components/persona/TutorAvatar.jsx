import React from 'react';

// Six placeholder tutor avatars: simple illustrated adults, varied ages and
// skin tones, no uniforms or government imagery. Final art can replace these
// by keeping the same ids (a1–a6).
const AVATARS = {
  a1: { bg: '#F6E3D6', skin: '#E0AC83', hair: '#3B2A20', shirt: '#2F6F73', style: 'long', label: 'Woman with long dark hair' },
  a2: { bg: '#E3ECF7', skin: '#8D5524', hair: '#1E1A17', shirt: '#B4543A', style: 'short', label: 'Man with short dark hair' },
  a3: { bg: '#EEF2E3', skin: '#F1C7A5', hair: '#C9C9C9', shirt: '#5B6FA8', style: 'short', label: 'Older man with gray hair' },
  a4: { bg: '#F7E7EC', skin: '#5C3A21', hair: '#151110', shirt: '#D9A441', style: 'curly', label: 'Woman with curly hair' },
  a5: { bg: '#E6EEF0', skin: '#C68642', hair: '#2A1D15', shirt: '#7A4E8C', style: 'bun', label: 'Woman with hair in a bun' },
  a6: { bg: '#F4EBDD', skin: '#D9A57B', hair: '#D8D3CC', shirt: '#3E7D5A', style: 'bob', label: 'Older woman with short gray hair' },
};

function Hair({ style, color }) {
  switch (style) {
    case 'long':
      return <path d="M28 44c0-14 9-22 20-22s20 8 20 22v26h-8V48c-4-6-20-6-24 0v22h-8z" fill={color} />;
    case 'curly':
      return (
        <g fill={color}>
          {[[34, 32], [42, 26], [52, 26], [60, 32], [64, 41], [30, 41], [47, 24]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8" />
          ))}
        </g>
      );
    case 'bun':
      return (
        <g fill={color}>
          <circle cx="48" cy="20" r="7" />
          <path d="M30 42c0-11 8-18 18-18s18 7 18 18c-5-6-12-8-18-8s-13 2-18 8z" />
        </g>
      );
    case 'bob':
      return <path d="M29 46c0-14 9-22 19-22s19 8 19 22v8h-6v-12c-6-5-20-5-26 0v12h-6z" fill={color} />;
    default:
      return <path d="M31 40c0-10 8-16 17-16s17 6 17 16c-5-4-11-6-17-6s-12 2-17 6z" fill={color} />;
  }
}

export default function TutorAvatar({ avatar = 'a1', size = 56, className = '' }) {
  const a = AVATARS[avatar] || AVATARS.a1;
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      role="img"
      aria-label={a.label}
      className={`rounded-full shrink-0 ${className}`}
    >
      <circle cx="48" cy="48" r="48" fill={a.bg} />
      <path d="M18 96c2-18 14-26 30-26s28 8 30 26z" fill={a.shirt} />
      <rect x="42" y="58" width="12" height="12" rx="4" fill={a.skin} />
      <circle cx="48" cy="44" r="17" fill={a.skin} />
      <Hair style={a.style} color={a.hair} />
      <circle cx="42" cy="46" r="1.8" fill="#1F1A17" />
      <circle cx="54" cy="46" r="1.8" fill="#1F1A17" />
      <path d="M43 53c3 2.5 7 2.5 10 0" stroke="#1F1A17" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
