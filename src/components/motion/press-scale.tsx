"use client";

import { motion } from "motion/react";

/** Lifts slightly on hover and squishes on press. */
export function PressScale({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      style={{ display: "inline-block" }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.div>
  );
}
