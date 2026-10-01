"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Ambient loop for DECORATIVE, aria-hidden doodles only. Never wrap real content
 * in Float: continuously moving content fails WCAG 2.2.2 (Pause, Stop, Hide).
 */
export function Float({
  children,
  className,
  amplitude = 8,
  duration = 4,
  rotate = 3,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
  rotate?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ y: -amplitude, rotate: -rotate }}
      animate={{ y: amplitude, rotate }}
      transition={{
        duration,
        delay,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
      }}
    >
      {children}
    </motion.div>
  );
}
