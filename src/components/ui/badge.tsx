import { cn } from "./cn";

const BADGE_BASE =
  "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-extrabold capitalize";

type Glyph = "circle" | "spinner" | "check" | "x" | "dash";

const STATUS: Record<string, { fill: string; glyph: Glyph }> = {
  queued: { fill: "bg-sand text-ink", glyph: "circle" },
  pending: { fill: "bg-sand text-ink", glyph: "circle" },
  skipped: { fill: "bg-sand text-ink", glyph: "dash" },
  running: { fill: "bg-sky text-ink", glyph: "spinner" },
  completed: { fill: "bg-green text-white", glyph: "check" },
  done: { fill: "bg-green text-white", glyph: "check" },
  failed: { fill: "bg-red-deep text-white", glyph: "x" },
};

function StatusGlyph({ glyph }: { glyph: Glyph }) {
  const common = {
    width: 12,
    height: 12,
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: "false" as const,
    className: "shrink-0",
  };
  switch (glyph) {
    case "circle":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="4" />
        </svg>
      );
    case "spinner":
      return (
        <svg {...common} className="shrink-0 animate-spin">
          <circle cx="6" cy="6" r="4" strokeDasharray="3 3" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M2 6.5 5 9.5 10 3" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M3 3l6 6M9 3 3 9" />
        </svg>
      );
    case "dash":
      return (
        <svg {...common}>
          <path d="M3 6h6" />
        </svg>
      );
  }
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.queued;
  return (
    <span className={cn(BADGE_BASE, s.fill)}>
      <StatusGlyph glyph={s.glyph} />
      {status}
    </span>
  );
}

const IMPACT: Record<string, { fill: string; bars: number }> = {
  critical: { fill: "bg-red-deep text-white", bars: 4 },
  serious: { fill: "bg-orange text-ink", bars: 3 },
  moderate: { fill: "bg-yellow text-ink", bars: 2 },
  minor: { fill: "bg-sky text-ink", bars: 1 },
  unknown: { fill: "bg-sand text-ink", bars: 0 },
};

function ImpactBars({ count }: { count: number }) {
  return (
    <svg
      width="14"
      height="12"
      viewBox="0 0 14 12"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
      fill="currentColor"
    >
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 3.5}
          y={9 - i * 3}
          width="2.5"
          height={3 + i * 3}
          rx="0.5"
          opacity={i < count ? 1 : 0.25}
        />
      ))}
    </svg>
  );
}

export function ImpactBadge({ impact }: { impact: string | null | undefined }) {
  const key = impact && impact in IMPACT ? impact : "unknown";
  const s = IMPACT[key];
  return (
    <span className={cn(BADGE_BASE, s.fill)}>
      <ImpactBars count={s.bars} />
      <span className="sr-only">impact: </span>
      {impact ?? "unknown"}
    </span>
  );
}
