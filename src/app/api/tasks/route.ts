import { NextResponse } from "next/server";
import { requirePremiumAccess } from "@/lib/apiPremiumGate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { error, user } = await requirePremiumAccess();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");

    if (!day) return NextResponse.json({ error: "Missing day parameter" }, { status: 400 });

    const supabase = createSupabaseServerClient();
    const { data: tasks, error: fetchError } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user!.id)
      .eq("day_number", parseInt(day))
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error, user } = await requirePremiumAccess();
  if (error) return error;

  try {
    const body = await req.json();
    const { title, notes, priority, duration, day_number } = body;

    if (!title || !day_number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: task, error: insertError } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: user!.id,
        title,
        notes: notes || null,
        priority: priority || "Medium",
        duration: duration || 30,
        type: "manual",
        day_number,
        completed: false
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { error, user } = await requirePremiumAccess();
  if (error) return error;

  try {
    const body = await req.json();
    const { id, completed, notes, duration, skipped, title, priority } = body;

    if (!id) return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

    const supabase = createSupabaseServerClient();
    
    // First fetch the task to ensure it belongs to the user
    const { data: existingTask } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("id", id)
      .eq("user_id", user!.id)
      .single();
      
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Skip logic for AI tasks
    if (skipped && existingTask.type === 'ai') {
      // Move to next day
      const { data: updatedTask, error: updateError } = await supabase
        .from("daily_tasks")
        .update({
          day_number: existingTask.day_number + 1,
          updated_at: new Date().toISOString()
        } as any)
        .eq("id", id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      return NextResponse.json({ task: updatedTask, skipped: true });
    }

    const updates: any = {};
    if (completed !== undefined) {
      updates.completed = completed;
      updates.completed_at = completed ? new Date().toISOString() : null;
    }
    if (notes !== undefined) updates.notes = notes;
    if (duration !== undefined) updates.duration = duration;
    
    // Only manual tasks can change title and priority
    if (existingTask.type === 'manual') {
      if (title !== undefined) updates.title = title;
      if (priority !== undefined) updates.priority = priority;
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("daily_tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Evaluate 80% rule
    const { data: allTasks } = await supabase
      .from("daily_tasks")
      .select("completed")
      .eq("user_id", user!.id)
      .eq("day_number", existingTask.day_number);

    let streakProtected = false;
    let percentage = 0;
    
    if (allTasks && allTasks.length > 0) {
      const completedCount = allTasks.filter((t: any) => t.completed).length;
      percentage = Math.round((completedCount / allTasks.length) * 100);

      if (percentage >= 80) {
        // Attempt to complete the day. We ignore errors like 'already completed' or 'daily limit reached'
        const { error: completeError } = await supabase.rpc("complete_day", { p_day: existingTask.day_number });
        if (!completeError) {
          streakProtected = true;
        }
      }
    }

    return NextResponse.json({ task: updatedTask, percentage, streakProtected });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error, user } = await requirePremiumAccess();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

    const supabase = createSupabaseServerClient();
    
    // RLS policy ensures users can only delete their own "manual" tasks
    const { error: deleteError } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id)
      .eq("type", "manual");

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
