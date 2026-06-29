"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { InteractiveButton } from "@/components/InteractiveButton";

export function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  };

  return (
    <InteractiveButton
      variant="secondary"
      onClick={onLogout}
      className="w-full flex justify-between px-2 py-3"
      successMessage="Signed out successfully"
    >
      <div className="flex items-center gap-3">
        <LogOut className="h-4 w-4 text-white/50" />
        <span className="text-sm font-medium">Sign out</span>
      </div>
      <div />
    </InteractiveButton>
  );
}
