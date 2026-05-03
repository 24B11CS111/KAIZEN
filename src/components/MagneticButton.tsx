"use client";
import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BaseProps {
  children: ReactNode;
  variant?: "blood" | "ghost";
  className?: string;
}

type Ripple = { id: number; x: number; y: number };

function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);
  const spawn = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = ++idRef.current;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    setRipples((rs) => [...rs, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((rs) => rs.filter((r) => r.id !== id));
    }, 700);
  };
  const layer = (
    <span aria-hidden className="ripple-layer">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </span>
  );
  return { spawn, layer };
}

const baseCls =
  "magnetic relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 font-display tracking-wider uppercase text-sm transition-transform duration-300 ease-out will-change-transform";

const variants = {
  blood:
    "bg-blood-500 text-white border border-blood-400/60 hover:bg-blood-600 shadow-blood",
  ghost:
    "border border-white/15 text-white/90 hover:border-blood-500/60 hover:text-white bg-white/5"
} as const;

export function MagneticButton({
  children,
  variant = "blood",
  className,
  onClick,
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { spawn, layer } = useRipple();
  return (
    <button
      {...rest}
      onClick={(e) => {
        spawn(e);
        onClick?.(e);
      }}
      className={cn(baseCls, variants[variant], className)}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {layer}
    </button>
  );
}

export function MagneticLink({
  children,
  variant = "blood",
  className,
  href,
  onClick
}: BaseProps & { href: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
  const { spawn, layer } = useRipple();
  return (
    <Link
      href={href}
      onClick={(e) => {
        spawn(e);
        onClick?.(e);
      }}
      className={cn(baseCls, variants[variant], className)}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {layer}
    </Link>
  );
}
