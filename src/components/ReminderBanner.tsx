"use client";

/**
 * KAIZEN.SYS — ReminderBanner
 *
 * A drop-in engagement surface. Renders the highest-priority active
 * reminder (expiry > comeback > daily) as a slim premium banner.
 * Dismissible — dismissals persist in localStorage with the reminder's
 * own TTL so the user isn't nagged endlessly.
 *
 * Visually aligns with the existing KAIZEN aesthetic (obsidian / blood)
 * — no new design tokens, just compositions of existing utilities.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, ArrowRight, AlertTriangle, FlameKindling, Sparkles } from "lucide-react";
import type { Reminder } from "@/lib/engagement";

interface Props {
  reminders: Reminder[];
}

const STORAGE_PREFIX = "kaizen.reminder.dismissed.";

interface DismissRecord { ts: number; ttl: number; }

function readDismiss(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return false;
    const rec = JSON.parse(raw) as DismissRecord;
    return Date.now() - rec.ts < rec.ttl;
  } catch {
    return false;
  }
}

function writeDismiss(id: string, ttl: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + id,
      JSON.stringify({ ts: Date.now(), ttl } as DismissRecord)
    );
  } catch { /* ignore quota / private mode */ }
}

export function ReminderBanner({ reminders }: Props) {
  // Filter out anything dismissed within its TTL.
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const ids = new Set<string>();
    reminders.forEach((r) => { if (readDismiss(r.id)) ids.add(r.id); });
    setDismissedIds(ids);
  }, [reminders]);

  const active = useMemo(
    () => reminders.find((r) => !dismissedIds.has(r.id)) ?? null,
    [reminders, dismissedIds]
  );

  if (!active) return null;

  const tone = toneStyles(active.tone);
  const Icon = toneIcon(active.kind);

  const dismiss = () => {
    writeDismiss(active.id, active.dismissTtlMs);
    setDismissedIds((s) => { const n = new Set(s); n.add(active.id); return n; });
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active.id}
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className={
          "relative overflow-hidden rounded-xl border backdrop-blur-md " +
          tone.container
        }
      >
        {/* subtle moving sheen — matches existing depth utilities */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(208,0,0,0.10), transparent 60%)"
          }}
        />
        <div className="relative p-3.5 sm:p-4 flex items-start gap-3">
          <span
            className={
              "grid place-items-center h-9 w-9 rounded-md shrink-0 border " +
              tone.iconWrap
            }
          >
            <Icon className={"h-4 w-4 " + tone.iconColor} />
          </span>

          <div className="flex-1 min-w-0">
            <div className="text-[13px] sm:text-sm font-semibold leading-tight">
              {active.title}
            </div>
            <div className="text-[11px] sm:text-xs text-white/65 mt-1 leading-snug">
              {active.body}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={active.cta.href}
                className={
                  "btn-tap inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors " +
                  tone.cta
                }
              >
                {active.cta.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="text-[11px] text-white/45 hover:text-white/80 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="text-white/35 hover:text-white/80 shrink-0 -mt-0.5 -mr-0.5"
            aria-label="Close reminder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function toneStyles(tone: Reminder["tone"]) {
  switch (tone) {
    case "urgent":
      return {
        container: "border-blood-500/45 bg-blood-500/[0.07] shadow-[0_0_30px_-12px_rgba(208,0,0,0.55)]",
        iconWrap:  "bg-blood-500/20 border-blood-500/55",
        iconColor: "text-blood-500",
        cta:       "bg-blood-500 hover:bg-blood-600 text-white"
      };
    case "warm":
      return {
        container: "border-blood-500/30 bg-white/[0.025]",
        iconWrap:  "bg-blood-500/15 border-blood-500/40",
        iconColor: "text-blood-500",
        cta:       "bg-blood-500/90 hover:bg-blood-500 text-white"
      };
    default:
      return {
        container: "border-white/10 bg-white/[0.02]",
        iconWrap:  "bg-white/[0.04] border-white/15",
        iconColor: "text-white/80",
        cta:       "bg-white/10 hover:bg-white/20 text-white border border-white/15"
      };
  }
}

function toneIcon(kind: Reminder["kind"]) {
  switch (kind) {
    case "expiry":    return AlertTriangle;
    case "comeback":  return FlameKindling;
    case "first_day": return Sparkles;
    default:          return Sparkles;
  }
}
