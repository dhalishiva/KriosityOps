# Prompt for ChatGPT — build the KriosityOps Android app

Copy everything below the line into ChatGPT. Attach `index.html`, `README.md` and `tokens.json` from this folder (or paste the GitHub link to `android-ui/`) so it can see the screens.

---

You are a senior React Native engineer. Build the **KriosityOps** Android app, production quality, as a complete Expo project I can run with `npx expo start` and build with EAS. Give me every file in full (no "…rest of code here"), in a sensible folder tree, then the exact commands to install, run and build an APK/AAB.

## What KriosityOps is

A board for indie founders who run many apps. For each app it records where the app lives (database, hosting, repo, domain, payments, email… with provider, account name, project ref and console link — identifiers only, never secrets), a social post log per platform with a cadence and traffic-light "lamps", a "who's working on it" marker (Me / Claude / ChatGPT / …), and daily user counts. The web app already exists at https://ops.kriosity.in. The Android app is the on-the-go companion: check the board, look up and copy identifiers, log a post (including from the Android share sheet), and claim/release an app.

## Design — follow the attached screens exactly

The attached `index.html` shows 13 screens; `README.md` is the UX spec (screens, data, behaviour, states); `tokens.json` has every colour, size and radius for light and dark. Match them closely:

- Fonts: **Schibsted Grotesk** (400–800) for UI, **JetBrains Mono** (400/500) for identifiers and numbers. Load with `@expo-google-fonts/schibsted-grotesk` and `@expo-google-fonts/jetbrains-mono`.
- Palette "harbor control board": cool paper background, navy ink, one cobalt accent, and signal lamps green `ok` / amber `due` / red `late` / grey `never`. Full dark theme from `tokens.json`; theme follows the system by default with an override in Account.
- Cards have a 1 dp border and no shadow; only the FAB and bottom sheets are elevated. Bottom sheets have a 20 dp top radius and a drag handle.
- Bottom navigation: **Board**, **Due** (badge = late + due count), **Account**.
- 48 dp touch targets, content descriptions on icon buttons, lamps always paired with text, dynamic type without clipping.

## Tech stack (use these)

- Expo SDK (latest stable), TypeScript strict, **expo-router** (file-based routes, tabs layout + stack for app detail).
- `@supabase/supabase-js` v2 with `expo-secure-store` as the auth storage adapter (chunk values over 2 KB), `autoRefreshToken: true`, `detectSessionInUrl: false`, and `AppState` listener to start/stop auto refresh.
- `@tanstack/react-query` for fetching, caching and optimistic updates; persist the query cache with `@tanstack/query-async-storage-persister` so the last board shows offline with an "Offline · last updated HH:MM" bar.
- `@gorhom/bottom-sheet` for sheets, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-svg` for icons, lamps and the sparkline.
- `expo-notifications` for a local daily reminder (default 9:00 AM, user-changeable) that fires only if something is due or late — compute from cached data when the app was last opened; no push server needed.
- `expo-clipboard`, `expo-linking`, `expo-haptics`.
- Android share intent: use `expo-share-intent` (config plugin) so sharing a URL from X / LinkedIn / Reddit opens the "Log a post" sheet with the link pre-filled and the matching channel pre-selected by host (x.com/twitter.com → x, linkedin.com → linkedin, reddit.com → reddit, etc.).
- Config via `app.config.ts` + `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`. Package name `in.kriosity.ops`, app name "KriosityOps".

## Backend — already exists, do not create tables

Supabase project URL: `https://xfskyegiwupjkuepiavx.supabase.co` (anon key goes in `.env`, I'll paste it). Row-level security already limits every row to `auth.uid()`; just query normally as the signed-in user. Never use a service-role key in the app.

