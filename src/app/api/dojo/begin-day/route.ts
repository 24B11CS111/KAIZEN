import { NextResponse } from "next/server";
import { requirePremiumAccess } from "@/lib/apiPremiumGate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { error, user } = await requirePremiumAccess();
  if (error) return error;

  const supabase = createSupabaseServerClient();

  try {
    // Attempt to upsert user_progress summary to ensure current_day is 1
    const { error: upsertError } = await supabase
      .from("user_progress")
      .upsert({
        user_id: user!.id,
        current_day: 1,
        completed_days: [],
        streak: 0,
        longest_streak: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.warn("[begin-day] Failed to upsert user_progress:", upsertError);
    }

    // Also update profile current_day just in case
    await supabase.from("profiles").update({ current_day: 1 }).eq("id", user!.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to begin day 1" }, { status: 500 });
  }
}
