import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuthBypassed } from "@/lib/devBypass";
import { OnboardingFlow } from "./OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (isAuthBypassed()) {
    return <OnboardingFlow />;
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/onboarding");

  // Already onboarded? Send them to the dojo.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const p: any = profile;
  if (p?.onboarded_at) redirect("/dojo");

  return <OnboardingFlow />;
}
