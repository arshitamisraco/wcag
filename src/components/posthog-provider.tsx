"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { Suspense, useEffect } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

function init() {
  if (!POSTHOG_KEY || typeof window === "undefined" || posthog.__loaded) return;
  posthog.init(POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: POSTHOG_HOST.replace(".i.posthog.com", ".posthog.com"),
    capture_pageview: false,
    person_profiles: "identified_only",
  });
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    init();
    if (!posthog.__loaded) return;
    // Path only: query strings can contain user-entered data.
    posthog.capture("$pageview", { $current_url: window.location.origin + pathname });
  }, [pathname, searchParams]);
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {POSTHOG_KEY ? (
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
      ) : null}
      {children}
    </>
  );
}
