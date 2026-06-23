"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

/**
 * KAIZEN.SYS — Official logo (transparent BG, Cloudinary CDN).
 * Raw URL used — the obsidian backdrop behind the image IS the background.
 * Cloudinary on-the-fly: no additional transforms needed for in-app use.
 */
import { BRAND } from "@/constants/branding";

type Phase = "brand" | "tagline" | "done";

/**
 * KAIZEN.SYS cinematic boot.
 *
 * Lifecycle:
 *   t=0     mount, phase = "brand"     (logo + "KAIZEN.SYS")
 *   t=1.0s  phase -> "tagline"         ("DISCIPLINE. PRECISION. ASCENSION.")
 *   t=2.5s  phase -> "done"            (overlay fades + scales out)
 *   t=3.0s  HARD FAILSAFE -> "done"    (no matter what, overlay must clear)
 */
export function IntroLoader() {
  // Always start with "brand" so server and client initial HTML match (prevents hydration #418).
  const [phase, setPhase] = useState<Phase>("brand");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    try {
      if (sessionStorage.getItem("kaizen.intro.shown") === "1") {
        setPhase("done");
        return;
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, []);

  useEffect(() => {
    if (!ready || phase === "done") return;

    const t1 = window.setTimeout(() => setPhase("tagline"), 1000);
    const t2 = window.setTimeout(() => {
      setPhase("done");
      try { sessionStorage.setItem("kaizen.intro.shown", "1"); } catch {}
    }, 2500);
    const failsafe = window.setTimeout(() => {
      setPhase("done");
      try { sessionStorage.setItem("kaizen.intro.shown", "1"); } catch {}
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(failsafe);
    };
  }, [ready, phase]);

  if (!ready || phase === "done") return null;

  return (
    <AnimatePresence mode="wait">
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
          {/* Blood-red radial ambient — deep, cinematic */}
          <motion.div
            aria-hidden
            className="absolute h-[80vmin] w-[80vmin] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(208,0,0,0.35) 0%, rgba(208,0,0,0.08) 35%, transparent 65%)"
            }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.5, 1.15, 0.92], opacity: [0, 1, 0.7] }}
            transition={{ duration: 2.6, ease: "easeInOut" }}
          />

          {/* Outer concentric ring — expands and fades */}
          <motion.div
            aria-hidden
            className="absolute rounded-full border border-blood-500/30"
            style={{
              width: "32vmin",
              height: "32vmin",
              boxShadow: "0 0 50px rgba(208,0,0,0.35), inset 0 0 30px rgba(208,0,0,0.1)"
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.1, 1.0], opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.6, ease: "easeInOut" }}
          />

          {/* Inner ring — tighter, subtle */}
          <motion.div
            aria-hidden
            className="absolute rounded-full border border-blood-500/15"
            style={{ width: "20vmin", height: "20vmin" }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.05, 0.98], opacity: [0, 0.6, 0] }}
            transition={{ duration: 2.4, ease: "easeInOut", delay: 0.1 }}
          />

          {/* Logo + Text layer */}
          <div className="relative z-10 flex flex-col items-center gap-5 text-center select-none px-6">

            {/* Logo — transparent BG renders directly on obsidian for clean look */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, filter: "blur(16px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.06, filter: "blur(10px)" }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              style={{
                filter: [
                  "drop-shadow(0 0 32px rgba(208,0,0,0.65))",
                  "drop-shadow(0 0 80px rgba(208,0,0,0.2))",
                  "drop-shadow(0 2px 16px rgba(0,0,0,0.9))"
                ].join(" ")
              }}
            >
              <Image
                src={BRAND.logo}
                alt="KAIZEN.SYS"
                width={128}
                height={128}
                className="object-contain"
                priority
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {phase === "brand" && (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, letterSpacing: "0.04em" }}
                  animate={{ opacity: 1, letterSpacing: "0.32em" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-3xl md:text-5xl tracking-[0.32em] text-white"
                >
                  KAIZEN<span className="text-blood-500">.</span>SYS
                </motion.div>
              )}
              {phase === "tagline" && (
                <motion.div
                  key="tag"
                  initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-sm md:text-lg tracking-[0.28em] text-white/80"
                >
                  DISCIPLINE<span className="text-blood-500"> · </span>
                  PRECISION<span className="text-blood-500"> · </span>
                  ASCENSION
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom progress scanline */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 bottom-10 mx-auto h-px w-48"
            style={{
              background: "rgba(208,0,0,0.65)",
              boxShadow: "0 0 14px rgba(208,0,0,0.8), 0 0 4px rgba(208,0,0,1)"
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 2.3, ease: "linear", delay: 0.1 }}
            exit={{ opacity: 0 }}
          />

          {/* Corner accent dots */}
          {[
            "top-6 left-6",
            "top-6 right-6",
            "bottom-6 left-6",
            "bottom-6 right-6"
          ].map((pos) => (
            <motion.div
              key={pos}
              aria-hidden
              className={`absolute ${pos} h-1 w-1 rounded-full bg-blood-500/40`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0.5], scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          ))}
        </motion.div>
    </AnimatePresence>
  );
}

