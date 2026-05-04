"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScanLine, AlertTriangle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = "pending" | "active" | "rejected" | "banned" | "expired";
const POLL_MS = 4000;

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
    return (
      <div className="grid place-items-center min-h-[60vh] px-6">
        <div className="text-center max-w-md">
          <div className="relative h-20 w-20 mx-auto mb-6 grid place-items-center">
            <div className="absolute inset-0 rounded-full bg-blood-500/20" />
            <AlertTriangle className="h-9 w-9 text-blood-500" />
          </div>
          <p className="label-mono">Status . Rejected</p>
          <h1 className="heading text-3xl mt-3">Payment rejected.</h1>
          <p className="text-white/60 mt-3 text-sm leading-relaxed">
            Please contact support. We could not verify your UTR.
          </p>
          <Link href="/enroll" className="btn-primary mt-6 inline-flex items-center justify-center w-full">
            Re-submit payment
          </Link>
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
