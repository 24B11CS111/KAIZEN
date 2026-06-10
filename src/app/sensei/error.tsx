"use client";

import { useEffect } from "react";
import { ErrorBoundaryUI } from "@/components/ErrorBoundaryUI";

export default function SenseiError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[sensei] route error:", error);
  }, [error]);

  return (
    <ErrorBoundaryUI
      title="Sensei dashboard error"
      message="Something went wrong loading this admin view. You can retry or return to the dojo."
      reset={reset}
      homeHref="/sensei"
    />
  );
}
