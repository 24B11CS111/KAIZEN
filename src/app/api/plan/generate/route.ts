import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient
} from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isAuthBypassed } from "@/lib/devBypass";
import { generatePlan, planInputFromProfile } from "@/lib/ai-plan";

export const runtime = "nodejs";

/**
 * POST /api/plan/generate
 *
 * Generates a fresh personalized 30-day plan for the authenticated user
 * from their current profile, and inserts a new row into user_plans.
 *
 * Called automatically by /api/onboarding on completion, and exposed as
 * a manual "Regenerate plan" trigger from settings if the user wants to
 * iterate on their answers.
 */
export async function POST(request: Request) {
  if (isAuthBypassed()) {
    return NextResponse.json({ ok: true, bypassed: true });
  }

  const ip = getClientIp(request.headers);
  const rl = rateLimit("plan-gen:" + ip, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many plan generations. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000))
        }
      }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Could not initialize Supabase. Check SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile) {
    return NextResponse.json(
      { error: "Could not load your profile. Try again." },
      { status: 500 }
    );
  }

  const input = planInputFromProfile(profile);
  const plan = generatePlan(input);

  // Compute the next version number for this user.
  const { data: lastRow } = await admin
    .from("ai_plans")
    .select("version")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((lastRow as any)?.version ?? 0) + 1;

  const { error: insErr } = await admin.from("ai_plans").insert({
    user_id:     user.id,
    track_id:       plan.track_id,
    track_label: plan.track_label,
    generated_plan:        plan.days,
    source:      plan.source,
    version:     nextVersion
  } as any);

  if (insErr) {
    return NextResponse.json(
      { error: "Could not save plan: " + insErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    track_id: plan.track_id,
    track_label: plan.track_label,
    days: plan.days.length,
    version: nextVersion
  });
}
