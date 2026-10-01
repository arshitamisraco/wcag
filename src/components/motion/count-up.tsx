"use client";

import { animate, useMotionValue, useReducedMotion, useTransform, motion } from "motion/react";
import { useEffect } from "react";

const format = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Animates a number from 0 to `value` after mount. The server render (and any
 * client without JS) shows the final value, so content is never missing on first
 * paint. Screen readers get the final value via the sr-only span; the animating
 * digits are aria-hidden. Under reduced motion no animation runs.
 */
export function CountUp({
  value,
  duration = 0.9,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, format);

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    mv.set(0);
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [value, duration, reduced, mv]);

  return (
    <span className={className}>
      <motion.span aria-hidden="true">{text}</motion.span>
      <span className="sr-only">{value.toLocaleString("en-US")}</span>
    </span>
  );
}
