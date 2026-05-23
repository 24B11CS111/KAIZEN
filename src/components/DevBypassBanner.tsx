"use client";

/**
 * KAIZEN.SYS — Dev Bypass Banner
 *
 * Renders ONLY when NEXT_PUBLIC_BYPASS_AUTH=1 AND NODE_ENV !== production
 * AND the current route is NOT a marketing surface (landing / auth).
 * Investor-ready surfaces stay clean; debug surfaces stay obvious.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";

const SUPPRESS_ON = ["/", "/auth/login", "/auth/signup", "/legal"];

export function DevBypassBanner() {
  const pathname = usePathname();
  const suppressed = SUPPRESS_ON.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "production") return;
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "1") setShow(true);
  }, []);

  if (!show || suppressed) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 0,
        insetInline: 0,
        zIndex: 9999,
        background: "linear-gradient(90deg, #D00000, #7a0000)",
        color: "#fff",
        fontSize: 11,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        fontWeight: 700,
        textAlign: "center",
        padding: "6px 12px",
        boxShadow: "0 4px 18px -4px rgba(208,0,0,0.7)",
        pointerEvents: "none",
        fontFamily: "-apple-system,system-ui,sans-serif"
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <AlertTriangle style={{ width: 11, height: 11 }} />
        DEV PREVIEW MODE — showing MOCK data. Set NEXT_PUBLIC_BYPASS_AUTH=0 for real user state.
      </span>
    </div>
  );
}
