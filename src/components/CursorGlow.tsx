"use client";
import { useEffect, useRef } from "react";

export function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;
    let x = rx;
    let y = ry;
    let targetSize = 38;
    let targetGlow = 0.6;
    let magneticEl: HTMLElement | null = null;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = "translate(" + x + "px, " + y + "px) translate(-50%, -50%)";
      }
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const interactive = t.closest(
        "a,button,[role='button'],input,textarea,select,label,.magnetic"
      ) as HTMLElement | null;

      if (interactive) {
        targetSize = interactive.classList.contains("magnetic") ? 80 : 60;
        targetGlow = 1;
        magneticEl = interactive.classList.contains("magnetic") ? interactive : null;
      } else {
        targetSize = 38;
        targetGlow = 0.6;
        magneticEl = null;
      }
    };

    const tick = () => {
      let tx = x;
      let ty = y;
      if (magneticEl) {
        const r = magneticEl.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        tx = x + (cx - x) * 0.25;
        ty = y + (cy - y) * 0.25;
      }
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = "translate(" + rx + "px, " + ry + "px) translate(-50%, -50%)";
        ringRef.current.style.width = targetSize + "px";
        ringRef.current.style.height = targetSize + "px";
        ringRef.current.style.borderColor = "rgba(208,0,0," + targetGlow + ")";
        ringRef.current.style.boxShadow = "0 0 " + (24 + targetGlow * 24) + "px rgba(208,0,0," + (0.35 + targetGlow * 0.35) + ")";
      }
      if (auraRef.current) {
        auraRef.current.style.transform = "translate(" + rx + "px, " + ry + "px) translate(-50%, -50%)";
        auraRef.current.style.opacity = String(0.25 + targetGlow * 0.35);
      }
      requestAnimationFrame(tick);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    const id = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    <>
      <div
        ref={auraRef}
        aria-hidden
        className="cursor-aura"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 220,
          height: 220,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9998,
          background: "radial-gradient(circle, rgba(208,0,0,0.35) 0%, rgba(208,0,0,0.05) 45%, transparent 70%)",
          mixBlendMode: "screen",
          willChange: "transform, opacity"
        }}
      />
      <div ref={ringRef} className="cursor-ring" aria-hidden />
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
}
