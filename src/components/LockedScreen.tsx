"use client";
import Link from "next/link";
import { Lock, RefreshCcw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function LockedScreen({ reason = "expired" }: { reason?: "expired" | "rejected" }) {
  return (
    <div className="relative min-h-[70vh] grid place-items-center px-6 overflow-hidden">
      <div aria-hidden className="absolute inset-0 grid grid-cols-3 gap-3 p-8 blur-md opacity-40 pointer-events-none">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="glass rounded-xl h-36" />
        ))}
      </div>

      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {[15, 35, 55, 75, 95].map((pct, i) => (
          <motion.div
            key={i}
            className="absolute left-[-10%] right-[-10%] h-1.5"
            style={{
              top: pct + "%",
              background:
                "linear-gradient(90deg, transparent, rgba(208,0,0,0.55) 30%, rgba(208,0,0,0.85) 50%, rgba(208,0,0,0.55) 70%, transparent)",
              transform: "rotate(" + (i % 2 === 0 ? -8 : 8) + "deg)",
              boxShadow: "0 0 18px rgba(208,0,0,0.55)"
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 1, 0.85, 1], scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.1, 0.25, 0.12, 0.3, 0.1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(208,0,0,0.18), transparent 60%)"
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative glass rounded-2xl p-8 max-w-md text-center border-blood-500/40 shadow-blood-lg z-10"
      >
        <div className="relative h-16 w-16 mx-auto grid place-items-center">
          <div className="absolute inset-0 rounded-full bg-blood-500/20 animate-pulseRed" />
          <Lock className="h-8 w-8 text-blood-500" />
        </div>
        <div className="label-mono mt-5 inline-flex items-center gap-2 text-blood-500 animate-flicker">
          <AlertTriangle className="h-3 w-3" />
          {reason === "rejected" ? "Offering refused" : "Gate sealed"}
        </div>
        <h1 className="heading text-3xl mt-3">
          {reason === "rejected" ? "The offering was refused." : "Your path has closed."}
        </h1>
        <p className="text-white/60 mt-3 text-sm">
          {reason === "rejected"
            ? "The Sensei could not verify your UTR. Re-submit with a valid 12-digit reference."
            : "30 days have passed. To continue, begin a new cycle. The clock resets, the discipline does not."}
        </p>
        <Link href="/enroll" className="btn-blood mt-6 w-full">
          <RefreshCcw className="h-4 w-4" />
          {reason === "rejected" ? "Re-submit offering" : "Renew access"}
        </Link>
      </motion.div>
    </div>
  );
}
