"use client";

/**
 * KAIZEN.SYS — Auth Session hook.
 *
 * Single source of truth for client-side auth + profile state.
 *
 * Lifecycle:
 *   1. SSR / first render: status = "loading" (no flash of sign-in CTAs)
 *   2. After hydration: getSession() resolves → status flips
 *   3. onAuthStateChange keeps state in sync across tabs / token refresh
 *   4. When authenticated, fetches a minimal profile row for the navbar
 *
 * Hydration-safe: never reads localStorage during render. Server + client
 * first paint both render "loading" — no mismatch.
 *
 * Cache: request-scoped (not module-scoped) to prevent stale profile
 * leaking between sign-out / sign-in of different accounts.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type SubscriptionStatus =
  | "active" | "pending" | "expired" | "rejected" | "banned";

export interface AuthProfile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: SubscriptionStatus | null;
  plan_amount: number | null;
  expiry_date: string | null;
  role: "user" | "admin" | null;
}

export interface AuthSessionState {
  status: AuthStatus;
  user: User | null;
  profile: AuthProfile | null;
  firstName: string;
}

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, subscription_status, plan_amount, expiry_date, role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as AuthProfile;
}

function firstNameFrom(
  user: User | null,
  profile: AuthProfile | null
): string {
  const full = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined);
  if (full) return full.split(" ")[0];
  if (user?.email) return user.email.split("@")[0];
  return "Warrior";
}

export function useAuthSession(): AuthSessionState {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  // Per-instance cache — avoids stale data between account switches.
  const profileCache = useRef<{ uid: string; data: AuthProfile } | null>(null);

  useEffect(() => {
    let cancelled = false;

    try {
      const supabase = createSupabaseBrowserClient();

      const apply = async (session: Session | null) => {
        if (cancelled) return;

        if (session?.user) {
          setUser(session.user);
          setStatus("authenticated");

          // Use per-instance cache to avoid re-fetching for the same user.
          const uid = session.user.id;
          if (profileCache.current?.uid === uid) {
            const cached = profileCache.current;
            if (!cancelled && cached) setProfile(cached.data);
            return;
          }

          try {
            const p = await fetchProfile(uid);
            if (!cancelled && p) {
              profileCache.current = { uid, data: p };
              setProfile(p);
            }
          } catch (e) {
            console.warn("[auth] profile fetch failed:", e);
          }
        } else {
          // Signed out — clear everything including cache.
          profileCache.current = null;
          setUser(null);
          setProfile(null);
          setStatus("unauthenticated");
        }
      };

      // Initial session check — with error fallback so we never get stuck
      // in "loading" if the network is down or Supabase is unreachable.
      supabase.auth
        .getSession()
        .then((result: any) => apply(result?.data?.session ?? null))
        .catch((e: unknown) => {
          console.warn("[auth] getSession failed:", e);
          if (!cancelled) setStatus("unauthenticated");
        });

      const { data: sub } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        apply(session ?? null);
      });

      return () => {
        cancelled = true;
        try { sub.subscription.unsubscribe(); } catch { /* ignore */ }
      };
    } catch (e) {
      console.error("[auth] init failed:", e);
      if (!cancelled) setStatus("unauthenticated");
      return () => { cancelled = true; };
    }
  }, []);

  const firstName = useMemo(() => firstNameFrom(user, profile), [user, profile]);

  return { status, user, profile, firstName };
}

/** Sign-out helper — clears session and hard-navigates. */
export async function signOutAndRedirect(target: string = "/") {
  const supabase = createSupabaseBrowserClient();
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
  if (typeof window !== "undefined") {
    window.location.assign(target);
  }
}

/** Subscription badge metadata for the navbar pill. */
export function subscriptionBadge(
  p: AuthProfile | null
): { label: string; tone: "active" | "pending" | "expired" | "free" } | null {
  if (!p) return null;
  switch (p.subscription_status) {
    case "active":   return { label: "Active",   tone: "active" };
    case "pending":  return { label: "Pending",  tone: "pending" };
    case "expired":  return { label: "Expired",  tone: "expired" };
    case "rejected": return { label: "Inactive", tone: "expired" };
    case "banned":   return { label: "Banned",   tone: "expired" };
    default:         return { label: "Free",     tone: "free" };
  }
}
