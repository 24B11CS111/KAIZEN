/**
 * Root loading state — KAIZEN logo with premium glow pulse on obsidian.
 */
import Image from "next/image";

import { BRAND } from "@/constants/branding";

export default function RootLoading() {
  return (
    <main className="min-h-[100svh] grid place-items-center bg-obsidian">
      <div className="flex flex-col items-center gap-6">
        <span
          className="relative grid place-items-center h-20 w-20 animate-pulse"
          style={{ filter: "drop-shadow(0 0 24px rgba(208,0,0,0.65))" }}
        >
          <Image
            src={BRAND.logo}
            alt="KAIZEN.SYS"
            width={80}
            height={80}
            className="object-contain"
            priority
          />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/55">
          KAIZEN<span className="text-blood-500">.</span>SYS
        </span>
      </div>
    </main>
  );
}

