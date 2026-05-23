# KAIZEN.SYS

> An AI-powered student evolution operating system for B.Tech and Intermediate students.

Mobile-first PWA + cinematic dashboard + realtime progression + branch-aware curriculum + admin approval flow. Black/red dojo aesthetic, anime-inspired progression psychology, production-grade Supabase backend.

---

## Stack

- **Next.js 14** (App Router, RSC, server actions)
- **TypeScript** (strict mode, zero errors)
- **Tailwind CSS** with custom `obsidian` / `blood` palette
- **Framer Motion** for cinematic transitions
- **Supabase** — Auth + Postgres + RLS + Realtime
- **Vercel** for production deploy
- **Capacitor** (optional) for Android shell

---

## Quick start

```bash
# 1. Install
npm install

# 2. Pull env vars from Vercel (or copy .env.local.example to .env.local and fill in)
vercel env pull .env.local

# 3. Run all 4 SQL migrations in Supabase SQL Editor (in order)
#    supabase/migrations/0000_combined.sql
#    supabase/migrations/0001_content_system.sql
#    supabase/migrations/0002_branch_seed.sql
#    supabase/migrations/0003_branch_identity.sql

# 4. Start
npm run dev
```

Open `http://localhost:3000`.

For testing without auth, set `NEXT_PUBLIC_BYPASS_AUTH=1` in `.env.local` and visit `/dojo` directly.

---

## Required environment variables

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase Dashboard -> Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Same page -> `anon public` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Same page -> `service_role` (NEVER expose client-side) |
| `ADMIN_EMAIL` | optional | Defaults to `hrixofficial@gmail.com` |
| `NEXT_PUBLIC_UPI_ID` | optional | Your UPI handle for the payment QR |
| `NEXT_PUBLIC_UPI_NAME` | optional | Display name on UPI |
| `NEXT_PUBLIC_UPI_QR_PATH` | optional | URL or `/path` to your QR PNG |
| `NEXT_PUBLIC_BYPASS_AUTH` | dev-only | Set to `1` for local UI preview without auth |
| `RATE_LIMIT_MAX` | optional | Per-IP rate limit (default 5) |
| `RATE_LIMIT_WINDOW_MS` | optional | Rate-limit window (default 1 hour) |

After editing `.env.local`, **restart `npm run dev`** — Next.js only reads env at startup.

Use `/health` to verify everything is wired correctly.

---

## Database migrations

Run **once on a fresh Supabase project**, in the SQL Editor, in this order:

1. **`0000_combined.sql`** — core tables: `profiles`, `utr_logs`, `user_progress`, `progress_logs`, `streaks`, `xp_log`, `activity_log`. RPCs: `complete_day`, `reset_stale_streak`, `approve_utr`, `reject_utr`, `ban_user`, `reset_progress`, `touch_expiry`, `get_you_vs_you`, `is_admin`. Triggers, RLS, realtime publication.
2. **`0001_content_system.sql`** — content + per-user-progress tables: `branches`, `roadmaps`, `semesters`, `modules`, `lessons`, `missions`, `certifications`, `projects`, `skills`, plus 4 user-progress mirrors.
3. **`0002_branch_seed.sql`** — curated content for all 7 B.Tech branches: skills, missions, certifications, projects, semesters.
4. **`0003_branch_identity.sql`** — purpose / career / industry / transformation / tagline columns on `branches`, seeded for all 7.

Migrations are **idempotent** — safe to re-run.

---

## NPM scripts

```bash
npm run dev          # local dev server
npm run build        # production build (used by Vercel)
npm run start        # serve the production build
npm run lint         # next lint
npm run type-check   # tsc --noEmit (strict)

# Capacitor (Android shell, optional)
npm run cap:setup    # one-time install + scaffold
npm run cap:sync     # push web -> android/
npm run cap:open     # open Android Studio
npm run cap:run      # run on connected device
npm run android:apk  # debug APK
npm run android:aab  # release AAB for Play Store
```

---

## Architecture

