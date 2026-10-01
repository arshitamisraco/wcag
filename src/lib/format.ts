export function timeAgo(date: Date | string | null | undefined, now = new Date()): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.round((now.getTime() - d.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

export const IMPACTS = ["critical", "serious", "moderate", "minor"] as const;
export type Impact = (typeof IMPACTS)[number];

/** Tailwind classes; all pairs meet WCAG AA contrast (4.5:1). */
export const IMPACT_COLORS: Record<Impact | "unknown", string> = {
  critical: "bg-red-800 text-white",
  serious: "bg-orange-100 text-orange-950 border border-orange-700",
  moderate: "bg-yellow-100 text-yellow-950 border border-yellow-700",
  minor: "bg-blue-100 text-blue-950 border border-blue-700",
  unknown: "bg-gray-100 text-gray-900 border border-gray-500",
};

export function impactClass(impact: string | null | undefined): string {
  return IMPACT_COLORS[(impact as Impact) in IMPACT_COLORS ? (impact as Impact) : "unknown"];
}
