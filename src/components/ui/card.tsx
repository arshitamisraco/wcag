import { cn } from "./cn";
import { TONE_BG, type Tone } from "./tones";

export type CardTone = Tone;

export function Card({
  children,
  className,
  tone,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: CardTone;
  as?: "div" | "section" | "article" | "li" | "aside";
}) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-ink p-5 shadow-[4px_4px_0_0_var(--ink)]",
        tone ? TONE_BG[tone] : "bg-paper",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({
  children,
  className,
  as: Tag = "h3",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3" | "h4";
}) {
  return <Tag className={cn("font-display text-xl font-bold text-ink", className)}>{children}</Tag>;
}

export function CardLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("text-xs font-bold uppercase tracking-wide text-ink-2", className)}>
      {children}
    </span>
  );
}
