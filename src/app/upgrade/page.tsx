import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpgradeClient } from "./UpgradeClient";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/auth/login?next=/upgrade");
  }

  // Check latest payment submission
  const { data: submission } = await supabase
    .from("payment_submissions")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If approved, redirect straight to dojo (since middleware allowed them here otherwise)
  if (submission?.status === "approved") {
    redirect("/dojo");
  }

  return <UpgradeClient submission={submission} />;
}
