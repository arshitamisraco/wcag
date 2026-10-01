export type Tone = "sky" | "yellow" | "orange" | "pink" | "green-soft" | "paper";

/** Full class strings so Tailwind v4's source scan picks every one up. */
export const TONE_BG: Record<Tone, string> = {
  sky: "bg-sky",
  yellow: "bg-yellow",
  orange: "bg-orange",
  pink: "bg-pink",
  "green-soft": "bg-green-soft",
  paper: "bg-paper",
};
