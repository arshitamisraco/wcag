const STYLES: Record<string, string> = {
  queued: "bg-gray-100 text-gray-900 border-gray-500",
  running: "bg-blue-100 text-blue-950 border-blue-700",
  completed: "bg-green-100 text-green-950 border-green-700",
  failed: "bg-red-100 text-red-950 border-red-700",
  pending: "bg-gray-100 text-gray-900 border-gray-500",
  done: "bg-green-100 text-green-950 border-green-700",
  skipped: "bg-gray-100 text-gray-900 border-gray-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STYLES[status] ?? STYLES.queued}`}
    >
      {status}
    </span>
  );
}
