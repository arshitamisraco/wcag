"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

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
      if (res.status === 429 && data.scanId) {
        router.push(`/scans/${data.scanId}`);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      track("rescan_clicked", { site_id: siteId });
      router.push(`/scans/${data.scanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={onClick} disabled={busy}>
        {busy ? "Starting..." : label}
      </Button>
      <p role="alert" className="mt-2 text-sm font-bold text-red-deep">
        {error}
      </p>
    </div>
  );
}
