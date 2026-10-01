import type { DoodleProps } from "./types";

/** Loose hand-drawn curl with a few loops. Stroke only; colored via `text-*`. */
export function Squiggle({ className, style, ...rest }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 80 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 27 C10 12 24 7 25 18 C26 30 11 31 15 19 C19 8 37 9 39 21 C41 33 28 33 32 22 C36 11 55 10 56 22 C57 31 50 32 50 25 C50 17 66 13 76 12" />
    </svg>
  );
}
