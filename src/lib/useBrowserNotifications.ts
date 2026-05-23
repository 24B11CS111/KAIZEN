"use client";

/**
 * Lightweight browser notification helper.
 *
 * Strictly opt-in — calls the Notification API only after the user
 * explicitly clicks "Enable reminders". No silent permission prompts.
 *
 * Works alongside the existing service worker (registered via
 * ServiceWorkerRegistrar). For real push (delivered when the browser
 * is closed), a separate Web Push subscription + backend job would be
 * required; this helper covers in-session and "page-open" reminders,
 * which is the highest-conversion retention surface for PWAs.
 */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kaizen.notify.enabled";

export type NotifyPermission = "default" | "granted" | "denied" | "unsupported";

interface UseBrowserNotifications {
  permission: NotifyPermission;
  enabled: boolean;
  /** Show the native permission prompt + remember the user's choice. */
  request: () => Promise<NotifyPermission>;
  /** Fire a notification right now (no-op if not enabled). */
  notify: (opts: { title: string; body?: string; tag?: string; icon?: string }) => void;
  /** Schedule a "today only" reminder at a specific local hour:minute. */
  scheduleAt: (hour: number, minute: number, opts: { title: string; body?: string; tag?: string }) => () => void;
  /** Forget the saved preference (user-revocable). */
  disable: () => void;
}

export function useBrowserNotifications(): UseBrowserNotifications {
  const [permission, setPermission] = useState<NotifyPermission>("default");
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as NotifyPermission);
    try {
      setEnabled(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* private mode etc. — silently fall back to default off */
    }
  }, []);

  const request = useCallback(async (): Promise<NotifyPermission> => {
    if (typeof Notification === "undefined") return "unsupported";
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotifyPermission);
      if (result === "granted") {
        try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
        setEnabled(true);
      }
      return result as NotifyPermission;
    } catch {
      return "denied";
    }
  }, []);

  const notify = useCallback(
    (opts: { title: string; body?: string; tag?: string; icon?: string }) => {
      if (typeof window === "undefined") return;
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      try {
        const n = new Notification(opts.title, {
          body: opts.body,
          tag: opts.tag,
          icon: opts.icon ?? "/icon-192.png",
          badge: "/icon-192.png"
        });
        // Auto-close after 8 seconds on platforms that respect it.
        setTimeout(() => { try { n.close(); } catch { /* ignore */ } }, 8000);
      } catch {
        /* swallow — notification API can throw on some platforms */
      }
    },
    []
  );

  /** Schedule a single same-day notification. Returns a canceller. */
  const scheduleAt = useCallback(
    (hour: number, minute: number, opts: { title: string; body?: string; tag?: string }) => {
      if (typeof window === "undefined") return () => {};
      const now = new Date();
      const target = new Date();
      target.setHours(hour, minute, 0, 0);
      let ms = target.getTime() - now.getTime();
      // If the time already passed today, schedule for the same time tomorrow.
      if (ms < 0) ms += 24 * 60 * 60 * 1000;
      // Cap at 23h59m so it always fires before the timer is GC'd.
      ms = Math.min(ms, 23 * 60 * 60 * 1000 + 59 * 60 * 1000);
      const timer = window.setTimeout(() => notify(opts), ms);
      return () => window.clearTimeout(timer);
    },
    [notify]
  );

  const disable = useCallback(() => {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setEnabled(false);
  }, []);

  return { permission, enabled, request, notify, scheduleAt, disable };
}
