/**
 * Root loading state.
 *
 * Rendered while any server segment is resolving. Keeps the user from
 * ever seeing a literal blank page during initial / refresh hydration.
 * Matches the KAIZEN aesthetic — center red pulse on obsidian.
 */
import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <main className="min-h-[100svh] grid place-items-center bg-obsidian">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid place-items-center h-12 w-12">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-blood-500/15 border border-blood-500/40"
            style={{ boxShadow: "0 0 24px rgba(208,0,0,0.45)" }}
          />
          <Loader2 className="h-5 w-5 text-blood-500 animate-spin relative z-10" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-white/55">
          KAIZEN<span className="text-blood-500">.</span>SYS
        </span>
      </div>
    </main>
  );
}
