"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?next=/dojo`
        }
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100svh] grid place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass rounded-2xl p-8 w-full max-w-md"
      >
        <Link href="/" className="label-mono">← Return to gate</Link>
        <h1 className="heading text-3xl mt-4">Enter the dojo.</h1>
        <p className="mt-2 text-white/60 text-sm">
          A magic-link will be dispatched to your email. No passwords. No clutter.
        </p>

        {sent ? (
          <div className="mt-6 glass rounded-lg p-4 border-blood-500/40">
            <p className="font-display">
              Scroll dispatched. Check <span className="text-blood-500">{email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="label-mono">Email</span>
              <div className="mt-2 flex items-center gap-2 glass rounded-md px-3 py-2 focus-within:border-blood-500/60">
                <Mail className="h-4 w-4 text-white/50" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent outline-none w-full text-sm"
                  placeholder="warrior@school.edu"
                />
              </div>
            </label>
            {error && <p className="text-blood-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="btn-blood w-full">
              {loading ? "Forging…" : "Dispatch link"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}
