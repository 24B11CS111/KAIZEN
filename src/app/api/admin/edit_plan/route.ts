import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

export const runtime = "nodejs";

const EditPlanSchema = z.object({
  submission_id: z.string().uuid()
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { supabase } = guard;

  const parsed = EditPlanSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "submission_id required" }, { status: 400 });
  }

  // Find user from submission
  const { data: sub } = await supabase.from("payment_submissions").select("user_id").eq("id", parsed.data.submission_id).single();
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get current profile
  const { data: prof } = await supabase.from("profiles").select("subscription_tier").eq("id", sub.user_id).single();
  
  const newTier = prof?.subscription_tier === "shogun" ? "ronin" : "shogun";

  const { error } = await supabase.from("profiles").update({ subscription_tier: newTier }).eq("id", sub.user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
