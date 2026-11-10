<!-- Binding design spec for Pathways from Nov 2026. Replaces brand-spec.md.
     Source: the "Pathways UI Directions" design canvas (Round 5 = the chosen
     look, Round 4 = practice screens). Token names are what the code uses:
     tailwind.config.js and src/lib/theme.js. -->

# Pathways "The Road" style guide

## Fonts (Google Fonts)

- **Bricolage Grotesque 800**: headings and big numbers (`font-display`; `h1`–`h3` by default). Letter-spacing about −0.03em.
- **Inter 400 / 500 / 600**: everything else (`font-sans`). `font-bold` and `font-extrabold` show as 600.
- No other fonts: the old serif, italic serif, handwriting (Caveat) and typewriter (Courier Prime) fonts are gone.

## Colors

| Name in the guide | Hex | Tailwind token | Use |
| --- | --- | --- | --- |
| navy | `#0E1B33` | `navy` | top areas ("the what"), main dark buttons |
| navy-2 | `#1A2B4D` | `navy-2` | chips/pills sitting on navy |
| navy-line | `#2E4470` | `navy-line` | borders on navy |
| road | `#22355C` | `road` | unfilled road on navy |
| cream | `#F5F3EE` | `cream` | page/sheet background ("the do") |
| card | `#FFFFFF`, border `#E2DED4` | `bg-white`, `card-line` | cards on cream |
| sand | `#E9E5DB` | `sand` | "officer accepts" boxes, secondary chips on cream |
| text | `#12203A` | `ink` | main text on cream |
| text-2 | `#4E5A72` (labels `#5A6680`) | `ink-2`, `ink-label` | secondary text and labels on cream |
| on-navy | `#FFFFFF`; secondary `#C9D5EE`; labels `#9DB1D9` | `on-navy`, `on-navy-2`, `on-navy-label` | text on navy |
| star | `#D63A30` | `star` | the red star: "you're here" and the ONE main action. Never used for errors. |
| sky | `#7FA3E8` | `sky` | completed stops / filled road |
| correct | `#1E7A4F` | `correct` | always with a check icon and the word "Correct" |
| not-correct | `#A8460E` (heading text `#943D0C`) | `not-correct`, `not-correct-text` | always with an X icon and the words "Not correct"; also errors and warnings |

There are no skill or section colors: Reading, Writing, Civics, Speaking and the N-400 all use navy (fills) and sand (tints).

Contrast: white on star ≈ 4.7:1 (fine for button text), star on cream ≈ 4.2:1 (never use it for text), not-correct on cream ≈ 5.4:1, white on navy ≈ 17:1. Sky never takes white text.

## The layout rule

Every main screen is split. The top part is navy and says WHAT this is (title, question, where you are): `NavyTop`. Below it, a cream sheet with 28px rounded top corners holds what you DO (buttons, answers, lists, feedback): `CreamSheet`.

## Type sizes

Question text 38–40px; page titles 28–34px; card titles 22px (all Bricolage 800, letter-spacing about −0.03em). Body 16px Inter. Labels 12px Inter 600 uppercase, letter-spacing 0.12em (`text-label`). Never below 12px.

## Shapes

Cards 22px corners (`rounded-card`); sheets 28px top corners (`rounded-t-sheet`); buttons fully rounded (pill).

## Buttons (`Button` in `src/components/pathways/ui.jsx`)

- `variant="main"`: star red with white text, 56–60px tall, ONE per screen.
- `variant="next"`: next/continue. Navy on cream, or white on navy (`onNavy`).
- `variant="second"`: second choice, outlined.
- `variant="link"`: a text link.
- Every tap target at least 44×44px (`min-h-tap`).

## Icons and surfaces

Simple outline icons, 2px stroke. No emoji. No gradients except the progress fills. No drop shadows on cards (menus, dialogs and drawers keep one soft `shadow-float`).

## Bottom tab bar (Prompt 2)

4 tabs: Today, Study, Vía, N-400. Cream background, active tab in navy text with a 3px star-red line on top. No floating Vía button.

## Ground rules

- Change the look and layout only. Do not change features, grading, AI calls, what is saved, or who can see what.
- Do not add data fields. Any progress shown must come from data the app already saves.
- Keep every safety and privacy message (not affiliated with USCIS, not legal advice, Vía privacy reminder, "Talk to a lawyer first").
- Text must still fit when translated (longer languages) and must work right-to-left (Arabic, Farsi, Urdu): logical start/end spacing, no fixed-width text boxes.
