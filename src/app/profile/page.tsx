import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User, Mail, CreditCard, Calendar, Clock,
  ShieldCheck, ArrowRight, LogOut, Settings,
  Sword, AlertCircle, QrCode
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const QR_URL =
  process.env.NEXT_PUBLIC_UPI_QR_PATH ||
  "https://res.cloudinary.com/dzqfrwizz/image/upload/v1778002547/70f7bcee-4a22-41ea-b6c9-5af680bfc6a0_fjcl52.png";
const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "kaizen@upi";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "KAIZEN";

const STATUS_CONFIG: Record<string, { label: string; color: string; glow: string; dot: string }> = {
  active:   { label: "Active",     color: "text-emerald-400", glow: "shadow-[0_0_16px_-4px_rgba(52,211,153,0.5)]",  dot: "bg-emerald-400" },
  pending:  { label: "Pending",    color: "text-amber-300",   glow: "shadow-[0_0_16px_-4px_rgba(251,191,36,0.4)]",  dot: "bg-amber-400" },
  expired:  { label: "Expired",    color: "text-white/50",    glow: "",                                               dot: "bg-white/30" },
  rejected: { label: "Rejected",   color: "text-blood-500",   glow: "shadow-[0_0_16px_-4px_rgba(208,0,0,0.4)]",    dot: "bg-blood-500" },
  banned:   { label: "Banned",     color: "text-blood-500",   glow: "shadow-[0_0_16px_-4px_rgba(208,0,0,0.4)]",    dot: "bg-blood-500" },
};

function planLabel(amount: number | null | undefined): string {
  if (amount === 49) return "Intermediate Plan — \u20b949";
  if (amount === 99) return "B.Tech Plan — \u20b999";
  return "Free";
}

