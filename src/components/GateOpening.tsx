"use client";
import { motion } from "framer-motion";

export function GateOpening({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      onAnimationComplete={onComplete}
    >
      {/* Top half */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 bg-obsidian border-b border-blood-500/60"
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ duration: 1.6, ease: [0.83, 0, 0.17, 1] }}
        style={{ boxShadow: "0 0 40px rgba(208,0,0,0.5)" }}
      />
      {/* Bottom half */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-obsidian border-t border-blood-500/60"
        initial={{ y: 0 }}
        animate={{ y: "100%" }}
        transition={{ duration: 1.6, ease: [0.83, 0, 0.17, 1] }}
        style={{ boxShadow: "0 0 40px rgba(208,0,0,0.5)" }}
      />
      {/* Center seal */}
      <motion.div
        className="absolute inset-0 grid place-items-center"
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 1.6 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      >
        <div className="font-display text-blood-500 tracking-[0.4em] text-3xl md:text-5xl">
          GATE · OPEN
        </div>
      </motion.div>
    </motion.div>
  );
}
