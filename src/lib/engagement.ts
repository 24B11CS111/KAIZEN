/**
 * KAIZEN.SYS — Engagement & Retention engine.
 *
 * Pure, deterministic, no I/O. Drop-in helpers that consume the data
 * already loaded by /dojo/page.tsx (profile + user_progress summary)
 * and produce:
 *   - reminders[]: prioritized list of nudges to show in the dashboard
 *   - motivation:  a short, varied line tuned to the user's state
 *
 * Three reminder kinds, in descending priority:
 *   1. expiry      — subscription about to lapse (≤3 days)
 *   2. comeback    — user hasn't sealed a day in ≥24h despite a streak
 *   3. daily       — user hasn't sealed today; nudge to begin
 */

export type ReminderKind = "expiry" | "comeback" | "daily" | "first_day";
export type ReminderTone = "urgent" | "warm" | "neutral";

export interface Reminder {
  id: string;
  kind: ReminderKind;
  tone: ReminderTone;
  title: string;
  body: string;
  cta: { label: string; href: string };
  /**
   * Time-to-live for client-side dismissal (ms). After dismissal, the
   * banner won't reappear for this long.
   */
  dismissTtlMs: number;
}

export interface EngagementInput {
  full_name: string | null;
  expiry_date: string | null;
  subscription_status: string | null;
  streak: number;
  longest_streak: number;
  current_day: number;
  completed_count: number;
  sealed_today: boolean;
  missed_days: number;       // -1 if never sealed
}

