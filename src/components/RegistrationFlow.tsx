"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, Mail, KeyRound, User, Phone,
  GraduationCap, Cpu, Brain, Database, RadioTower, Zap, Cog, Hammer,
  FlaskConical, Sigma, QrCode, Loader2
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  RegisterAccountSchema, RegisterPathSchema, EnrollmentSchema
} from "@/lib/validation";

type Step = 1 | 2 | 3 | 4;
type PathType = "ronin" | "shogun";

const stepTitles = ["Account", "Path", "Payment", "Sealed"];

function describeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  if (lower.includes("fetch failed") || lower.includes("failed to fetch") || lower.includes("network")) {
    return (
      "Could not reach Supabase. Open /health to diagnose. Most often: " +
      "(1) wrong NEXT_PUBLIC_SUPABASE_URL, (2) edited .env.local without restarting npm run dev, " +
      "(3) Supabase project is paused (free tier auto-pauses)."
    );
  }
  if (lower.includes("database error") || lower.includes("saving new user")) {
    return (
      "Supabase auth trigger failed. RUN supabase/migrations/0004_drop_trigger_explicit_profile.sql " +
      "in your Supabase SQL editor, then try again."
    );
  }
  return msg;
}

export function RegistrationFlow() {
  const [step, setStep] = useState<Step>(1);
  const [account, setAccount] = useState({
    full_name: "", email: "", whatsapp: "", password: ""
  });
  const [path, setPath] = useState<PathType | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [pay, setPay] = useState({ whatsapp: "", utr_number: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (step === 3 && !pay.whatsapp && account.whatsapp) {
      setPay((p) => ({ ...p, whatsapp: account.whatsapp }));
    }
  }, [step, account.whatsapp, pay.whatsapp]);

  // Clear stale notice/error whenever the user navigates between steps -
  // a "Account created" success from step 1 should NOT linger on step 3.
  useEffect(() => {
    setError(null);
    setNotice(null);
  }, [step]);

  const planAmount = path === "shogun" ? 99 : 49;
  const upi = process.env.NEXT_PUBLIC_UPI_ID || "kaizen@upi";
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || "KAIZEN.SYS";
  const qrPath = process.env.NEXT_PUBLIC_UPI_QR_PATH || "https://res.cloudinary.com/dzqfrwizz/image/upload/v1778002547/70f7bcee-4a22-41ea-b6c9-5af680bfc6a0_fjcl52.png";
  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: upi, pn: upiName, am: String(planAmount), cu: "INR",
      tn: "KAIZEN-" + planAmount
    });
    return "upi://pay?" + params.toString();
  }, [upi, upiName, planAmount]);

  // STEP 1 -> STEP 2: signup. Robust to email-confirm flow - we no longer
  // depend on a session being returned. Errors block; missing session does NOT.
  const signup = async () => {
    setError(null);
    setNotice(null);
    const parsed = RegisterAccountSchema.safeParse(account);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      // Always go through the server admin endpoint - it creates the user
      // with email_confirm=true, OR if they already exist, force-confirms
      // and resets their password to what they typed. Either way, the
      // account ends up in a state where signInWithPassword works.
      const adminRes = await fetch("/api/register/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          password: parsed.data.password,
          whatsapp: parsed.data.whatsapp ?? null
        })
      });
      const adminJson = await adminRes.json().catch(() => ({}));

      // Treat 200 OK and 409 (already exists) as success. Real errors block.
      if (!adminRes.ok && adminRes.status !== 409) {
        throw new Error(adminJson?.error || "Sign up failed. Please try again.");
      }

      // Best-effort sign-in to establish a browser session for subsequent
      // RLS-protected calls. NOT required to proceed - if Supabase still
      // rejects (rare), the next steps fall back to the admin endpoint.
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password
        });
      } catch {
        // Ignore - flow continues regardless.
      }

      setNotice("Account created. Choose your path.");
      setStep(2);
    } catch (e) {
      console.error("[register] signup error:", e);
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  // STEP 2 -> STEP 3: save path via the server endpoint
  const savePath = async () => {
    setError(null);
    setNotice(null);
    if (!path) {
      setError("Pick a path");
      return;
    }
    const parsed = RegisterPathSchema.safeParse({ path_type: path, branch: "general" });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid selection");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/register/path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path_type: parsed.data.path_type,
          branch: parsed.data.branch,
          // email is the fallback identifier when no session cookie
          email: account.email
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Could not save path. Please try again.");
      }
      setStep(3);
    } catch (e) {
      console.error("[register] path save error:", e);
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  // STEP 3 -> STEP 4: submit UTR via /api/enroll
  const submitPayment = async () => {
    setError(null);
    const parsed = EnrollmentSchema.safeParse({
      full_name: account.full_name,
      whatsapp: pay.whatsapp,
      utr_number: pay.utr_number,
      plan_amount: planAmount
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      let res: Response;
      try {
        res = await fetch("/api/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data)
        });
      } catch (netErr) {
        throw new Error(
          "Could not reach the server. Is `npm run dev` still running? (" +
          (netErr instanceof Error ? netErr.message : String(netErr)) + ")"
        );
      }
      let json: { error?: string } = {};
      try { json = await res.json(); } catch { /* may be empty */ }
      if (!res.ok) {
        throw new Error(json.error || ("Submission failed (HTTP " + res.status + ")."));
      }
      setStep(4);
    } catch (e) {
      console.error("[register] payment error:", e);
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Stepper step={step} />

      <div className="card mt-8 p-7 min-h-[420px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Pane key="1">
              <h2 className="h3">Create your account</h2>
              <p className="text-sm text-white/55 mt-1">
                One identity for the whole 30-day system.
              </p>
              <div className="mt-6 space-y-4">
                <Field label="Full name" icon={User}
                  value={account.full_name}
                  onChange={(v) => setAccount({ ...account, full_name: v })}
                  placeholder="Anurag K." />
                <Field label="Email" icon={Mail} type="email"
                  value={account.email}
                  onChange={(v) => setAccount({ ...account, email: v })}
                  placeholder="warrior@school.edu" />
                <Field label="WhatsApp" icon={Phone} inputMode="tel"
                  value={account.whatsapp}
                  onChange={(v) => setAccount({ ...account, whatsapp: v })}
                  placeholder="+91 98xxxxxxxx" />
                <Field label="Password" icon={KeyRound} type="password"
                  value={account.password}
                  onChange={(v) => setAccount({ ...account, password: v })}
                  placeholder="At least 8 chars, 1 upper, 1 digit" />
                {error && <Err msg={error} />}
                {notice && <Ok msg={notice} />}
              </div>
              <div className="mt-7 flex justify-between items-center">
                <Link href="/auth/login" className="text-xs text-white/55 hover:text-white">
                  Already have an account? Sign in
                </Link>
                <Submit onClick={signup} busy={busy}>Continue</Submit>
              </div>
            </Pane>
          )}

          {step === 2 && (
            <Pane key="2">
              <h2 className="h3">Choose your path</h2>
              <p className="text-sm text-white/55 mt-1">
                Determines your stream list and pricing.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PathCard
                  selected={path === "ronin"}
                  onClick={() => { setPath("ronin"); setBranch("general"); }}
                  title="RONIN" subtitle="Foundation Path"
                  price="₹49 / month" icon={GraduationCap} />
                <PathCard
                  selected={path === "shogun"}
                  onClick={() => { setPath("shogun"); setBranch("general"); }}
                  title="SHOGUN" subtitle="Elite Path"
                  price="₹99 / month" icon={Cpu} recommended />
              </div>
              {error && <Err msg={error} />}
              {notice && <Ok msg={notice} />}
              <div className="mt-7 flex justify-between">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <Submit onClick={savePath} busy={busy} disabled={!path}>
                  Continue
                </Submit>
              </div>
            </Pane>
          )}

          {step === 3 && (
            <Pane key="3">
              <h2 className="h3">Pay ₹{planAmount} via UPI</h2>
              <p className="text-sm text-white/55 mt-1">
                Scan, pay, then enter the 12-digit UTR.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                <div className="card p-4 grid place-items-center aspect-square relative">
                  <Image src={qrPath} alt="UPI QR" fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-contain p-6" priority />
                  <div className="absolute top-2 left-2 text-[10px] uppercase tracking-[0.18em] text-white/55">
                    QR &middot; {upi}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="card p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Amount</div>
                    <div className="text-lg font-semibold mt-0.5">₹{planAmount}</div>
                  </div>
                  <a href={upiLink} className="btn-secondary w-full text-xs">
                    <QrCode className="h-3.5 w-3.5" /> Open in UPI app
                  </a>
                  <Field label="Confirm WhatsApp" icon={Phone} inputMode="tel"
                    value={pay.whatsapp}
                    onChange={(v) => setPay({ ...pay, whatsapp: v })}
                    placeholder="+91 98xxxxxxxx" />
                  <Field label="UTR (12 digits)" inputMode="numeric"
                    value={pay.utr_number}
                    onChange={(v) =>
                      setPay({ ...pay, utr_number: v.replace(/\D/g, "").slice(0, 12) })}
                    placeholder="123456789012" />
                </div>
              </div>
              {error && <Err msg={error} />}
                {notice && <Ok msg={notice} />}
              <div className="mt-7 flex justify-between">
                <button onClick={() => setStep(3)} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <Submit onClick={submitPayment} busy={busy}>Submit for review</Submit>
              </div>
            </Pane>
          )}

          {step === 4 && (
            <Pane key="4">
              <div className="grid place-items-center text-center py-8">
                <div className="grid place-items-center h-16 w-16 rounded-full bg-blood-500/15 border border-blood-500/40 mb-5">
                  <Check className="h-8 w-8 text-blood-500" />
                </div>
                <h2 className="h3">Sealed. Sensei is verifying.</h2>
                <p className="text-sm text-white/60 mt-2 max-w-md">
                  Your offering has been received. You&apos;ll be activated within minutes.
                </p>
                <Link href="/dojo" className="btn-primary mt-6">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Pane>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Err({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="text-xs text-blood-500 mt-3 px-3 py-2 rounded-md bg-blood-500/10 border border-blood-500/30 leading-relaxed"
    >
      {msg}
    </motion.div>
  );
}

function Ok({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="text-xs text-emerald-300 mt-3 px-3 py-2 rounded-md bg-emerald-300/5 border border-emerald-300/30 leading-relaxed"
    >
      {msg}
    </motion.div>
  );
}

function Submit({
  onClick, busy, disabled, children
}: {
  onClick: () => void;
  busy: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {busy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Working...
        </>
      ) : (
        <>
          {children} <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <ol className="flex items-center gap-2">
      {stepTitles.map((label, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex-1 flex items-center gap-2">
            <motion.div
              animate={{ scale: active ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className={
                "grid place-items-center h-8 w-8 rounded-full text-xs font-medium border " +
                (done
                  ? "bg-blood-500 border-blood-500 text-white"
                  : active
                  ? "border-blood-500/70 text-blood-500"
                  : "border-white/15 text-white/40")
              }
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </motion.div>
            <span className={
              "text-[11px] uppercase tracking-[0.18em] hidden sm:inline " +
              (active ? "text-white" : "text-white/45")
            }>
              {label}
            </span>
            {i < stepTitles.length - 1 && (
              <span className="flex-1 h-px bg-white/10 mx-1" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "url" | "numeric" | "decimal" | "search";
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  autoComplete?: string;
}

function Field({ label, value, onChange, type = "text", inputMode, placeholder, icon: Icon, autoComplete }: FieldProps) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2.5 focus-within:border-blood-500/60 transition-colors">
        {Icon && <Icon className="h-4 w-4 text-white/45 shrink-0" />}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="bg-transparent outline-none w-full text-sm text-white placeholder-white/30"
        />
      </div>
    </label>
  );
}

interface PathCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  price: string;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
}

function PathCard({ selected, onClick, title, subtitle, price, icon: Icon, recommended }: PathCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "tap-card text-left rounded-xl border p-4 transition-all relative " +
        (selected
          ? "border-blood-500/70 bg-blood-500/10"
          : "border-white/10 bg-white/[0.02] hover:border-blood-500/40")
      }
    >
      {recommended && (
        <span className="absolute top-2 right-2 text-[9px] uppercase tracking-[0.18em] text-blood-500">
          Recommended
        </span>
      )}
      <span className="grid place-items-center h-9 w-9 rounded-md bg-blood-500/15 border border-blood-500/40 mb-3">
        <Icon className="h-5 w-5 text-blood-500" />
      </span>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-white/55 mt-0.5">{subtitle}</div>
      <div className="text-xs text-blood-500 font-semibold mt-2">{price}</div>
    </button>
  );
}
