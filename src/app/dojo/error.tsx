"use client";
import { useEffect } from "react";
import { ErrorBoundaryUI } from "@/components/ErrorBoundaryUI";

export default function DojoError({
  error, reset
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <ErrorBoundaryUI reset={reset} homeHref="/dojo" />;
}
