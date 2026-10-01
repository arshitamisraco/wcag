"use client";

import { animate, useMotionValue, useReducedMotion, useTransform, motion } from "motion/react";
import { useEffect } from "react";

const format = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Animates a number from 0 to `value`. Screen readers get the final value
 * immediately via the sr-only span; the animating digits are aria-hidden.
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
  const mv = useMotionValue(0);
  const text = useTransform(mv, format);

  useEffect(() => {
    if (reduced) return;
    mv.set(0);
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [value, duration, reduced, mv]);

  if (reduced) {
    return <span className={className}>{value.toLocaleString("en-US")}</span>;
  }

  return (
    <span className={className}>
      <motion.span aria-hidden="true">{text}</motion.span>
      <span className="sr-only">{value.toLocaleString("en-US")}</span>
    </span>
  );
}
