// Amio, the tutor character. Copy this file as-is; don't redraw the shapes.
// Source of truth: docs/design-v2/frames/AmioCharacter.png and AmioLanguages.png.
//
// <Amio mood="hello" lang="es" size={72} />
// <Amio mood="listening" lang="ar" onDark />   // Arabic, Urdu, Persian flip the tail automatically
// <AmioSays>Buenos días, Lucía.</AmioSays>      // the hand-drawn speech bubble
//
// Rules: red (#F0503C) is Amio only. The language mark is navy on light
// backgrounds and white on navy (onDark). Below 32px the mark is hidden.

import React from "react";

export type AmioMood =
  | "hello" | "listening" | "thinking" | "speaking"
  | "cheering" | "proud" | "tryAgain" | "waiting";

// Website / app languages with their own mark. Any other language shows the dot ("en").
export type AmioLang =
  | "en" | "es" | "vi" | "ht" | "zh" | "ar" | "ko" | "ru"
  | "uk" | "pt" | "fr" | "hi" | "pa" | "bn" | "ur" | "fa";

const RED = "#F0503C";
const NAVY = "#1E2B45";
const GOLD = "#FFC23D";
const SKY = "#A9CBEC";
const RTL: AmioLang[] = ["ar", "ur", "fa"];

const BODY =
  "M60 14 C90 12 108 32 106 58 C104 82 86 98 62 98 C56 98 52 97 48 96 L22 112 L32 88 C18 80 12 66 14 52 C16 30 36 16 60 14Z";

function Face({ mood }: { mood: AmioMood }) {
  const eyes = (
    <>
      <circle cx="46" cy="50" r="13" fill="#fff" />
      <circle cx="76" cy="50" r="13" fill="#fff" />
      <circle cx="48.5" cy="52" r="6.5" fill={NAVY} />
      <circle cx="78.5" cy="52" r="6.5" fill={NAVY} />
    </>
  );
  const s = { fill: "none", stroke: NAVY, strokeLinecap: "round" as const };
  switch (mood) {
    case "listening":
      return (<>
        <circle cx="45" cy="50" r="15" fill="#fff" /><circle cx="77" cy="50" r="15" fill="#fff" />
        <circle cx="47" cy="50" r="7.5" fill={NAVY} /><circle cx="79" cy="50" r="7.5" fill={NAVY} />
        <ellipse cx="62" cy="76" rx="5" ry="4" fill={NAVY} />
        <path d="M113 38 Q124 56 113 74" {...s} strokeWidth={4} />
        <path d="M121 30 Q135 56 121 82" {...s} strokeWidth={4} opacity={0.4} />
      </>);
    case "thinking":
      return (<>
        <circle cx="46" cy="50" r="13" fill="#fff" /><circle cx="76" cy="50" r="13" fill="#fff" />
        <circle cx="42" cy="46" r="6.5" fill={NAVY} /><circle cx="72" cy="46" r="6.5" fill={NAVY} />
        <path d="M52 75 H72" {...s} strokeWidth={5} />
      </>);
    case "speaking":
      return (<>
        {eyes}
        <path d="M47 68 Q62 92 77 68Z" fill={NAVY} />
        <path d="M113 38 L124 32 M115 54 L128 54 M113 70 L124 76" {...s} strokeWidth={4} />
      </>);
    case "cheering":
      return (<>
        <path d="M33 54 Q46 36 59 54 M63 54 Q76 36 89 54" {...s} strokeWidth={5.5} />
        <path d="M45 66 Q62 94 79 66Z" fill={NAVY} />
        <rect x="4" y="2" width="8" height="8" fill={GOLD} transform="rotate(20 8 6)" />
        <rect x="116" y="40" width="8" height="8" fill={GOLD} transform="rotate(-25 120 44)" />
        <circle cx="112" cy="-6" r="4.5" fill={SKY} /><circle cx="6" cy="62" r="4" fill={SKY} />
      </>);
    case "proud":
      return (<>
        <path d="M33 56 Q46 40 59 56 M63 56 Q76 40 89 56" {...s} strokeWidth={5.5} />
        <ellipse cx="32" cy="68" rx="8" ry="5" fill="#FFB3A6" /><ellipse cx="92" cy="68" rx="8" ry="5" fill="#FFB3A6" />
        <path d="M48 72 Q62 84 76 72" {...s} strokeWidth={5} />
        <path d="M118 -6 L122 4 L133 5 L125 12 L127 23 L118 17 L109 23 L111 12 L103 5 L114 4Z" fill={GOLD} />
      </>);
    case "tryAgain":
      return (<>
        <circle cx="46" cy="52" r="13" fill="#fff" /><circle cx="76" cy="52" r="13" fill="#fff" />
        <circle cx="48.5" cy="55" r="6.5" fill={NAVY} /><circle cx="78.5" cy="55" r="6.5" fill={NAVY} />
        <path d="M32 40 L56 31 M90 40 L66 31" {...s} strokeWidth={4.5} />
        <path d="M52 76 Q62 71 72 76" {...s} strokeWidth={5} />
      </>);
    case "waiting":
      return (<>
        <path d="M33 52 A13 13 0 0 0 59 52Z" fill="#fff" /><path d="M63 52 A13 13 0 0 0 89 52Z" fill="#fff" />
        <circle cx="46" cy="55" r="5" fill={NAVY} /><circle cx="76" cy="55" r="5" fill={NAVY} />
        <path d="M31 52 H61 M61 52 H91" {...s} strokeWidth={4.5} />
        <path d="M54 76 Q62 80 70 76" {...s} strokeWidth={4.5} />
      </>);
    default: // hello
      return (<>{eyes}<path d="M50 71 Q62 81 74 71" {...s} strokeWidth={5} /></>);
  }
}

