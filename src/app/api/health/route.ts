import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint. Hit /api/health to see exactly what's wrong.
 *
 * Returns a JSON object with the result of every check we can run:
 *   - env: are all required env vars defined?
 *   - supabase_anon: can the anon key talk to Supabase auth?
 *   - supabase_service: can the service key reach the DB?
 *   - profiles_table: does the profiles table exist (i.e. did the migration run)?
 *   - path_branch_columns: did migration 0002 also run?
 *
 * Fields with "ok": false include a "hint" telling you how to fix it.
 */
export async function GET() {
  const out: Record<string, unknown> = { ts: new Date().toISOString() };

  // 1. ENV CHECK
  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ADMIN_EMAIL"
  ];
  const envStatus: Record<string, boolean> = {};
  const missing: string[] = [];
  for (const k of requiredEnv) {
    const present = typeof process.env[k] === "string" && process.env[k]!.length > 0;
    envStatus[k] = present;
    if (!present) missing.push(k);
  }
  out.env = {
    ok: missing.length === 0,
    detail: envStatus,
    ...(missing.length > 0 && {
      hint:
        "Missing env var(s) " +
        missing.join(", ") +
        ". Add them to .env.local at the project root, then RESTART `npm run dev` (Next.js only reads env at startup)."
    })
  };

  if (missing.length > 0) {
    return NextResponse.json(out, { status: 200 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 1.5  shape-check the URL (catches typos like "https//" and trailing slashes)
  let urlOk = false;
  try {
    const u = new URL(url);
    urlOk = u.protocol === "https:" && u.host.endsWith(".supabase.co");
  } catch { urlOk = false; }
  out.url_shape = {
    ok: urlOk,
    value: url,
    ...(urlOk
      ? {}
      : { hint: "URL must look like https://xxxxx.supabase.co (no trailing slash, no path)." })
  };
  if (!urlOk) return NextResponse.json(out, { status: 200 });

  // 2. ANON CONNECT - hit auth health
  try {
    const anonClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { error } = await anonClient.auth.getSession();
    out.supabase_anon = error
      ? { ok: false, error: error.message, hint: "Anon key may be wrong or project paused." }
      : { ok: true };
  } catch (e) {
    out.supabase_anon = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      hint: "Could not reach Supabase. Check the URL and your network."
    };
  }

  // 3. SERVICE ROLE -> DB query
  try {
    const admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .limit(1);
    if (error) {
      const isMissingTable =
        error.message.includes("relation") ||
        error.message.includes("does not exist") ||
        error.code === "42P01";
      out.profiles_table = {
        ok: false,
        error: error.message,
        hint: isMissingTable
          ? "The profiles table doesn't exist. Run supabase/migrations/0001_initial.sql in your Supabase SQL editor."
          : "Service role key may be wrong, or RLS is blocking the service role (it shouldn't)."
      };
    } else {
      out.profiles_table = { ok: true, sample_count: data?.length ?? 0 };

      // 4. Does migration 0002 columns exist?
      const { error: colErr } = await admin
        .from("profiles")
        .select("path_type, branch")
        .limit(1);
      out.path_branch_columns = colErr
        ? {
            ok: false,
            error: colErr.message,
            hint:
              "Migration 0002 not applied. Run supabase/migrations/0002_path_branch.sql in Supabase SQL editor."
          }
        : { ok: true };
    }
  } catch (e) {
    out.profiles_table = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      hint: "Service role connection failed entirely."
    };
  }

  // 5. SUMMARY
  const allOk =
    (out.env as { ok: boolean }).ok &&
    (out.url_shape as { ok: boolean }).ok &&
    (out.supabase_anon as { ok: boolean }).ok &&
    (out.profiles_table as { ok: boolean }).ok &&
    ((out.path_branch_columns as { ok: boolean })?.ok ?? false);

  out.summary = allOk
    ? { ok: true, message: "All systems green. Registration should work." }
    : { ok: false, message: "Fix the entries flagged ok:false above (each has a 'hint')." };

  return NextResponse.json(out, { status: 200 });
}