function planTier(amount: number | null | undefined): "free" | "intermediate" | "btech" {
  if (amount === 49) return "intermediate";
  if (amount === 99) return "btech";
  return "free";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/");

  const name       = profile.full_name ?? "Warrior";
  const email      = profile.email ?? user.email ?? "\u2014";
  const status     = (profile.subscription_status ?? "pending") as string;
  const statusConf = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const tier       = planTier(profile.plan_amount);
  const joinDate   = formatDate(profile.created_at);
  const expiry     = formatDate(profile.expiry_date);
  const inits      = initials(name);

  // UPI deep-link for re-payment (server-side, used in expired/rejected block)
  const planAmount = profile.plan_amount ?? 99;
  const upiLink =
    "upi://pay?" +
    new URLSearchParams({
      pa: UPI_ID,
      pn: UPI_NAME,
      am: String(planAmount),
      cu: "INR",
      tn: "KAIZEN-RENEW"
    }).toString();

  return (
    <main className="min-h-[100svh] bg-obsidian">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-72 z-0"
        style={{
          background:
            "radial-gradient(70% 55% at 50% -10%, rgba(208,0,0,0.09), transparent 70%)"
        }}
      />

      <div className="relative z-10 container-app max-w-md pt-8 pb-bottom-nav">

        {/* Avatar + name block */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Avatar */}
          <div className="relative mb-4">
            <div
              className="h-20 w-20 rounded-full border-2 border-blood-500/40 grid place-items-center text-2xl font-bold text-blood-500 shadow-[0_0_32px_-8px_rgba(208,0,0,0.5)]"
              style={{ background: "radial-gradient(circle at 30% 30%, rgba(208,0,0,0.15), rgba(208,0,0,0.05))" }}
            >
              {inits}
            </div>
            {/* Status dot */}
            <span
              className={
                "absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-obsidian " +
                statusConf.dot
              }
            />
          </div>

          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-white/45 mt-0.5">{email}</p>

          {/* Status pill */}
          <div className={
            "mt-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[12px] font-semibold " +
            statusConf.color + " " + statusConf.glow
          }>
            <span className={"h-1.5 w-1.5 rounded-full " + statusConf.dot} />
            {statusConf.label}
          </div>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden mb-3">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 text-blood-500" />
              <span className="text-[10px] uppercase tracking-[0.20em] text-white/45">Subscription</span>
            </div>
            {tier === "free" && (
              <Link
                href="/upgrade"
                className="btn-tap inline-flex items-center gap-1.5 rounded-lg bg-blood-500 text-white text-[11px] font-semibold px-3 py-1.5 shadow-[0_0_16px_-4px_rgba(208,0,0,0.55)]"
              >
                Upgrade <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="px-5 py-4 space-y-3.5">
            <ProfileRow
              icon={ShieldCheck}
              label="Plan"
              value={planLabel(profile.plan_amount)}
            />
            <ProfileRow
              icon={Calendar}
              label="Member since"
              value={joinDate}
            />
            {profile.expiry_date && (
              <ProfileRow
                icon={Clock}
                label="Access until"
                value={expiry}
              />
            )}
          </div>
        </div>

        {/* Account details card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden mb-3">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.05]">
            <User className="h-4 w-4 text-white/40" />
            <span className="text-[10px] uppercase tracking-[0.20em] text-white/45">Account</span>
          </div>
          <div className="px-5 py-4 space-y-3.5">
            <ProfileRow icon={User} label="Name" value={name} />
            <ProfileRow icon={Mail} label="Email" value={email} />
            {profile.field_of_study && (
              <ProfileRow icon={Sword} label="Field" value={profile.field_of_study} />
            )}
            {profile.occupation && (
              <ProfileRow
                icon={Settings}
                label="Occupation"
                value={profile.occupation.replace(/_/g, " ")}
              />
            )}
          </div>
        </div>

        {/* Status message for non-active users */}
        {status === "pending" && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4 mb-3 flex gap-3">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">Your offering is under Sensei verification.</p>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                Your payment is waiting for manual approval. Premium systems stay locked until the Sensei approves the submission.
              </p>
            </div>
          </div>
        )}

        {(status === "expired" || status === "rejected") && (
          <div className="rounded-2xl border border-blood-500/20 bg-blood-500/[0.04] p-5 mb-3">
            <div className="flex gap-3 items-start">
              <AlertCircle className="h-4 w-4 text-blood-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blood-500">
                  {status === "expired" ? "Access expired" : "Access inactive"}
                </p>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  {status === "rejected"
                    ? "Your UTR could not be verified. Scan the QR and re-submit."
                    : "Renew your subscription to continue your journey."}
                </p>
              </div>
            </div>

            {/* QR + action buttons */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="relative h-36 w-36 rounded-xl overflow-hidden border border-white/[0.10] bg-white">
                <Image
                  src={QR_URL}
                  alt="UPI QR"
                  fill
                  sizes="144px"
                  className="object-contain p-1.5"
                  priority
                />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 flex items-center gap-1.5">
                <QrCode className="h-3 w-3" /> {UPI_ID}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href={upiLink}
                className="btn-tap inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-[11px] font-semibold px-3.5 py-2 transition-all"
              >
                Open UPI app
              </a>
              <Link
                href="/upgrade"
                className="btn-tap inline-flex items-center justify-center gap-1.5 rounded-lg bg-blood-500 text-white text-[11px] font-semibold px-3.5 py-2 shadow-[0_0_16px_-4px_rgba(208,0,0,0.55)]"
              >
                {status === "rejected" ? "Re-submit" : "Renew"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-1 space-y-2">
          <Link
            href="/dojo"
            className="btn-tap flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04] transition-all px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <Sword className="h-4 w-4 text-blood-500" />
              <span className="text-sm font-medium">Go to Dojo</span>
            </div>
            <ArrowRight className="h-4 w-4 text-white/30" />
          </Link>

          <div className="rounded-2xl border border-blood-500/15 bg-blood-500/[0.03] px-5 py-1.5">
            <LogoutButton />
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid place-items-center h-8 w-8 rounded-lg bg-white/[0.03] border border-white/[0.06] shrink-0">
        <Icon className="h-3.5 w-3.5 text-white/40" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
        <p className="text-sm text-white/85 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
