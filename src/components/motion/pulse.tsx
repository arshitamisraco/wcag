"use client";

import { motion } from "motion/react";

/** Pulsing dot for the scan-running status. Decorative; the text beside it carries the meaning. */
export function Pulse({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        width: 12,
        height: 12,
        borderRadius: "9999px",
        background: "var(--ink)",
        flexShrink: 0,
      }}
      animate={{ scale: [1, 1.4], opacity: [1, 0.5] }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
      }}
    />
  );
}
