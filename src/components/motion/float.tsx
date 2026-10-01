"use client";

import { motion } from "motion/react";

/**
 * Ambient loop for DECORATIVE, aria-hidden doodles only. Never wrap real content
 * in Float: continuously moving content fails WCAG 2.2.2 (Pause, Stop, Hide).
 *
 * Always renders the same element on server and client (no hydration mismatch).
 * Under reduced motion, MotionConfig reducedMotion="user" skips the transform
 * animation and the doodle simply sits still.
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
  return (
    <motion.div
      className={className}
      animate={{ y: [-amplitude, amplitude], rotate: [-rotate, rotate] }}
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
