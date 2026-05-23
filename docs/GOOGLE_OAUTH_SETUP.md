# KAIZEN.SYS — Google OAuth setup

This guide eliminates the #1 failure mode for "Google login doesn't work": misconfigured redirect URLs between Google Cloud Console and Supabase. The client code is correct; this is purely about provider config.

If you're seeing **"redirect_uri_mismatch"** or **"Sign-in is misconfigured"**, fix this with the exact URLs below.

## 1. Find your Supabase project reference

Open **Supabase Dashboard → Project Settings → General**.
Your project URL looks like `https://<project-ref>.supabase.co`. Note the `<project-ref>` part.

## 2. Google Cloud Console — create the OAuth client

1. Go to https://console.cloud.google.com/
2. Pick (or create) a project, then go to **APIs & Services → Credentials**.
3. Click **Create Credentials → OAuth client ID**.
4. If asked, configure the **OAuth consent screen** first:
   - User type: **External**
   - App name: `KAIZEN.SYS`
   - User support email: your address
   - App logo: optional
   - Authorized domains: add the domain you'll deploy to (e.g. `kaizen.sys`, or your Vercel domain `kaizen-sys.vercel.app`)
   - Scopes: leave the default (email + profile + openid)
   - Test users: add your own email while you're in testing mode
5. Back at Credentials → Create OAuth client ID:
   - Application type: **Web application**
   - Name: `KAIZEN.SYS — Web`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-production-domain.com
     ```
   - **Authorized redirect URIs** (the critical one — copy EXACTLY):
     ```
     https://<project-ref>.supabase.co/auth/v1/callback
     ```
     Note: this is the Supabase Auth URL, **not** your app URL. Supabase receives the OAuth response, exchanges the code, then redirects to your app's `/auth/callback`.
6. Click **Create**. Copy the **Client ID** and **Client secret**.

## 3. Supabase — enable Google provider

1. Open **Supabase Dashboard → Authentication → Providers → Google**.
2. Toggle **Enabled** on.
3. Paste **Client ID** and **Client secret** from step 2.6.
4. Leave the default **Redirect URL** as shown — that's the URL you registered with Google.
5. Click **Save**.

## 4. Supabase — set Site URL + Redirect URLs allowlist

1. Open **Supabase Dashboard → Authentication → URL Configuration**.
2. **Site URL** — your production app URL:
   ```
   https://your-production-domain.com
   ```
3. **Redirect URLs** (allowlist; one per line). Every URL you want the auth flow to be allowed to redirect back to:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/callback/**
   https://your-production-domain.com/auth/callback
   https://your-production-domain.com/auth/callback/**
   https://your-staging-domain.vercel.app/auth/callback
   ```
   The wildcards (`/**`) let `?next=/dojo` style query params through.
4. Click **Save**.

## 5. Environment variables (your app)

`.env.local` for local dev, plus the same keys on Vercel for prod:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Project Settings -> API>
SUPABASE_SERVICE_ROLE_KEY=<service role key, server-only, NEVER prefixed NEXT_PUBLIC_>
```

## 6. Test the flow

1. **Local dev**:
   - `npm run dev`
   - Visit http://localhost:3000/auth/login
   - Click **Continue with Google**
   - Expected: Google consent screen → returns to `http://localhost:3000/auth/callback?code=...` → redirects to `/dojo` (or `/onboarding` if first-time user).
2. **Production**:
   - Deploy
   - Repeat the same flow on your production URL.

## 7. Common errors + what they mean

| Symptom | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | The redirect URI in Google Cloud doesn't match what Supabase sent | Step 2.5 — copy `https://<project-ref>.supabase.co/auth/v1/callback` exactly |
| App opens login, Google completes, then bounces back to `/auth/login?error=...` | Site URL or Redirect URLs allowlist in Supabase is wrong | Step 4 — make sure your domain + `/auth/callback` is allowed |
| `Provider is not enabled` | Google provider toggle is off | Step 3 — enable in Supabase |
| `Invalid client` | Client ID / secret mismatch | Step 3 — re-paste from Google Cloud |
| OAuth completes but `/dojo` is blank | Cookie not set (3rd-party cookie blocking) | Make sure Site URL is the same origin you're loading the app from. No mixed http/https. |
| Works on desktop, fails on Android | Custom-tab return URL mismatch | Add your domain (no path) to Authorized Domains in the OAuth consent screen (step 2.4) |
| `Access denied` from user | User cancelled or test-user list is closed | If consent screen is in Testing mode (step 2.4), add the user's email under Test Users. For production, publish the consent screen. |

## 8. Publishing the consent screen (production only)

While the consent screen is in **Testing** mode, only listed test users can sign in. To allow any Google user:

1. **OAuth consent screen → Publish app**
2. For basic email/profile scopes you don't need Google verification — the app goes live immediately.
3. If you request restricted scopes later (Gmail, Drive, etc.) you'll need to go through the verification process. KAIZEN currently uses only `openid email profile`, so this is not required.

## 9. Where this is wired in the code (for reference)

| File | Role |
|---|---|
| `src/app/auth/login/LoginForm.tsx` | Calls `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: origin + "/auth/callback?next=..." } })` |
| `src/app/auth/signup/SignupForm.tsx` | Same flow, default `next=/onboarding` |
| `src/app/auth/callback/route.ts` | Receives the redirect, calls `exchangeCodeForSession(code)`, sets cookie, redirects to `next` |
| `src/lib/supabase/client.ts` | Browser client (reads NEXT_PUBLIC_* env) |
| `src/lib/supabase/server.ts` | Server + admin clients |
| `middleware.ts` | Reads the session cookie, gates `/dojo /sensei /admin /profile /onboarding` |

All of this is already implemented. The setup is purely provider-config — once steps 1-5 are done, Google login works on both desktop and Android (mobile uses Chrome Custom Tabs by default in PWA / Capacitor, and the same redirect URL works).

## TL;DR

Three URLs to register, four places to register them:

```
Supabase Auth callback (in Google Cloud):
  https://<project-ref>.supabase.co/auth/v1/callback

Your app callback (in Supabase Redirect URLs allowlist):
  http://localhost:3000/auth/callback
  https://your-production-domain.com/auth/callback

Site URL (in Supabase):
  https://your-production-domain.com
```

If those four are correct, Google login works.
