"use client";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees. Default 8. */
  max?: number;
  /** Glare layer? Default true. */
  glare?: boolean;
}

/**
 * GPU-accelerated 3D tilt card. Pointer position drives rotateX/Y.
 * Adds a subtle red specular highlight that follows the cursor.
 */
export function Card3D({ children, className, max = 8, glare = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 2 * max;
    const ry = (px - 0.5) * 2 * max;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    if (glareRef.current) {
      glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(208,0,0,0.18), transparent 55%)`;
    }
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "rotateX(0) rotateY(0)";
    if (glareRef.current) glareRef.current.style.background = "transparent";
  };

  return (
    <div className="tilt-perspective">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={cn("tilt-card relative", className)}
      >
        {children}
        {glare && (
          <span
            ref={glareRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ mixBlendMode: "screen", transition: "background 200ms ease" }}
          />
        )}
      </div>
    </div>
  );
}
