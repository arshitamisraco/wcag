import { cn } from "./cn";

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-ink bg-sand px-2 py-0.5 font-mono text-xs font-semibold text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
