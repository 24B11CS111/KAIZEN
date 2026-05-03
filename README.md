# KAIZEN.SYS

> The Discipline Engine — a 30-day Bushido protocol for B.Tech & Intermediate students.
> Modern Bushido x Cyberpunk Minimalism. Subscription-gated. Manually UPI-verified. Hard-locked at expiry.

---

## Stack

- **Next.js 14** (App Router, Server Components, Edge-compatible middleware)
- **TypeScript**, **Tailwind CSS**, **Framer Motion** (60fps transitions)
- **@splinetool/react-spline** (hero 3D scene, lazy-loaded)
- **Supabase** (Postgres + Auth + RLS + Postgres functions/RPC)
- **Zod** for input validation, **in-memory rate limit** (3 / IP / hour)

---

## Quick start

```bash
cd kaizen-sys
cp .env.example .env.local        # fill in values (see below)
npm install
npm run dev                       # http://localhost:3000
```

### Required env vars

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never exposed |
| `ADMIN_EMAIL` | The single admin's email — gates `/sensei` |
| `NEXT_PUBLIC_UPI_ID` / `NEXT_PUBLIC_UPI_NAME` | UPI handle shown on enrollment |
| `NEXT_PUBLIC_UPI_QR_PATH` | Path to the static QR image (default `/upi-qr.png`) |
| `NEXT_PUBLIC_SPLINE_SCENE` | Spline scene URL for the hero (optional — fallback renders if blank) |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | Defaults: 3 / 1 hour |

---

## Database setup

Run the migration in your Supabase SQL editor (or via CLI):

```bash
supabase db push        # if using supabase CLI
# OR copy/paste supabase/migrations/0001_initial.sql into the SQL editor
```

The migration creates:

- `profiles`, `utr_logs`, `progress_logs`, `streaks` tables with **UNIQUE** constraints on `whatsapp` and `utr_number` plus a `CHECK` constraint enforcing 12-digit UTR.
- Indexes on `whatsapp`, `utr_number`, `user_id`, `expiry_date`, `subscription_status`.
- **Row Level Security** policies — users see only their own rows; admin sees all.
- `SECURITY DEFINER` RPCs for atomic, gated operations:
  - `approve_utr(uuid)` — admin only; **always creates a fresh 30-day cycle**, resets progress + streak.
  - `reject_utr(uuid)` — admin only; flips status to `rejected`.
  - `ban_user(uuid)` / `reset_progress(uuid)` — admin god-mode actions.
  - `complete_day(int)` — user-callable; enforces active subscription + streak math (skip ⇒ reset, consecutive ⇒ +1).
  - `touch_expiry(uuid)` — flips `active → expired` if `expiry_date <= now()` (called on every `/dojo` read).
- `handle_new_user` trigger — auto-creates a `profiles` row on signup, auto-promotes the row whose email matches the `app.admin_email` setting (you can also flip `role='admin'` manually after first login).

### Bootstrap the admin

After your admin signs up via magic link once, run:

```sql
update public.profiles
set role = 'admin'
where email = 'your.admin@email.com';
```

---

## Routes

| Route | Type | Guarded by |
| --- | --- | --- |
| `/` | Public | Landing — Hero (Spline), Protocol, Plans, Footer |
| `/auth/login` | Public | Magic-link OTP |
| `/auth/callback` | Public | Exchanges Supabase code for a session |
| `/enroll` | Public (login required to submit) | Multi-step plan → UPI → form flow |
| `/dojo` | **Middleware** + page guard | Logged-in user. Renders one of: PENDING (Sensei verifying), ACTIVE (gate-opening + roadmap + streak), EXPIRED/REJECTED (locked) |
| `/sensei` | **Middleware** + page guard | `role='admin'` AND `email == ADMIN_EMAIL` |

API routes:

- `POST /api/enroll` — Zod validate, IP rate-limit, check unique whatsapp/UTR, insert pending UTR.
- `POST /api/progress/complete` — Calls `complete_day` RPC; updates streak.
- `POST /api/admin/approve|reject|ban|reset` — All gated by `requireAdmin()` AND the `is_admin()` check inside each RPC.

---

## Security checklist

