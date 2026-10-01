"use client";

import { useEffect, useRef } from "react";
import { track, type EventProps } from "@/lib/analytics";

/** Fires one analytics event when mounted. Renders nothing. */
export function TrackOnMount({ event, props }: { event: string; props?: EventProps }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(event, props);
    // fire once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
