import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateInitialPlan } from "@/lib/ai/planGenerator";
import { generateDeterministicMissions } from "@/lib/ai/missionEngine";
import { OnboardingSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const profileData = OnboardingSchema.parse(body);

    // Ensure all undefined options are passed cleanly
    const aiPayload = {
      full_name: profileData.full_name,
      occupation: profileData.occupation,
      main_goal: profileData.main_goal,
      wake_time: profileData.wake_time,
      sleep_time: profileData.sleep_time,
      available_hours: profileData.available_hours,
      discipline_level: profileData.discipline_level,
      workout_preference: profileData.workout_preference,
      energy_level: profileData.energy_level,
      study_timing: profileData.study_timing,
      work_type: profileData.work_type,
      distractions: profileData.distractions,
      skills_to_learn: profileData.skills_to_learn,
    };

    let generatedPlan;
    let isFallback = false;

    try {
      generatedPlan = await generateInitialPlan(aiPayload);
    } catch (aiError) {
      console.error("AI Generation failed, falling back to deterministic:", aiError);
      isFallback = true;
      const fallbackMissions = generateDeterministicMissions(aiPayload);
      generatedPlan = {
        monthly_strategy: "Establish daily consistency through rigid structure.",
        week_1: "Focus on hitting the daily tasks perfectly. Do not optimize yet.",
        week_2: "Build momentum. Add 10% more volume to deep work.",
        week_3: "Eliminate distractions. Refine the focus block.",
        week_4: "Sustain and reflect. Prepare for the next cycle.",
        daily_missions: fallbackMissions
      };
    }

    // Insert into ai_plans
    const { error: planError } = await supabase
      .from("ai_plans")
      .insert({
        user_id: session.user.id,
        plan_name: "Master Execution Protocol",
        status: "active",
        generated_plan: generatedPlan,
        prompt_used: isFallback ? "deterministic_fallback" : "onboarding_v1",
        generation_model: isFallback ? "none" : "gemini-2.5-flash",
      });

    if (planError) throw planError;

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        wake_time: aiPayload.wake_time,
        sleep_time: aiPayload.sleep_time,
        available_hours: aiPayload.available_hours,
        discipline_level: aiPayload.discipline_level,
        workout_preference: aiPayload.workout_preference,
        energy_level: aiPayload.energy_level,
        study_timing: aiPayload.study_timing,
        work_type: aiPayload.work_type,
        distractions: aiPayload.distractions,
        skills_to_learn: aiPayload.skills_to_learn,
      })
      .eq("id", session.user.id);

    if (profileError) throw profileError;

    return NextResponse.json({ ok: true, fallback: isFallback });
  } catch (err: any) {
    console.error("Plan Generation Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate plan" },
      { status: 500 }
    );
  }
}
