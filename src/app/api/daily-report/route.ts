import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateAdaptiveMissions, DailyReport } from "@/lib/ai/adaptiveEngine";
import { generateInsights } from "@/lib/ai/insightEngine";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mood, energy, completion_percentage, notes } = body;

    // 1. Save the Daily Report
    const { data: report, error: reportError } = await supabase
      .from("daily_reports")
      .insert({
        user_id: session.user.id,
        mood,
        energy,
        completion_percentage: Number(completion_percentage),
        notes,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // 2. Check User's Subscription Tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", session.user.id)
      .single();

    const tier = profile?.subscription_tier || "expired";
    const aiEnabled = tier === "shogun" || tier === "trial";

    // 3. Fetch the active AI Plan to adapt tomorrow's missions (only if AI is enabled)
    if (aiEnabled) {
      const { data: activePlan } = await supabase
        .from("ai_plans")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (activePlan && activePlan.generated_plan) {
      const planData = activePlan.generated_plan as any;
      const currentMissions = planData.daily_missions || [];
      const goal = "User's current execution goal"; // Typically fetched from profile

      try {
        const reportData: DailyReport = {
          mood,
          energy,
          completion_percentage: Number(completion_percentage),
          notes,
        };

        const adaptation = await generateAdaptiveMissions(reportData, currentMissions, goal);
        
        // Update the plan with adjusted missions
        planData.daily_missions = adaptation.adjusted_missions;
        planData.latest_adaptation_reason = adaptation.reasoning;

        await supabase
          .from("ai_plans")
          .update({ generated_plan: planData })
          .eq("id", activePlan.id);

      } catch (aiError) {
        console.error("Adaptive engine failed, retaining current schedule:", aiError);
        // We do not throw here to ensure the report is still considered "saved"
      }
    }
    } // End if (aiEnabled)

    return NextResponse.json({ ok: true, report });
  } catch (err: any) {
    console.error("Daily Report Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit report" },
      { status: 500 }
    );
  }
}
