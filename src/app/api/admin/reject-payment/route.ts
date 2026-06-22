import { NextResponse } from "next/server";
import { isAuthBypassed } from "@/lib/devBypass";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

export const runtime = "nodejs";

const RejectSchema = z.object({
  submission_id: z.string().uuid()
});

export async function POST(req: Request) {
  if (isAuthBypassed()) return NextResponse.json({ ok: true, bypassed: true });
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const { supabase, profile } = guard;

  const parsed = RejectSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "submission_id required" }, { status: 400 });
  }

  const submission_id = parsed.data.submission_id;

  const { data: submission, error: subError } = await supabase
    .from("payment_submissions")
    .select("user_id, status")
    .eq("id", submission_id)
    .single();

  if (subError || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json({ error: "Submission is not pending" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("payment_submissions")
    .update({ 
      status: "rejected" 
    })
    .eq("id", submission_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
