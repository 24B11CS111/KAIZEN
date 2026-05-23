"use client";

/**
 * Last-resort error boundary that catches errors which bubble all the
 * way past the root layout (rare, but it's what stops the blank screen
 * when layout itself crashes). Renders its own <html>/<body>.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[global error]", error); }, [error]);

  return (
    <html lang="en">
      <body style={{
        background: "#050505",
        color: "white",
        margin: 0,
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif"
      }}>
        <div style={{ maxWidth: 380, textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 10 }}>
            The dojo couldn&apos;t load.
          </h1>
          <p style={{ fontSize: 13, opacity: 0.65, lineHeight: 1.6 }}>
            A low-level error stopped the page from rendering. Reload to try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 22,
              background: "#D00000",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
