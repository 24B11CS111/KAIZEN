import { NextResponse } from "next/server";
import { OnboardingSchema } from "@/lib/validation";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient
} from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isAuthBypassed } from "@/lib/devBypass";
import { generatePlan, planInputFromProfile } from "@/lib/ai-plan";

export const runtime = "nodejs";

/**
 * POST /api/onboarding
 *
 * Persists the onboarding questionnaire:
 *   1. Updates public.profiles with the structured fields + onboarded_at
 *   2. Inserts a full snapshot row into public.onboarding_data
 *   3. Auto-generates the user's first 30-day AI plan
 *
 * Writes happen under the service-role client (admin) so we don't rely
 * on RLS being permissive enough for the schema-extended columns. The
 * user identity comes from the live server-side auth session.
 */
export async function POST(request: Request) {
  if (isAuthBypassed()) {
    return NextResponse.json({ ok: true, bypassed: true });
  }

  const ip = getClientIp(request.headers);
  const rl = rateLimit("onboarding:" + ip, 8, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000))
        }
      }
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in again." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Could not initialize Supabase. Check SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  await admin.from("profiles").upsert(
    { id: user.id, email: user.email ?? "" },
    { onConflict: "id" }
  );

  const { error: profErr } = await admin
    .from("profiles")
    .update({
      full_name: data.full_name,
      age: data.age,
      gender: data.gender,
      occupation: data.occupation,
      field_of_study: data.field_of_study,
      daily_time_min: data.daily_time_min,
      skill_level: data.skill_level,
      main_goal: data.main_goal,
      onboarded_at: new Date().toISOString()
    } as any)
    .eq("id", user.id);

  if (profErr) {
    return NextResponse.json(
      { error: "Could not save your profile: " + profErr.message },
      { status: 500 }
    );
  }

  const { error: snapErr } = await admin.from("onboarding_data").insert({
    user_id: user.id,
    full_name: data.full_name,
    age: data.age,
    gender: data.gender,
    occupation: data.occupation,
    field_of_study: data.field_of_study,
    daily_time_min: data.daily_time_min,
    skill_level: data.skill_level,
    main_goal: data.main_goal,
    main_goal_other: data.main_goal_other ?? null,
    source: "web",
    raw: data as any
  } as any);

  if (snapErr) {
    console.error("[onboarding] snapshot insert failed:", snapErr.message);
  }

  // Auto-generate the user's first 30-day AI plan.
  let planMeta: { track_id: string; track_label: string; days: number } | null = null;
  try {
    const branchRow = await admin
      .from("profiles")
      .select("branch")
      .eq("id", user.id)
      .maybeSingle();
    const branch = (branchRow.data as any)?.branch ?? null;

    const planInput = planInputFromProfile({ ...data, branch });
    const plan = generatePlan(planInput);

    const { error: planErr } = await admin.from("ai_plans").insert({
      user_id: user.id,
      track_id: plan.track_id,
      track_label: plan.track_label,
      generated_plan: plan.days,
      source: plan.source,
      version: 1
    } as any);

    if (planErr) {
      console.error("[onboarding] plan insert failed:", planErr.message);
    } else {
      planMeta = {
        track_id: plan.track_id,
        track_label: plan.track_label,
        days: plan.days.length
      };
    }
  } catch (e) {
    console.error("[onboarding] plan generation failed:", e);
  }

  return NextResponse.json({ ok: true, plan: planMeta });
}
