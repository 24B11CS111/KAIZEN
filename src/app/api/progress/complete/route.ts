import { NextResponse } from "next/server";
import { isAuthBypassed } from "@/lib/devBypass";
import { DayCompletionSchema } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (isAuthBypassed()) return NextResponse.json({ ok: true, bypassed: true });
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = DayCompletionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .rpc("complete_day", {
      p_day:   parsed.data.day,
      p_notes: parsed.data.notes ?? null
    })
    .single();

  if (error) {
    const raw = (error.message ?? "").toLowerCase();
    let phrase = "Could not record completion.";
    let status = 400;
    if (raw.includes("daily limit")) {
      phrase = "daily limit reached";
      status = 409;
    } else if (raw.includes("already completed")) {
      phrase = "already completed";
      status = 409;
    } else if (raw.includes("subscription")) {
      phrase = "subscription not active";
    } else if (raw.includes("invalid day")) {
      phrase = "invalid day";
    } else if (raw.includes("unauthorized")) {
      phrase = "unauthorized";
      status = 401;
    }
    return NextResponse.json({ error: phrase }, { status });
  }

  const row = data as any;
  return NextResponse.json({
    ok: true,
    current_streak: row?.current_streak,
    longest_streak: row?.longest_streak,
    current_day:    row?.current_day
  });
}
