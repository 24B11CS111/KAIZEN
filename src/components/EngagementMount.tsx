"use client";

/**
 * KAIZEN.SYS — EngagementMount
 *
 * Single client component that mounts the engagement layer onto an
 * existing dashboard. No layout takeover — it renders:
 *
 *   1. ReminderBanner  (highest-priority active reminder, dismissible)
 *   2. NotifyOptIn     (one-tap chip to enable browser reminders)
 *
 * Both surfaces are additive and live inside the existing
 * `container-app` grid above (or below) the mission card.
 *
 * On mount it also schedules a same-day reminder notification at 8 PM
 * local time IF the user has previously granted permission and hasn't
 * sealed today — best-effort, real push needs a Web Push backend.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check } from "lucide-react";
import { ReminderBanner } from "./ReminderBanner";
import {
  computeReminders,
  generateMotivation,
  type EngagementInput
} from "@/lib/engagement";
import { useBrowserNotifications } from "@/lib/useBrowserNotifications";

interface Props {
  input: EngagementInput;
}

const NOTIFY_HIDE_KEY = "kaizen.notify.optin.hidden";
const NOTIFY_HIDE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export function EngagementMount({ input }: Props) {
  const reminders = useMemo(() => computeReminders(input), [input]);
  const motivation = useMemo(() => generateMotivation({
    streak:          input.streak,
    completed_count: input.completed_count,
    missed_days:     input.missed_days,
    sealed_today:    input.sealed_today,
    full_name:       input.full_name
  }), [
    input.streak, input.completed_count,
    input.missed_days, input.sealed_today, input.full_name
  ]);

  const { permission, enabled, request, notify, scheduleAt } = useBrowserNotifications();

  // Re-render after we read localStorage on the client.
  const [optInHidden, setOptInHidden] = useState<boolean>(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(NOTIFY_HIDE_KEY);
      if (!raw) { setOptInHidden(false); return; }
      const ts = Number(raw);
      setOptInHidden(Date.now() - ts < NOTIFY_HIDE_TTL_MS);
    } catch { setOptInHidden(false); }
  }, []);

  // Schedule the daily reminder on mount when:
  //   - notifications are granted
  //   - user hasn't sealed today
  //   - subscription is active
  useEffect(() => {
    if (permission !== "granted") return;
    if (input.sealed_today) return;
    if (input.subscription_status !== "active") return;

    const cancel = scheduleAt(20, 0, {
      title:  "Day " + input.current_day + " is unsealed",
      body:   reminders[0]?.body ?? "Open your dojo and seal today's mission.",
      tag:    "kaizen-daily-" + new Date().toISOString().slice(0, 10)
    });

    // Immediate "welcome back" notify if they've been gone 24h+ and
    // permission was previously granted (server-rendered missed_days).
    if (input.missed_days >= 1) {
      notify({
        title: "The dojo is waiting",
        body:  reminders[0]?.body ?? "One mission today and the rhythm returns.",
        tag:   "kaizen-comeback"
      });
    }
    return cancel;
  }, [
    permission, input.sealed_today, input.subscription_status,
    input.current_day, input.missed_days, scheduleAt, notify, reminders
  ]);

  const askPermission = async () => {
    const res = await request();
    if (res === "granted") {
      // Confirm immediately with a quiet notification.
      notify({
        title: "Reminders on",
        body:  "We'll nudge you at 8 PM on days you haven't sealed.",
        tag:   "kaizen-optin"
      });
    } else {
      hideOptIn();
    }
  };

  const hideOptIn = () => {
    try { window.localStorage.setItem(NOTIFY_HIDE_KEY, String(Date.now())); } catch { /* ignore */ }
    setOptInHidden(true);
  };

  // The opt-in chip only shows when:
  //   - permission is "default" (never asked)
  //   - subscription is active
  //   - user has completed at least 1 day (engagement floor)
  //   - chip wasn't dismissed within the last week
  const showOptIn =
    permission === "default" &&
    input.subscription_status === "active" &&
    input.completed_count >= 1 &&
    !optInHidden;

  // Don't render an empty wrapper.
  if (reminders.length === 0 && !showOptIn) {
    return <MotivationLine text={motivation} />;
  }

  return (
    <div className="space-y-3">
      <MotivationLine text={motivation} />
      {reminders.length > 0 && <ReminderBanner reminders={reminders} />}
      {showOptIn && (
        <NotifyOptIn
          enabled={enabled}
          onEnable={askPermission}
          onDismiss={hideOptIn}
        />
      )}
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function MotivationLine({ text }: { text: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={text}
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 3 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-[11px] sm:text-xs text-white/55 leading-relaxed px-1 italic"
      >
        {text}
      </motion.p>
    </AnimatePresence>
  );
}

function NotifyOptIn({
  enabled, onEnable, onDismiss
}: {
  enabled: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}) {
  if (enabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-[11px] text-white/55 px-1"
      >
        <Check className="h-3 w-3 text-emerald-400" />
        Daily reminders are on
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3 flex items-center gap-3 backdrop-blur-md"
    >
      <span className="grid place-items-center h-8 w-8 rounded-md bg-blood-500/10 border border-blood-500/30 shrink-0">
        <Bell className="h-3.5 w-3.5 text-blood-500" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold leading-tight">Get a quiet daily nudge</div>
        <div className="text-[11px] text-white/55 mt-0.5 leading-snug">
          8 PM reminder if your day isn't sealed yet.
        </div>
      </div>
      <button
        type="button"
        onClick={onEnable}
        className="btn-tap rounded-md bg-blood-500 hover:bg-blood-600 text-white text-[11px] font-semibold px-2.5 py-1.5 transition-colors"
      >
        Enable
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Not now"
        className="text-white/35 hover:text-white/70 shrink-0"
      >
        <BellOff className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
