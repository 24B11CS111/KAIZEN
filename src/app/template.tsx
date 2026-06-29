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
      initial={{ opacity: 0, x: 16, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        mass: 0.8
      }}
      className="flex-1 flex flex-col w-full h-full relative origin-center"
    >
      {children}
    </motion.div>
  );
}
