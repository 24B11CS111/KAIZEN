"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wrap a page or section in a smooth fade-up reveal. Mobile-friendly
 * and respects prefers-reduced-motion via Framer Motion defaults.
 */
export function PageTransition({
  children,
  delay = 0,
  className = ""
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Use as a wrapper for lists - children fade in sequentially. */
export function StaggerGroup({
  children,
  delayBetween = 0.06,
  className = ""
}: {
  children: ReactNode[];
  delayBetween?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: delayBetween } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 6, scale: 0.98 },
        show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
