import { NextResponse } from "next/server";
import { EnrollmentSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // 1. Rate limit by IP — 3 per hour
  const ip = getClientIp(request.headers);
  const rl = rateLimit(`enroll:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  // 2. Auth
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // 3. Validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = EnrollmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { full_name, whatsapp, utr_number, plan_amount } = parsed.data;

  // 4. Update profile (whatsapp + name); use admin client because user might not
  // have updated the row before — but RLS still protects via policy (auth.uid() = id)
  const admin = createSupabaseAdminClient();

  // Check current profile state
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, subscription_status, expiry_date, whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Refuse new enrollment while subscription is active
  if (
    profile.subscription_status === "active" &&
    profile.expiry_date &&
    new Date(profile.expiry_date).getTime() > Date.now()
  ) {
    return NextResponse.json(
      { error: "You already have an active subscription." },
      { status: 409 }
    );
  }
  if (profile.subscription_status === "banned") {
    return NextResponse.json({ error: "Account is suspended." }, { status: 403 });
  }

  // 5. Update whatsapp if missing or different
  if (profile.whatsapp !== whatsapp || !profile.whatsapp) {
    const { error: updateErr } = await admin
      .from("profiles")
      .update({ whatsapp, full_name, subscription_status: "pending" })
      .eq("id", user.id);
    if (updateErr) {
      if (updateErr.code === "23505") {
        return NextResponse.json(
          { error: "This WhatsApp number is already enrolled." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
    }
  } else {
    await admin
      .from("profiles")
      .update({ full_name, subscription_status: "pending" })
      .eq("id", user.id);
  }

  // 6. Insert UTR log (UNIQUE on utr_number)
  const { error: utrErr } = await admin.from("utr_logs").insert({
    user_id: user.id,
    utr_number,
    plan_amount,
    status: "pending",
    ip_address: ip === "unknown" ? null : ip
  });

  if (utrErr) {
    if (utrErr.code === "23505") {
      return NextResponse.json(
        { error: "This UTR has already been submitted." },
        { status: 409 }
      );
    }
    if (utrErr.code === "23514") {
      return NextResponse.json(
        { error: "UTR must be exactly 12 digits." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Could not record UTR." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "pending" });
}
