"use client";
import { motion } from "framer-motion";
import { ScanLine } from "lucide-react";

export function SenseiVerifying({ name }: { name?: string | null }) {
  return (
    <div className="grid place-items-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div className="relative h-24 w-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border border-blood-500/40 animate-pulseRed" />
          <div className="absolute inset-3 rounded-full border border-blood-500/30 animate-flicker" />
          <div className="absolute inset-0 grid place-items-center">
            <ScanLine className="h-9 w-9 text-blood-500" />
          </div>
        </div>
        <p className="label-mono">Status · Pending</p>
        <h1 className="heading text-3xl mt-3">Sensei is verifying…</h1>
        <p className="text-white/60 mt-3 text-sm leading-relaxed">
          Your offering has been received{name ? `, ${name.split(" ")[0]}` : ""}.
          The Sensei manually inspects every UTR. You&apos;ll receive a
          WhatsApp ping the moment your gate opens.
        </p>
        <motion.div
          className="mt-8 mx-auto h-[2px] w-48 bg-white/10 overflow-hidden rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-blood-500"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
