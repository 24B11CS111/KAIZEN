"use client";

import { motion } from "framer-motion";

/**
 * Global Route Transition Template
 * Next.js App Router remounts templates on navigation,
 * allowing us to trigger Framer Motion enter animations.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col w-full h-full relative"
    >
      {children}
    </motion.div>
  );
}
