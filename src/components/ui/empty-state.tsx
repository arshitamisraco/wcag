export function EmptyState({
  illustration,
  title,
  children,
  action,
}: {
  illustration?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink bg-paper px-6 py-10 text-center">
      {illustration ? <div className="mb-1">{illustration}</div> : null}
      <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
      {children ? <div className="max-w-prose text-ink-2">{children}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