```ts
type Profile = { id: string; email: string; full_name: string | null; country: string | null;
  plan: 'free' | 'pro'; plan_provider: 'razorpay' | 'paypal' | null; plan_renews_at: string | null;
  is_admin: boolean; created_at: string };

type App = { id: string; owner_id: string; name: string; url: string | null; description: string | null;
  status: 'idea' | 'building' | 'live' | 'paused' | 'retired'; color: string;
  in_use_by: string | null; in_use_since: string | null; created_at: string; updated_at: string };

type Resource = { id: string; app_id: string; owner_id: string;
  kind: 'database'|'hosting'|'repo'|'domain'|'payments'|'email'|'storage'|'analytics'|'other';
  provider: string; account: string | null; project: string | null; link: string | null;
  notes: string | null; created_at: string };

type Channel = { id: string; app_id: string; owner_id: string; platform: string; handle: string | null;
  cadence_days: number /* 1..90 */; created_at: string };   // unique (app_id, platform, handle)

type Post = { id: string; channel_id: string; app_id: string; owner_id: string; posted_at: string;
  links: string[]; note: string | null; created_at: string };

type Metric = { app_id: string; day: string /* date */; users_total: number | null;
  users_new_24h: number | null; visitors_24h: number | null; pageviews_24h: number | null };
```

Tables: `profiles`, `apps`, `resources`, `social_channels`, `social_posts`, `metrics_daily`. `owner_id` defaults to `auth.uid()` on insert, so don't send it. Users cannot change their own `plan` or `is_admin` (a trigger ignores it). Inserting a third app on the free plan raises a Postgres error whose message starts with `FREE_LIMIT:` — catch it and show the Free limit sheet (screen 13).

Auth: email + password (`signInWithPassword`, `signUp` with `options.data.full_name`), email code (`signInWithOtp({ email, options: { shouldCreateUser: false } })` then `verifyOtp({ email, token, type: 'email' })`), password reset (`resetPasswordForEmail` with `redirectTo: 'https://ops.kriosity.in/login'`). Sign-up and reset can just open the website if simpler.

## Catalog (copy into `lib/catalog.ts`)

Kinds and providers:
- database: Supabase, Firebase, Neon, MongoDB Atlas, PlanetScale, Turso, Appwrite, Self-hosted Postgres, MySQL
- hosting: Vercel, Netlify, Render, Railway, Cloudflare Pages, Fly.io, Hostinger, AWS, DigitalOcean, Heroku
- repo: GitHub, GitLab, Bitbucket
- domain: Hostinger, GoDaddy, Namecheap, Cloudflare, Squarespace, Porkbun
- payments: Razorpay, Stripe, PayPal, Paddle, Lemon Squeezy, Cashfree
- email: Microsoft 365, Google Workspace, Resend, SendGrid, Zoho Mail, Amazon SES
- storage: Supabase Storage, AWS S3, Cloudflare R2, Cloudinary
- analytics: Vercel Analytics, Google Analytics, Search Console, Plausible, PostHog
- other: free text. Every kind also allows typing any provider.

Auto console link from project: Supabase + 20-char lowercase ref → `https://supabase.com/dashboard/project/{ref}`; GitHub/GitLab/Bitbucket + `owner/repo` → `https://{github.com|gitlab.com|bitbucket.org}/{owner/repo}`; Netlify + site slug → `https://app.netlify.com/sites/{slug}`; Render → `https://dashboard.render.com/`.

Platforms (id → label): x → X, reddit → Reddit, linkedin → LinkedIn, pinterest → Pinterest, instagram → Instagram, youtube → YouTube, facebook → Facebook, threads → Threads, producthunt → Product Hunt, hackernews → Hacker News, indiehackers → Indie Hackers, other → Other.

Lamp rule:
```ts
function freshness(lastPostedAt: string | null, cadenceDays: number, now = Date.now()) {
  if (!lastPostedAt) return { state: 'never', days: null };
  const days = Math.floor((now - new Date(lastPostedAt).getTime()) / 86400000);
  if (days >= cadenceDays * 2) return { state: 'late', days };
  if (days >= cadenceDays) return { state: 'due', days };
  return { state: 'ok', days };
}
// worst-first order for sorting and a card's lamp: late > due > never > ok
```

Secret guard: before saving a stack item, warn (not block) if any field matches `/^(sk_|rk_|rzp_live_|rzp_test_|eyJ|ghp_|github_pat_|AKIA)/` or is a 32+ char random-looking string with no spaces — "This looks like a secret key. KriosityOps stores names and links only."

## Screens to build (numbers match the mockups)

