# KAIZEN.SYS — Production Deployment Checklist

Single source of truth for shipping KAIZEN to production. Walk through every section in order. Each item has a verification command or screenshot reference.

## 0 · Pre-flight (5 min)

- [ ] Branch is up to date with `main`
- [ ] `git status` shows clean working tree
- [ ] `.env.local` exists and is **not** committed
- [ ] You have access to the Supabase project dashboard
- [ ] You have access to the Vercel project dashboard
- [ ] You have access to Google Cloud Console (if Google OAuth is enabled)

## 1 · Code validation

| Check | Command | Expected |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | EXIT 0, no errors |
| Lint | `npx next lint` | No errors (warnings ok) |
| Build | `npm run build` | Compiles successfully, no failed routes |

The codebase has been verified TypeScript-clean and lint-clean (4 known false-positive `react-hooks/exhaustive-deps` warnings on `streakState.current` nested-property deps — these work correctly because the parent `streakState` object reference is what triggers re-renders).

## 2 · Database — Supabase migrations

Run **in order** in Supabase Dashboard → SQL Editor (each is idempotent; safe to re-run):

| Order | File | Purpose |
|---|---|---|
| 1 | `supabase/migrations/0000_combined.sql` | Profiles, utr_logs, user_progress (legacy log), progress_logs, streaks, xp_log, activity_log + RPCs + RLS + realtime |
| 2 | `supabase/migrations/0001_content_system.sql` | Branches, roadmaps, missions, certs, projects, skills |
| 3 | `supabase/migrations/0002_branch_seed.sql` | 7 B.Tech branch content |
| 4 | `supabase/migrations/0003_branch_identity.sql` | Branch purpose / career / industry |
| 5 | `supabase/migrations/0004_onboarding.sql` | Onboarding enums + onboarding_data table + profile extensions |
| 6 | `supabase/migrations/0005_user_plans.sql` | (Will be renamed by 0006) |
| 7 | `supabase/migrations/0006_persistence_layer.sql` | Renames user_plans → ai_plans; splits user_progress → user_progress_days + new summary table; adds daily_logs; updates complete_day RPC |
| 8 | `supabase/migrations/0007_workout_prefs.sql` | Adds workout_location + fitness_level columns to profiles |

### Verify migrations applied

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
-- Expected: ai_plans, activity_log, daily_logs, onboarding_data,
-- profiles, progress_logs, streaks, user_progress, user_progress_days,
-- utr_logs, xp_log (+ content tables from 0001/0002)
```

## 3 · Supabase Auth configuration

### 3.1 — URL Configuration (Dashboard → Authentication → URL Configuration)

```
Site URL:          https://your-production-domain.com
Redirect URLs:
  http://localhost:3000/auth/callback
  http://localhost:3000/auth/callback/**
  https://your-production-domain.com/auth/callback
  https://your-production-domain.com/auth/callback/**
  https://*-vercel.app/auth/callback                  (for preview deploys)
```

### 3.2 — Email Settings (Dashboard → Authentication → Email Settings)

```
Sender name:   KAIZEN.SYS
Sender email:  dojo@your-domain.com  (must be on a verified domain)
SMTP:          Resend / Postmark / SES (for deliverability)
```

### 3.3 — Email Templates (paste from `supabase/email-templates/`)

| Supabase template | Source file | Subject |
|---|---|---|
| Magic Link | `magic-link.html` | KAIZEN.SYS — Verification Code |
| Confirm signup | `confirm-signup.html` | KAIZEN.SYS — Confirm your account |
| Reset Password | `reset-password.html` | KAIZEN.SYS — Reset your password |

### 3.4 — Providers

- [ ] **Email** enabled (default)
- [ ] **Google** enabled — see `docs/GOOGLE_OAUTH_SETUP.md` for exact URLs
- [ ] **Phone** enabled (optional) — requires Twilio / MessageBird credentials

## 4 · Environment variables

### 4.1 — Local `.env.local` (development)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

ADMIN_EMAIL=you@example.com

NEXT_PUBLIC_UPI_ID=kaizen@upi
NEXT_PUBLIC_UPI_NAME=KAIZEN
NEXT_PUBLIC_UPI_QR_PATH=https://res.cloudinary.com/.../upi-qr.png

# Off in dev unless you specifically want to preview mock data
NEXT_PUBLIC_BYPASS_AUTH=0
```

