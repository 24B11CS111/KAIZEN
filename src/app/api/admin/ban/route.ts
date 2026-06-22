import { NextResponse } from "next/server";
import { isAuthBypassed } from "@/lib/devBypass";
import { requireAdmin } from "@/lib/admin";
import { safeRpc } from "@/lib/safeRpc";
import { z } from "zod";

export const runtime = "nodejs";

const BanSchema = z.object({
  user_id: z.string().uuid().optional(),
  submission_id: z.string().uuid().optional()
});

export async function POST(req: Request) {
  if (isAuthBypassed()) return NextResponse.json({ ok: true, bypassed: true });
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { supabase } = guard;

  const parsed = BanSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || (!parsed.data.user_id && !parsed.data.submission_id)) {
    return NextResponse.json({ error: "user_id or submission_id required" }, { status: 400 });
  }

  let targetUserId = parsed.data.user_id;

  if (!targetUserId && parsed.data.submission_id) {
    const { data: sub } = await supabase.from("payment_submissions").select("user_id").eq("id", parsed.data.submission_id).single();
    if (sub) targetUserId = sub.user_id;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update subscription_status to banned and tier to expired
  const { error } = await supabase.from("profiles").update({ 
    subscription_status: "banned",
    subscription_tier: "expired"
  }).eq("id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
