"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Phase = "brand" | "tagline" | "done";

/**
 * KAIZEN.SYS cinematic boot.
 *
 * Lifecycle:
 *   t=0     mount, phase = "brand"     (red pulse + "KAIZEN.SYS")
 *   t=1.0s  phase -> "tagline"         ("DISCIPLINE. PRECISION. ASCENSION.")
 *   t=2.5s  phase -> "done"            (overlay fades + scales out)
 *   t=3.0s  HARD FAILSAFE -> "done"    (no matter what, overlay must clear)
 *
 * Critical: useEffect runs ONCE (empty deps). Earlier version listed [phase],
 * which re-created all timers every transition and ping-ponged 1<->2 forever.
 *
 * Once phase === "done" the overlay is unmounted by AnimatePresence and the
 * main UI underneath becomes interactive. While exiting, pointer-events are
 * disabled so any straggler frame can't swallow clicks.
 */
export function IntroLoader() {
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === "undefined") return "brand";
    return sessionStorage.getItem("kaizen.intro.shown") === "1" ? "done" : "brand";
  });

  useEffect(() => {
    if (phase === "done") return;

    const t1 = window.setTimeout(() => setPhase("tagline"), 1000);
    const t2 = window.setTimeout(() => {
      setPhase("done");
      try { sessionStorage.setItem("kaizen.intro.shown", "1"); } catch {}
    }, 2500);
    // Failsafe: regardless of any animation hiccup, the intro MUST clear.
    const failsafe = window.setTimeout(() => {
      setPhase("done");
      try { sessionStorage.setItem("kaizen.intro.shown", "1"); } catch {}
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(failsafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- run ONCE only. Do not depend on phase.

  return (
    <AnimatePresence mode="wait">
      {phase !== "done" && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[200] grid place-items-center bg-obsidian overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: "blur(8px)",
            pointerEvents: "none"
          }}
          transition={{ duration: 0.7, ease: [0.83, 0, 0.17, 1] }}
        >
          {/* Center red pulse */}
          <motion.div
            aria-hidden
            className="absolute h-[70vmin] w-[70vmin] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(208,0,0,0.45) 0%, rgba(208,0,0,0.05) 40%, transparent 70%)"
            }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.6, 1.2, 0.95], opacity: [0, 0.9, 0.65] }}
            transition={{ duration: 2.4, ease: "easeInOut" }}
          />

          {/* Concentric ring */}
          <motion.div
            aria-hidden
            className="absolute h-[28vmin] w-[28vmin] rounded-full border border-blood-500/50"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1, 1.05], opacity: [0, 0.8, 0] }}
            transition={{ duration: 2.4, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 40px rgba(208,0,0,0.5)" }}
          />

          {/* Text layer */}
          <div className="relative z-10 text-center select-none px-6">
            <AnimatePresence mode="wait">
              {phase === "brand" && (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, letterSpacing: "0.05em" }}
                  animate={{ opacity: 1, letterSpacing: "0.32em" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-3xl md:text-5xl tracking-[0.32em]"
                >
                  KAIZEN<span className="text-blood-500">.</span>SYS
                </motion.div>
              )}
              {phase === "tagline" && (
                <motion.div
                  key="tag"
                  initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-base md:text-xl tracking-[0.28em] text-white/85"
                >
                  DISCIPLINE<span className="text-blood-500"> . </span>
                  PRECISION<span className="text-blood-500"> . </span>
                  ASCENSION
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom progress scanline */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 bottom-10 mx-auto h-px w-48 bg-blood-500/60"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.2, ease: "linear" }}
            style={{
              transformOrigin: "left",
              boxShadow: "0 0 12px rgba(208,0,0,0.7)"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
