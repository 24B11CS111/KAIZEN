"use client";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  show: boolean;
}

/**
 * Subtle 8-particle red burst fired when a day is sealed. No external
 * deps, no confetti library - just framer-motion divs that fly outward
 * for ~700ms then fade. Pointer-events none so it never blocks UI.
 */
export function CompletionBurst({ show }: Props) {
  const particles = Array.from({ length: 8 }, (_, i) => i);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden="true"
        >
          {/* Central glow pulse */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0.8 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute h-16 w-16 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(208,0,0,0.6), transparent 70%)" }}
          />
          {/* Particles flying outward */}
          {particles.map((i) => {
            const angle = (i / particles.length) * Math.PI * 2;
            const dist = 70;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            return (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x, y, scale: 0.3, opacity: 0 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="absolute h-1.5 w-1.5 rounded-full bg-blood-500"
                style={{ boxShadow: "0 0 8px rgba(208,0,0,0.85)" }}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
