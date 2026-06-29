import { NextResponse } from "next/server";
import { requirePremiumAccess } from "@/lib/apiPremiumGate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { error, user } = await requirePremiumAccess();
  if (error) return error;

  const supabase = createSupabaseServerClient();

  try {
    const { day_number } = await req.json().catch(() => ({ day_number: 1 }));

    // Upsert user_progress summary
    const { data: existingProgress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (existingProgress) {
      await supabase.from("user_progress").update({
        current_day: day_number,
        updated_at: new Date().toISOString()
      }).eq("user_id", user!.id);
    } else {
      await supabase.from("user_progress").insert({
        user_id: user!.id,
        current_day: day_number,
        completed_days: [],
        streak: 0,
        longest_streak: 0,
        updated_at: new Date().toISOString()
      });
    }

    // Also update profile current_day just in case
    await supabase.from("profiles").update({ current_day: day_number }).eq("id", user!.id);

    // Create daily_tasks based on ai_plans for this day
    const { data: plans } = await supabase
      .from("ai_plans")
      .select("generated_plan")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (plans && plans.generated_plan) {
      // Check if tasks already exist for this day
      const { data: existingTasks } = await supabase
        .from("daily_tasks")
        .select("id")
        .eq("user_id", user!.id)
        .eq("day_number", day_number)
        .limit(1);

      if (!existingTasks || existingTasks.length === 0) {
        let tasksToInsert: any[] = [];
        
        // generated_plan can be an array of missions or an object
        const planData = plans.generated_plan;
        
        const processMission = (mission: any) => {
          if (mission && mission.title) {
            tasksToInsert.push({
              user_id: user!.id,
              title: mission.title,
              notes: mission.description || null,
              priority: "High",
              duration: mission.duration || 30,
              type: "ai",
              day_number: day_number
            });
          }
        };

        if (Array.isArray(planData)) {
          planData.forEach(processMission);
        } else if (planData && typeof planData === "object") {
          processMission(planData);
        }

        if (tasksToInsert.length > 0) {
          await supabase.from("daily_tasks").insert(tasksToInsert);
        }
      }
    }

    return NextResponse.json({ success: true, day_number });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || `Failed to begin day` }, { status: 500 });
  }
}
