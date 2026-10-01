import { Squiggle } from "@/components/doodles";
import { cn } from "./cn";

export function SectionHeading({
  id,
  children,
  level = 2,
  eyebrow,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  level?: 2 | 3;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <div className={className}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-wide text-ink-2">{eyebrow}</p>
      ) : null}
      <Tag id={id} className={cn("font-display font-bold text-ink", level === 2 ? "text-3xl" : "text-xl")}>
        {children}
      </Tag>
      <Squiggle className="mt-1 h-4 w-24 text-orange" />
    </div>
  );
}
