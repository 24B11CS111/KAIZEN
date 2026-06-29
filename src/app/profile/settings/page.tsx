import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile/settings");

  return (
    <main className="min-h-[100svh] bg-obsidian flex flex-col">
      {/* Native App Header */}
      <header className="sticky top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-[var(--border)]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/profile" className="btn-tap grid place-items-center h-10 w-10 -ml-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="h-5 w-5 text-white/70" />
          </Link>
          <h1 className="text-sm font-semibold tracking-wide flex-1">Preferences</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto app-scroll-container pb-bottom-nav">
        <div className="container-mobile py-6 max-w-md mx-auto">
          <SettingsForm email={user.email || ""} />
        </div>
      </div>
    </main>
  );
}
