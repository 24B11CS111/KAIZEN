"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Mail, KeyRound, ArrowRight, Loader2, AlertTriangle,
  Eye, EyeOff, ShieldCheck
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const KAIZEN_LOGO = "https://res.cloudinary.com/dzqfrwizz/image/upload/v1777189231/e5717fae-28ad-4eb7-9ec8-cb953b5cc353.png";

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
  return raw || "Sign-up failed. Please try again.";
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
  const next = search.get("next") || "/onboarding";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
  }, [router, next]);

  const emailValid = useMemo(() => EMAIL_RE.test(email.trim()), [email]);
  const pwMeta     = useMemo(() => passwordStrength(password), [password]);
  const pwValid    =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password);
  const canSubmit = emailValid && pwValid && !loading;

  const submitGoogle = useCallback(async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: origin + "/auth/callback?next=" + encodeURIComponent(next),
          queryParams: { prompt: "select_account", access_type: "offline" }
        }
      });
      if (oauthErr) throw oauthErr;
      // Leave googleLoading=true — browser is redirecting to Google.
    } catch (err) {
      setError(describeSignupError(err instanceof Error ? err.message : String(err)));
      setGoogleLoading(false);
    }
  }, [next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Sign-up failed");

      // Establish browser session immediately so /onboarding is accessible.
      const supabase = createSupabaseBrowserClient();
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(), password
      });
      if (signErr) throw signErr;

      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(describeSignupError(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (bootChecking || googleLoading) {
    return (
      <main className="min-h-[100svh] grid place-items-center px-6 bg-obsidian">
        <div className="flex flex-col items-center gap-5">
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 18px rgba(208,0,0,0.6))" }}
          >
            <Image src={KAIZEN_LOGO} alt="KAIZEN.SYS" width={52} height={52} className="object-contain" priority />
          </motion.span>
          <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
            {googleLoading ? "Connecting…" : "KAIZEN.SYS"}
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
            <Image src={KAIZEN_LOGO} alt="KAIZEN.SYS" width={60} height={60} className="object-contain" priority />
          </span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/45">
            KAIZEN<span className="text-blood-500">.</span>SYS
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]">
          <Link href="/" className="text-[10px] uppercase tracking-[0.18em] text-white/45 hover:text-white/80 transition-colors">
            ← Return to gate
          </Link>
          <h1 className="text-[26px] font-semibold leading-tight mt-3">
            Forge your <span className="text-blood-500">identity</span>.
          </h1>
          <p className="mt-1.5 text-sm text-white/55">
            Create your account. No credit card needed.
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={submitGoogle}
            disabled={loading || googleLoading}
            className="btn-tap mt-6 w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 px-4 py-3.5 text-sm font-semibold transition-all disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/70" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <div className="mt-5 mb-5 flex items-center gap-3">
            <span className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">or with email</span>
            <span className="flex-1 h-px bg-white/[0.07]" />
          </div>

          <form onSubmit={submit} noValidate className="space-y-3.5">
            <Field
              label="Email" icon={Mail} type="email" autoComplete="email"
              value={email} onChange={setEmail} placeholder="warrior@school.edu"
              inputMode="email"
              valid={email.length === 0 ? null : emailValid}
            />

            <div>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Password</span>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.02] px-3.5 py-3.5 focus-within:border-blood-500/50 transition-colors">
                  <KeyRound className="h-4 w-4 text-white/35 shrink-0" />
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
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating your account…</>
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
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</span>
      <div
        className={
          "mt-1.5 flex items-center gap-2 rounded-xl border bg-white/[0.02] px-3.5 py-3.5 transition-colors " +
          (valid === false
            ? "border-blood-500/40"
            : "border-white/[0.09] focus-within:border-blood-500/50")
        }
      >
        {Icon && <Icon className="h-4 w-4 text-white/35 shrink-0" />}
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path fill="#EA4335" d="M12 5c1.617 0 3.077.561 4.225 1.654l3.156-3.156C17.404 1.55 14.882.5 12 .5 7.392.5 3.397 3.137 1.5 7l3.69 2.86C6.05 7.123 8.808 5 12 5z"/>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.4-1.12 2.61-2.39 3.41l3.66 2.84c2.13-1.97 3.75-4.88 3.75-8.49z"/>
      <path fill="#FBBC05" d="M5.19 14.14c-.22-.66-.34-1.36-.34-2.14s.12-1.48.34-2.14L1.5 7C.66 8.5.18 10.2.18 12s.48 3.5 1.32 5l3.69-2.86z"/>
      <path fill="#34A853" d="M12 23.5c3.24 0 5.96-1.07 7.95-2.91l-3.66-2.84c-1.02.69-2.33 1.1-4.29 1.1-3.19 0-5.95-2.13-6.81-5l-3.69 2.86C3.4 20.86 7.39 23.5 12 23.5z"/>
    </svg>
  );
}
