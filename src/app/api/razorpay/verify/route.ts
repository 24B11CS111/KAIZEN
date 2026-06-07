import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;

  const secret = process.env.RAZORPAY_KEY_SECRET || "test_secret";
  
  // Verify signature
  const generated_signature = crypto
    .createHmac("sha256", secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Update user subscription
  const admin = createSupabaseAdminClient();
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days for this payment

  const plan_amount = plan === "elite" ? 99 : 49;

  const { error } = await admin
    .from("profiles")
    .update({
      subscription_tier: plan,
      subscription_status: "active",
      plan_amount: plan_amount,
      expiry_date: expiryDate.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update profile after payment:", error);
    return NextResponse.json({ error: "Payment verified but profile update failed" }, { status: 500 });
  }

  // Log the payment
  await admin.from("utr_logs").insert({
    user_id: user.id,
    utr_number: razorpay_payment_id, // Store payment ID here for record keeping
    plan_amount: plan_amount,
    status: "approved", // auto-approved
    reviewed_at: new Date().toISOString()
  });

  return NextResponse.json({ ok: true });
}
