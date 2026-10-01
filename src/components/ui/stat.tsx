import { CountUp } from "@/components/motion/count-up";
import { CardLabel } from "./card";
import { cn } from "./cn";
import { TONE_BG, type Tone } from "./tones";

/** One summary figure. Render inside a `<dl>`; emits a single `<div>` wrapping `<dt>`/`<dd>`. */
export function Stat({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: React.ReactNode;
  value: number;
  sub?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-ink p-5 shadow-[4px_4px_0_0_var(--ink)]",
        tone ? TONE_BG[tone] : "bg-paper",
        className,
      )}
    >
      <dt>
        <CardLabel>{label}</CardLabel>
      </dt>
      <dd className="mt-1 font-display text-4xl font-bold text-ink">
        <CountUp value={value} />
      </dd>
      {sub ? <dd className="mt-1 text-sm text-ink-2">{sub}</dd> : null}
    </div>
  );
}