```
App
├── auth                     Email-password + magic link, callback, onAuthStateChange
├── /register                5-step wizard (Account -> Path -> Stream -> Payment -> Sealed)
├── /dojo                    Live cinematic dashboard (canonical home)
├── /dashboard               -> redirects to /dojo
├── /branches                7-branch index
├── /branches/[code]         Branch detail (identity / roadmap / skills / missions / certs / projects)
├── /profile, /progress      User account + analytics
├── /admin                   UTR approval queue
├── /sensei                  Heavier admin chamber
├── /enroll                  Re-enrollment (after expiry / rejection)
├── /health                  Self-diagnosis (env, supabase, tables)
└── /api/...                 Server actions and route handlers

Lib
├── supabase/{client,server,middleware,env}    Three Supabase clients + env validator
├── adminEmail                                  ADMIN_EMAIL helper (defaults to hrixofficial@gmail.com)
├── admin                                       requireAdmin() guard for admin routes
├── ranking                                     XP / Level / Rank math
├── milestones                                  Day-3/7/30 tier helpers
├── dailyTracking                               Daily-reset + streak + Supabase queries
├── useRealtimeTracking                         Single hook -> postgres_changes on user-scoped tables
├── content                                     Branch / roadmap / mission / cert / project / skill data
├── devBypass                                   Auth-bypass flag for local testing
├── validation                                  Zod schemas for every endpoint
├── rate-limit                                  In-memory per-IP rate limit
└── utils                                       cn(), daysRemaining(), formatINR()

Components
├── DojoDashboard                               The whole live dashboard
├── HeroStatusPanel + AnalyticsRings + AIGuidancePanel + YouVsYou + AchievementGrid
├── MissionCard                                 Day content with locked overlays
├── SenseiVerifying                             Pending screen with realtime polling
├── LockedScreen                                Expired / rejected gate
├── AdminApprovalList + AdminPanel              Admin UTR actions
├── BottomNav + BottomNavGate                   App-style mobile nav
├── Skeleton + ErrorBoundaryUI                  Production loading + error states
├── PageTransition / StaggerGroup               Reusable cinematic entrance
├── InstallPrompt + ServiceWorkerRegistrar      PWA install + offline shell
├── LogoutButton                                Client logout
└── Hero + Navbar + Footer + IntroLoader + GateOpening    Landing surface

Database
├── auth.users -> profiles -> {utr_logs, user_progress, progress_logs, streaks, xp_log, activity_log}
└── content    -> branches -> {roadmaps -> semesters -> modules -> lessons,
                                missions, certifications, projects, skills}
                            +  4 user_*_progress mirrors

Realtime
└── supabase_realtime publication: profiles, user_progress, streaks, xp_log,
                                   activity_log, user_mission_completions,
                                   user_skill_progress, user_certification_progress,
                                   user_project_progress
```

---

## Auth + admin

- **Sign-in**: email + password (primary) OR magic link (fallback). Auto-redirects when a session exists.
- **Sign-up**: 5-step wizard. Always succeeds even when email-confirm is on (server admin endpoint force-confirms via `admin.createUser({ email_confirm: true })` and falls back to upgrading existing users via `admin.updateUserById`).
- **Admin gate**: triple-checked at middleware + page + API levels. Admin = `profiles.role = 'admin'` AND `email == ADMIN_EMAIL`. Defaults to `hrixofficial@gmail.com`.
- **Admin actions**: `/api/admin/{approve,reject,ban,reset}` -> SECURITY DEFINER RPCs that bypass RLS only for verified admin sessions.

---

## Realtime tracking

- `useRealtimeTracking({ userId, onChange })` subscribes once to `user_progress`, `streaks`, `xp_log`, and `profiles` filtered by user_id. Calls `router.refresh()` on every server-side mutation. Two browser tabs stay in sync within ~50ms.
- `complete_day(p_day)` is the canonical write path: enforces subscription active, daily-limit, no-duplicate, computes streak, fires the `log_progress` trigger that writes to `xp_log` + `activity_log`.
- `get_you_vs_you()` powers the "You vs You" widget — this-week vs last-week aggregates over `user_progress` + `xp_log`, returned in one RPC call.

---

## Deploy to Vercel

```bash
git push    # if linked to a Vercel GitHub project, deploy is automatic
# or
vercel --prod
```

