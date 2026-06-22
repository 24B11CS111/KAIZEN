"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminRealtime() {
  const router = useRouter();
  
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    // Listen to changes across major admin tables to trigger a server-side refresh
    const channel = supabase.channel('admin_global_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_submissions' }, () => {
        router.refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        router.refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, () => {
        router.refresh();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
