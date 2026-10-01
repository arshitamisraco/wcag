"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RescanButton({ siteId, label = "Re-scan now" }: { siteId: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/rescan`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      router.push(`/scans/${data.scanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="rounded-md bg-blue-800 px-4 py-2 font-semibold text-white hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 disabled:cursor-not-allowed disabled:bg-gray-600"
      >
        {busy ? "Starting..." : label}
      </button>
      <p role="alert" className="mt-1 text-sm font-medium text-red-800">
        {error}
      </p>
    </div>
  );
}
