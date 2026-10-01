import type { DoodleProps } from "./types";

/** Pointed green leaf with an ink center vein. */
export function Leaf({ className, style, ...rest }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 60 60"
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
      <path
        d="M7 53 C4 26 22 7 53 7 C55 36 36 56 7 53 Z"
        fill="var(--green)"
        stroke="var(--ink)"
      />
      <path d="M8 52 C22 39 34 27 46 14" stroke="var(--ink)" />
      <path d="M24 38 L24 47 M33 29 L42 30" stroke="var(--ink)" strokeWidth={2} />
    </svg>
  );
}
