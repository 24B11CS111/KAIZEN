import { NextResponse } from "next/server";
import { RegisterAccountSchema } from "@/lib/validation";
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

export async function POST(request: Request) {
  const fault = envFault();
  if (fault.length > 0) {
    return NextResponse.json(
      { error: "Server is missing env var(s): " + fault.join(", ") + ". Add them to .env.local and restart." },
      { status: 500 }
    );
  }

  const ip = getClientIp(request.headers);
  const rl = rateLimit("signup:" + ip, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 }); }

  const parsed = RegisterAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { full_name, email, password, whatsapp } = parsed.data;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: "Could not initialize Supabase. Check SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  // Pre-check: WhatsApp must be unique (when provided).
  if (whatsapp) {
    const { data: existingWa } = await admin
      .from("profiles")
      .select("id")
      .eq("whatsapp", whatsapp)
      .maybeSingle();
    if (existingWa) {
      return NextResponse.json(
        { error: "This WhatsApp number is already registered." },
        { status: 409 }
      );
    }
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  });

  if (createErr) {
    const msg = (createErr.message ?? "").toLowerCase();
    const alreadyExists =
      msg.includes("already") || msg.includes("registered") || msg.includes("exists");

    // If a prior client-side signUp left an unconfirmed user, find them
    // and force-confirm + reset password so signInWithPassword works.
    if (alreadyExists) {
      try {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users.find(
          (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
        );
        if (existing) {
          await admin.auth.admin.updateUserById(existing.id, {
            email_confirm: true,
            password,
            user_metadata: { ...(existing.user_metadata || {}), full_name }
          });
          await admin
            .from("profiles")
            .update({ full_name, whatsapp: whatsapp ?? null })
            .eq("id", existing.id);
          return NextResponse.json({ ok: true, confirmed_existing: true });
        }
      } catch (e) {
        console.error("[register/signup] confirm-existing failed:", e);
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

  if (created.user) {
    await admin
      .from("profiles")
      .update({ full_name, whatsapp: whatsapp ?? null })
      .eq("id", created.user.id);
  }

  return NextResponse.json({ ok: true });
}