### 4.2 — Vercel (production)

Settings → Environment Variables. Add all of the above EXCEPT `NEXT_PUBLIC_BYPASS_AUTH` (leave it unset, or set to `0`). Even if it's set to `1` on Vercel, `isAuthBypassed()` returns `false` in `NODE_ENV=production` — defense in depth.

- [ ] All Supabase keys copy-pasted from Dashboard → Project Settings → API
- [ ] Service role key NEVER has `NEXT_PUBLIC_` prefix (server-only)
- [ ] `ADMIN_EMAIL` matches the email you want to grant admin role
- [ ] UPI vars match your real payee account

## 5 · Authentication flows — manual smoke test

After deploy, walk through each:

| Flow | Steps | Expected |
|---|---|---|
| Email + password signup | `/auth/signup` → enter email + password → submit | Account created, redirected to `/onboarding` |
| Onboarding | Complete 8 steps | Profile saved, AI plan auto-generated in `ai_plans`, redirect to `/dojo` |
| First dashboard view | Land on `/dojo` | "Welcome, {name}. Your discipline journey begins now." + Day 1 mission |
| Sign out | Click avatar → Sign out | Redirect to `/`, navbar shows guest CTAs |
| Email magic link | `/auth/login` → Email link tab → enter email | Receive KAIZEN-branded email, click link → land on `/dojo` |
| Google OAuth | `/auth/login` → Continue with Google | Google consent → land on `/dojo` |
| Phone OTP | `/auth/login` → Phone tab → enter number → enter code | Land on `/dojo` |
| Refresh persistence | While signed in, refresh `/dojo` | Stays signed in, dashboard re-renders |
| Logout + redirect | Sign out, then visit `/dojo` | Redirected to `/auth/login?next=/dojo` |

## 6 · Row-Level Security (RLS) audit

Run in Supabase SQL Editor:

```sql
-- Every user-scoped table must have policies referencing auth.uid()
select tablename, policyname, qual
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles','onboarding_data','ai_plans',
    'user_progress','user_progress_days','daily_logs',
    'streaks','xp_log','activity_log','utr_logs'
  )
order by tablename, policyname;

-- Every qual MUST reference auth.uid() = user_id  (or is_admin() for admin reads)
```

- [ ] All user-scoped tables have RLS **enabled**
- [ ] Every policy filters by `auth.uid()` or uses `is_admin()`
- [ ] No table has a `using (true)` policy (would expose all rows)
- [ ] Service role key is only used in server-side API routes (never bundled to client)

## 7 · Dashboard personalization audit

See `docs/PERSONALIZATION_AUDIT.md` for the full section-by-section table. Quick verification:

- [ ] First-time user sees: streak 0, currentDay 1, completedCount 0, pct 0%
- [ ] No "Demo Warrior" / "5-day streak" / "Day 6" visible anywhere
- [ ] Dev banner suppressed on landing (`/`) and auth screens
- [ ] `NEXT_PUBLIC_BYPASS_AUTH=0` in `.env.local` and on Vercel

## 8 · Payment lock validation

- [ ] Free user (`plan_amount = null` or `0`) sees first 3 days unlocked, days 4-30 blurred with "Upgrade to unlock" CTA on MissionCard
- [ ] Paid user (`plan_amount > 0`) sees full 30-day path
- [ ] Expired user (`expiry_date < now()`) sees LockedScreen with renewal CTA
- [ ] `/api/enroll` accepts UTR, stores it in `utr_logs` with `status: pending`
- [ ] `/api/admin/approve` (admin-only) flips utr_log → approved + profile → active + sets expiry_date = now + 30 days
- [ ] Subscription expiry warning at 3 days uses `supabase/email-templates/subscription-expiring.html` (transactional, your own cron)

## 9 · Mobile UX validation

Open on a real Android phone (Chrome) AND iPhone (Safari):

- [ ] Scrolling reaches the footer on every page (Hero, /dojo, /progress, /profile, /branches)
- [ ] No horizontal scroll on any screen
- [ ] Safe-area respected at top (notch) and bottom (home indicator)
- [ ] Bottom nav stays fixed and doesn't overlap content
- [ ] Tap targets are 44px+ (every button)
- [ ] Inputs don't trigger iOS zoom (16px+ font on focused inputs)
- [ ] PWA install prompt appears (Chrome) after engagement
- [ ] Service worker registers (DevTools → Application → Service Workers)

