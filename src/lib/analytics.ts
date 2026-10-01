"use client";

import posthog from "posthog-js";

export type EventProps = Record<string, string | number | boolean | null>;

/**
 * Sends a PostHog event. No-ops when PostHog is not initialized (no key set,
 * server render, or blocked). Pass hostnames and ids only, never full URLs or HTML.
 */
export function track(event: string, props?: EventProps): void {
  try {
    if (typeof window === "undefined" || !posthog.__loaded) return;
    posthog.capture(event, props);
  } catch {
    // analytics must never break the app
  }
}
