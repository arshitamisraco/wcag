import type { DoodleProps } from "./types";

/** Irregular 13-point yellow burst with an orange dotted pill inside. */
export function Starburst({ className, style, ...rest }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 120 120"
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
        d="M60.0 4.0 L69.8 20.2 L84.1 16.2 L85.2 31.6 L108.2 29.5 L100.2 44.8 L111.6 53.7 L98.7 64.7 L111.0 80.5 L94.6 83.9 L91.0 97.9 L77.2 92.8 L73.9 114.3 L60.0 100.0 L46.8 109.3 L40.0 98.1 L22.6 99.0 L28.7 81.6 L6.7 80.2 L19.3 64.9 L10.5 53.0 L23.5 46.2 L15.2 26.4 L32.1 28.6 L35.4 13.1 L50.4 21.2 Z"
        fill="var(--yellow)"
        stroke="var(--ink)"
      />
      <g transform="rotate(28 60 60)">
        <rect x="45" y="32" width="30" height="56" rx="15" fill="var(--orange)" stroke="var(--ink)" />
        <path
          d="M60 42 V78"
          stroke="var(--ink)"
          strokeWidth={4}
          strokeDasharray="0.1 8"
        />
        <circle cx="53" cy="48" r="1.6" fill="var(--yellow)" stroke="none" />
        <circle cx="67" cy="56" r="1.6" fill="var(--yellow)" stroke="none" />
        <circle cx="53" cy="66" r="1.6" fill="var(--yellow)" stroke="none" />
        <circle cx="67" cy="74" r="1.6" fill="var(--yellow)" stroke="none" />
      </g>
    </svg>
  );
}
