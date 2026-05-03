"use client";
import { motion } from "framer-motion";

interface Props {
  /** 0..1 */
  progress: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

/**
 * Animated SVG progress ring. The stroke length lerps via Framer Motion
 * stroke-dashoffset; a soft red glow pulses behind once progress exceeds 0.
 */
export function EnergyRing({
  progress,
  size = 220,
  stroke = 10,
  label,
  sublabel
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* Glow pulse */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, rgba(208,0,0,${0.12 + clamped * 0.35}) 0%, transparent 70%)`,
          opacity: clamped > 0 ? 1 : 0,
          transition: "opacity 600ms ease, background 600ms ease"
        }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="kaizenRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3333" />
            <stop offset="100%" stopColor="#a80000" />
          </linearGradient>
          <filter id="kaizenRingGlow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#kaizenRing)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "center",
            filter: "url(#kaizenRingGlow)"
          }}
        />
        {/* Tick marks */}
        {Array.from({ length: 30 }).map((_, i) => {
          const angle = (i / 30) * Math.PI * 2 - Math.PI / 2;
          const x1 = size / 2 + Math.cos(angle) * (r + stroke);
          const y1 = size / 2 + Math.sin(angle) * (r + stroke);
          const x2 = size / 2 + Math.cos(angle) * (r + stroke + 5);
          const y2 = size / 2 + Math.sin(angle) * (r + stroke + 5);
          const lit = i / 30 < clamped;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={lit ? "rgba(208,0,0,0.9)" : "rgba(255,255,255,0.1)"}
              strokeWidth={1.2}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="font-display text-4xl tracking-tight">
            {Math.round(clamped * 100)}
            <span className="text-white/40 text-base">%</span>
          </div>
          {label && <div className="label-mono mt-1">{label}</div>}
          {sublabel && <div className="text-xs text-white/50 mt-0.5">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}