## 10 · Performance baseline

Use Lighthouse on the deployed URL:

| Metric | Target |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |
| PWA installable | ✅ |

Known optimizations already in place:
- Service worker network-first for HTML (no stale HTML)
- Static assets cached aggressively (Next.js default)
- Hero ambient gradients are pure CSS (no extra DOM)
- `useMemo` on derived dashboard state
- Single auth listener via `useAuthSession` module-level cache
- 3 parallel reads per dashboard cold load
- Image domains whitelisted in `next.config.js` (`res.cloudinary.com`)

## 11 · Vercel deployment

### 11.1 — Initial deploy

1. Connect repo to Vercel (Project → Import)
2. Framework preset: **Next.js** (auto-detected)
3. Build command: `npm run build` (default)
4. Output directory: `.next` (default)
5. Install command: `npm install` (default)
6. **Environment variables** — paste from section 4.2
7. Deploy

### 11.2 — Custom domain

1. Vercel → Project → Settings → Domains → Add
2. Update DNS at your registrar (CNAME or A record per Vercel instructions)
3. Wait for SSL certificate (1-2 min, automatic)
4. **Update Supabase**: Site URL + Redirect URLs (section 3.1) to use the new domain
5. **Update Google Cloud Console**: OAuth redirect URI (only the Supabase callback) and authorized origins (your new domain) per `docs/GOOGLE_OAUTH_SETUP.md`

### 11.3 — Capacitor / Android APK (optional, later)

The codebase is already Capacitor-ready (`capacitor.config.ts`). When you're ready:

```bash
npm run cap:setup            # one-time
npm run cap:sync android
npm run cap:open android     # opens Android Studio
npm run android:apk          # builds release APK
```

The Capacitor app is a WebView shell pointing at `server.url` — your live Vercel deploy. No static export, no separate build path.

## 12 · Post-deploy verification (5 min)

After the first production deploy, walk through:

- [ ] Visit homepage — hero loads, no console errors
- [ ] Sign up with a real email — email arrives (KAIZEN-branded)
- [ ] Confirm + onboarding — completes cleanly, lands on `/dojo`
- [ ] Refresh `/dojo` — stays signed in, no blank screen
- [ ] Open DevTools → Network — no 500s, no 401s on dashboard load
- [ ] Open DevTools → Application → Cookies — Supabase auth cookies present
- [ ] Open DevTools → Application → Service Workers — `sw.js` registered, status active
- [ ] Test on mobile (real device) — bottom nav, scroll, install prompt all work
- [ ] Sign in via Google — completes, lands on `/dojo`
- [ ] Sign out — redirected to `/`, can re-sign-in immediately

## 13 · Production safety nets (already in place)

| Concern | Mitigation |
|---|---|
| Blank screen on refresh | Root `error.tsx` + `loading.tsx` + `global-error.tsx`; defensive middleware; safe-wrapped server fetches |
| Mock data leaking to prod | `isAuthBypassed()` hard-blocks in `NODE_ENV=production` regardless of env var |
| Stale HTML after deploy | Service worker bumped to `kaizen-v4`, network-first for HTML |
| RLS bypass risk | All user-scoped tables have `auth.uid() = user_id` policies |
| Demo content on dashboard | All dashboard surfaces derive from real user data; first-time users see authentic zeros |
| OAuth misconfig | `docs/GOOGLE_OAUTH_SETUP.md` documents exact URL requirements + 7-row error table |
| Email branding | All 5 templates use KAIZEN aesthetic (obsidian + blood, mobile-responsive, table layout) |
| Hydration mismatch | `useAuthSession` returns deterministic "loading" on first render (SSR + client agree) |

## TL;DR — Ship sequence

```bash
1.  Verify .env.local has NEXT_PUBLIC_BYPASS_AUTH=0
2.  npx tsc --noEmit                      # green
3.  npm run build                         # passes
4.  Run migrations 0000 → 0007 in Supabase SQL Editor
5.  Configure Supabase: Site URL, Redirect URLs, email templates, providers
6.  Configure Google Cloud (if Google OAuth)
7.  Push to main → Vercel auto-deploys
8.  Set Vercel env vars from section 4.2
9.  Walk through section 5 (auth flows) on the live URL
10. Walk through section 12 (post-deploy verification)
```

When all 13 sections check out, KAIZEN is production-ready.
