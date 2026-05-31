"use client";
import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleDollarSign, QrCode, ScrollText } from "lucide-react";
import { EnrollmentSchema } from "@/lib/validation";
import { formatINR } from "@/lib/utils";

type Plan = 49 | 99;
type Step = 1 | 2 | 3 | 4;

interface Props {
  initialPlan?: Plan;
  isAuthenticated: boolean;
}

export function EnrollmentFlow({ initialPlan, isAuthenticated }: Props) {
  const [step, setStep] = useState<Step>(initialPlan ? 2 : 1);
  const [plan, setPlan] = useState<Plan | null>(initialPlan ?? null);
  const [form, setForm] = useState({ full_name: "", whatsapp: "", utr_number: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upi = process.env.NEXT_PUBLIC_UPI_ID || "kaizen@upi";
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || "KAIZEN.SYS";
  const qrPath = process.env.NEXT_PUBLIC_UPI_QR_PATH || "https://res.cloudinary.com/dzqfrwizz/image/upload/v1778002547/70f7bcee-4a22-41ea-b6c9-5af680bfc6a0_fjcl52.png";

  const upiLink = useMemo(() => {
    if (!plan) return "";
    const params = new URLSearchParams({
      pa: upi,
      pn: upiName,
      am: String(plan),
      cu: "INR",
      tn: `KAIZEN-${plan}`
    });
    return `upi://pay?${params.toString()}`;
  }, [plan, upi, upiName]);

  const submit = async () => {
    if (!plan) return;
    setError(null);
    const parsed = EnrollmentSchema.safeParse({ ...form, plan_amount: plan });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    if (!isAuthenticated) {
      setError("Please log in first to bind this enrollment to your identity.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enrollment failed");
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Stepper step={step} />

      <div className="glass rounded-2xl p-7 mt-8 min-h-[420px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Pane key="1">
              <h2 className="heading text-2xl">Choose your blade.</h2>
              <p className="text-white/60 text-sm mt-1">
                Both plans unlock the same 30-day path. Pick the one that fits your wallet.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[49, 99].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPlan(p as Plan);
                      setStep(2);
                    }}
                    className="glass glass-hover rounded-xl p-5 text-left"
                  >
                    <div className="label-mono">{p === 49 ? "Shoshin" : "Bushi"}</div>
                    <div className="font-display text-3xl mt-2">{formatINR(p)}</div>
                    <div className="text-xs text-white/55 mt-1">/ 30 days</div>
                  </button>
                ))}
              </div>
            </Pane>
          )}

          {step === 2 && plan && (
            <Pane key="2">
              <h2 className="heading text-2xl">Pay {formatINR(plan)} via UPI.</h2>
              <p className="text-white/60 text-sm mt-1">
                Scan the QR or use the link. Then keep your 12-digit UTR ready.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="glass rounded-xl p-4 grid place-items-center aspect-square relative">
                  <Image
                    src={qrPath}
                    alt="UPI QR"
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-contain p-6"
                    priority
                  />
                  <div className="absolute top-2 left-2 label-mono">QR · {upi}</div>
                </div>
                <div className="text-sm space-y-3">
                  <div className="glass rounded-lg p-3">
                    <div className="label-mono">UPI ID</div>
                    <div className="font-display mt-1">{upi}</div>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="label-mono">Amount</div>
                    <div className="font-display mt-1">{formatINR(plan)}</div>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="label-mono">Note</div>
                    <div className="text-white/80 mt-1 text-xs leading-relaxed">
                      After paying, copy the 12-digit UTR from your UPI app and proceed.
                    </div>
                  </div>
                  <a href={upiLink} className="btn-ghost w-full text-xs">
                    Open in UPI app
                  </a>
                </div>
              </div>

              <div className="mt-7 flex justify-between">
                <button onClick={() => setStep(1)} className="btn-ghost">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button onClick={() => setStep(3)} className="btn-blood">
                  I&apos;ve paid <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Pane>
          )}

          {step === 3 && plan && (
            <Pane key="3">
              <h2 className="heading text-2xl">Submit your offering.</h2>
              <p className="text-white/60 text-sm mt-1">
                The Sensei will verify within minutes. Each WhatsApp & UTR can be used only once.
              </p>

              <div className="mt-6 space-y-4">
                <Field
                  label="Full name"
                  value={form.full_name}
                  onChange={(v) => setForm({ ...form, full_name: v })}
                  placeholder="Anurag K."
                />
                <Field
                  label="WhatsApp"
                  value={form.whatsapp}
                  onChange={(v) => setForm({ ...form, whatsapp: v })}
                  placeholder="+91 98xxxxxxxx"
                  inputMode="tel"
                />
                <Field
                  label="UTR (12 digits)"
                  value={form.utr_number}
                  onChange={(v) =>
                    setForm({ ...form, utr_number: v.replace(/\D/g, "").slice(0, 12) })
                  }
                  placeholder="123456789012"
                  inputMode="numeric"
                />
                {error && <p className="text-blood-400 text-xs">{error}</p>}
                {!isAuthenticated && (
                  <p className="text-xs text-white/60">
                    You&apos;re not logged in.{" "}
                    <Link href="/auth/login?next=/enroll" className="text-blood-500 underline">
                      Sign in first →
                    </Link>
                  </p>
                )}
              </div>

              <div className="mt-7 flex justify-between">
                <button onClick={() => setStep(2)} className="btn-ghost">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button onClick={submit} disabled={submitting} className="btn-blood">
                  {submitting ? "Sealing…" : "Submit for review"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Pane>
          )}

          {step === 4 && (
            <Pane key="4">
              <div className="grid place-items-center text-center py-8">
                <div className="relative h-20 w-20 mb-5">
                  <div className="absolute inset-0 rounded-full bg-blood-500/20 animate-pulseRed" />
                  <div className="absolute inset-2 rounded-full grid place-items-center bg-blood-500/15 border border-blood-500/40">
                    <Check className="h-8 w-8 text-blood-500" />
                  </div>
                </div>
                <h2 className="heading text-3xl">Your offering is under Sensei verification.</h2>
                <p className="mt-2 text-white/60 max-w-md">
                  Your payment and UTR have been submitted successfully. Premium access activates
                  only after manual Sensei approval.
                </p>
                <Link href="/dojo" className="btn-blood mt-6">
                  Enter the Dojo <ArrowRight className="h-4 w-4" />
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Stepper({ step }: { step: Step }) {
  const items = [
    { n: 1, label: "Plan", icon: CircleDollarSign },
    { n: 2, label: "UPI", icon: QrCode },
    { n: 3, label: "Form", icon: ScrollText },
    { n: 4, label: "Verify", icon: Check }
  ] as const;
  return (
    <ol className="flex items-center justify-between gap-2">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <li key={it.n} className="flex-1 flex items-center gap-3">
            <div
              className={`grid place-items-center h-9 w-9 rounded-full border transition-all
                ${
                  done
                    ? "bg-blood-500 border-blood-500 text-white"
                    : active
                    ? "border-blood-500 text-blood-500 shadow-blood"
                    : "border-white/15 text-white/50"
                }`}
            >
              <it.icon className="h-4 w-4" />
            </div>
            <span
              className={`label-mono hidden sm:inline ${
                active ? "text-white" : "text-white/50"
              }`}
            >
              {it.label}
            </span>
            {i < items.length - 1 && (
              <span className="flex-1 h-px bg-white/10 mx-1" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "text" | "tel" | "numeric";
}) {
  return (
    <label className="block">
      <span className="label-mono">{label}</span>
      <div className="mt-2 glass rounded-md px-3 py-2 focus-within:border-blood-500/60">
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent outline-none w-full text-sm"
        />
      </div>
    </label>
  );
}
