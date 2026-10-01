# Doodle UI design system

Visual reference: a flat, hand-drawn illustration of four people with disabilities on a cream
background. Bold black outlines, saturated primary fills (sky blue, orange, yellow, dark green,
pink, red), confetti doodles (squiggles, starbursts, dotted pills, zigzags, dots). Playful but
not childish. Everything below must keep WCAG 2.2 AA.

## Tokens (Tailwind v4 utilities)

| Token | Hex | Utility | Use |
| --- | --- | --- | --- |
| cream | #FBF6EC | `bg-cream` | Page background |
| paper | #FFFDF7 | `bg-paper` | Card surfaces |
| ink | #1B1B1F | `text-ink` `border-ink` `bg-ink` | All body text, outlines, primary button bg |
| ink-2 | #3A3A42 | `text-ink-2` | Secondary text (10.5:1 on cream) |
| sky | #4DB7F0 | `bg-sky` | Fill only, ink text (7.6:1) |
| sky-deep | #0A4F96 | `text-sky-deep` | Links (7.6:1 on cream), white text on it (6.7:1) |
| orange | #F2693A | `bg-orange` | Fill only, ink text (5.6:1) |
| orange-deep | #A33A12 | `bg-orange-deep` | White text on it (6.6:1) |
| yellow | #FFC72C | `bg-yellow` | Fill, highlights, focus halo. Ink text (11:1) |
| yellow-soft | #FFE48A | `bg-yellow-soft` | Subtle fill, ink text |
| green | #1F6E4F | `bg-green` `text-green` | White text on it (6.2:1); as text on cream (5.7:1) |
| green-deep | #174F39 | | White text on it (9.5:1) |
| green-soft | #BFE8CF | `bg-green-soft` | Fill, ink text |
| pink | #F7A8C4 | `bg-pink` | Fill only, ink text (9.3:1) |
| pink-soft | #FBD3E1 | | Fill, ink text |
| red | #E63946 | `bg-red` | DECORATIVE FILL ONLY. Fails for text either way. |
| red-deep | #A8142A | `bg-red-deep` `text-red-deep` | White text on it (7.5:1); as text on cream (passes) |
| teal | #1FA87A | `bg-teal` | DECORATIVE FILL ONLY |
| sand | #E9E3D6 | `bg-sand` `border-sand` | Dividers, neutral chips (ink text 13:1) |

Rules:
- Text is always `text-ink`, `text-ink-2`, `text-sky-deep` (links), `text-green`, `text-red-deep`,
  or white on `ink`/`sky-deep`/`green`/`green-deep`/`red-deep`/`orange-deep`.
- Never put text on `red`, `teal`, or any fill not listed above.
- Every colored component has a `border-2 border-ink` (or `border-[3px]`). This is both the art
  style and the 3:1 non-text contrast boundary.
- Color is never the only signal: pair with text labels, icons, or shape.

## Shape language

- Corners: `rounded-2xl` on cards, `rounded-full` on pills/buttons, `rounded-xl` on inputs.
- Outline: `border-2 border-ink` everywhere (buttons, cards, inputs, badges, table container).
- Depth: hard offset shadow `shadow-[4px_4px_0_0_var(--ink)]` (tokens: `--shadow-offset`,
  `--shadow-offset-sm`, `--shadow-offset-lg`). Pressed state translates by the offset and drops
  the shadow. No blur, no gradients.
- Decorative doodles are SVG React components in `src/components/doodles/`, all `aria-hidden`
  and `focusable="false"`, positioned absolutely behind content with `pointer-events-none`.

## Typography

- Display: Fredoka (via `next/font/google`, CSS var `--font-fredoka`), weights 500-700. Applied
  to h1-h4 globally and via `font-display`.
- Body: Nunito (CSS var `--font-nunito`), 400/600/700/800. Base size 17px, line-height 1.6.
- Mono: system monospace for selectors and code.
- Sizes: h1 `text-4xl sm:text-5xl lg:text-6xl`, h2 `text-3xl`, h3 `text-xl`. Max line length
  `max-w-prose` for paragraphs.

## Components (`src/components/ui/`)

- `Button`: variants `primary` (bg-ink text-cream), `secondary` (bg-yellow text-ink),
  `accent` (bg-sky text-ink), `ghost` (bg-transparent text-ink, border). Sizes `sm|md|lg`.
  Min target 44x44 CSS px. Disabled: `bg-sand text-ink-2` and `aria-disabled`, keep readable.
  Accepts `asChild`-like `href` to render a Next `Link`.
- `Card`: paper surface, ink border, offset shadow. Optional `tone` for a colored top strip.
- `Badge`: `StatusBadge` and `ImpactBadge`. Each has a text label plus a small shape glyph
  so status is not color-only.
- `Pill`: WCAG tag chip (`bg-sand`, mono text).
- `SectionHeading`: h2 with an underline doodle (small squiggle SVG) beneath.
- `Alert`: `tone: info|success|error` with icon + text; `role="alert"` or `role="status"` as
  appropriate (passed by caller).
- `EmptyState`: illustration slot + heading + text + optional action.
- `DataTable`: wrapper with ink border, zebra rows via `bg-paper`/`bg-cream`, sticky header,
  horizontal scroll with `tabIndex=0` and an accessible name on the scroll region.
- `Stat`: big number with label for summary grids (used with CountUp).

## Motion (`motion/react`, package `motion`)

- `src/components/motion/motion-provider.tsx`: `"use client"`, wraps children in
  `<MotionConfig reducedMotion="user">` so every animation collapses when the OS asks.
- Primitives (all `"use client"`): `FadeIn` (opacity+y), `Stagger` + `StaggerItem` (list
  entrance, 40-60ms stagger), `CountUp` (animates number, renders the final value in an
  `aria-live="off"` span and a visually hidden final value for screen readers from first paint),
  `Float` (gentle y/rotate loop for doodles only, never for content), `PressScale`
  (whileTap scale 0.97 wrapper for buttons), `Pulse` (scan-running indicator).
- Durations 0.3-0.6s, springs with `bounce: 0.25`. Ambient loops only on `aria-hidden` doodles.
- No animation may hide or move content on first paint in a way that blocks reading: initial
  opacity may start at 0 only when the element animates in within 600ms.
- Reduced motion: `MotionConfig reducedMotion="user"` + the CSS media query in globals.css.

## Accessibility checklist (WCAG 2.2 AA)

- Landmarks: header/nav, main (`id="main"`), footer. Skip link first in DOM.
- One h1 per page; headings nest without skipping.
- All interactive targets at least 24x24 (we use 44x44).
- Visible focus (global `:focus-visible` ring) never suppressed.
- Links underlined (`underline decoration-2 underline-offset-4`), colored `text-sky-deep`.
- Tables keep `caption`, `scope`, `th` for row headers.
- Live regions: scan poller `role="status" aria-live="polite"`; errors `role="alert"`.
- Decorative SVG: `aria-hidden="true" focusable="false"`. Meaningful SVG: `role="img"` + `<title>`.
- `prefers-reduced-motion` honored (MotionConfig + CSS).
- Zoom to 200% and 320px width must not clip or require horizontal page scroll (tables may
  scroll inside their own labeled region).
