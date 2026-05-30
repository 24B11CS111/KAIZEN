import { NextResponse } from "next/server";
import { EnrollmentSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { isAuthBypassed } from "@/lib/devBypass";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Dev bypass: short-circuit so the registration flow can be walked
  // through without a real session.
  if (isAuthBypassed()) {
    return NextResponse.json({ ok: true, bypassed: true });
  }

  const ip = getClientIp(request.headers);
  const rl = rateLimit("enroll:" + ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = EnrollmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { full_name, whatsapp, plan_amount, utr_number } = parsed.data;
  const admin = createSupabaseAdminClient();

  // Check current profile state
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_status, expiry_date")
    .eq("id", user.id)
    .maybeSingle();
  const p: any = profile;

  if (p?.subscription_status === "active" && p?.expiry_date && new Date(p.expiry_date) > new Date()) {
    return NextResponse.json(
      { error: "You already have an active subscription." },
      { status: 409 }
    );
  }
  if (p?.subscription_status === "banned") {
    return NextResponse.json({ error: "Account is banned." }, { status: 403 });
  }

  const { data: existingPending } = await admin
    .from("utr_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (existingPending) {
    return NextResponse.json(
      { error: "Your offering is under Sensei verification." },
      { status: 409 }
    );
  }

  // WhatsApp uniqueness across other users
  if (whatsapp) {
    const { data: dupe } = await admin
      .from("profiles")
      .select("id")
      .eq("whatsapp", whatsapp)
      .neq("id", user.id)
      .maybeSingle();
    if (dupe) {
      return NextResponse.json(
        { error: "This WhatsApp number is already linked to another account." },
        { status: 409 }
      );
    }
  }

  // Update profile
  const { error: profErr } = await admin
    .from("profiles")
    .update({
      full_name,
      whatsapp,
      plan_amount,
      subscription_status: "pending"
    })
    .eq("id", user.id);
  if (profErr) {
    return NextResponse.json(
      { error: "Could not save your profile: " + profErr.message },
      { status: 500 }
    );
  }

  // Insert UTR log
  const { error: utrErr } = await admin
    .from("utr_logs")
    .insert({
      user_id: user.id,
      utr_number,
      plan_amount,
      status: "pending",
      ip_address: ip ?? null
    } as any);

  if (utrErr) {
    const code = (utrErr as any).code;
    if (code === "23505") {
      return NextResponse.json(
        { error: "This UTR has already been submitted." },
        { status: 409 }
      );
    }
    if (code === "23514") {
      return NextResponse.json(
        { error: "UTR must be exactly 12 digits." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not record the UTR: " + utrErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
