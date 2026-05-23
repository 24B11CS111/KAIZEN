# KAIZEN.SYS - Mobile + PWA Production Audit

## ✅ Already in place

### Mobile-first CSS
- `container-app` with safe-area-inset padding (notch + Dynamic Island safe)
- `pb-bottom-nav` reserves space for the bottom nav including home indicator
- `min-height: 44px` on all interactive elements (Apple HIG / Material tap target)
- 16px font on inputs (prevents iOS Safari zoom-on-focus)
- `overscroll-behavior-y: none` (no pull-to-refresh white flash)
- `overflow-x: hidden` on html + body (no horizontal scroll, ever)
- `touch-action: manipulation` (200ms tap delay removed)
- `-webkit-tap-highlight-color: transparent` (no gray flash)
- `-webkit-touch-callout: none` on UI chrome (no long-press menu on buttons)

### PWA
- `manifest.json` with name, theme color, 4 icon variants (any + maskable)
- 3 quick-action shortcuts (Mission / Progress / Branches)
- `display: standalone` + `display_override: ["window-controls-overlay", "standalone", "minimal-ui"]`
- Service worker (`/sw.js`) - cache-first for static, network-first for HTML
- `InstallPrompt` component with `beforeinstallprompt` capture + iOS guidance
- 7-day cooldown on dismiss

### iOS-specific
- `apple-touch-icon` link in head
- `apple-mobile-web-app-capable=yes`
- `apple-mobile-web-app-status-bar-style=black-translucent`
- `apple-mobile-web-app-title=KAIZEN`
- `startupImage` array in metadata
- `viewportFit: cover` for notch
- `format-detection telephone=no` (stop iOS auto-linking phone numbers)

### Android-specific
- `mobile-web-app-capable=yes`
- `msapplication-TileColor=#050505`
- Maskable icons for adaptive launcher

### Touch UX
- `tap-card:active { transform: scale(0.975) }` (~80ms haptic feedback)
- `cta-nudge` arrow animation on primary CTAs
- `glow-ring` hover/focus state
- Press feedback on `btn-primary` / `btn-secondary` (scale 0.96)
- Premium focus rings (red glow ring + halo)

### Performance
- `React.memo` on heavy panels (StatCard, HeroStatusPanel internals)
- `useMemo` on all expensive computations (XP state, day data, achievements)
- `useCallback` on event handlers passed to memoized children
- `useTransition` on the day-complete network call (UI stays responsive)
- Realtime hook ref-guarded against StrictMode double-mount
- `prefers-reduced-motion` zeroes all transition durations

### Production-safe
- TS strict: `ignoreBuildErrors: false`
- ESLint: `ignoreDuringBuilds: false`
- Suspense wrapping on `useSearchParams` (prerender-safe)
- Env validation at module boundary, throws actionable errors
- Capacitor config decoupled from Vercel build (`tsconfig.json` exclude)
- All 7 SQL migrations idempotent + FK-ordered

### Capacitor-ready (no native code yet)
- `capacitor.config.json` with appId, appName, theme color, allowed nav
- `public-shell/index.html` offline fallback page
- `npm run cap:setup` script ready to scaffold android/
- `npm run android:apk` / `android:aab` for builds

---

## Deploy checklist

### Before `vercel --prod`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in Vercel
- [ ] `ADMIN_EMAIL` set in Vercel (optional, defaults to hrixofficial@gmail.com)
- [ ] `NEXT_PUBLIC_BYPASS_AUTH` is **0 or unset** in Vercel
- [ ] 4 SQL migrations run in Supabase SQL Editor (0000 -> 0003)
- [ ] Realtime publication enabled on user_progress, streaks, xp_log, profiles
- [ ] Admin user has `role='admin'` in profiles table

### After deploy
- [ ] `/health` returns all green
- [ ] Lighthouse PWA score 90+
- [ ] Install prompt appears on Chrome mobile after a few seconds
- [ ] Service worker registered (DevTools -> Application -> Service Workers)
- [ ] Two tabs of same account stay in sync via realtime (mark day complete in one, watch the other update)

---

## Capacitor (when ready for Android)

Two paths:

**A. Quick (WebView shell pointing at deployed URL)** - recommended
- Edit `capacitor.config.json` -> set `server.url` to your Vercel URL
- `npm run cap:setup`
- `npm run cap:run` -> emulator
- `npm run android:aab` -> Play Store

**B. Full offline (requires `output: 'export'`)** - NOT supported by current architecture
- Would require removing middleware.ts, all API routes, and converting server components to client
- Not recommended; the WebView shell pattern gives you the same UX

See `CAPACITOR_ANDROID.md` for the full Android walkthrough.

---

## Known limitations (by design)

1. **Static export not supported** - the app uses Next.js middleware, API routes, server components with cookie auth, and `cookies()` from `next/headers`. The WebView shell pattern is the correct path.
2. **iOS push notifications** - require Apple Developer Program + APNs. Not in scope.
3. **Background sync** - service worker handles offline reads but doesn't sync writes when offline (Supabase auth requires network).

All ship-blocking work is done. Run the 4 migrations, set the env vars on Vercel, push to git, and the app is live.
