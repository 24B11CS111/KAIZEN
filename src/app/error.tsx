"use client";

/**
 * Root error boundary.
 *
 * Catches any unhandled error from any nested server / client component
 * tree so the user never sees a literal blank page on refresh.
 * Reset button retries the current segment.
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RootError({
  error,
  reset
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[root error]", error);
  }, [error]);

  return (
    <main className="min-h-[100svh] grid place-items-center px-6 bg-obsidian text-white">
      <div className="text-center max-w-md">
        <span className="grid place-items-center h-12 w-12 mx-auto rounded-full bg-blood-500/15 border border-blood-500/40 mb-5">
          <AlertTriangle className="h-6 w-6 text-blood-500" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Something tripped.</h1>
        <p className="mt-2 text-sm text-white/60 leading-relaxed">
          The dojo had a hiccup. Retry the page, or return home and try again.
        </p>
        <div className="mt-7 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="btn-primary btn-tap inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
          <Link
            href="/"
            className="btn-secondary btn-tap inline-flex items-center gap-2"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
        </div>
        {error?.digest && (
          <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-white/35">
            ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
