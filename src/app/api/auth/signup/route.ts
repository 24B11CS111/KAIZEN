import { NextResponse } from "next/server";
import { SignupSchema } from "@/lib/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

function envFault() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

/**
 * Lightweight signup endpoint — email + password only.
 *
 * Creates the user with email_confirm=true so the browser can immediately
 * sign-in afterward and progress through /onboarding. The detailed
 * profile fields are collected in the onboarding flow (NOT here).
 */
export async function POST(request: Request) {
  const fault = envFault();
  if (fault.length > 0) {
    return NextResponse.json(
      {
        error:
          "Server is missing env var(s): " +
          fault.join(", ") +
          ". Add them to .env.local and restart."
      },
      { status: 500 }
    );
  }

  const ip = getClientIp(request.headers);
  const rl = rateLimit("auth-signup:" + ip, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000))
        }
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Could not initialize Supabase. Check SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { source: "signup" }
  });

  if (createErr) {
    const msg = (createErr.message ?? "").toLowerCase();
    const alreadyExists =
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists");

    if (alreadyExists) {
      // Existing-but-unconfirmed user: force-confirm + reset password so
      // signInWithPassword from the browser will succeed. This mirrors
      // the recovery path used by the legacy /api/register/signup route.
      try {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users.find(
          (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
        );
        if (existing) {
          await admin.auth.admin.updateUserById(existing.id, {
            email_confirm: true,
            password
          });
          return NextResponse.json({ ok: true, confirmed_existing: true });
        }
      } catch (e) {
        console.error("[auth/signup] confirm-existing failed:", e);
      }
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: createErr.message ?? "Sign up failed" },
      { status: 400 }
    );
  }

  // Seed an email-only profile row. Onboarding fills in the rest.
  if (created.user) {
    try {
      await admin.from("profiles").upsert(
        {
          id: created.user.id,
          email: created.user.email ?? email
        },
        { onConflict: "id" }
      );
    } catch (e) {
      console.error("[auth/signup] profile seed failed:", e);
      // Non-fatal: the trigger or later RLS-protected calls can self-heal.
    }
  }

  return NextResponse.json({ ok: true, user_id: created.user?.id ?? null });
}
