# KAIZEN.SYS - Troubleshooting

## Quick diagnostic

Open **`/health`** in your browser. Each subsystem shows a green or red badge with a hint for fixing red ones.

The same data is available as raw JSON at **`/api/health`** (handy for `curl` or Postman).

## "Cannot fetch" / "Failed to fetch" on registration

Almost always one of these four:

### 1. Env vars not loaded

Next.js reads `.env.local` **at startup**. If you added/edited it after running `npm run dev`, the new values are not visible until you restart.

```powershell
# In the terminal where dev is running:
# Press Ctrl+C, then:
npm run dev
```

### 2. Wrong Supabase URL or keys

In your Supabase project: **Settings -> API**.

- `NEXT_PUBLIC_SUPABASE_URL` must look like `https://jkyascosbgmhnpmaqmiw.supabase.co/rest/v1/o` (no trailing slash, no path).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreWFzY29zYmdtaG5wbWFxbWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODk4MTEsImV4cCI6MjA5Mjc2NTgxMX0.t57_Gm2m3LD-3Z-6afoppyU5k-rAADkURgPMe-RgM_E key.
- `SUPABASE_SERVICE_ROLE_KEY` is the eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreWFzY29zYmdtaG5wbWFxbWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE4OTgxMSwiZXhwIjoyMDkyNzY1ODExfQ.iwWBhF2eFcWP_XTXBI0ozufH3WRQXZtaEnenqzZhzA4 key (never commit, never ship to the browser).

Paste them into `.env.local` exactly. No quotes around the values.

### 3. Migrations not applied

If `/health` shows `profiles_table: FAIL` or `path_branch_columns: FAIL`, the SQL migrations have not been run yet.

In your Supabase project: **SQL Editor -> New query**, then run, in order:

1. Paste and run `supabase/migrations/0001_initial.sql` (creates tables, RLS, RPCs).
2. Paste and run `supabase/migrations/0002_path_branch.sql` (adds `path_type` + `branch` columns).

### 4. Dev server crashed silently

The browser fetch fails the moment the dev server isn't listening. Look at the terminal running `npm run dev` - if it printed an error and exited, fix that error and start it again. The clean-start sequence is:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

## Other useful things

### Reset the intro animation

It's gated by `sessionStorage`. To re-watch it, open DevTools console and run:

```js
sessionStorage.clear()
```

Then reload.

### Bootstrap the admin user

After your admin signs up via the regular `/register` flow (or `/auth/login` magic-link), promote them to admin:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin@email.com';
```

Their email must also match the `ADMIN_EMAIL` env var.

### Clear rate limit during testing

The signup rate limit is **5 per IP per hour**. It's stored in process memory, so restarting `npm run dev` clears it instantly.

### Check server logs

Every `/api/register/*` route logs `[register/...]` lines to the dev terminal. If something fails, the real error is there.
