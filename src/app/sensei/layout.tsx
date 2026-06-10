import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminPage } from "@/lib/admin";
import { safeRpc } from "@/lib/safeRpc";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";

export const dynamic = "force-dynamic";

export default async function SenseiLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdminPage();

  const supabase = createSupabaseServerClient();
  await safeRpc(supabase, "touch_all_expired_subscriptions", undefined, "sensei/layout");

  return (
    <div className="flex h-[100svh] overflow-hidden bg-obsidian text-white selection:bg-blood-500/30">
      {/* Sidebar - Hidden on small screens, block on lg */}
      <div className="hidden lg:block lg:w-64 lg:shrink-0 border-r border-white/5 bg-black/50 backdrop-blur-xl">
        <AdminSidebar />
      </div>

      {/* Main Content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <AdminHeader adminProfile={profile} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative z-10">
          {/* We wrap children in an ErrorBoundary at the layout level in case a whole page crashes */}
          <ErrorBoundary name="Admin View">
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
