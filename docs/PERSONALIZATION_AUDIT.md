# KAIZEN.SYS — Dojo Personalization Audit

Comprehensive audit confirming that every section of the Dojo dashboard is **scoped to the authenticated user** and rendered from **dynamic data** — no static, demo, shared, or placeholder content.

## Data flow — one diagram

```
auth cookie  ─►  supabase.auth.getUser()         (server, /dojo/page.tsx)
                       │
                       ▼
                 user.id  (UUID — every query is filtered by this)
                       │
   ┌───────────────────┼───────────────────────────────────────┐
   ▼                   ▼                                       ▼
profiles            ai_plans                          user_progress + daily_logs
 (own row,        (own row,                            (own rows, RLS-scoped)
  full_name,       generated_plan jsonb,
  branch,          track_id, version)
  main_goal,
  fitness_level,
  workout_location,
  daily_time_min,
  expiry_date)
   │
   ▼
streaks  +  xp_log  +  activity_log  +  onboarding_data
(all RLS-scoped to user_id)
```

Every table has Row-Level Security enabled with `auth.uid() = user_id` as the policy predicate. A user cannot see another user's data even if they craft the query themselves.

## Section-by-section audit

| Dashboard section | Data source | Static fallback? |
|---|---|---|
| **PersonalizedWelcome** (top banner) | `profile.full_name`, `profile.main_goal`, `profile.branch`, `streaks.current_streak`, `daily_logs.completed_at` | No — variant chosen from real state |
| **EngagementMount** (reminders) | `profile.subscription_status`, `profile.expiry_date`, `streaks`, `daily_logs` | No — reminders computed from real state |
| **HeroStatusPanel** | `profile.full_name`, computed XP, current streak, today's progress %, AI status message | No |
| **AnalyticsRings** | `completed_days.length`, `cycleDay` from `profile.start_date`, `longest_streak` | No |
| **Streak-broken card** | Server-detected via `daysSinceLastCompletion()` + `longest_streak > 0` | No |
| **MissionCard** (locked days only) | `ai_plans.generated_plan[displayDay - 1]` adapted, lock state from `plan_amount` + `start_date` | No |
| **DailyMissionBoard** (unlocked days) | `assembleDailyMission(profile, planDay, trackLabel, dayNumber)` | No — every field derived from user |
| ├ STUDY | `planDay.study` (from `ai_plans.generated_plan`) | No |
| ├ PRACTICE | `planDay.practice` split into 1-3 bullets | No |
| ├ BUILD | `planDay.build` | No |
| ├ WORKOUT | `generateWorkout({ workout_location, fitness_level, daily_time_min })` | Defaults to home+beginner if missing — never demo data |
| ├ DISCIPLINE | `planDay.discipline` + `planDay.productivity` | No |
| └ RECOVERY | Deterministic per-day rotation keyed on `dayNumber` (hydration / sleep / stretch pools) | No |
| **AIGuidancePanel** | `dayData.concept`, `dayData.title`, derived focus area | No |
| **YouVsYou** | `get_you_vs_you()` RPC scoped by `auth.uid()` | No |
| **AchievementGrid** | `completedCount`, `longestStreak`, `currentStreak` | No |
| **30-Day Path grid** | `completed: Set<number>` from `daily_logs`, lock states from `plan_amount` + `cycleDay` | Header now uses `aiTrackLabel ?? profile.branch` and HIDES if both missing |
| **Complete-day button** | Posts to `/api/progress/complete` (RPC inserts to user-scoped tables only) | No |

## First-time user flow — verified personalized

When a brand-new user (just finished onboarding) lands on `/dojo`:

1. `middleware.ts` reads session cookie → confirms auth → reads `profiles.onboarded_at` → since onboarding is done, allows through
2. `/dojo/page.tsx` calls `supabase.auth.getUser()` → gets real user.id
3. Fetches `profile` row (own UUID)
4. `Promise.all` fetches `user_progress` (summary, will be the auto-seeded defaults), `ai_plans` (will be null), `daily_logs` (empty array)
5. **`ai_plans` row missing** → server-side `generatePlan(planInputFromProfile(profile))` is invoked synchronously, derives the plan from the user's onboarding answers, inserts a row with `version: 1`, and uses the fresh plan inline for the first paint
6. DojoDashboard renders with `displayDay = 1`, `streakState = { current: 0, longest: 0 }`, `completed = empty Set`
7. PersonalizedWelcome shows: **"Welcome, {name}. Your discipline journey begins now."**

## Returning user flow — verified

For an existing user with progress:

