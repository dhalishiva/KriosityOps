# KriosityOps

One board for every app you run: where each app lives (database account and project ref, host, repo, domain, payments), a social post log with due and overdue lamps, a "who's working on it" marker, and daily user counts (rolling out).

Live at **https://ops.kriosity.in**. A Kriosity product by Shiva Dhali Services.

## Stack

- React 18 + Vite + TypeScript, React Router. Marketing pages are prerendered to static HTML at build time for SEO; the signed-in app is a lazy-loaded SPA served from `/app` (the shell at `dist/app/index.html`).
- Supabase project **KriosityOps** (`xfskyegiwupjkuepiavx`, ap-south-1), in the account `shiva.dhali@kriosity.in`.
- Vercel for hosting. Edge functions on Supabase for billing and the contact form.

## Plans

| Plan | Price | Apps | Payment |
| --- | --- | --- | --- |
| Free | ₹0 / $0 | 2 | — |
| Pro | ₹299 a month (India) | Unlimited | Razorpay subscription |
| Pro | $9 a month (rest of world) | Unlimited | PayPal subscription |

The 2-app limit is enforced in the database (`enforce_app_limit` trigger). Users cannot change their own plan or admin flag (`guard_profile_update` trigger). A daily cron (`expire-pro-plans`) moves expired Pro accounts back to Free.

## Database

Migrations are in `supabase/migrations`. Every table has RLS; every row belongs to `auth.uid()`.

- `profiles`: plan, provider, renewal date, admin flag. `shiva.dhali@kriosity.in` and `shivadhali89@gmail.com` become admins on signup.
- `apps`: name, URL, stage, colour, `in_use_by` / `in_use_since`.
- `resources`: the registry. Identifiers only, never secrets.
- `social_channels`, `social_posts`: the post log, with a cadence per channel.
- `metrics_daily`: daily snapshots (filled by the 6 AM IST collector, next phase).
- `subscriptions`, `contact_messages`.

## Edge functions

| Function | JWT | Purpose |
| --- | --- | --- |
| `billing` | yes | `razorpay_create`, `razorpay_verify`, `paypal_activate`, `cancel` |
| `billing-webhook` | no (signature checked) | `?provider=razorpay` and `?provider=paypal` |
| `contact` | no (rate limited) | saves the message and emails support@kriosity.in over SMTP |

## Setup still needed (one time)

### 1. Supabase Auth (Dashboard → Authentication)

- **URL configuration**: Site URL `https://ops.kriosity.in`; redirect URLs `https://ops.kriosity.in/**`.
- **SMTP**: Settings → SMTP: host `smtp.office365.com`, port `587`, user `shiva.dhali@kriosity.in`, sender name `KriosityOps`, sender `shiva.dhali@kriosity.in`.
- **Email templates → Magic link** and **Confirm signup**: put the code in the body so users get an OTP, for example:

  ```html
  <h2>Your KriosityOps code</h2>
  <p>Enter this code to sign in: <strong style="font-size:24px;letter-spacing:4px">{{ .Token }}</strong></p>
  <p>It expires in 10 minutes. If you didn’t ask for it, ignore this email.</p>
  ```
- Optional: **Attack protection → Captcha** with Cloudflare Turnstile, then set `VITE_TURNSTILE_SITE_KEY` in Vercel.

### 2. Edge function secrets (Dashboard → Edge Functions → Secrets)

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=shiva.dhali@kriosity.in
SMTP_PASS=...
CONTACT_TO=support@kriosity.in

RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_PLAN_ID=plan_...          # ₹299 monthly plan created in Razorpay
RAZORPAY_WEBHOOK_SECRET=...

PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_PLAN_ID=P-...               # $9 monthly plan created in PayPal
PAYPAL_WEBHOOK_ID=...
# PAYPAL_ENV=sandbox               # only while testing
```

### 3. Payment provider webhooks

- Razorpay → Settings → Webhooks: `https://xfskyegiwupjkuepiavx.supabase.co/functions/v1/billing-webhook?provider=razorpay`, events `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`, `subscription.halted`, `subscription.paused`, `subscription.resumed`.
- PayPal → Developer dashboard → your app → Webhooks: `https://xfskyegiwupjkuepiavx.supabase.co/functions/v1/billing-webhook?provider=paypal`, events `BILLING.SUBSCRIPTION.*` and `PAYMENT.SALE.COMPLETED`. Copy the webhook ID into `PAYPAL_WEBHOOK_ID`.

### 4. Vercel environment variables

```
VITE_SUPABASE_URL=https://xfskyegiwupjkuepiavx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_RAZORPAY_KEY_ID=rzp_live_...
VITE_PAYPAL_CLIENT_ID=...
VITE_PAYPAL_PLAN_ID=P-...
VITE_TURNSTILE_SITE_KEY=           # optional
```

Until the payment variables are set, the Billing page tells users to upgrade over WhatsApp.

## Brand assets

`public/brand/` has the logo and mark as SVG and PNG (256, 1024, 2x, 4x). Favicons, Apple touch icon, PWA icons and `og-image.png` are in `public/`. Regenerate icons with `npm i --no-save sharp && node scripts/icons.mjs`.

## Develop

```
cp .env.example .env   # fill in the Supabase values
npm install
npm run dev
npm run build          # typecheck, build, prerender marketing pages
```

## Next

- Phase 3: a read-only stats function users add to each Supabase project, a 6 AM IST collector that also pulls Vercel analytics, and daily snapshots into `metrics_daily`.
- Android UI kit starter.
