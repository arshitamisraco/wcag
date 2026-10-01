"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LABELS: Record<string, string> = {
  queued: "Scan queued, waiting for a worker...",
  running: "Scanning the page and generating explanations...",
};

export function ScanPoller({ scanId, initialStatus }: { scanId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/scans/${scanId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setStatus(data.scan.status);
        router.refresh();
      } catch {
        // transient network error; retry on next tick
      }
    };
    const id = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [scanId, router]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-blue-700 bg-blue-50 px-4 py-3 text-blue-950"
    >
      {LABELS[status] ?? `Scan ${status}`}
    </div>
  );
}