1. Same auth + profile fetch
2. `user_progress` summary row exists with `current_day` (next unsealed), `completed_days[]`, `streak`, `longest_streak`, `last_completed_date`
3. `ai_plans` row exists — use the existing plan
4. `daily_logs` returns all sealed days
5. `streakBroken` derives from `daysSinceLastCompletion(last_completed_date) > 1 AND longest_streak > 0`
6. PersonalizedWelcome chooses:
   - Sealed today → "Well done, {name}. Day {n} is in the books."
   - Active streak → "Welcome back, {name}. Day {n} · {streak}-day fire."
   - Returning from break (missed ≥ 2) → "Welcome back, {name}. Day {n} — reseal the line."

## Static-content audit — completed sweeps

| Past issue | Fix shipped |
|---|---|
| Day grid header hardcoded "CSE" fallback | Now `aiTrackLabel ?? profile.branch`, hidden if both missing |
| Static branch curriculum bleed | `/dojo/page.tsx` auto-generates AI plan on first visit; static curriculum only used as defensive fallback in DojoDashboard if `aiCurriculum` is null AND profile has a branch (degraded mode) |
| Demo Warrior mock data leaking to prod | `isAuthBypassed()` returns false in `NODE_ENV=production` regardless of env var |
| Generic missed-day banner | Replaced with immersive recovery card using exact brief copy |
| Free-tier preview | `FREE_LIMIT = 3` enforced in DojoDashboard; MissionCard renders blur + lock + upgrade CTA |
| Paid users | `plan_amount > 0` unlocks full 30-day path |
| Subscription expiry | LockedScreen on expired/banned/rejected; auto-managed by middleware + `touch_expiry` RPC |

## Supabase tables — all RLS-scoped

| Table | Per-row policy | Used in Dojo |
|---|---|---|
| `profiles` | `auth.uid() = id` for select / update | Header + welcome + workout prefs |
| `onboarding_data` | `auth.uid() = user_id` | Read once, not re-read on dashboard |
| `ai_plans` | `auth.uid() = user_id` | Daily mission source |
| `user_progress` | `auth.uid() = user_id` (summary table) | current_day, completed_days, streak |
| `user_progress_days` | `auth.uid() = user_id` (per-day log) | Used by complete_day RPC + xp/activity triggers |
| `daily_logs` | `auth.uid() = user_id` insert/select/update | Day grid + sealed-today detection |
| `streaks` | `auth.uid() = user_id` | Streak history + last_completed_date |
| `xp_log` | `auth.uid() = user_id` | YouVsYou source |
| `activity_log` | `auth.uid() = user_id` | Future-use audit log |

Admin role has read-all policies via `is_admin()` predicate. No shared/global state exists in any table.

## Note on `workout_preferences`

The brief mentions a `workout_preferences` table. KAIZEN stores these as **columns on `profiles`** instead — `workout_location` and `fitness_level` — added in migration `0007_workout_prefs.sql`. This is the canonical Supabase pattern for 1:1 user → preferences relationships (no separate table needed since preferences never have multiple rows per user). The picker `pickWorkoutTrack()` reads these columns; missing values default to home + beginner.

## Verification commands

```sql
-- Verify no row in any table can be read across users:
select tablename, policyname, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','ai_plans','user_progress','daily_logs','streaks');
-- Expected: every qual references auth.uid()

-- Verify a user has only their own ai_plans row:
select user_id, count(*) from public.ai_plans group by user_id;
-- Expected: 1 per user (or N per user if regenerated, but never cross-contaminated)
```

## Performance properties

- **3 parallel reads per dashboard cold-load**: `user_progress` (1 row), `ai_plans` (1 row), `daily_logs` (≤30 rows), plus 1 RPC `reset_stale_streak`
- All queries indexed on `(user_id)` or `(user_id, created_at)`
- `useMemo` keeps the assembled `DailyMission` from recomputing unless `profile / planDay / trackLabel / displayDay` change
- `useAuthSession` caches profile in module scope; multi-tab is one listener via `onAuthStateChange`
- Service worker is network-first for HTML; no stale demo cache can survive a deploy (cache version bumped in `public/sw.js`)

## TL;DR

The Dojo dashboard is fully personalized today. Every visible string is either:
1. The user's own profile data, OR
2. The user's own AI plan content, OR
3. The user's own workout for the current cycle position, OR
4. A motivational status message computed from the user's own progress/streak/missed-days state.

No demo profile, no fake roadmap, no shared dashboard state, no hardcoded branch names. The Welcome card uses the exact copy from the brief: **"Welcome, {userName}. Your discipline journey begins now."**
