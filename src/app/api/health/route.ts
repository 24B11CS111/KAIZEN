import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckResult {
  ok: boolean;
  detail?: any;
  hint?: string;
}

interface HealthOut {
  env: CheckResult;
  url_shape?: CheckResult;
  supabase_anon?: CheckResult;
  profiles_table?: CheckResult;
  path_branch_columns?: CheckResult;
  onboarding_data_table?: CheckResult;
  user_progress_table?: CheckResult;
}

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

export async function GET() {
  const out: HealthOut = { env: { ok: false } };

  // 1) ENV check
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

  // 2) URL shape check
  const validShape = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(url);
  out.url_shape = {
    ok: validShape,
    detail: { url },
    ...(!validShape && {
      hint:
        "NEXT_PUBLIC_SUPABASE_URL should look like https://xxxxx.supabase.co (no trailing path)."
    })
  };

  // 3) Anon key check - simple sanity ping
  try {
    const anonClient = createClient(url, anon, { auth: { persistSession: false } });
    const { error } = await anonClient.auth.getSession();
    out.supabase_anon = error
      ? { ok: false, detail: error.message }
      : { ok: true };
  } catch (e: any) {
    out.supabase_anon = {
      ok: false,
      detail: e?.message ?? String(e),
      hint: "Supabase client could not initialize. Check the URL + anon key."
    };
  }

  // 4) Profiles table reachable via service role
  let admin;
  try {
    admin = createClient(url, service, { auth: { persistSession: false } });
  } catch (e: any) {
    out.profiles_table = {
      ok: false,
      detail: e?.message ?? String(e),
      hint: "Service role client failed to init."
    };
    return NextResponse.json(out, { status: 200 });
  }

  try {
    const { error } = await admin.from("profiles").select("id").limit(1);
    out.profiles_table = error
      ? {
          ok: false,
          detail: error.message,
          hint: "Run supabase/migrations/0001_initial.sql in the Supabase SQL editor."
        }
      : { ok: true };
  } catch (e: any) {
    out.profiles_table = {
      ok: false,
      detail: e?.message ?? String(e),
      hint: "Could not query profiles table."
    };
  }

  // 5) path_type / branch columns from migration 0002
  try {
    const { error } = await admin.from("profiles").select("path_type, branch").limit(1);
    out.path_branch_columns = error
      ? {
          ok: false,
          detail: error.message,
          hint: "Run supabase/migrations/0002_path_branch.sql in the Supabase SQL editor."
        }
      : { ok: true };
  } catch (e: any) {
    out.path_branch_columns = {
      ok: false,
      detail: e?.message ?? String(e)
    };
  }

  try {
    const { error } = await admin.from("onboarding_data").select("id").limit(1);
    out.onboarding_data_table = error
      ? {
          ok: false,
          detail: error.message,
          hint: "Run supabase/migrations/0004_onboarding.sql in the Supabase SQL editor."
        }
      : { ok: true };
  } catch (e: any) {
    out.onboarding_data_table = {
      ok: false,
      detail: e?.message ?? String(e)
    };
  }

  try {
    const { error } = await admin.from("user_progress").select("user_id").limit(1);
    out.user_progress_table = error
      ? {
          ok: false,
          detail: error.message,
          hint: "Run supabase/migrations/0006_persistence_layer.sql in the Supabase SQL editor."
        }
      : { ok: true };
  } catch (e: any) {
    out.user_progress_table = {
      ok: false,
      detail: e?.message ?? String(e)
    };
  }

  return NextResponse.json(out, { status: 200 });
}
