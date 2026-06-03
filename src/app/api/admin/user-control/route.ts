import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthBypassed } from "@/lib/devBypass";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  action: z.enum([
    "suspend",
    "unsuspend",
    "extend_subscription",
    "grant_premium",
    "revoke_premium",
    "reset_progress",
    "edit_user"
  ]),
  user_id: z.string().uuid(),
  reason: z.string().trim().max(240).optional().nullable(),
  days: z.number().int().min(1).max(365).optional(),
  plan_amount: z.union([z.literal(49), z.literal(99)]).optional(),
  patch: z
    .object({
      full_name: z.string().trim().min(2).max(80).optional(),
      whatsapp: z.string().trim().max(20).nullable().optional(),
      branch: z.string().trim().max(40).nullable().optional(),
      occupation: z.string().trim().max(80).nullable().optional(),
      main_goal: z.string().trim().max(80).nullable().optional(),
      workout_location: z.string().trim().max(20).nullable().optional(),
      fitness_level: z.string().trim().max(20).nullable().optional()
    })
    .optional()
});

function planFromAmount(amount: number | undefined) {
  if (amount === 49) return "intermediate_49";
  if (amount === 99) return "btech_99";
  return "custom";
}

export async function POST(req: Request) {
  if (isAuthBypassed()) return NextResponse.json({ ok: true, bypassed: true });

  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid admin action" },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const admin = createSupabaseAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("email,expiry_date,plan_amount")
    .eq("id", body.user_id)
    .maybeSingle();

  if ((target as any)?.email?.toLowerCase?.() === "hrixofficial@gmail.com") {
    return NextResponse.json({ error: "Owner account cannot be modified here." }, { status: 403 });
  }

  if (body.action === "reset_progress") {
    const { error } = await admin.rpc("reset_progress", { p_user_id: body.user_id } as any);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "suspend") {
    const { error } = await admin
      .from("profiles")
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspension_reason: body.reason ?? "Manual Sensei suspension",
        subscription_status: "banned",
        expiry_date: new Date().toISOString()
      } as any)
      .eq("id", body.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, subscription_status: "banned" });
  }

  if (body.action === "unsuspend") {
    const expiry = (target as any)?.expiry_date ? new Date((target as any).expiry_date) : null;
    const status = expiry && expiry > new Date() ? "active" : "expired";
    const { error } = await admin
      .from("profiles")
      .update({
        is_suspended: false,
        suspended_at: null,
        suspension_reason: null,
        subscription_status: status
      } as any)
      .eq("id", body.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, subscription_status: status });
  }

  if (body.action === "extend_subscription" || body.action === "grant_premium") {
    const days = body.days ?? 30;
    const currentExpiry = (target as any)?.expiry_date ? new Date((target as any).expiry_date) : null;
    const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
    const expiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    const amount = body.plan_amount ?? Number((target as any)?.plan_amount ?? 99);
    const { error } = await admin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_plan: planFromAmount(amount),
        plan_amount: amount,
        start_date: new Date().toISOString(),
        expiry_date: expiry.toISOString(),
        is_suspended: false,
        suspended_at: null,
        suspension_reason: null
      } as any)
      .eq("id", body.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, subscription_status: "active", expiry_date: expiry.toISOString() });
  }

  if (body.action === "revoke_premium") {
    const { error } = await admin
      .from("profiles")
      .update({
        subscription_status: "expired",
        expiry_date: new Date().toISOString()
      } as any)
      .eq("id", body.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, subscription_status: "expired" });
  }

  if (body.action === "edit_user") {
    const { error } = await admin
      .from("profiles")
      .update(body.patch as any)
      .eq("id", body.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
