# KAIZEN.SYS — Production Setup Checklist

## 1. Supabase Dashboard → Authentication → URL Configuration

### Site URL
```
https://your-vercel-domain.vercel.app
```

### Redirect URLs (add ALL of these)
```
https://your-vercel-domain.vercel.app/auth/callback
https://your-vercel-domain.vercel.app/auth/callback?*
https://your-custom-domain.com/auth/callback
https://your-custom-domain.com/auth/callback?*
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?*
```
> The `?*` wildcard allows the `?next=/dojo` query param that the app appends.

---

## 2. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client

### Authorized JavaScript Origins
```
https://your-vercel-domain.vercel.app
https://your-custom-domain.com
```

### Authorized Redirect URIs
```
https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
```
> This is the SUPABASE redirect, NOT your app's /auth/callback.
> Find your project ref in: Supabase Dashboard → Project Settings → General

### In Supabase Dashboard → Authentication → Providers → Google
- Enable Google provider
- Paste your Google Client ID and Client Secret from Google Cloud Console

---

## 3. Vercel Environment Variables

Set ALL of these in: Vercel Dashboard → Project → Settings → Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        = https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJ... (anon/public key from Supabase)
SUPABASE_SERVICE_ROLE_KEY       = eyJ... (service role key — NEVER prefix with NEXT_PUBLIC_)
ADMIN_EMAIL                     = your-admin@email.com
NEXT_PUBLIC_UPI_ID              = kaizen@upi
NEXT_PUBLIC_UPI_NAME            = KAIZEN
NEXT_PUBLIC_UPI_QR_PATH         = /upi-qr.png
NEXT_PUBLIC_BYPASS_AUTH         = 0
```

> Get keys from: Supabase Dashboard → Project → Settings → API

### Common Mistakes
- ❌ `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co/rest/v1/o` — wrong (trailing path)
- ✅ `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co` — correct (no path)
- ❌ `SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY=eyJ...` — duplicate prefix
- ✅ `SUPABASE_SERVICE_ROLE_KEY=eyJ...` — correct (just the JWT value)

---

## 4. Supabase Auth Settings

In: Supabase Dashboard → Authentication → Settings

- **JWT expiry**: 3600 (1 hour recommended)
- **Enable email confirmations**: OFF (app uses `email_confirm: true` on admin client)
- **Enable phone confirmations**: Match your phone provider setup
- **Minimum password length**: 8

---

## 5. Vercel Deployment

After setting all env vars:
```bash
vercel --prod
```
Or push to main — Vercel auto-deploys.

### Verify deployment
```
https://your-domain.com/api/health
```
Should return `{ "ok": true }` (or similar).

---

## 6. Quick Smoke Test

1. Visit `/auth/signup` → Create account with email
2. Should redirect to `/onboarding` with the new account
3. Visit `/auth/login` → Sign in with same credentials
4. Click "Continue with Google" → should redirect to Google, then back
5. Visit `/profile` → should show account info
6. Reload `/dojo` → should NOT redirect to login (session persisted)
