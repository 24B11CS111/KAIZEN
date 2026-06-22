import { NextResponse } from "next/server";
import { isAuthBypassed } from "@/lib/devBypass";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

export const runtime = "nodejs";

const ApproveSchema = z.object({
  submission_id: z.string().uuid()
});

export async function POST(req: Request) {
  if (isAuthBypassed()) return NextResponse.json({ ok: true, bypassed: true });
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { supabase, profile } = guard;

  const parsed = ApproveSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "submission_id required" }, { status: 400 });
  }

  const submission_id = parsed.data.submission_id;

  // 1. Get the submission
  const { data: submission, error: subError } = await supabase
    .from("payment_submissions")
    .select("user_id, plan, status")
    .eq("id", submission_id)
    .single();

  if (subError || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json({ error: "Submission is not pending" }, { status: 400 });
  }

  // 2. Update submission to approved
  const { error: updateError } = await supabase
    .from("payment_submissions")
    .update({ 
      status: "approved", 
      reviewed_by: profile.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq("id", submission_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 3. Update the user's profile to the target plan (shogun/ronin)
  // Extending expiry by 30 days
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      subscription_tier: submission.plan, // 'shogun' or 'ronin'
      subscription_status: 'active', // keep legacy field synced if necessary
      start_date: new Date().toISOString(),
      expiry_date: expiryDate.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", submission.user_id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
