import type { SVGProps } from "react";

type HeroIllustrationProps = Omit<SVGProps<SVGSVGElement>, "role" | "aria-labelledby" | "aria-describedby"> & {
  className?: string;
  /** Id for the <title>. Override when rendering more than once on a page. */
  titleId?: string;
};

const INK = "var(--ink)";
const SKIN_A = "#E58A57"; // terracotta
const SKIN_B = "var(--sky)";
const SKIN_C = "var(--pink)";

/** Limb drawn as a thick ink line with a colored line on top (outlined tube). */
function Limb({ d, color, w = 18 }: { d: string; color: string; w?: number }) {
  return (
    <>
      <path d={d} stroke={INK} strokeWidth={w} fill="none" />
      <path d={d} stroke={color} strokeWidth={w - 6} fill="none" />
    </>
  );
}

export function HeroIllustration({
  className,
  titleId = "hero-illustration-title",
  ...rest
}: HeroIllustrationProps) {
  const descId = `${titleId.replace(/-title$/, "")}-desc`;
  return (
    <svg
      viewBox="0 0 520 360"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
      className={className}
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <title id={titleId}>
        Illustration of three people with disabilities: a wheelchair user giving a peace sign, a
        person with a white cane giving a thumbs up, and a person in a hijab making a heart shape
      </title>
      <desc id={descId}>
        A flat, hand-drawn style scene on a cream background with bold black outlines. On the left,
        a person with terracotta skin sits in a yellow wheelchair with large black wheels. They wear
        a blue and yellow striped shirt, green trousers and orange shoes, and raise one hand in a
        peace sign. In the middle, a person with sky blue skin and dark sunglasses stands holding a
        white cane in one hand and giving a thumbs up with the other. They wear a dark blue top
        with a yellow band and orange cargo trousers. On the right, a person in an orange hijab,
        a yellow coat with pockets and a green skirt raises both arms to make a heart shape above
        their head. A yellow starburst, a squiggle, dots and leaves are scattered around them.
      </desc>
      <g stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        {/* ---------- background doodles ---------- */}
        <g transform="translate(153 52) scale(1.75)">
          <path
            d="M60.0 4.0 L69.8 20.2 L84.1 16.2 L85.2 31.6 L108.2 29.5 L100.2 44.8 L111.6 53.7 L98.7 64.7 L111.0 80.5 L94.6 83.9 L91.0 97.9 L77.2 92.8 L73.9 114.3 L60.0 100.0 L46.8 109.3 L40.0 98.1 L22.6 99.0 L28.7 81.6 L6.7 80.2 L19.3 64.9 L10.5 53.0 L23.5 46.2 L15.2 26.4 L32.1 28.6 L35.4 13.1 L50.4 21.2 Z"
            fill="var(--yellow)"
            strokeWidth={1.8}
          />
        </g>
        <path
          d="M18 44 C26 26 40 22 41 34 C42 46 27 47 31 35 C35 24 53 25 55 37 C57 48 44 48 48 38 C52 28 68 26 78 24"
          fill="none"
        />
        <g fill={INK} stroke="none">
          <circle cx="476" cy="26" r="5" />
          <circle cx="492" cy="22" r="4.5" />
          <circle cx="508" cy="28" r="5" />
        </g>
        <g transform="rotate(14 492 240)">
          <rect x="478" y="196" width="28" height="84" rx="14" fill="var(--teal)" />
          <circle cx="492" cy="216" r="5.5" fill="none" stroke="var(--yellow)" />
          <circle cx="492" cy="238" r="2.5" fill="var(--yellow)" stroke="none" />
          <circle cx="492" cy="252" r="2.5" fill="var(--yellow)" stroke="none" />
          <circle cx="492" cy="266" r="2.5" fill="var(--yellow)" stroke="none" />
        </g>
        <path d="M318 46 L331 28 L344 48 L357 28 L370 46" fill="none" stroke="var(--red)" />
        <g transform="translate(456 0)">
          <path d="M18 300 C16 278 30 266 52 266 C54 290 40 304 18 300 Z" fill="var(--green)" />
          <path d="M19 299 C28 289 38 281 47 272" fill="none" />
        </g>
        <path d="M0 326 H520" fill="none" />

        {/* ---------- (a) wheelchair user, peace sign ---------- */}
        <g transform="translate(-20 0)">
        {/* chair back + handle */}
        <rect x="68" y="130" width="17" height="92" rx="8.5" fill="var(--yellow)" />
        <rect x="52" y="126" width="30" height="11" rx="5.5" fill="var(--yellow)" />
        {/* leg rest tube and footplate */}
        <Limb d="M176 224 L190 304" color="var(--yellow)" w={13} />
        <rect x="190" y="304" width="46" height="10" rx="5" fill="var(--yellow)" />
        {/* neck + torso */}
        <rect x="113" y="104" width="18" height="22" rx="6" fill={SKIN_A} />
        <rect x="88" y="116" width="64" height="88" rx="18" fill="var(--sky)" stroke="none" />
        <g stroke="var(--yellow)" strokeWidth={9} strokeLinecap="butt">
          <path d="M88 140 H152" />
          <path d="M88 160 H152" />
          <path d="M88 180 H152" />
        </g>
        <rect x="88" y="116" width="64" height="88" rx="18" fill="none" />
        {/* seat, legs, shoe */}
        <rect x="84" y="214" width="108" height="14" rx="7" fill="var(--yellow)" />
        <rect x="100" y="192" width="98" height="28" rx="14" fill="var(--green)" />
        <rect x="190" y="204" width="26" height="92" rx="13" fill="var(--green)" />
        <rect x="190" y="284" width="42" height="21" rx="10.5" fill="var(--orange)" />
        {/* wheel */}
        <circle cx="102" cy="272" r="53" fill={INK} />
        <circle cx="102" cy="272" r="41" fill="var(--cream)" />
        <g strokeWidth={2.5}>
          <path d="M102 272 V233 M102 272 V311 M102 272 L63 272 M102 272 L141 272" fill="none" />
        </g>
        <circle cx="102" cy="272" r="9" fill="var(--yellow)" />
        <circle cx="178" cy="314" r="11" fill={INK} />
        <circle cx="178" cy="314" r="4" fill="var(--cream)" stroke="none" />
        {/* head */}
        <circle cx="122" cy="84" r="27" fill={SKIN_A} />
        <path
          d="M95 84 C90 54 124 46 146 62 C154 70 151 82 149 90 C144 76 130 70 114 74 C104 77 99 80 95 84 Z"
          fill={INK}
        />
        <circle cx="112" cy="46" r="9" fill={INK} />
        <circle cx="113" cy="90" r="2.6" fill={INK} stroke="none" />
        <circle cx="133" cy="90" r="2.6" fill={INK} stroke="none" />
        <path d="M113 100 Q123 109 134 100" fill="none" strokeWidth={2.5} />
        <circle cx="105" cy="99" r="4" fill="var(--pink)" stroke="none" />
        <circle cx="141" cy="99" r="4" fill="var(--pink)" stroke="none" />
        {/* arms: resting hand on lap, raised hand with peace sign */}
        <Limb d="M96 140 Q76 176 110 192" color="var(--sky)" />
        <circle cx="116" cy="193" r="9" fill={SKIN_A} />
        <Limb d="M146 134 Q176 130 178 94" color="var(--sky)" />
        <path d="M172 78 L165 50" stroke={INK} strokeWidth={11} fill="none" />
        <path d="M172 78 L165 50" stroke={SKIN_A} strokeWidth={5} fill="none" />
        <path d="M184 78 L194 52" stroke={INK} strokeWidth={11} fill="none" />
        <path d="M184 78 L194 52" stroke={SKIN_A} strokeWidth={5} fill="none" />
        <circle cx="178" cy="88" r="13" fill={SKIN_A} />

        </g>

        {/* ---------- (b) person with white cane, thumbs up ---------- */}
        {/* legs (cargo trousers) */}
        <rect x="236" y="194" width="27" height="116" rx="11" fill="var(--orange)" />
        <rect x="266" y="194" width="27" height="116" rx="11" fill="var(--orange)" />
        <rect x="241" y="236" width="17" height="22" rx="4" fill="var(--orange)" />
        <rect x="271" y="236" width="17" height="22" rx="4" fill="var(--orange)" />
        <path d="M241 244 H258 M271 244 H288" fill="none" strokeWidth={2} />
        <rect x="231" y="302" width="36" height="22" rx="10" fill={INK} />
        <rect x="263" y="302" width="36" height="22" rx="10" fill={INK} />
        {/* neck + torso with yellow band */}
        <rect x="256" y="102" width="18" height="22" rx="6" fill={SKIN_B} />
        <rect x="234" y="112" width="62" height="94" rx="18" fill="var(--sky-deep)" stroke="none" />
        <path d="M234 146 H296" stroke="var(--yellow)" strokeWidth={16} strokeLinecap="butt" fill="none" />
        <rect x="234" y="112" width="62" height="94" rx="18" fill="none" />
        {/* head */}
        <circle cx="265" cy="78" r="27" fill={SKIN_B} />
        <path
          d="M238 74 C236 46 270 40 290 56 C295 62 293 72 292 78 C286 66 272 62 256 66 C246 68 241 70 238 74 Z"
          fill={INK}
        />
        <rect x="244" y="72" width="20" height="14" rx="6" fill={INK} />
        <rect x="268" y="72" width="20" height="14" rx="6" fill={INK} />
        <path d="M264 77 H268" fill="none" />
        <path d="M248 76 H253" stroke="var(--cream)" strokeWidth={2} fill="none" />
        <path d="M272 76 H277" stroke="var(--cream)" strokeWidth={2} fill="none" />
        <path d="M256 98 Q266 106 277 98" fill="none" strokeWidth={2.5} />
        {/* cane + holding arm */}
        <path d="M308 150 L342 328" stroke={INK} strokeWidth={9} fill="none" />
        <path d="M308 150 L342 328" stroke="var(--paper)" strokeWidth={4} fill="none" />
        <g stroke="var(--red)" strokeWidth={4} strokeLinecap="butt" fill="none">
          <path d="M329 249 L331 259" />
          <path d="M334 275 L336 285" />
          <path d="M339 301 L341 311" />
        </g>
        <Limb d="M290 130 Q312 150 306 174" color="var(--sky-deep)" />
        <circle cx="306" cy="176" r="9" fill={SKIN_B} />
        {/* thumbs-up arm */}
        <Limb d="M240 132 Q206 146 208 116" color="var(--sky-deep)" />
        <rect x="201" y="76" width="13" height="28" rx="6.5" fill={SKIN_B} />
        <circle cx="208" cy="112" r="13" fill={SKIN_B} />
        <path d="M201 113 H215 M202 119 H215" fill="none" strokeWidth={2} />

        {/* ---------- (c) hijab, yellow coat, heart hands ---------- */}
        {/* legs + shoes */}
        <rect x="414" y="296" width="14" height="24" rx="6" fill={SKIN_C} />
        <rect x="436" y="296" width="14" height="24" rx="6" fill={SKIN_C} />
        <rect x="406" y="314" width="26" height="12" rx="6" fill="var(--orange)" />
        <rect x="432" y="314" width="26" height="12" rx="6" fill="var(--orange)" />
        {/* skirt */}
        <path d="M402 236 L464 236 L474 308 C452 316 420 316 392 308 Z" fill="var(--green)" />
        {/* hijab back */}
        <path
          d="M398 112 C394 66 470 66 466 112 C466 132 476 142 472 160 L392 160 C390 142 402 132 398 112 Z"
          fill="var(--orange)"
        />
        {/* coat */}
        <rect x="396" y="148" width="72" height="104" rx="18" fill="var(--yellow)" />
        <path d="M432 156 V250" fill="none" strokeWidth={2.5} />
        <rect x="403" y="206" width="22" height="24" rx="5" fill="var(--yellow-soft)" />
        <rect x="439" y="206" width="22" height="24" rx="5" fill="var(--yellow-soft)" />
        <g fill={INK} stroke="none">
          <circle cx="425" cy="176" r="2.6" />
          <circle cx="439" cy="176" r="2.6" />
        </g>
        {/* face */}
        <ellipse cx="432" cy="110" rx="21" ry="24" fill={SKIN_C} />
        <circle cx="424" cy="108" r="2.6" fill={INK} stroke="none" />
        <circle cx="441" cy="108" r="2.6" fill={INK} stroke="none" />
        <path d="M424 119 Q432 126 441 119" fill="none" strokeWidth={2.5} />
        <circle cx="417" cy="117" r="3.5" fill="var(--orange)" stroke="none" />
        <circle cx="448" cy="117" r="3.5" fill="var(--orange)" stroke="none" />
        {/* arms raised to the heart */}
        <Limb d="M404 150 Q364 124 384 84 Q392 64 412 52" color="var(--yellow)" />
        <Limb d="M460 150 Q500 124 480 84 Q472 64 452 52" color="var(--yellow)" />
        <path
          d="M432 68 C414 56 403 45 407 33 C411 20 428 20 432 33 C436 20 453 20 457 33 C461 45 450 56 432 68 Z"
          fill={SKIN_C}
        />
        <path d="M414 34 C416 30 420 29 423 31" fill="none" stroke="#fff" strokeWidth={2} />

        {/* ---------- foreground doodles ---------- */}
        <g fill="var(--yellow)">
          <circle cx="34" cy="334" r="5" />
          <circle cx="50" cy="340" r="4" />
          <circle cx="66" cy="334" r="5" />
        </g>
        <path d="M200 344 L214 330 L228 346 L242 330 L256 346" fill="none" stroke="var(--sky)" />
      </g>
    </svg>
  );
}
