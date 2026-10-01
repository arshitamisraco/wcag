"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/analytics";

function hostOf(input: string): string {
  try {
    const t = input.trim();
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`).hostname;
  } catch {
    return "unknown";
  }
}

export function ScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429 && data.scanId) {
        router.push(`/scans/${data.scanId}`);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      track("scan_submitted", { url_host: hostOf(url) });
      router.push(`/scans/${data.scanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl" noValidate>
      <label htmlFor="url" className="block text-sm font-semibold text-gray-900">
        Page URL
      </label>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        <input
          id="url"
          name="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="https://example.com"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-describedby={error ? "url-error" : undefined}
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 rounded-md border border-gray-600 px-3 py-2 text-gray-900 placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="rounded-md bg-blue-800 px-5 py-2 font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-600"
        >
          {busy ? "Starting..." : "Scan"}
        </button>
      </div>
      <p id="url-error" role="alert" className="mt-2 text-sm font-medium text-red-800">
        {error}
      </p>
    </form>
  );
}
