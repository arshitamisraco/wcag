import { cn } from "./cn";

export function DataTable({
  caption,
  label,
  children,
  className,
}: {
  caption: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "overflow-x-auto rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_0_var(--ink)]",
        className,
      )}
    >
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({
  scope = "col",
  className,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={cn(
        "border-b-2 border-ink bg-yellow-soft px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink",
        className,
      )}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-sand px-4 py-3 align-top", className)} {...rest} />;
}

export function Tr({ className, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("odd:bg-paper even:bg-cream last:[&>td]:border-b-0", className)} {...rest} />
  );
}
