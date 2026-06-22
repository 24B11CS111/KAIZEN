import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/superAdmin";
import { NextResponse } from "next/server";

export async function requirePremiumAccess() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, is_suspended, email")
    .eq("id", session.user.id)
    .single();

  if (!profile) {
    return { error: NextResponse.json({ error: "Profile not found" }, { status: 404 }) };
  }

  const isSuper = isSuperAdmin(profile.email || session.user.email);
  if (isSuper) {
    return { user: session.user, profile };
  }

  const blockedStatus = profile.subscription_status === "banned" || profile.is_suspended === true;
  const allowedTiers = ["ronin", "shogun"];

  if (!allowedTiers.includes(profile.subscription_tier) || blockedStatus) {
    return { error: NextResponse.json({ error: "Forbidden: Premium Access Required" }, { status: 403 }) };
  }

  return { user: session.user, profile };
}
