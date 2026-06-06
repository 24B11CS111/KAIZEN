import { requireAdminPage } from "@/lib/admin";
import { Settings, ShieldCheck, Mail, Key, Bell, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { profile } = await requireAdminPage();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Settings</h1>
        <p className="text-white/50 text-sm mt-1">Manage platform configuration and Sensei permissions.</p>
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blood-500/30 bg-blood-500/10 text-2xl font-bold text-blood-400">
              {profile?.full_name?.charAt(0) || "S"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{profile?.full_name || "Super Admin"}</h2>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <p className="text-sm text-emerald-400">Full System Access</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Account Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-sm font-medium text-white">Admin Email</p>
                    <p className="text-xs text-white/40 mt-0.5">{profile?.email}</p>
                  </div>
                </div>
                <button disabled className="px-4 py-2 rounded-lg bg-white/5 text-white/40 text-xs font-semibold cursor-not-allowed border border-white/5">
                  Locked
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-sm font-medium text-white">Authentication</p>
                    <p className="text-xs text-white/40 mt-0.5">Password & Supabase Auth</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-xs font-semibold transition-colors">
                  Reset Password
                </button>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform Config</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-sm font-medium text-white">Sensei Notifications</p>
                    <p className="text-xs text-white/40 mt-0.5">Receive alerts for new UTR submissions</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blood-500"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-sm font-medium text-white">Database Caching</p>
                    <p className="text-xs text-white/40 mt-0.5">Clear Next.js route caches</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-xs font-semibold transition-colors">
                  Purge Cache
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
