<!-- Source of truth for the Pathways brand (from the redesign canvas, Oct 2026). Reference SVGs are in docs/redesign/assets/. -->

# Pathways brand spec

## Name
- Brand: **Pathways**. Store title: **Pathways: US Citizenship Test** (29 chars). Subtitle: **Free tutor in your language** (27).
- Descriptor line used with the logo in marketing: "Free U.S. citizenship test practice".
- Required independence line wherever the brand meets the public: "Free practice · Not affiliated with USCIS".
- Never: "official", "USCIS" in the logo, seals, eagles, flags, shields, stars-and-stripes, Statue of Liberty, torches.

## Logo finalists (draw all in inline SVG, viewBox 0 0 120 120, navy #14264A + one red dot #D9483F)
- **F1 Merging roads** (lead): a long road sweeps in from lower left, a shorter side road joins from the right, the merged road bends on toward the red dot.
  Base geometry: `M18 108C30 86 44 72 62 64` + `M102 90C90 86 76 76 62 64` + `M62 64C74 56 79 44 73 32`, round caps, stroke ~10 (heavier at small sizes), dot `cx 70 cy 20 r 10`.
- **F2 Path P**: a lowercase/uppercase P whose bowl is a road that curves around and ends at the red dot; stem = navy stroke.
- **F3 Path wordmark**: "Pathways" in Instrument Serif; a thin path line runs under the word from the P and ends in the red dot after the s.
- Recommended system: F1 as the symbol/app icon + "Pathways" in Instrument Serif as the wordmark (lockup = symbol left, word right; stacked version symbol over word).

## Tutor
- Default tutor name **Vía** (Spanish "way/road" — a sibling of Pathways). Learners can rename their tutor.
- Vía's icon: the **V mark** — two paths that meet at a red dot, pointing DOWN (the Pathways mark leads up; Vía meets you where you are). SVG:
  `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#14264A"/><path d="M13 13c5 7 8.5 14 11 22" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/><path d="M35 13c-5 7-8.5 14-11 22" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="36.5" r="4" fill="#D9483F"/></svg>`
- Vía is ALWAYS the V mark — never a human face, photo, or drawn portrait (including the first hello). Always label "Vía · AI tutor".
- Show Vía's V mark once per screen: the center of the tab bar. Elsewhere her words are signed in text ("— Vía"), not with a second mark.
- Red dots: the Pathways logo dot and Vía's dot may share a screen (two dots allowed); no other Signal red decor on that screen.

## Color
| Name | Hex | Role |
|---|---|---|
| Ink | #14264A | text, primary buttons, logo |
| Ink deep | #0F1B36 | hover/pressed |
| Signal red | #D9483F | the dot, small decor only (never text) |
| Red ink | #B53A32 | red text, poster blocks with white text |
| Paper | #FFFFFF | cards |
| Mist | #F3F5F9 | app background |
| Linen | #ECEAE4 | warm ground for marketing/print |
| Slate | #D5DDEA | desk/ground behind cards |
| Line | #DEE4EE | borders |
| Muted | #3D4F73 | secondary text |
| Manila | #EFDFB8 | N-400 folder only |
| Civics | #1F4C8F | subject color |
| Reading | #1E6B66 | subject color |
| Writing | #2E7D4F | subject color |
| Speaking | #B53A32 | subject color |
Contrast: Ink on Paper/Mist/Linen ≥ 12:1; Muted on Paper ≈ 8.6:1; white on Red ink ≈ 5.6:1; white on Civics ≈ 8:1; Signal red is decor only.

## Type
- Display: **Instrument Serif** (400, italic) — headlines, numerals, Vía's spoken voice in italic.
- UI/body: **Instrument Sans** (400/500/600/700) — everything else; body ≥ 16px.
- Vía's handwriting: **Caveat** (600/700) — short margin notes only, ≥ 20px.
- Form quotes: **Courier Prime** (400/700) — N-400 wording only, labeled "ON THE FORM · WORD FOR WORD".

## Shape & motifs
- Index cards (radius 10–14, thin red top rule optional), manila folder with colored tabs (N-400), full-bleed poster for test questions, the red dot as the single accent per view, line drawings in navy with one red dot.

## Voice
- Calm, respectful, adult. Plain words. "Explain it simply" everywhere. No mascots, streaks, hearts, leaderboards.
- Legal line: "We explain what questions mean. How they apply to you is for a lawyer — Talk to a lawyer first."

## Additions (Oct 2026, after the X2 review)
- **Sky** `#A9CBEC`: light blue. Ink text and ink/white-pill buttons only (white text on Sky fails contrast). Used for the Writing practice tile and one N-400 section tab.
- **Plum** `#5E4A8C`: white text ≈ 7.4:1. One N-400 section tab.
- Practice hub order and colors: Reading (Civics blue) · Writing (Sky) · Civics (Red ink) · Speaking, the officer's questions (Ink). Start buttons on the tiles are white.
- Practice run progress: one star per card. Upcoming cards are white stars, the current one is an outlined star, and a finished card turns green (right), yellow (almost) or red (missed); the stars sit on an Ink deep strip so those colors stay visible on red and blue posters; the screen-reader label says the counts. Stars, never torches or the Statue of Liberty.
- **Ruled paper** = the learner's own page: white with pale blue rules and a pale margin line. Used for the Listen-and-write surface, the "Explain it simply" sheet, lesson notes, and the N-400 screens. Not on Today or the Practice hub.
- N-400 opens on a simple folder cover (one short paragraph, the sections-read chips, "Open the folder"), then the section list, then a question.