- ✅ **Input validation** — every input parsed by Zod (`UtrSchema`, `WhatsappSchema`, `NameSchema`, `PlanSchema`).
- ✅ **UNIQUE constraints** on `whatsapp` and `utr_number` at the DB level (Postgres returns `23505`, surfaced as `409`).
- ✅ **CHECK constraint** — UTR must match `^\d{12}$` (DB-enforced; client+server also validate).
- ✅ **Rate limit** — 3 enrollment submissions per IP per hour.
- ✅ **RLS everywhere** — users can only read/write their own rows; only admins can update `utr_logs.status`. `progress_logs` writes additionally require `is_subscription_active(auth.uid())`.
- ✅ **Middleware (`middleware.ts`)** protects `/dojo` (logged-in, not banned/rejected) and `/sensei` (admin role + email match).
- ✅ **Page-level defense-in-depth** — both `/dojo` and `/sensei` re-verify the profile server-side.
- ✅ **Admin RPCs use `SECURITY DEFINER`** with an `is_admin()` check at the top — even if a regular user calls them via the anon key, they raise `forbidden`.
- ✅ **Service role key** — only used in `/api/enroll` for trusted UPSERT-style logic; never reaches the browser.
- ✅ **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false`.
- ⚠️ The in-memory rate limiter is per-instance; for multi-region deploys, swap for Upstash Redis (one-line change in `src/lib/rate-limit.ts`).

---

## Subscription lifecycle

```
[signup]  → profiles.subscription_status = 'pending'
[enroll]  → utr_logs (status='pending')
[admin approve] → approve_utr RPC:
                     - status='active'
                     - start_date = now()
                     - expiry_date = now() + 30 days   ← ALWAYS new cycle
                     - delete progress_logs, reset streak
[t = +30d] → next /dojo read calls touch_expiry → status='expired'
[expired] → /dojo renders LockedScreen → CTA: /enroll (NEW cycle)
```

Re-subscription **never** extends — it always starts a fresh 30-day window with progress reset to zero.

---

## Design system (Tailwind)

- Background: `obsidian` (`#050505`)
- Accent: `blood.500` (`#D00000`) with `shadow-blood` glow
- Glassmorphism: `.glass` + `.glass-hover`
- Buttons: `.btn-blood`, `.btn-ghost`
- Animations: `pulseRed`, `flameRise`, `gateOpen`, `scanline`, `flicker`
- Cursor glow (white dot + red ring) — auto-disabled on touch devices

---

## File map

```
kaizen-sys/
├── middleware.ts                 # /dojo + /sensei route protection
├── next.config.js                # security headers, image patterns
├── tailwind.config.ts            # design tokens
├── supabase/migrations/
│   └── 0001_initial.sql          # schema + RLS + RPCs
├── public/
│   └── upi-qr.png                # placeholder — REPLACE with your real QR
└── src/
    ├── app/
    │   ├── page.tsx              # landing
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── auth/login            # magic-link page
    │   ├── auth/callback         # session exchange
    │   ├── enroll/page.tsx       # multi-step flow
    │   ├── dojo/page.tsx         # state-routed dashboard
    │   ├── sensei/page.tsx       # admin panel
    │   └── api/
    │       ├── enroll/
    │       ├── progress/complete/
    │       └── admin/{approve,reject,ban,reset}/
    ├── components/
    │   ├── Navbar, Hero, SplineHero, ProtocolSection, PlansSection, Footer
    │   ├── CursorGlow
    │   ├── EnrollmentFlow
    │   ├── DojoDashboard, GateOpening, SenseiVerifying, StreakCounter, LockedScreen
    │   └── AdminPanel
    ├── lib/
    │   ├── supabase/{client,server,middleware}.ts
    │   ├── validation.ts          # Zod schemas
    │   ├── rate-limit.ts          # in-memory IP limiter
    │   ├── admin.ts               # requireAdmin() guard
    │   └── utils.ts
    └── types/database.ts          # hand-typed Supabase schema
```

---

## Production checklist

- [ ] Replace `public/upi-qr.png` with your actual UPI QR.
- [ ] Set `ADMIN_EMAIL` and after signup run `update profiles set role='admin' where email=...`.
- [ ] Swap `src/lib/rate-limit.ts` for Upstash Redis if deploying multi-region.
- [ ] Wire a WhatsApp notifier (e.g. Twilio) in the `approve_utr` callback to ping warriors when their gate opens.
- [ ] Add an SEO `robots.txt` + `sitemap.xml`.
- [ ] Configure Supabase Auth → Email templates with the Bushido voice.
