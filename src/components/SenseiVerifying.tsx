"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScanLine, AlertTriangle, QrCode } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = "pending" | "active" | "rejected" | "banned" | "expired";
const POLL_MS = 4000;

const QR_URL =
  process.env.NEXT_PUBLIC_UPI_QR_PATH ||
  "https://res.cloudinary.com/dzqfrwizz/image/upload/v1778002547/70f7bcee-4a22-41ea-b6c9-5af680bfc6a0_fjcl52.png";
const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "kaizen@upi";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "KAIZEN";

interface Props {
  name?: string | null;
  initialStatus?: Status;
}

export function SenseiVerifying({ name, initialStatus = "pending" }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [checking, setChecking] = useState(true);
  // Guards against React StrictMode double-mount creating a duplicate
  // realtime channel on the same name (which fires the
  // "cannot add postgres_changes callbacks after subscribe()" error).
  const subscribedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    let timer: ReturnType<typeof setInterval> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchStatus = async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", uid)
        .single();
      if (cancelled) return;
      const s = ((data as any)?.subscription_status ?? "pending") as Status;
      setStatus(s);
      setChecking(false);
      if (s === "active") {
        if (timer) { clearInterval(timer); timer = null; }
        try {
          window.sessionStorage.setItem("kaizen_verification_status", "approved");
        } catch {}
        router.replace("/dashboard");
        router.refresh();
      } else if (s === "expired" || s === "banned") {
        if (timer) { clearInterval(timer); timer = null; }
        router.refresh();
      }
    };

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      await fetchStatus(user.id);
      if (cancelled) return;

      timer = setInterval(() => { fetchStatus(user.id); }, POLL_MS);

      // Skip if a prior mount already subscribed (StrictMode double-mount).
      if (subscribedRef.current) return;
      subscribedRef.current = true;

      // CRITICAL: chain .on() BEFORE .subscribe() synchronously.
      channel = supabase
        .channel("profile-status:" + user.id)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: "id=eq." + user.id
          },
          () => { fetchStatus(user.id); }
        )
        .subscribe();
    };

    setup();

    return () => {
      cancelled = true;
      if (timer) { clearInterval(timer); timer = null; }
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      subscribedRef.current = false;
    };
  }, [router]);

  if (status === "rejected") {
    const upiLink =
      "upi://pay?" +
      new URLSearchParams({ pa: UPI_ID, pn: UPI_NAME, cu: "INR", tn: "KAIZEN-RETRY" }).toString();

    return (
      <div className="grid place-items-center min-h-[60vh] px-6 py-10">
        <div className="text-center max-w-sm w-full">
          <div className="relative h-20 w-20 mx-auto mb-6 grid place-items-center">
            <div className="absolute inset-0 rounded-full bg-blood-500/20" />
            <AlertTriangle className="h-9 w-9 text-blood-500" />
          </div>
          <p className="label-mono">Status . Rejected</p>
          <h1 className="heading text-3xl mt-3">Verification failed.</h1>
          <p className="text-white/60 mt-3 text-sm leading-relaxed">
            Verification failed. Contact support or re-submit with a valid 12-digit UTR reference.
          </p>

          {/* QR */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="relative h-36 w-36 rounded-xl overflow-hidden border border-white/[0.08] bg-white">
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

          <div className="mt-5 grid grid-cols-2 gap-3">
            <a href={upiLink} className="btn-ghost text-xs justify-center">
              Open UPI app
            </a>
            <Link href="/enroll" className="btn-primary text-xs justify-center inline-flex items-center">
              Re-submit payment
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid place-items-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div className="relative h-24 w-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border border-blood-500/40 animate-pulseRed" />
          <div className="absolute inset-3 rounded-full border border-blood-500/30 animate-flicker" />
          <div className="absolute inset-0 grid place-items-center">
            <ScanLine className="h-9 w-9 text-blood-500" />
          </div>
        </div>
        <p className="label-mono">
          Status . {checking ? "Checking..." : "Pending"}
        </p>
        <h1 className="heading text-3xl mt-3">Sensei is verifying...</h1>
        <p className="text-white/60 mt-3 text-sm leading-relaxed">
          Your offering has been received{name ? `, ${name.split(" ")[0]}` : ""}.
          The Sensei manually inspects every UTR. You&apos;ll receive a
          WhatsApp ping the moment your gate opens.
        </p>
        <motion.div
          className="mt-8 mx-auto h-[2px] w-48 bg-white/10 overflow-hidden rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-blood-500"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
