"use client";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Wraps the page contents so they fade-and-slide in once the intro overlay
 * has cleared. We watch sessionStorage to know whether the IntroLoader has
 * marked itself complete; if not, we show after a 2.5s delay (matching the
 * IntroLoader's exit timing); plus a 3.2s hard fallback so the UI never
 * stays hidden forever.
 */
export function MainReveal({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("kaizen.intro.shown") === "1";
  });

  useEffect(() => {
    if (revealed) return;
    const t = window.setTimeout(() => setRevealed(true), 2500);
    const failsafe = window.setTimeout(() => setRevealed(true), 3200);
    return () => {
      clearTimeout(t);
      clearTimeout(failsafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={
        revealed
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 12, filter: "blur(6px)" }
      }
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
