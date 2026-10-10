# KriosityOps auth emails

Paste each file into **Supabase → Authentication → Emails → Templates** for the KriosityOps project (`xfskyegiwupjkuepiavx`). Use "Source" view and replace everything.

| Supabase template | File | Subject |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | Your KriosityOps code: {{ .Token }} |
| Magic Link | `magic-link.html` | Your KriosityOps sign-in code: {{ .Token }} |
| Change Email Address | `change-email.html` | Confirm your new KriosityOps email |
| Reauthentication | `reauthentication.html` | Your KriosityOps confirmation code |
| Reset Password | `reset-password.html` | Your KriosityOps sign-in code: {{ .Token }} |
| Invite user | `invite-user.html` | You’ve been invited to KriosityOps |

New users get **Confirm signup**; returning users get **Magic Link**. Both show the code (`{{ .Token }}`), which the app's sign-in screen expects.

Also set, under **Authentication → Sign In / Providers → Email**:

- Email OTP expiration: `600` seconds (the emails and the app say 10 minutes)
- Email OTP length: `6`

The logo loads from `https://ops.kriosity.in/brand/kriosityops-mark-256.png`, so it appears once the domain's DNS is live.
