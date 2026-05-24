"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Mail, KeyRound, ArrowRight, Loader2, AlertTriangle,
  Phone, Sparkles, Eye, EyeOff
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const KAIZEN_LOGO = "https://res.cloudinary.com/dzqfrwizz/image/upload/v1779649962/image-removebg-preview_i3duhi.png";

type Mode = "password" | "magic" | "phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{7,14}$/;

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
  if (m.includes("invalid otp") || m.includes("token has expired"))
    return "That code is wrong or expired. Request a fresh one.";
  if (m.includes("phone provider") || m.includes("sms provider"))
    return "SMS sign-in isn't enabled on this project yet.";
  if (m.includes("provider is not enabled") || m.includes("oauth provider"))
    return "Google sign-in isn't configured yet. Contact support.";
  return raw || "Sign-in failed. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dojo";

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [bootChecking, setBootChecking] = useState(true);

  // Surface any error passed from the OAuth callback.
  useEffect(() => {
    const e = search.get("error");
    if (e) setError(e);
  }, [search]);

  // Boot check: if user is already signed in, skip straight to destination.
  // Uses getSession() (cookie read, no network) + onAuthStateChange for
  // OAuth redirects that complete mid-render. Falls back on network error.
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
        // Network error — show form rather than getting stuck loading.
        if (!cancelled) setBootChecking(false);
      });

    // Listen for OAuth redirects completing (e.g. Google consent screen returns).
    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, session: any) => {
      if (session && !cancelled) router.replace(next);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router, next]);

  // Reset transient state when switching modes.
  useEffect(() => {
    setError(null);
    setMagicSent(false);
    setOtpSent(false);
    setOtp("");
  }, [mode]);

  const emailValid   = useMemo(() => EMAIL_RE.test(email.trim()), [email]);
  const phoneValid   = useMemo(() => PHONE_RE.test(phone.replace(/\s|-/g, "")), [phone]);
  const canPassword  = emailValid && password.length >= 6 && !loading;
  const canMagic     = emailValid && !loading;
  const canSendOtp   = phoneValid && !loading;
  const canVerifyOtp = otp.length >= 4 && otp.length <= 8 && !loading;

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
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
    } finally { setLoading(false); }
  };

  const submitMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMagic) return;
    setError(null); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: origin + "/auth/callback?next=" + encodeURIComponent(next)
        }
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
    } finally { setLoading(false); }
  };

  const submitGoogle = useCallback(async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: origin + "/auth/callback?next=" + encodeURIComponent(next),
          queryParams: { prompt: "select_account", access_type: "offline" }
        }
      });
      if (error) throw error;
      // OAuth redirects the browser — we intentionally leave googleLoading=true
      // so there's no blank-screen flash while the redirect completes.
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
      setGoogleLoading(false);
    }
  }, [next]);

  const sendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendOtp) return;
    setError(null); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const normalized = phone.startsWith("+")
        ? phone
        : "+91" + phone.replace(/\D/g, "").slice(-10);
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (error) throw error;
      setPhone(normalized);
      setOtpSent(true);
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
    } finally { setLoading(false); }
  };

  const verifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canVerifyOtp) return;
    setError(null); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone, token: otp, type: "sms"
      });
      if (error) throw error;
      if (!data.session) throw new Error("No session returned");
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
    } finally { setLoading(false); }
  };

  // --- Boot loading state ---
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
            Enter the <span className="text-blood-500">dojo</span>.
          </h1>
          <p className="mt-1.5 text-sm text-white/55">Sign in to continue your path.</p>

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

          <div className="mt-5 mb-4 flex items-center gap-3">
            <span className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">or</span>
            <span className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Mode tabs */}
          <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5 text-[11px] w-full">
            <ModeTab active={mode === "password"} onClick={() => setMode("password")}>Password</ModeTab>
            <ModeTab active={mode === "magic"}    onClick={() => setMode("magic")}>Magic link</ModeTab>
            <ModeTab active={mode === "phone"}    onClick={() => setMode("phone")}>Phone</ModeTab>
          </div>

          <AnimatePresence mode="wait">
            {mode === "password" && (
              <Pane key="password">
                <form onSubmit={submitPassword} className="mt-5 space-y-3.5" noValidate>
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
            )}

            {mode === "magic" && (
              <Pane key="magic">
                {!magicSent ? (
                  <form onSubmit={submitMagic} className="mt-5 space-y-3.5" noValidate>
                    <Field label="Email" icon={Mail} type="email" autoComplete="email"
                      value={email} onChange={setEmail} placeholder="warrior@school.edu"
                      inputMode="email" />
                    <p className="text-[11px] text-white/45 leading-relaxed">
                      We email you a one-time sign-in link. No password needed.
                    </p>
                    {error && <ErrBanner msg={error} />}
                    <SubmitBtn loading={loading} disabled={!canMagic}>Email me a link</SubmitBtn>
                  </form>
                ) : (
                  <SentBanner
                    label="Link sent"
                    body={"Check " + email + ". The link expires in 1 hour."}
                  />
                )}
              </Pane>
            )}

            {mode === "phone" && (
              <Pane key="phone">
                {!otpSent ? (
                  <form onSubmit={sendPhoneOtp} className="mt-5 space-y-3.5" noValidate>
                    <Field label="Mobile" icon={Phone} type="tel" inputMode="tel"
                      autoComplete="tel" value={phone} onChange={setPhone}
                      placeholder="+91 98XXXXXXXX" />
                    <p className="text-[11px] text-white/45 leading-relaxed">
                      A 6-digit SMS code. Indian numbers can skip the country code.
                    </p>
                    {error && <ErrBanner msg={error} />}
                    <SubmitBtn loading={loading} disabled={!canSendOtp}>Send code</SubmitBtn>
                  </form>
                ) : (
                  <form onSubmit={verifyPhoneOtp} className="mt-5 space-y-3.5" noValidate>
                    <p className="text-[11px] text-white/55">
                      Code sent to <span className="text-white/85 font-medium">{phone}</span>.
                    </p>
                    <Field
                      label="6-digit code" icon={Sparkles} inputMode="numeric"
                      value={otp}
                      onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 8))}
                      placeholder="123456"
                    />
                    {error && <ErrBanner msg={error} />}
                    <SubmitBtn loading={loading} disabled={!canVerifyOtp}>
                      Verify &amp; sign in
                    </SubmitBtn>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(""); setError(null); }}
                      className="w-full text-[11px] text-white/45 hover:text-white/75 transition-colors pt-1"
                    >
                      Change number
                    </button>
                  </form>
                )}
              </Pane>
            )}
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

function ModeTab({
  active, onClick, children
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "btn-tap flex-1 px-2 py-1.5 rounded-[7px] text-center transition-all " +
        (active
          ? "bg-blood-500 text-white font-semibold shadow-[0_0_16px_-4px_rgba(208,0,0,0.6)]"
          : "text-white/55 hover:text-white/85")
      }
    >
      {children}
    </button>
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
        <><Loader2 className="h-4 w-4 animate-spin" /> Working…</>
      ) : (
        <>{children} <ArrowRight className="h-4 w-4" /></>
      )}
    </button>
  );
}

function SentBanner({ label, body }: { label: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-xl border border-blood-500/30 bg-blood-500/[0.06] p-4"
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-white/60 mt-1.5 leading-relaxed">{body}</p>
    </motion.div>
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
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.02] px-3.5 py-3.5 focus-within:border-blood-500/50 transition-colors">
        {Icon && <Icon className="h-4 w-4 text-white/35 shrink-0" />}
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
