"use client";
import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";

interface Props {
  title?: string;
  message?: string;
  reset?: () => void;
  homeHref?: string;
}

export function ErrorBoundaryUI({
  title = "Something went wrong",
  message = "We hit a snag loading this page. Try again in a moment.",
  reset,
  homeHref = "/dojo"
}: Props) {
  return (
    <main className="container-app pt-16 pb-bottom-nav max-w-md">
      <div className="card p-6 text-center">
        <span className="grid place-items-center h-12 w-12 mx-auto rounded-md bg-blood-500/10 border border-blood-500/30 mb-4">
          <AlertTriangle className="h-6 w-6 text-blood-500" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-white/60 mt-1.5">{message}</p>
        <div className="mt-5 space-y-2.5">
          {reset && (
            <button onClick={reset} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              <RotateCw className="h-4 w-4" /> Try again
            </button>
          )}
          <Link href={homeHref} className="btn-secondary w-full">Back to Dojo</Link>
        </div>
      </div>
    </main>
  );
}
