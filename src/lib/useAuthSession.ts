"use client";

/**
 * KAIZEN.SYS — Auth Session hook.
 *
 * Single source of truth for client-side auth + profile state.
 *
 * Lifecycle:
 *   1. SSR / first render: status = "loading" (so the navbar doesn't
 *      flash sign-in CTAs to authenticated users)
 *   2. After hydration: getSession() resolves → status flips to
 *      "authenticated" or "unauthenticated"
 *   3. onAuthStateChange keeps state in sync across tabs / token refresh
 *   4. When authenticated, also fetches a minimal profile row so the
 *      navbar can show the user's first name + subscription badge
 *
 * Hydration-safe by design: never reads localStorage during render and
 * doesn't differ between server + client first paint (both render
 * "loading").
 */

import { useEffect, useMemo, useState } from "react";
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

let cachedProfile: AuthProfile | null = null;
let cachedUserId: string | null = null;

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  if (cachedUserId === userId && cachedProfile) return cachedProfile;
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, subscription_status, plan_amount, expiry_date, role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  cachedProfile = data as AuthProfile;
  cachedUserId = userId;
  return cachedProfile;
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

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    // Hard-guard the entire setup. If Supabase can't init (missing env
    // vars client-side, network blip), we fall back to "unauthenticated"
    // so the navbar shows guest CTAs instead of being stuck in skeleton.
    try {
      const supabase = createSupabaseBrowserClient();

      const apply = async (session: Session | null) => {
        if (cancelled) return;
        if (session?.user) {
          setUser(session.user);
          setStatus("authenticated");
          try {
            const p = await fetchProfile(session.user.id);
            if (!cancelled) setProfile(p);
          } catch (e) {
            // Profile fetch failure is non-fatal — keep the auth state.
            console.warn("[auth] profile fetch failed:", e);
          }
        } else {
          setUser(null);
          setProfile(null);
          cachedProfile = null;
          cachedUserId = null;
          setStatus("unauthenticated");
        }
      };

      supabase.auth.getSession()
        .then(({ data }) => apply(data.session ?? null))
        .catch((e) => {
          console.warn("[auth] getSession failed:", e);
          if (!cancelled) setStatus("unauthenticated");
        });

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        apply(session ?? null);
      });
      subscription = sub.subscription;
    } catch (e) {
      console.error("[auth] init failed:", e);
      if (!cancelled) setStatus("unauthenticated");
    }

    return () => {
      cancelled = true;
      try { subscription?.unsubscribe(); } catch { /* ignore */ }
    };
  }, []);

  const firstName = useMemo(() => firstNameFrom(user, profile), [user, profile]);

  return { status, user, profile, firstName };
}

/** Sign-out helper — clears cache + Supabase session. */
export async function signOutAndRedirect(target: string = "/") {
  const supabase = createSupabaseBrowserClient();
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
  cachedProfile = null;
  cachedUserId = null;
  if (typeof window !== "undefined") {
    window.location.assign(target);
  }
}

/** Subscription badge metadata (color + label) for the navbar pill. */
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
