"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  User, Mail, KeyRound, ArrowRight, Loader2, AlertTriangle,
  Eye, EyeOff, ShieldCheck, MailCheck
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeNextPath } from "@/lib/siteUrl";

import { BRAND } from "@/constants/branding";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function describeSignupError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("already") || m.includes("registered") || m.includes("exists"))
    return "An account with this email already exists. Sign in instead.";
  if (m.includes("rate") && m.includes("limit"))
    return "Too many attempts. Wait a moment and try again.";
  if (m.includes("network") || m.includes("fetch failed") || m.includes("failed to fetch"))
    return "No connection. Check your network and try again.";
  if (m.includes("password") && (m.includes("weak") || m.includes("short")))
    return "Password too weak. Use 8+ chars with uppercase, lowercase, and a digit.";
  if (m.includes("invalid") && m.includes("email"))
    return "Enter a valid email address.";
  // Return raw Supabase message for unrecognised errors so we can diagnose production.
  if (!raw) return "Sign-up failed. Please try again.";
  return raw;
}

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw))   score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Very strong", "Iron-clad"];
  return { score, label: labels[score] };
}

export function SignupForm() {
  const router = useRouter();
  const search = useSearchParams();
  // Sanitize next immediately — prevents open redirects and Next.js "Invalid path" errors
  const next = sanitizeNextPath(search.get("next") || "/onboarding");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootChecking, setBootChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    supabase.auth
      .getSession()
      .then((result: any) => {
        if (cancelled) return;
        if (result?.data?.session) router.replace(next);
        else setBootChecking(false);
      })
      .catch(() => {
        // Network error — show form rather than staying stuck.
        if (!cancelled) setBootChecking(false);
      });

    return () => { cancelled = true; };
  }, [router, next]);  const emailValid = useMemo(() => EMAIL_RE.test(email.trim()), [email]);
  const nameValid  = name.trim().length >= 2;
  const pwMeta     = useMemo(() => passwordStrength(password), [password]);
  const pwValid    =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);
  const canSubmit = nameValid && emailValid && pwValid && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name.trim(), email: email.trim(), password })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Sign-up failed");

      // Establish browser session immediately so /onboarding is accessible.
      const supabase = createSupabaseBrowserClient();
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(), password
      });
      if (signErr) throw signErr;

      // next is already sanitized at the top of this component
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(describeSignupError(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

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
            Forge your <span className="text-blood-500">identity</span>.
          </h1>
          <p className="mt-1.5 text-sm text-white/55">
            Create your account. No credit card needed.
          </p>

          <form onSubmit={submit} noValidate className="mt-6 space-y-3.5">
            <Field
              label="Name" icon={User} type="text" autoComplete="name"
              value={name} onChange={setName} placeholder="Miyamoto Musashi"
              valid={name.length === 0 ? null : nameValid}
            />

            <Field
              label="Email" icon={Mail} type="email" autoComplete="email"
              value={email} onChange={setEmail} placeholder="warrior@school.edu"
              inputMode="email"
              valid={email.length === 0 ? null : emailValid}
            />

            <div>
              <label className="block group">
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 group-focus-within:text-blood-500/80 transition-colors">Password</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.02] px-3.5 py-3.5 focus-within:border-blood-500/60 focus-within:bg-blood-500/[0.02] focus-within:shadow-[0_0_24px_-6px_rgba(208,0,0,0.25)] transition-all duration-300">
                  <KeyRound className="h-4 w-4 text-white/35 shrink-0 group-focus-within:text-blood-500/80 transition-colors" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8+ chars, 1 upper, 1 digit"
                    autoComplete="new-password"
                    className="bg-transparent outline-none w-full text-[16px] text-white placeholder-white/25"
                    required
                  />
                  <button
                    type="button" tabIndex={-1}
                    onClick={() => setShowPw(v => !v)}
                    className="text-white/35 hover:text-white/65 shrink-0"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2"
                >
                  <div className="flex-1 flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={
                          "h-1 flex-1 rounded-full transition-colors " +
                          (i < pwMeta.score
                            ? pwMeta.score <= 2 ? "bg-blood-700"
                              : pwMeta.score === 3 ? "bg-amber-400"
                              : "bg-emerald-400"
                            : "bg-white/[0.08]")
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 w-20 text-right shrink-0">
                    {pwMeta.label}
                  </span>
                </motion.div>
              )}
            </div>

            {error && <ErrBanner msg={error} />}

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-tap w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blood-500 text-white py-3.5 text-sm font-semibold shadow-[0_0_24px_-6px_rgba(208,0,0,0.6)] hover:bg-blood-600 hover:shadow-[0_0_32px_-4px_rgba(208,0,0,0.75)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none mt-1"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating your account\u2026</>
              ) : (
                <>Create account <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <p className="text-[11px] text-white/35 flex items-center justify-center gap-1.5 pt-0.5">
              <ShieldCheck className="h-3 w-3 text-blood-500/60" />
              We never share your email. No spam.
            </p>
          </form>
        </div>

        <p className="mt-6 text-xs text-white/40 text-center">
          Already in the dojo?{" "}
          <Link
            href={"/auth/login?next=" + encodeURIComponent(next)}
            className="text-blood-500 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

/* ----- sub-components ----- */

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "url" | "numeric";
  icon?: React.ComponentType<{ className?: string }>;
  valid?: boolean | null;
}

function Field({ label, value, onChange, type = "text", placeholder, autoComplete, inputMode, icon: Icon, valid }: FieldProps) {
  return (
    <label className="block group">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 group-focus-within:text-blood-500/80 transition-colors">{label}</span>
      <div
        className={
          "mt-1.5 flex items-center gap-2 rounded-xl border bg-white/[0.02] px-3.5 py-3.5 transition-all duration-300 " +
          (valid === false
            ? "border-blood-500/40"
            : "border-white/[0.09] focus-within:border-blood-500/60 focus-within:bg-blood-500/[0.02] focus-within:shadow-[0_0_24px_-6px_rgba(208,0,0,0.25)]")
        }
      >
        {Icon && <Icon className="h-4 w-4 text-white/35 shrink-0 group-focus-within:text-blood-500/80 transition-colors" />}
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
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

