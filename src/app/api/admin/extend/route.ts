import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

export const runtime = "nodejs";

const ExtendSchema = z.object({
  submission_id: z.string().uuid()
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { supabase } = guard;

  const parsed = ExtendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "submission_id required" }, { status: 400 });
  }

  // Find user from submission
  const { data: sub } = await supabase.from("payment_submissions").select("user_id").eq("id", parsed.data.submission_id).single();
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get current profile
  const { data: prof } = await supabase.from("profiles").select("expiry_date").eq("id", sub.user_id).single();
  
  const currentExpiry = prof?.expiry_date ? new Date(prof.expiry_date) : new Date();
  if (currentExpiry < new Date()) {
    currentExpiry.setTime(Date.now());
  }
  currentExpiry.setDate(currentExpiry.getDate() + 30);

  const { error } = await supabase.from("profiles").update({ expiry_date: currentExpiry.toISOString() }).eq("id", sub.user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