function Mark({ lang, color }: { lang: AmioLang; color: string }) {
  const st = { fill: "none", stroke: color, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (lang) {
    case "es": return <path d="M42 -2 Q52 -16 62 -6 T82 -6" {...st} strokeWidth={8} />;           // tilde ñ
    case "vi": return <path d="M50 2 L62 -10 L74 2" {...st} strokeWidth={8} />;                     // circumflex ê
    case "ht": return <path d="M52 -12 L70 4" {...st} strokeWidth={8} />;                           // grave ò
    case "zh": return <path d="M50 -10 L62 2 L74 -10" {...st} strokeWidth={8} />;                  // caron ǎ (pinyin)
    case "ar": return <path d="M46 0 Q51 -14 57 -3 Q62 -14 67 -3 Q73 -14 78 0" {...st} strokeWidth={7} />; // shadda
    case "ko": return <circle cx="62" cy="-6" r="8" fill="none" stroke={color} strokeWidth={6} />; // ㅇ
    case "ru": return <><circle cx="51" cy="-6" r="6" fill={color} /><circle cx="73" cy="-6" r="6" fill={color} /></>; // ё
    case "uk": return <path d="M48 -10 Q62 8 76 -10" {...st} strokeWidth={8} />;                   // breve й
    case "pt": return <path d="M66 98 L66 106 Q78 106 76 114 Q74 122 62 120" {...st} strokeWidth={7} />; // cedilla ç (below)
    case "fr": return <path d="M54 4 L72 -12" {...st} strokeWidth={8} />;                          // acute é
    case "hi": return <><path d="M48 0 Q62 14 76 0" {...st} strokeWidth={7} /><circle cx="62" cy="-12" r="5" fill={color} /></>; // chandrabindu
    case "pa": return <><circle cx="56" cy="-8" r="6" fill={color} /><path d="M60 -4 Q76 -4 78 8" {...st} strokeWidth={6} /></>; // bindi/tippi
    case "bn": return <><circle cx="62" cy="-18" r="6" fill={color} /><circle cx="62" cy="-2" r="6" fill={color} /></>; // visarga
    case "ur": return <><circle cx="62" cy="-18" r="5.5" fill={color} /><circle cx="52" cy="-2" r="5.5" fill={color} /><circle cx="72" cy="-2" r="5.5" fill={color} /></>;
    case "fa": return <path d="M72 -14 Q56 -16 56 -7 Q56 0 68 0 L75 -6" {...st} strokeWidth={7} />; // hamza
    default:   return <circle cx="62" cy="-6" r="7" fill={color} />;                              // English and fallback: dot
  }
}

export function Amio({
  mood = "hello", lang = "es", size = 72, onDark = false, label,
}: { mood?: AmioMood; lang?: AmioLang; size?: number; onDark?: boolean; label?: string }) {
  const rtl = RTL.includes(lang);
  const showMark = size >= 32;
  return (
    <svg width={size} height={size * 154 / 150} viewBox="-10 -26 150 154"
      role="img" aria-label={label ?? "Amio"} style={{ flex: "none" }}>
      <g transform={rtl ? "translate(124 0) scale(-1 1)" : undefined}>
        <path d={BODY} fill={RED} />
      </g>
      <Face mood={mood} />
      {showMark && <Mark lang={lang} color={onDark ? "#fff" : NAVY} />}
    </svg>
  );
}

// The hand-drawn speech bubble Amio talks in. One short line, never a paragraph.
export function AmioSays({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", flex: 1, color: NAVY }}>
      <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        <path d="M16 6 C80 2 200 4 292 8 C297 34 296 66 291 94 C200 98 100 97 18 93 C15 80 13 66 14 56 L2 46 L15 38 C14 26 14 16 16 6Z"
          fill="#fff" stroke={RED} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "relative", padding: "12px 16px 12px 24px", fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
        {children}
      </div>
    </div>
  );
}
