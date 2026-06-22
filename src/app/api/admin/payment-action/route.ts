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

    const { submission_id, action } = await req.json();
    if (!submission_id || !action) {
      return NextResponse.json({ error: "Missing submission_id or action" }, { status: 400 });
    }

    const { data: submission } = await adminClient
      .from("payment_submissions")
      .select("*")
      .eq("id", submission_id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const targetUserId = submission.user_id;

    if (action === "approve") {
      const tier = submission.plan.toLowerCase() === "shogun" ? "shogun" : "ronin";
      
      await adminClient.from("payment_submissions").update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id
      }).eq("id", submission_id);

      // Add 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      await adminClient.from("profiles").update({
        subscription_tier: tier,
        expiry_date: thirtyDaysFromNow.toISOString()
      }).eq("id", targetUserId);
    } 
    else if (action === "reject") {
      await adminClient.from("payment_submissions").update({
        status: "rejected",
        approved_at: new Date().toISOString(),
        approved_by: user.id
      }).eq("id", submission_id);
    }
    else if (action === "extend") {
      // Extend expiry by 30 days
      const { data: targetProfile } = await adminClient.from("profiles").select("expiry_date").eq("id", targetUserId).single();
      const currentExpiry = targetProfile?.expiry_date ? new Date(targetProfile.expiry_date) : new Date();
      currentExpiry.setDate(currentExpiry.getDate() + 30);

      await adminClient.from("profiles").update({
        expiry_date: currentExpiry.toISOString()
      }).eq("id", targetUserId);
    }
    else if (action === "upgrade_plan") {
      await adminClient.from("profiles").update({ subscription_tier: "shogun" }).eq("id", targetUserId);
    }
    else if (action === "downgrade_plan") {
      await adminClient.from("profiles").update({ subscription_tier: "ronin" }).eq("id", targetUserId);
    }
    else if (action === "delete") {
      await adminClient.from("payment_submissions").delete().eq("id", submission_id);
    }
    else if (action === "ban") {
      await adminClient.from("profiles").update({ 
        subscription_tier: "expired",
        subscription_status: "banned",
        is_suspended: true
      }).eq("id", targetUserId);
    }
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Payment action error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
