/** Violation-count change vs a previous scan. Color is never the only signal. */
export function Delta({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  const cls =
    diff < 0 ? "text-green-800" : diff > 0 ? "text-red-800" : "text-gray-800";
  const sign = diff < 0 ? "−" : diff > 0 ? "+" : "";
  const word = Math.abs(diff) === 1 ? "violation" : "violations";
  const label =
    diff < 0 ? "Improvement" : diff > 0 ? "Regression" : "No change";
  return (
    <span className={`font-semibold ${cls}`}>
      <span className="sr-only">{label}: </span>
      {diff === 0 ? "No change in violations" : `${sign}${Math.abs(diff)} ${word}`}
      {diff === 0 ? "" : " since last scan"}
    </span>
  );
}
