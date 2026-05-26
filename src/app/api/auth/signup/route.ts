import { NextResponse } from "next/server";
import { SignupSchema } from "@/lib/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { buildCallbackUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";

function envFault() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

/**
 * Translate raw GoTrue / Supabase admin API errors into user-friendly strings.
 * Called server-side so errors never reach the browser as cryptic internal messages.
 */
function friendlyAdminError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("already") || m.includes("registered") || m.includes("exists"))
    return "An account with this email already exists.";
  if (m.includes("invalid path") || m.includes("invalid url") || m.includes("redirect"))
    return "Sign-up is temporarily unavailable. Please try again in a moment.";
  if (m.includes("rate") && m.includes("limit"))
    return "Too many sign-up attempts. Try again later.";
  if (m.includes("password") && (m.includes("weak") || m.includes("short") || m.includes("length")))
    return "Password too weak. Use 8+ characters with uppercase, lowercase, and a digit.";
  if (m.includes("invalid") && m.includes("email"))
    return "Enter a valid email address.";
  if (m.includes("network") || m.includes("fetch") || m.includes("connection"))
    return "Could not reach the authentication server. Check your connection.";
  return "Sign-up failed. Please try again.";
}

/**
 * Lightweight signup endpoint -- email + password only.
 *
 * Strategy:
 *   1. Use admin createUser with email_confirm:true (no confirmation email).
 *   2. If createUser fails with a Supabase config error (e.g. Site URL not set),
 *      fall back to direct signUp via the anon key -- which works even when the
 *      Supabase Dashboard Site URL is not yet configured.
 *   3. Seed a minimal profile row so onboarding can read it.
 *
 * The detailed profile fields (name, course, etc.) are collected in /onboarding.
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

  // --- Attempt 1: Admin API (fast, bypasses email confirmation) ---
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
      // signInWithPassword from the browser will succeed immediately.
      try {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users.find(
          (u: any) => (u.email ?? "").toLowerCase() === email.toLowerCase()
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

    // --- Attempt 2: Config error (e.g. Supabase Site URL not set) ---
    // The admin API fails with "Invalid path" when the Supabase Dashboard
    // Site URL is not configured. Fall back to a direct signUp call using
    // the anon key -- this works regardless of Site URL configuration,
    // but the user may receive a confirmation email if the project
    // requires email verification.
    const isConfigError =
      msg.includes("invalid path") ||
      msg.includes("invalid url") ||
      msg.includes("redirect");

    if (isConfigError) {
      console.warn(
        "[auth/signup] Admin createUser failed with config error -- falling back to anon signUp.",
        createErr.message
      );

      const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;
      if (NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const anonClient = createClient(
            NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
          );
          const { data: signUpData, error: signUpErr } = await anonClient.auth.signUp({
            email,
            password,
            options: {
              // Absolute URL required by GoTrue -- must be on the Redirect URL allowlist.
              emailRedirectTo: buildCallbackUrl("/dojo")
            }
          });

          if (signUpErr) {
            const signUpMsg = (signUpErr.message ?? "").toLowerCase();
            if (signUpMsg.includes("already") || signUpMsg.includes("registered") || signUpMsg.includes("exists")) {
              return NextResponse.json(
                { error: "An account with this email already exists." },
                { status: 409 }
              );
            }
            return NextResponse.json(
              { error: friendlyAdminError(signUpErr.message) },
              { status: 400 }
            );
          }

          // Seed profile if we got a user back
          if (signUpData?.user) {
            try {
              await admin.from("profiles").upsert(
                { id: signUpData.user.id, email: signUpData.user.email ?? email },
                { onConflict: "id" }
              );
            } catch (e) {
              console.error("[auth/signup] profile seed (fallback) failed:", e);
            }
          }

          // If email confirmation is required by the project, signal the
          // frontend to show a "check your email" message.
          const needsConfirmation = !signUpData?.session && signUpData?.user;
          return NextResponse.json({
            ok: true,
            needs_email_confirmation: Boolean(needsConfirmation),
            user_id: signUpData?.user?.id ?? null
          });
        } catch (e) {
          console.error("[auth/signup] anon signUp fallback failed:", e);
        }
      }

      // If fallback also failed, return a clear message that points at root cause
      return NextResponse.json(
        {
          error:
            "Authentication service is not fully configured. " +
            "Set your Site URL in Supabase Dashboard \u2192 Auth \u2192 URL Configuration."
        },
        { status: 503 }
      );
    }

    // All other errors -- translate and return
    return NextResponse.json(
      { error: friendlyAdminError(createErr.message) },
      { status: 400 }
    );
  }

  // Admin createUser succeeded -- seed profile
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
    }
  }

  return NextResponse.json({ ok: true, user_id: created.user?.id ?? null });
}