1. **Log in** — Password / Email code segmented control, Create account, Forgot password.
2. **Email code** — 6 boxes, paste whole code, resend after 60 s.
3. **Board empty** — "Add your first app", identifiers-only note, "Free plan: 2 apps".
4. **Board** — summary strip (apps / being worked on / posts due), filter chips (All, Live, Building, Needs a post), search, app cards (swatch with initial, name, url, `+new / total` users from latest metric, provider chips, worst channel lamp + "X · 7 days ago", cobalt "Claude is working on it · 40 min" line when claimed). Sort worst lamp first, then name. Pull to refresh. FAB "+ App" → Add app sheet (name, url, status, colour from `tokens.json.color.appSwatches`).
5. **App detail · Stack** — header, status pill, in-use strip, tabs Stack / Social / Numbers. Stack rows: kind icon, provider, mono `project · account`; tap copies project (toast "Copied"), trailing icon opens link; long-press → Edit / Delete (confirm). "Add to stack" button. Overflow menu: Edit app, Open website, Delete app (type the name to confirm).
6. **In-use sheet** — chips Me / Claude / ChatGPT / Cursor / Someone else…; sets `in_use_by` and `in_use_since = now()`. "Mark as free" sets both to null. Optimistic.
7. **Add to stack sheet** — kind chips, provider dropdown + free text, account, project (mono), link (auto-filled, editable), notes; secret guard.
8. **App detail · Social** — channel rows (lamp, "Platform · handle", "Every N days · last X ago", Log button), recent posts (date, first link host, note; swipe to delete with Undo), "Add a channel" sheet (platform, handle, cadence stepper 1–90, default 3).
9. **Log a post sheet** — when (date-time picker, default now), links (add more), note. Insert into `social_posts` with `channel_id`, `app_id`. Also opened from the share intent: if several channels match the shared host, ask which app first.
10. **Due** — all channels across apps grouped Late / Due today / Coming up (next due within 7 days, show date). Log inline; snackbar "Logged X for SlotRecover · Undo".
11. **App detail · Numbers** — total users, new 24 h, 14-day sparkline of `users_new_24h` (area fill, faint grid, emphasised last point), visitors and page views 24 h, "Updated today at 6:00 AM IST". Empty: "Numbers start tomorrow at 6 AM IST."
12. **Account** — dark plan card ("Free · 2 of 2 apps" with meter, or "Pro · renews 12 Nov"), email, daily reminder time, theme (System / Light / Dark), Admin row only if `is_admin` (read-only list of profiles: email, plan, created), Help on WhatsApp (opens `https://wa.me/919716414417?text=Hi%2C%20I%20need%20help%20with%20KriosityOps`; keep the number in config), Privacy and terms (open `https://ops.kriosity.in/privacy` and `/terms`), Log out, version.
13. **Free limit sheet** — on `FREE_LIMIT`: "You're using both free apps. The free plan includes 2 apps. Pro has no limit and is ₹299 a month in India or $9 elsewhere. You can upgrade on ops.kriosity.in." Button "Got it".

**Important — no in-app purchase.** Google Play requires Play Billing for digital subscriptions sold inside an app. Version 1 must not show a buy button or link to a checkout page. Only state the plan and that it's managed on the website.

## States everywhere

Skeleton loading cards, empty states, inline error with Retry, offline banner, session-expired → back to Log in with "Please log in again", optimistic updates with rollback on error, haptic tick on Log / claim.

## Code quality

- Folder layout: `app/` (routes), `components/` (Lamp, Chip, AppCard, Sheet, Row, Snackbar, Sparkline, Skeleton…), `lib/` (supabase, catalog, theme, queries, notifications, share), `hooks/`.
- A `theme.ts` built from `tokens.json` with `useTheme()`; no hard-coded colours in components.
- Typed Supabase queries; one query that loads the board in as few round trips as possible (apps, resources, channels, latest post per channel, latest metric per app — fetch in parallel and join in memory).
- ESLint + Prettier config, `README.md` with setup, `.env.example`, `eas.json` with `preview` (APK) and `production` (AAB) profiles.
- Adaptive app icon from the KriosityOps mark: a navy `#14213D` rounded square with three rows — green dot + white bar, green dot + shorter white bar, amber dot + white bar. Draw it as SVG and tell me how to export the PNG sizes.

Start by listing the folder tree, then give each file. Ask me only if something blocks you; otherwise make sensible choices and note them at the end.