In the Vercel dashboard -> Project Settings -> Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL` (optional)
- `NEXT_PUBLIC_BYPASS_AUTH=0` (CRITICAL — must be 0 or unset in production)

Set them for **Production, Preview, AND Development** scopes.

---

## Testing without auth (local only)

In `.env.local`:
```
NEXT_PUBLIC_BYPASS_AUTH=1
```
Restart `npm run dev`. All gates open, `/dojo` renders with mock active profile. Set back to `0` (or remove) to re-enable real auth. **Never deploy with this set to 1.**

---

## File map (key files)

```
src/
  app/
    auth/login/page.tsx          Sign-in (password + magic link)
    auth/callback/route.ts       OAuth + magic-link exchange
    register/page.tsx            5-step signup wrapper
    dojo/page.tsx                Dashboard server router
    dashboard/page.tsx           Redirects to /dojo
    branches/page.tsx            Branch index
    branches/[code]/page.tsx     Branch detail
    admin/page.tsx               UTR approval (gate-bypassable)
    sensei/page.tsx              Admin chamber
    profile/page.tsx             User account
    progress/page.tsx            User analytics
    enroll/page.tsx              Re-enroll
    health/page.tsx              Diagnostic
    api/
      register/{signup,path}/route.ts
      enroll/route.ts
      progress/complete/route.ts
      admin/{approve,reject,ban,reset}/route.ts
      health/route.ts
  components/
    DojoDashboard.tsx            The dashboard
    HeroStatusPanel.tsx          Rank + level + XP + sensei message
    AnalyticsRings.tsx           SVG progress rings
    AIGuidancePanel.tsx          Today's focus
    YouVsYou.tsx                 Live this-week vs last-week
    AchievementGrid.tsx          Locked/unlocked tiles
    MissionCard.tsx              Day content
    SenseiVerifying.tsx          Polling + realtime pending screen
    LockedScreen.tsx             Expired / rejected
    AdminApprovalList.tsx        Approve/reject UI
    BottomNav.tsx + BottomNavGate.tsx
    InstallPrompt.tsx + ServiceWorkerRegistrar.tsx
    PageTransition.tsx           Cinematic entry wrapper
    Skeleton.tsx + ErrorBoundaryUI.tsx
  lib/
    supabase/{client,server,middleware,env}.ts
    adminEmail.ts + admin.ts
    ranking.ts
    milestones.ts
    dailyTracking.ts
    useRealtimeTracking.ts
    content.ts
    devBypass.ts
    validation.ts
    rate-limit.ts
    utils.ts
  types/
    database.ts
    content.ts
  data/
    cse-days.ts                  30-day CSE day templates
supabase/
  migrations/
    0000_combined.sql            Core auth + tracking
    0001_content_system.sql      Content schema
    0002_branch_seed.sql         All 7 branches seeded
    0003_branch_identity.sql     Branch identity columns
public/
  manifest.json                  PWA manifest
  sw.js                          Service worker (cache-first static, network-first HTML)
  icon-192.png, icon-512.png
capacitor.config.ts + .json      Android shell config
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `[Supabase] Missing env: NEXT_PUBLIC_SUPABASE_URL` | Run `vercel env pull .env.local`, then restart dev server |
| `relation "public.X" does not exist` | Run `supabase/migrations/0000_combined.sql` in SQL Editor |
| Build fails on Vercel: `Cannot find module '@capacitor/cli'` | Already fixed — `capacitor.config.ts` is excluded in `tsconfig.json` |
| "Authentication required" in registration | Already fixed — server admin endpoint upgrades pending users automatically |
| Streak not auto-redirecting after admin approval | `useRealtimeTracking` polls every 4s + listens to postgres_changes; verify Realtime is enabled on `profiles` table in Supabase |
| 30-day grid empty | Check `user_progress` table is populated for your user_id |
| `/admin` redirects you to `/` | Your profile must have `role='admin'` AND `email = ADMIN_EMAIL`. Update with: `update profiles set role='admin' where email='hrixofficial@gmail.com';` |

---

## Production checklist

- [ ] All 4 migrations run in Supabase SQL Editor
- [ ] Env vars set in Vercel (Production + Preview + Development)
- [ ] `NEXT_PUBLIC_BYPASS_AUTH=0` (or unset) on Vercel
- [ ] Realtime publication includes the user-scoped tables (verify in Supabase Dashboard -> Database -> Replication)
- [ ] Admin profile row has `role='admin'` and matches `ADMIN_EMAIL`
- [ ] Service-role key never read in any `"use client"` file (verified)
- [ ] `/health` returns all green
- [ ] `npm run build` succeeds locally with zero TS errors
- [ ] Service worker is registered (verify via Chrome DevTools -> Application -> Service Workers)
- [ ] PWA installable (Lighthouse PWA score 100)

---

## License + credits

Built across 59 production-tracked tasks. Architecture: Anurag K. Implementation: Claude (Anthropic Sonnet).

The KAIZEN philosophy: small, daily, compounding improvements. Same applies to this codebase.
