"use client";

import { useState } from "react";
import { InteractiveButton } from "@/components/InteractiveButton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SettingsForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [notifications, setNotifications] = useState(true);

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    if (error) throw new Error(error.message);
    setPassword("");
  };

  const handleToggleNotifications = async () => {
    // Just a stub for UI feel
    return new Promise(resolve => setTimeout(resolve, 800)).then(() => {
      setNotifications(!notifications);
    });
  };

  return (
    <div className="space-y-8">
      {/* Account Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-blood-500 uppercase tracking-widest ml-1">Account</h2>
        <div className="card p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Email</label>
            <p className="text-sm text-white/90">{email}</p>
          </div>
          <div className="h-px bg-white/5 w-full my-2" />
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Change Password</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blood-500/50 transition-all"
                placeholder="New password"
              />
              <InteractiveButton
                variant="secondary"
                size="sm"
                onClick={handleUpdatePassword}
                successMessage="Password updated"
              >
                Update
              </InteractiveButton>
            </div>
          </div>
        </div>
      </section>

      {/* App Preferences */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-blood-500 uppercase tracking-widest ml-1">App</h2>
        <div className="card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Push Notifications</p>
              <p className="text-xs text-white/50 mt-0.5">Daily reminders and alerts</p>
            </div>
            <InteractiveButton
              variant={notifications ? "primary" : "secondary"}
              size="sm"
              onClick={handleToggleNotifications}
            >
              {notifications ? "Enabled" : "Disabled"}
            </InteractiveButton>
          </div>
        </div>
      </section>
      
      {/* Danger Zone */}
      <section className="space-y-4 pt-4">
        <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest ml-1">Danger Zone</h2>
        <div className="card border-red-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-400">Reset Account</p>
              <p className="text-xs text-white/50 mt-0.5">Cannot be undone</p>
            </div>
            <InteractiveButton
              variant="danger"
              size="sm"
              requireConfirm
              onClick={async () => {
                const supabase = createSupabaseBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.rpc('reset_progress', { p_user_id: user.id });
                }
              }}
              successMessage="Account reset"
            >
              Reset
            </InteractiveButton>
          </div>
        </div>
      </section>
    </div>
  );
}
