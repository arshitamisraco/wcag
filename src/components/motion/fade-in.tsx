"use client";

import { motion } from "motion/react";

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
} as const;

export type FadeInTag = keyof typeof TAGS;

/** Fades and lifts its children into place on mount. */
export function FadeIn({
  children,
  delay = 0,
  y = 12,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: FadeInTag;
}) {
  const Comp = TAGS[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      {children}
    </Comp>
  );
}
