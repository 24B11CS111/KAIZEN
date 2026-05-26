import { NextResponse } from "next/server";
import { buildCallbackUrl, getSiteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * KAIZEN.SYS — Auth diagnostics endpoint.
 *
 * Hit GET /api/auth/debug from your browser to see what URL the server
 * is using for auth redirects. Share this output when debugging auth.
 *
 * REMOVE or GATE BEHIND ADMIN AUTH before going fully public.
 */
export async function GET() {
  const siteUrl   = getSiteUrl();
  const callbackUrl = buildCallbackUrl("/dojo");

  // Check which env vars are present (values masked for security)
  const env = {
    NEXT_PUBLIC_SITE_URL:       process.env.NEXT_PUBLIC_SITE_URL       ? `"${process.env.NEXT_PUBLIC_SITE_URL}"` : "(not set)",
    NEXT_PUBLIC_VERCEL_URL:     process.env.NEXT_PUBLIC_VERCEL_URL     ? `"${process.env.NEXT_PUBLIC_VERCEL_URL}"` : "(not set)",
    VERCEL_URL:                 process.env.VERCEL_URL                 ? `"${process.env.VERCEL_URL}"` : "(not set)",
    NEXT_PUBLIC_SUPABASE_URL:   process.env.NEXT_PUBLIC_SUPABASE_URL   ? "set ✓" : "MISSING ✗",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set ✓" : "MISSING ✗",
    SUPABASE_SERVICE_ROLE_KEY:  process.env.SUPABASE_SERVICE_ROLE_KEY  ? "set ✓" : "MISSING ✗",
    NEXT_PUBLIC_BYPASS_AUTH:    process.env.NEXT_PUBLIC_BYPASS_AUTH ?? "(not set)"
  };

  // Test Supabase anon key connectivity
  let supabaseReachable = false;
  let supabaseError: string | null = null;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && anonKey) {
      const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        signal: AbortSignal.timeout(5000)
      });
      supabaseReachable = res.ok;
      if (!res.ok) supabaseError = `HTTP ${res.status} ${res.statusText}`;
    } else {
      supabaseError = "Missing Supabase env vars";
    }
  } catch (e) {
    supabaseError = e instanceof Error ? e.message : String(e);
  }

  // Test admin API (createUser permission)
  let adminApiOk = false;
  let adminApiError: string | null = null;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        signal: AbortSignal.timeout(5000)
      });
      adminApiOk = res.ok;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        adminApiError = `HTTP ${res.status} — ${(body as any)?.message ?? res.statusText}`;
      }
    } else {
      adminApiError = "Missing service role key";
    }
  } catch (e) {
    adminApiError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    auth: {
      siteUrl,
      callbackUrl,
      supabaseReachable,
      supabaseError,
      adminApiOk,
      adminApiError
    },
    env,
    instructions: {
      supabaseDashboard: {
        siteUrl: siteUrl,
        redirectUrls: [
          callbackUrl.replace("?next=%2Fdojo", "?*"),
          "https://*.vercel.app/auth/callback?*",
          "http://localhost:3000/auth/callback?*"
        ]
      },
      vercelEnvVars: {
        NEXT_PUBLIC_SITE_URL: siteUrl
      }
    }
  }, { status: 200 });
}
