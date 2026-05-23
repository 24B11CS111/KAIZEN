# KAIZEN.SYS — Email templates

Premium, dark, mobile-responsive email templates designed to replace the generic Supabase defaults. All templates are self-contained (inline styles, table layout, no external assets) so they render correctly across Gmail, Outlook, Apple Mail, ProtonMail, Yahoo, and mobile clients.

## Files

| File | When it's used | Trigger |
|---|---|---|
| `magic-link.html` | Email magic link **and** email OTP | `supabase.auth.signInWithOtp({ email })` |
| `confirm-signup.html` | First-time email confirmation | `auth.signUp` with `email_confirm: false` |
| `reset-password.html` | Password reset link | `supabase.auth.resetPasswordForEmail()` |
| `welcome.html` | Sent after onboarding completes (transactional, NOT Supabase) | Your backend, via Resend / Postmark / SES |
| `subscription-expiring.html` | 3 days before subscription expiry (transactional) | Cron / scheduled job |

## How to install in Supabase

1. Open **Supabase Dashboard → Authentication → Email Templates**.
2. For each Supabase-managed type below, paste the HTML into the **Message (HTML)** field and set the subject:

| Supabase template | File | Subject |
|---|---|---|
| Magic Link | `magic-link.html` | `KAIZEN.SYS — Verification Code` |
| Confirm signup | `confirm-signup.html` | `KAIZEN.SYS — Confirm your account` |
| Reset Password | `reset-password.html` | `KAIZEN.SYS — Reset your password` |

3. Under **Authentication → Email Settings**, set:
   - **Sender name** → `KAIZEN.SYS`
   - **Sender email** → e.g. `dojo@kaizen.sys` (or your verified domain)
   - **SMTP** → configure with your provider (Resend / Postmark / SES recommended for deliverability)

4. Save. Send a test email to yourself from the "Send test email" button in each template editor.

## Template variables

Supabase exposes these Go-template variables to auth emails:

```
{{ .Email }}           - recipient email
{{ .Token }}           - 6-digit OTP code (Magic Link template)
{{ .TokenHash }}       - hash of the token
{{ .ConfirmationURL }} - one-tap link (magic link, confirm, reset)
{{ .SiteURL }}         - your project's Site URL setting
{{ .RedirectTo }}      - the URL you passed in `redirectTo`
```

For the transactional templates (`welcome.html`, `subscription-expiring.html`) which Supabase does NOT send, the merge fields use `{{name}}`, `{{branch}}`, `{{goal}}`, `{{daily_minutes}}`, `{{dojo_url}}`, `{{days_remaining}}`, `{{renew_url}}`, `{{streak_count}}` — substitute these from your transactional sender of choice.

## Design notes

- Background `#050505` (obsidian) with `#D00000` (blood) accents
- Card uses gradient `#0a0a0a → #050505` for depth
- All text colors use `rgba(255,255,255,a)` so they degrade gracefully on light-mode-forced clients
- `color-scheme: dark only` meta tag forces dark rendering in supporting clients
- Preheader (hidden inbox preview text) appears under the subject on most clients
- OTP code uses monospace + 0.32em letter-spacing for premium, scannable presentation
- Button uses inline-block anchor wrapped in a `<td>` background, the most compatible pattern for Gmail / Outlook
- Hairline blood-red gradient divider mirrors the in-app navbar accent

## Testing checklist

- Render in [mail-tester.com](https://mail-tester.com) — aim for 8+/10
- Preview on Gmail (web + Android + iOS)
- Preview on Outlook 2019 / Outlook.com (most strict)
- Preview on Apple Mail (iOS + macOS)
- Check dark mode rendering — should stay dark on all clients
- Verify button works when CSS is stripped (it falls back to a plain link)
