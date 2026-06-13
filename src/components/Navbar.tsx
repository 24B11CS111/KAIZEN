"use client";

/**
 * KAIZEN.SYS — Navbar
 *
 * Premium, auth-aware, hydration-safe.
 *
 * Three render states:
 *   - loading           → skeleton avatar (no flash of sign-in CTAs)
 *   - unauthenticated   → "Sign in" + "Sign up" CTAs
 *   - authenticated     → ProfileMenu (avatar + name + badge + dropdown)
 *
 * Behavior:
 *   - sticky with glassmorphism that intensifies on scroll
 *   - subtle blood-red glow at scroll-top edge
 *   - mobile hamburger reveals the link list
 *   - tap targets ≥ 40px high
 */

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthSession } from "@/lib/useAuthSession";
import { ProfileMenu } from "./ProfileMenu";

const KAIZEN_LOGO = "https://res.cloudinary.com/dsvfrlwt1/image/upload/v1780421879/cb8239e9-c357-4ef2-bf15-693a52b91803_vzjrb3.png";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { status, profile, firstName } = useAuthSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAuthed = status === "authenticated";

  return (
    <header
      className={
        "fixed top-0 inset-x-0 z-40 transition-all duration-300 " +
        (scrolled
          ? "bg-surface/90 backdrop-blur-xl border-b border-[var(--border)] shadow-lg"
          : "bg-transparent")
      }
    >
      {scrolled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)"
          }}
        />
      )}

      <nav className="px-4 h-14 flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Brand */}
        <Link
          href={isAuthed ? "/dojo" : "/"}
          className="flex items-center gap-2 group shrink-0 btn-tap"
        >
          <span className="relative grid place-items-center h-8 w-8 transition-all duration-300">
            <Image
              src={KAIZEN_LOGO}
              alt="KAIZEN.SYS"
              width={32}
              height={32}
              className="object-contain w-full h-full"
              style={{ filter: "drop-shadow(0 0 0px rgba(208,0,0,0))", transition: "filter 0.3s" }}
              priority
            />
          </span>
          <span className="text-sm font-semibold tracking-wide">
            KAIZEN<span className="text-blood-500">.</span>SYS
          </span>
        </Link>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {status === "loading" && <AuthSkeleton />}
          {status === "unauthenticated" && <GuestCta />}
          {status === "authenticated" && (
            <ProfileMenu firstName={firstName} profile={profile} />
          )}
        </div>
      </nav>
    </header>
  );
}

/* ----- Auth area subcomponents ----- */

function AuthSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <span className="h-7 w-7 rounded-full bg-white/[0.04] border border-white/[0.06] animate-pulse" />
      <span className="hidden sm:block h-3 w-14 rounded bg-white/[0.04] animate-pulse" />
    </div>
  );
}

function GuestCta() {
  return (
    <>
      <Link
        href="/auth/login"
        className="text-[13px] text-white/75 hover:text-white px-3 py-1.5 rounded-md transition-colors btn-tap"
      >
        Sign in
      </Link>
      <Link
        href="/auth/signup"
        className="btn-primary btn-sm btn-tap"
      >
        Sign up
      </Link>
    </>
  );
}
