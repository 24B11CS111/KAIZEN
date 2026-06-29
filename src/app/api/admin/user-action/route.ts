import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const adminClient = createSupabaseAdminClient();
    const serverClient = createSupabaseServerClient();
    
    // Auth check
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await serverClient
      .from("profiles")
      .select("is_admin, email")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin && profile?.email?.toLowerCase() !== "hrixofficial@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { target_user_id, action } = await req.json();
    if (!target_user_id || !action) {
      return NextResponse.json({ error: "Missing target_user_id or action" }, { status: 400 });
    }

    if (action === "ban") {
      await adminClient.from("profiles").update({ 
        subscription_tier: "expired",
        subscription_status: "banned",
        is_suspended: true
      }).eq("id", target_user_id);
    }
    else if (action === "unban") {
      await adminClient.from("profiles").update({ 
        subscription_status: "active",
        is_suspended: false
      }).eq("id", target_user_id);
    }
    else if (action === "upgrade_plan") {
      await adminClient.from("profiles").update({ subscription_tier: "shogun" }).eq("id", target_user_id);
    }
    else if (action === "downgrade_plan") {
      await adminClient.from("profiles").update({ subscription_tier: "ronin" }).eq("id", target_user_id);
    }
    else if (action === "delete") {
      // In Supabase, deleting a user from auth.users also cascades to profiles if set up, 
      // but adminClient.auth.admin.deleteUser is the way to do it.
      const { error } = await adminClient.auth.admin.deleteUser(target_user_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("User action error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
