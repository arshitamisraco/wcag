import type { DoodleProps } from "./types";

/** A row of four filled dots, slightly uneven. Colored via `text-*`. */
export function DotsRow({ className, style, ...rest }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 80 20"
      fill="currentColor"
      {...rest}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="9" cy="11" r="6" />
      <circle cx="29" cy="9" r="5.5" />
      <circle cx="49" cy="11" r="6" />
      <circle cx="69" cy="9" r="5" />
    </svg>
  );
}

/** Scattered confetti: dots, tiny triangles and dashes in the palette. */
export function Confetti({ className, style, ...rest }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="22" cy="24" r="7" fill="var(--yellow)" stroke="var(--ink)" />
      <path d="M62 14 L76 38 L50 36 Z" fill="var(--orange)" stroke="var(--ink)" />
      <path d="M104 18 L118 10" stroke="var(--sky)" strokeWidth={5} />
      <circle cx="160" cy="20" r="5" fill="var(--pink)" stroke="var(--ink)" />
      <path d="M182 56 L170 78 L192 80 Z" fill="var(--teal)" stroke="var(--ink)" />
      <path d="M20 78 L38 90" stroke="var(--red)" strokeWidth={5} />
      <circle cx="84" cy="74" r="6" fill="var(--sky)" stroke="var(--ink)" />
      <path d="M118 100 L136 88" stroke="var(--yellow)" strokeWidth={5} />
      <circle cx="58" cy="106" r="3.5" fill="var(--ink)" stroke="none" />
      <circle cx="150" cy="62" r="3" fill="var(--ink)" stroke="none" />
    </svg>
  );
}
