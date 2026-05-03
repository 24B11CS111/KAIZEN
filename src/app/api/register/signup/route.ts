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
  console.log("[register/signup] received request");

  const fault = envFault();
  if (fault.length > 0) {
    console.error("[register/signup] missing env vars:", fault);
    return NextResponse.json(
      {
        error: "Server is missing env var(s): " + fault.join(", ") +
          ". Add them to .env.local and restart `npm run dev`."
      },
      { status: 500 }
    );
  }

  const ip = getClientIp(request.headers);
  const rl = rateLimit("signup:" + ip, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (e) {
    console.error("[register/signup] invalid JSON:", e);
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parsed = RegisterAccountSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    console.warn("[register/signup] validation failed:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { full_name, email, password, whatsapp } = parsed.data;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error("[register/signup] could not init Supabase admin:", e);
    return NextResponse.json(
      { error: "Could not initialize Supabase. Check SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  if (whatsapp) {
    const { data: existing, error: lookupErr } = await admin
      .from("profiles")
      .select("id")
      .eq("whatsapp", whatsapp)
      .maybeSingle();
    if (lookupErr) {
      console.error("[register/signup] whatsapp lookup error:", lookupErr);
    } else if (existing) {
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
    console.error("[register/signup] createUser error:", createErr);
    const msg = createErr.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
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
    const { error: updateErr } = await admin
      .from("profiles")
      .update({ full_name, whatsapp: whatsapp ?? null })
      .eq("id", created.user.id);
    if (updateErr) {
      console.error("[register/signup] profile update error:", updateErr);
    }
  }

  console.log("[register/signup] success for", email);
  return NextResponse.json({ ok: true });
}
