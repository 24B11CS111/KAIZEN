"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Mail, KeyRound, ArrowRight, Loader2, AlertTriangle,
  Phone, Sparkles
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "password" | "magic" | "phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[1-9]\d{7,14}$/;

function describeAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("invalid_credentials"))
    return "Wrong email or password.";
  if (m.includes("email not confirmed") || m.includes("not confirmed"))
    return "Please confirm your email first. Check your inbox for the verification link.";
  if (m.includes("rate") && m.includes("limit"))
    return "Too many attempts. Wait a minute and try again.";
  if (m.includes("network") || m.includes("fetch failed") || m.includes("failed to fetch"))
    return "Couldn't reach the server. Check your connection.";
  if (m.includes("user not found") || m.includes("no user"))
    return "No account with this method. Register first.";
  if (m.includes("invalid otp") || m.includes("token has expired"))
    return "That code is wrong or expired. Request a new one.";
  if (m.includes("phone provider") || m.includes("sms provider"))
    return "SMS sign-in isn't enabled on this project yet.";
  if (m.includes("provider is not enabled") || m.includes("oauth provider"))
    return "Google sign-in isn't enabled on this project yet.";
  return raw || "Sign-in failed. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dojo";

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [bootChecking, setBootChecking] = useState(true);

  useEffect(() => {
    const e = search.get("error");
    if (e) setError(e);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        if (data.session) router.replace(next);
        else setBootChecking(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace(next);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [router, next]);

  // Reset transient state when switching modes.
  useEffect(() => {
    setError(null);
    setMagicSent(false);
    setOtpSent(false);
    setOtp("");
  }, [mode]);

  const emailValid = useMemo(() => EMAIL_RE.test(email.trim()), [email]);
  const phoneValid = useMemo(() => PHONE_RE.test(phone.replace(/\s|-/g, "")), [phone]);
  const canSubmitPassword = emailValid && password.length >= 6 && !loading;
  const canSubmitMagic    = emailValid && !loading;
  const canSendOtp        = phoneValid && !loading;
  const canVerifyOtp      = otp.length >= 4 && otp.length <= 8 && !loading;

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitPassword) return;
    setError(null); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(), password
      });
      if (error) throw error;
      if (!data.session) throw new Error("No session returned");
      router.replace(next); router.refresh();
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
    } finally { setLoading(false); }
  };

  const submitMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitMagic) return;
    setError(null); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: origin + "/auth/callback?next=" + encodeURIComponent(next) }
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
    } finally { setLoading(false); }
  };

  const submitGoogle = async () => {
    setError(null); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: origin + "/auth/callback?next=" + encodeURIComponent(next),
          queryParams: { prompt: "select_account" }
        }
      });
      if (error) throw error;
      // OAuth redirects away — no need to set loading=false.
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const sendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendOtp) return;
    setError(null); setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const normalized = phone.startsWith("+") ? phone : ("+91" + phone.replace(/\D/g, "").slice(-10));
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
      router.replace(next); router.refresh();
    } catch (err) {
      setError(describeAuthError(err instanceof Error ? err.message : String(err)));
    } finally { setLoading(false); }
  };

  if (bootChecking) {
    return (
      <main className="min-h-[100svh] grid place-items-center px-6">
        <Loader2 className="h-6 w-6 text-blood-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] grid place-items-center px-5 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="card p-7 w-full max-w-md"
      >
        <Link href="/" className="text-[10px] uppercase tracking-[0.18em] text-white/55 hover:text-white">
          - Return to gate
        </Link>
        <h1 className="text-2xl font-semibold mt-3">Enter the dojo.</h1>
        <p className="mt-1.5 text-sm text-white/60">Sign in to continue your path.</p>

        {/* Google one-tap entry */}
        <button
          type="button"
          onClick={submitGoogle}
          disabled={loading}
          className="btn-tap mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/25 px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="mt-5 mb-4 flex items-center gap-3">
          <span className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">or</span>
          <span className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Mode tabs */}
        <div className="inline-flex rounded-md border border-white/10 bg-white/[0.02] p-0.5 text-xs">
          <ModeTab active={mode === "password"} onClick={() => setMode("password")}>Password</ModeTab>
          <ModeTab active={mode === "magic"}    onClick={() => setMode("magic")}>Email link</ModeTab>
          <ModeTab active={mode === "phone"}    onClick={() => setMode("phone")}>Phone OTP</ModeTab>
        </div>

        <AnimatePresence mode="wait">
          {mode === "password" && (
            <Pane key="password">
              <form onSubmit={submitPassword} className="mt-5 space-y-3" noValidate>
                <Field label="Email" icon={Mail} type="email" autoComplete="email"
                  value={email} onChange={setEmail} placeholder="warrior@school.edu" />
                <Field label="Password" icon={KeyRound} type="password" autoComplete="current-password"
                  value={password} onChange={setPassword} placeholder="At least 6 characters" />
                {error && <ErrBanner msg={error} />}
                <SubmitBtn loading={loading} disabled={!canSubmitPassword}>Sign in</SubmitBtn>
              </form>
            </Pane>
          )}

          {mode === "magic" && (
            <Pane key="magic">
              {!magicSent ? (
                <form onSubmit={submitMagic} className="mt-5 space-y-3" noValidate>
                  <Field label="Email" icon={Mail} type="email" autoComplete="email"
                    value={email} onChange={setEmail} placeholder="warrior@school.edu" />
                  <p className="text-[11px] text-white/55">
                    We will email you a one-time link. No password needed.
                  </p>
                  {error && <ErrBanner msg={error} />}
                  <SubmitBtn loading={loading} disabled={!canSubmitMagic}>Email me a link</SubmitBtn>
                </form>
              ) : (
                <SentBanner label="Link sent" body={"Check " + email + ". The link expires in 1 hour."} />
              )}
            </Pane>
          )}

          {mode === "phone" && (
            <Pane key="phone">
              {!otpSent ? (
                <form onSubmit={sendPhoneOtp} className="mt-5 space-y-3" noValidate>
                  <Field label="Mobile" icon={Phone} type="tel" inputMode="tel" autoComplete="tel"
                    value={phone} onChange={setPhone} placeholder="+91 98XXXXXXXX" />
                  <p className="text-[11px] text-white/55">
                    A 6-digit code arrives by SMS. Indian numbers can be entered without country code.
                  </p>
                  {error && <ErrBanner msg={error} />}
                  <SubmitBtn loading={loading} disabled={!canSendOtp}>Send code</SubmitBtn>
                </form>
              ) : (
                <form onSubmit={verifyPhoneOtp} className="mt-5 space-y-3" noValidate>
                  <p className="text-[11px] text-white/55">Code sent to <span className="text-white/85 font-medium">{phone}</span>.</p>
                  <Field
                    label="6-digit code" icon={Sparkles} inputMode="numeric"
                    value={otp}
                    onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 8))}
                    placeholder="123456"
                  />
                  {error && <ErrBanner msg={error} />}
                  <SubmitBtn loading={loading} disabled={!canVerifyOtp}>Verify &amp; sign in</SubmitBtn>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(""); setError(null); }}
                    className="w-full text-[11px] text-white/55 hover:text-white/85 mt-2"
                  >
                    Change number
                  </button>
                </form>
              )}
            </Pane>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-5 border-t border-white/10 text-xs text-white/55 text-center">
          New here?{" "}
          <Link href="/auth/signup" className="text-blood-500 font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