export interface MotivationInput {
  streak: number;
  completed_count: number;
  missed_days: number;
  sealed_today: boolean;
  full_name?: string | null;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Compute the prioritized reminders for this user. Empty array means
 * the dashboard is "clean" — nothing to nudge.
 */
export function computeReminders(input: EngagementInput): Reminder[] {
  const list: Reminder[] = [];
  const name = (input.full_name ?? "").split(" ")[0] || "Warrior";

  // ---------- 1. EXPIRY ----------
  if (input.subscription_status === "active" && input.expiry_date) {
    const ms = new Date(input.expiry_date).getTime() - Date.now();
    const days = Math.ceil(ms / DAY);
    if (days <= 0) {
      list.push({
        id: "expiry-now",
        kind: "expiry",
        tone: "urgent",
        title: "Your access just expired",
        body: "Renew now to keep your streak alive and your plan intact.",
        cta: { label: "Renew", href: "/enroll" },
        dismissTtlMs: 6 * 60 * 60 * 1000
      });
    } else if (days <= 3) {
      list.push({
        id: "expiry-" + days,
        kind: "expiry",
        tone: "urgent",
        title: days === 1
          ? "Subscription expires tomorrow"
          : days + " days until your subscription expires",
        body: "Renew now so your streak and progress don't reset.",
        cta: { label: "Renew", href: "/enroll" },
        dismissTtlMs: 12 * 60 * 60 * 1000
      });
    }
  }

  // ---------- 2. COMEBACK ----------
  // User had momentum (streak or longest_streak > 0) and missed 1+ days.
  if (!input.sealed_today) {
    if (input.missed_days >= 7) {
      list.push({
        id: "comeback-7",
        kind: "comeback",
        tone: "warm",
        title: "The dojo is still here, " + name + ".",
        body: "A week away. One small mission today and the rhythm restarts.",
        cta: { label: "Open today's mission", href: "/dojo" },
        dismissTtlMs: 8 * 60 * 60 * 1000
      });
    } else if (input.missed_days >= 3) {
      list.push({
        id: "comeback-3",
        kind: "comeback",
        tone: "warm",
        title: "Come back, " + name + ".",
        body: "Three days slipped. Walk Day " + input.current_day + " — the line reforms.",
        cta: { label: "Resume Day " + input.current_day, href: "/dojo" },
        dismissTtlMs: 8 * 60 * 60 * 1000
      });
    } else if (input.missed_days === 2) {
      list.push({
        id: "comeback-2",
        kind: "comeback",
        tone: "warm",
        title: "Two days. Don't make it three.",
        body: "One mission today and the recovery begins.",
        cta: { label: "Seal Day " + input.current_day, href: "/dojo" },
        dismissTtlMs: 6 * 60 * 60 * 1000
      });
    } else if (
      input.missed_days === 1 &&
      (input.streak > 0 || input.longest_streak > 0)
    ) {
      list.push({
        id: "comeback-1",
        kind: "comeback",
        tone: "warm",
        title: "Yesterday slipped.",
        body: "Today is yours, " + name + ". Reseal the line.",
        cta: { label: "Seal Day " + input.current_day, href: "/dojo" },
        dismissTtlMs: 4 * 60 * 60 * 1000
      });
    }
  }

  // ---------- 3. DAILY NUDGE ----------
  // Hasn't sealed today and isn't already in a comeback state.
  if (!input.sealed_today && list.length === 0) {
    if (input.completed_count === 0 && input.missed_days < 0) {
      list.push({
        id: "first-day",
        kind: "first_day",
        tone: "neutral",
        title: "Begin Day 1, " + name + ".",
        body: "Day one is the only hard one. Open your first mission.",
        cta: { label: "Begin Day 1", href: "/dojo" },
        dismissTtlMs: 12 * 60 * 60 * 1000
      });
    } else {
      list.push({
        id: "daily-" + input.current_day,
        kind: "daily",
        tone: "neutral",
        title: "Day " + input.current_day + " is unsealed.",
        body: streakLine(input.streak),
        cta: { label: "Open today's mission", href: "/dojo" },
        dismissTtlMs: 4 * 60 * 60 * 1000
      });
    }
  }

  return list;
}

function streakLine(streak: number): string {
  if (streak >= 21) return "21 days. Don't break the line now.";
  if (streak >= 14) return "Two weeks of fire. Hold it today.";
  if (streak >= 7)  return "One week sealed. Keep the rhythm.";
  if (streak >= 3)  return streak + "-day streak. Hold the line.";
  if (streak >= 1)  return "Streak started. One more mission keeps it alive.";
  return "Reps over motivation. Show up today.";
}

/**
 * Short, varied motivational line — slightly different from
 * aiStatusMessage so the two surfaces don't echo each other.
 *
 * Picks deterministically from a small pool keyed by today's date so
 * the message changes day-to-day but is stable within a day.
 */
export function generateMotivation(input: MotivationInput): string {
  const name = (input.full_name ?? "").split(" ")[0] || "Warrior";
  const today = new Date().toISOString().slice(0, 10);
  const salt = today.split("-").reduce((a, b) => a + Number(b), 0);

  // Sealed-today pool
  if (input.sealed_today) {
    const pool = [
      "Sealed. The fire holds another day.",
      "Day stacked. Recovery is part of the work.",
      "Discipline = showing up. You showed up.",
      "Quiet wins compound, " + name + "."
    ];
    return pool[salt % pool.length];
  }

  // Missed-days pool (recovery messaging)
  if (input.missed_days >= 3) {
    const pool = [
      "The path waits, " + name + ". Walk three days, the rhythm returns.",
      "Comebacks are part of the curriculum.",
      "Start small. Reps over guilt.",
      "Today is a Day 1 in a different way — take it."
    ];
    return pool[salt % pool.length];
  }
  if (input.missed_days === 1 || input.missed_days === 2) {
    const pool = [
      "Yesterday slipped. Today is yours.",
      "Recovery is one mission away.",
      "The streak isn't the point — showing up is.",
      "One mission today. That's the move."
    ];
    return pool[salt % pool.length];
  }

  // Active-streak pool
  if (input.streak >= 21) {
    const pool = [
      "This is who you are now, " + name + ".",
      "Three weeks. The defaults are rewritten.",
      "Identity > motivation. You proved it."
    ];
    return pool[salt % pool.length];
  }
  if (input.streak >= 14) {
    const pool = [
      "Two weeks of fire. Today's mission keeps it alive.",
      "The rhythm holds you now.",
      "Boring on the outside, sharp on the inside."
    ];
    return pool[salt % pool.length];
  }
  if (input.streak >= 7) {
    const pool = [
      "One week sealed, " + name + ". Hold it.",
      "Consistency is forming. Keep it boring.",
      "Discipline is rebuilt by showing up."
    ];
    return pool[salt % pool.length];
  }
  if (input.streak >= 3) {
    const pool = [
      "Three days in. Trust the process.",
      "Small daily wins. Today's is waiting.",
      "Reps over motivation."
    ];
    return pool[salt % pool.length];
  }

  // Default / cold-start pool
  const pool = [
    "Day one is the only hard one.",
    "Begin small. The path opens with the first step.",
    "Show up today. That's the whole game.",
    "The dojo is here. Walk in."
  ];
  return pool[salt % pool.length];
}

/** Helpers ---------------------------------------------------------- */

export function daysUntilExpiry(expiry: string | null | undefined): number | null {
  if (!expiry) return null;
  const ms = new Date(expiry).getTime() - Date.now();
  return Math.ceil(ms / DAY);
}

export function hoursSinceLastSeal(lastDate: string | null | undefined): number | null {
  if (!lastDate) return null;
  return Math.floor((Date.now() - new Date(lastDate).getTime()) / (60 * 60 * 1000));
}
