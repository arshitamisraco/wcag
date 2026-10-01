"use client";

import { motion, type Variants } from "motion/react";

const CONTAINER_TAGS = {
  div: motion.div,
  section: motion.section,
  ul: motion.ul,
  ol: motion.ol,
} as const;

const ITEM_TAGS = {
  div: motion.div,
  li: motion.li,
  article: motion.article,
} as const;

export type StaggerTag = keyof typeof CONTAINER_TAGS;
export type StaggerItemTag = keyof typeof ITEM_TAGS;

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.25, duration: 0.5 },
  },
};

/** Container that reveals its `StaggerItem` children one after another. */
export function Stagger({
  children,
  className,
  as = "div",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  as?: StaggerTag;
  delay?: number;
}) {
  const Comp = CONTAINER_TAGS[as];
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: delay } },
  };
  return (
    <Comp className={className} variants={container} initial="hidden" animate="show">
      {children}
    </Comp>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: StaggerItemTag;
}) {
  const Comp = ITEM_TAGS[as];
  return (
    <Comp className={className} variants={item}>
      {children}
    </Comp>
  );
}
