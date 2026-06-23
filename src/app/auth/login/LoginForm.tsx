"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Mail, KeyRound, ArrowRight, Loader2, AlertTriangle,
  Eye, EyeOff
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeNextPath } from "@/lib/siteUrl";

import { BRAND } from "@/constants/branding";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function describeAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("invalid_credentials"))
    return "Wrong email or password.";
  if (m.includes("email not confirmed") || m.includes("not confirmed"))
    return "Check your inbox — a confirmation link was sent when you signed up.";
  if (m.includes("rate") && m.includes("limit"))
    return "Too many attempts. Wait a minute and try again.";
  if (m.includes("network") || m.includes("fetch failed") || m.includes("failed to fetch"))
    return "No connection. Check your network and try again.";
  if (m.includes("user not found") || m.includes("no user"))
    return "No account found. Create one first.";
  if (m.includes("pkce") || m.includes("code verifier") || m.includes("auth session"))
    return "Sign-in session expired. Please try again.";
  // For all unrecognised errors show the raw Supabase message so we can diagnose
  // production issues. Once the root cause is fixed this can be made friendly.
  if (!raw) return "Sign-in failed. Please try again.";
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = sanitizeNextPath(search.get("next") || "/dojo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootChecking, setBootChecking] = useState(true);

  // Surface any error passed from the auth callback (?error=...).
  useEffect(() => {
    const e = search.get("error");
    if (e) {
      setError(e);
      try {
        const clean = new URL(window.location.href);
        clean.searchParams.delete("error");
        clean.searchParams.delete("error_code");
        clean.searchParams.delete("error_description");
        window.history.replaceState({}, "", clean.pathname + (clean.search || "") + clean.hash);
      } catch {}
    }
  }, [search]);

  // Boot check: if user is already signed in, skip straight to destination.
  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    supabase.auth
      .getSession()
      .then((result: any) => {
        if (cancelled) return;
        if (result?.data?.session) {
          router.replace(next);
        } else {
          setBootChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) setBootChecking(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, session: any) => {
      if (session && !cancelled) router.replace(next);
    });

    return () => {
      cancelled = true;
      try { sub.subscription.unsubscribe(); } catch {}
    };
  }, [router, next]);

  const emailValid   = useMemo(() => EMAIL_RE.test(email.trim()), [email]);
  const canPassword  = emailValid && password.length >= 6 && !loading;

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPassword) return;
    setError(null); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(), password
      });
      if (error) throw error;
      if (!data.session) throw new Error("No session returned");
      router.replace(next);
      router.refresh();
    } catch (err) {
      console.error("[LoginForm] password sign-in error:", err);
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
    } finally { setLoading(false); }
  };

  // --- Boot loading state ---
  if (bootChecking) {
    return (
      <main className="min-h-[100svh] grid place-items-center px-6 bg-obsidian">
        <div className="flex flex-col items-center gap-5">
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 18px rgba(208,0,0,0.6))" }}
          >
            <Image src={BRAND.logo} alt="KAIZEN.SYS" width={52} height={52} className="object-contain" priority />
          </motion.span>
          <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
            KAIZEN.SYS
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] flex items-center justify-center px-5 py-10 bg-obsidian">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px]"
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <span style={{ filter: "drop-shadow(0 0 20px rgba(208,0,0,0.5))" }}>
            <Image src={BRAND.logo} alt="KAIZEN.SYS" width={60} height={60} className="object-contain" priority />
          </span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/45">
            KAIZEN<span className="text-blood-500">.</span>SYS
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl glass-surface p-7 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.9)]">
          <Link href="/" className="text-[10px] uppercase tracking-[0.18em] text-white/45 hover:text-white/80 transition-colors">
            \u2190 Return to gate
          </Link>
          <h1 className="text-[26px] font-semibold leading-tight mt-3">
            Enter the <span className="text-blood-500">dojo</span>.
          </h1>
          <p className="mt-1.5 text-sm text-white/55">Sign in to continue your path.</p>

          <AnimatePresence mode="wait">
            <Pane key="password">
              <form onSubmit={submitPassword} className="mt-6 space-y-3.5" noValidate>
                <Field label="Email" icon={Mail} type="email" autoComplete="email"
                  value={email} onChange={setEmail} placeholder="warrior@school.edu"
                  inputMode="email" />
                <div className="relative">
                  <Field label="Password" icon={KeyRound}
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password} onChange={setPassword} placeholder="Your password" />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 bottom-[14px] text-white/40 hover:text-white/70"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && <ErrBanner msg={error} />}
                <SubmitBtn loading={loading} disabled={!canPassword}>Sign in</SubmitBtn>
              </form>
            </Pane>
          </AnimatePresence>
        </div>

        <p className="mt-6 text-xs text-white/40 text-center">
          New here?{" "}
          <Link
            href={"/auth/signup?next=" + encodeURIComponent(next)}
            className="text-blood-500 font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

/* ----- sub-components ----- */

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SubmitBtn({
  loading, disabled, children
}: { loading: boolean; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="btn-tap w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blood-500 text-white py-3.5 text-sm font-semibold shadow-[0_0_24px_-6px_rgba(208,0,0,0.6)] hover:bg-blood-600 hover:shadow-[0_0_32px_-4px_rgba(208,0,0,0.75)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
    >
      {loading ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Working\u2026</>
      ) : (
        <>{children} <ArrowRight className="h-4 w-4" /></>
      )}
    </button>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "url" | "numeric" | "decimal" | "search";
  placeholder?: string;
  autoComplete?: string;
  icon?: React.ComponentType<{ className?: string }>;
}
function Field({ label, value, onChange, type = "text", inputMode, placeholder, autoComplete, icon: Icon }: FieldProps) {
  return (
    <label className="block group">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 group-focus-within:text-blood-500/80 transition-colors">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.02] px-3.5 py-3.5 focus-within:border-blood-500/60 focus-within:bg-blood-500/[0.02] focus-within:shadow-[0_0_24px_-6px_rgba(208,0,0,0.25)] transition-all duration-300">
        {Icon && <Icon className="h-4 w-4 text-white/35 shrink-0 group-focus-within:text-blood-500/80 transition-colors" />}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent outline-none w-full text-[16px] text-white placeholder-white/25"
          required
        />
      </div>
    </label>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-xs text-blood-500 px-3 py-2.5 rounded-xl bg-blood-500/[0.08] border border-blood-500/25 inline-flex items-start gap-2 w-full"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{msg}</span>
    </motion.div>
  );
}
