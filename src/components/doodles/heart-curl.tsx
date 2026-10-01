import type { DoodleProps } from "./types";

/** One-stroke heart with a looping tail. Stroke only; colored via `text-*`. */
export function HeartCurl({ className, style, ...rest }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 80 80"
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
      <path d="M38 66 C20 54 7 43 9 28 C11 13 31 11 38 25 C44 11 66 12 68 28 C70 42 56 54 40 66 C47 72 57 72 60 66 C63 59 54 56 52 63" />
    </svg>
  );
}
