"use client";

/**
 * KAIZEN.SYS — Footer
 *
 * Minimal, cinematic, disciplined.
 * Mobile-first 1-col → 4-col on desktop. Subtle gradient divider,
 * blood-accent brand mark, hairline borders.
 */

import Link from "next/link";
import Image from "next/image";
import { useAuthSession } from "@/lib/useAuthSession";
import {
  Twitter, Github, Linkedin, Instagram, Mail, ArrowUpRight
} from "lucide-react";

const KAIZEN_LOGO = "https://res.cloudinary.com/dsvfrlwt1/image/upload/v1780421879/cb8239e9-c357-4ef2-bf15-693a52b91803_vzjrb3.png";

const PRODUCT = [
  { href: "/dojo",     label: "Dashboard" },
  { href: "/progress", label: "Progress" },
  { href: "/branches", label: "Branches" },
  { href: "/#pricing", label: "Pricing" }
];

const RESOURCES = [
  { href: "/#how",     label: "How it works" },
  { href: "/sensei",   label: "Sensei" },
  { href: "/upgrade",   label: "Subscribe" }
];

const LEGAL = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms",   label: "Terms" },
  { href: "/legal/refund",  label: "Refund Policy" }
];

const SOCIAL = [
  { href: "#", label: "Twitter",   icon: Twitter },
  { href: "#", label: "GitHub",    icon: Github },
  { href: "#", label: "LinkedIn",  icon: Linkedin },
  { href: "#", label: "Instagram", icon: Instagram }
];

export function Footer() {
  const { status } = useAuthSession();
  const isAuthed = status === "authenticated";

  return (
    <footer className="relative mt-16 border-t border-white/[0.06] bg-gradient-to-b from-transparent to-black/40">
      {/* hairline accent at the very top */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(208,0,0,0.35) 50%, transparent 100%)"
        }}
      />

      <div className="container-page py-12 sm:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-10 gap-x-6">
          {/* Brand block — spans 2 cols on mobile */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 group btn-tap">
              <span className="relative grid place-items-center h-8 w-8 transition-all duration-300">
                <Image
                  src={KAIZEN_LOGO}
                  alt="KAIZEN.SYS"
                  width={32}
                  height={32}
                  className="object-contain w-full h-full transition-all duration-300 group-hover:[filter:drop-shadow(0_0_10px_rgba(208,0,0,0.7))]"
                />
              </span>
              <span className="text-[15px] font-semibold tracking-wide">
                KAIZEN<span className="text-blood-500">.</span>SYS
              </span>
            </Link>
            <p className="mt-3 text-[12px] text-white/55 leading-relaxed max-w-[28ch]">
              Discipline builds your future. A 30-day execution system for students who refuse to drift.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="btn-tap grid place-items-center h-8 w-8 rounded-md border border-white/10 bg-white/[0.02] hover:border-blood-500/40 hover:text-blood-500 text-white/55 transition-colors"
                >
                  <s.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <Column title="Product"   items={PRODUCT} />
          <Column title="Resources" items={RESOURCES} />
          <Column title="Legal"     items={LEGAL} extra={
            <a
              href="mailto:support@kaizen.sys"
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white transition-colors btn-tap"
            >
              <Mail className="h-3 w-3" />
              support@kaizen.sys
            </a>
          } />
        </div>

        {/* Bottom row */}
        <div className="mt-12 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-[11px] text-white/40">
            &copy; {new Date().getFullYear()} KAIZEN.SYS — Forged for discipline.
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/40">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              All systems operational
            </span>
            {!isAuthed && (
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1 hover:text-white transition-colors btn-tap"
              >
                Get started <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

function Column({
  title, items, extra
}: {
  title: string;
  items: { href: string; label: string }[];
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-3">
        {title}
      </div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="text-[12.5px] text-white/70 hover:text-white transition-colors btn-tap"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
      {extra}
    </div>
  );
}
