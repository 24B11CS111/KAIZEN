/**
 * KAIZEN.SYS — Dev auth bypass.
 *
 * When NEXT_PUBLIC_BYPASS_AUTH === "1" AND NODE_ENV !== "production",
 * every auth gate is skipped:
 *   - middleware lets all routes through
 *   - /dojo renders with a mock active profile + demo data
 *   - /admin + /sensei pages skip the admin email check
 *
 * To re-enable real auth locally: set NEXT_PUBLIC_BYPASS_AUTH=0 in
 * .env.local and RESTART `npm run dev`.
 *
 * PRODUCTION SAFETY: NODE_ENV=production short-circuits the bypass
 * to false REGARDLESS of the env var. The demo profile / progress /
 * streak below can never reach a real production user.
 */
export function isAuthBypassed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_BYPASS_AUTH === "1";
}

/** Mock profile used when auth bypass is on (dev only). */
export const mockProfile = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "demo@kaizen.local",
  role: "user" as const,
  subscription_status: "active" as const,
  plan_amount: 99,
  start_date: new Date(Date.now() - 7 * 86400000).toISOString(),
  expiry_date: new Date(Date.now() + 23 * 86400000).toISOString(),
  whatsapp: "+91 90000 00000",
  full_name: "Demo Warrior",
  path_type: "btech" as const,
  branch: "CSE" as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/** Mock streak used when auth bypass is on (dev only). */
export const mockStreak = {
  user_id: mockProfile.id,
  current_streak: 5,
  longest_streak: 7,
  last_completed_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
  updated_at: new Date().toISOString()
};

/** Mock progress (days 1-5 sealed) when auth bypass is on (dev only). */
export const mockProgress = [1, 2, 3, 4, 5].map((d) => ({
  id: "mock-" + d,
  user_id: mockProfile.id,
  day_number: d,
  completed: true,
  completed_at: new Date(Date.now() - (6 - d) * 86400000).toISOString()
}));
