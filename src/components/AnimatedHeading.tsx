"use client";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

interface Props {
  children: string;
  /** Tag to render. Default 'h1'. */
  as?: ElementType;
  className?: string;
  /** Per-letter stagger in seconds. */
  stagger?: number;
  /** Wrap a substring in an accent-colored span. */
  accent?: string;
  /** Optional suffix rendered after the animated string (e.g. punctuation). */
  suffix?: ReactNode;
}

const containerV: Variants = {
  hidden: {},
  show: (s: number) => ({
    transition: { staggerChildren: s, delayChildren: 0.05 }
  })
};

const letterV: Variants = {
  hidden: { y: "0.6em", opacity: 0, filter: "blur(8px)" },
  show: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
  }
};

/**
 * Letter-by-letter reveal heading. Whitespace is preserved.
 * Splits cleanly on grapheme boundaries via Array.from.
 */
export function AnimatedHeading({
  children,
  as: Tag = "h1",
  className,
  stagger = 0.025,
  accent,
  suffix
}: Props) {
  const text = children;
  const accentIdx = accent ? text.indexOf(accent) : -1;
  const letters = Array.from(text);

  return (
    <Tag className={cn("heading", className)} aria-label={text}>
      <motion.span
        className="inline-block"
        variants={containerV}
        custom={stagger}
        initial="hidden"
        animate="show"
        aria-hidden
      >
        {letters.map((ch, i) => {
          const inAccent =
            accentIdx >= 0 && i >= accentIdx && i < accentIdx + (accent?.length ?? 0);
          return (
            <motion.span
              key={i}
              variants={letterV}
              className={cn(
                "inline-block whitespace-pre",
                inAccent && "text-blood-500"
              )}
              style={inAccent ? { textShadow: "0 0 24px rgba(208,0,0,0.55)" } : undefined}
            >
              {ch}
            </motion.span>
          );
        })}
      </motion.span>
      {suffix}
    </Tag>
  );
}
