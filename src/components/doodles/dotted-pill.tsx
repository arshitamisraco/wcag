import type { DoodleProps } from "./types";

/** Tilted teal capsule with yellow rings and dots, ink outline. */
export function DottedPill({ className, style, ...rest }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 60 120"
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
      <g transform="rotate(-16 30 60)">
        <rect x="13" y="8" width="34" height="104" rx="17" fill="var(--teal)" stroke="var(--ink)" />
        <circle cx="30" cy="30" r="7" stroke="var(--yellow)" />
        <circle cx="30" cy="30" r="1.5" fill="var(--yellow)" stroke="none" />
        <circle cx="22" cy="52" r="2.4" fill="var(--yellow)" stroke="none" />
        <circle cx="37" cy="58" r="2.4" fill="var(--yellow)" stroke="none" />
        <circle cx="25" cy="70" r="2.4" fill="var(--yellow)" stroke="none" />
        <circle cx="31" cy="84" r="5" stroke="var(--yellow)" strokeWidth={2.5} />
        <circle cx="38" cy="98" r="2" fill="var(--yellow)" stroke="none" />
        <circle cx="22" cy="96" r="2" fill="var(--yellow)" stroke="none" />
      </g>
    </svg>
  );
}
