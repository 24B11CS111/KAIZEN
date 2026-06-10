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
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#030303] text-white selection:bg-blood-500/30">
      {/* Desktop / tablet sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-64 xl:w-72 shrink-0 flex-col border-r border-white/[0.06] bg-black/50 backdrop-blur-xl">
        <AdminSidebar />
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminHeader adminProfile={profile} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <ErrorBoundary name="Admin View">
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