/* ----- subcomponents ----- */

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
      className={"btn-tap px-3 py-1.5 rounded-[5px] transition-colors " +
        (active ? "bg-blood-500 text-white" : "text-white/65 hover:text-white")}
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
      className="btn-primary w-full disabled:opacity-50 inline-flex items-center justify-center gap-2 btn-tap"
    >
      {loading ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Working...</>
      ) : (
        <>{children} <ArrowRight className="h-4 w-4" /></>
      )}
    </button>
  );
}

function SentBanner({ label, body }: { label: string; body: string }) {
  return (
    <div className="mt-5 card p-4 border-blood-500/40">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-white/65 mt-2 leading-relaxed">{body}</p>
    </div>
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
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-3 focus-within:border-blood-500/60 transition-colors">
        {Icon && <Icon className="h-4 w-4 text-white/45 shrink-0" />}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent outline-none w-full text-[16px] text-white placeholder-white/30"
          required
        />
      </div>
    </label>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  return (
    <div className="text-xs text-blood-500 px-3 py-2 rounded-md bg-blood-500/10 border border-blood-500/30 inline-flex items-start gap-2 w-full">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{msg}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 5c1.617 0 3.077.561 4.225 1.654l3.156-3.156C17.404 1.55 14.882.5 12 .5 7.392.5 3.397 3.137 1.5 7l3.69 2.86C6.05 7.123 8.808 5 12 5z"/>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.4-1.12 2.61-2.39 3.41l3.66 2.84c2.13-1.97 3.75-4.88 3.75-8.49z"/>
      <path fill="#FBBC05" d="M5.19 14.14c-.22-.66-.34-1.36-.34-2.14s.12-1.48.34-2.14L1.5 7C.66 8.5.18 10.2.18 12s.48 3.5 1.32 5l3.69-2.86z"/>
      <path fill="#34A853" d="M12 23.5c3.24 0 5.96-1.07 7.95-2.91l-3.66-2.84c-1.02.69-2.33 1.1-4.29 1.1-3.19 0-5.95-2.13-6.81-5l-3.69 2.86C3.4 20.86 7.39 23.5 12 23.5z"/>
    </svg>
  );
}
