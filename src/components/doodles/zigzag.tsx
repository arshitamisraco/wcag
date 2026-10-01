import type { DoodleProps } from "./types";

/** Six-segment hand-drawn zigzag. Stroke only; colored via `text-*`. */
export function Zigzag({ className, style, ...rest }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 100 30"
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
      <path d="M4 23 L19 6 L34 25 L51 5 L65 24 L82 8 L96 21" />
    </svg>
  );
}
