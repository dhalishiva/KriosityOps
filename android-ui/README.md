# KriosityOps for Android — UI/UX spec

Open `index.html` in a browser to see all 13 screens drawn in phone frames (light and dark follow your system theme).
`CHATGPT_PROMPT.md` is the build prompt to hand to ChatGPT. `tokens.json` holds the colors and type as data.

## What the app is for

The web app (ops.kriosity.in) is where you set things up. The phone app is for the moments away from the desk:

1. **Check the board** — is any app being worked on, is any social channel overdue, how many new users came in.
2. **Look something up** — "which Supabase account is PaidTwice in?", copy a project ref, open a console.
3. **Log a post** right after posting it, ideally by sharing the post from the X/LinkedIn/Reddit app.
4. **Claim or release an app** ("Claude is working on it") so two people or two AIs don't edit the same app.

Anything heavier (billing, admin tables, bulk edits) stays on the web.

## Navigation

Bottom navigation with three destinations. App detail and sheets open on top.

```
Splash ─► Login ─┬─► OTP ─┐
                 └────────┴─► Board ◄──► Due ◄──► Account
                              │                     └─► Admin (admins only)
                              └─► App detail [Stack | Social | Numbers]
                                     ├─ In-use sheet
                                     ├─ Add/edit stack item sheet
                                     ├─ Add channel sheet
                                     └─ Log post sheet  ◄── Android share intent
```

## Screens

| # | Screen | Data | Key behaviour |
|---|---|---|---|
| 1 | Log in | `auth.signInWithPassword` | Segmented: Password / Email code. Link to create account and reset password. |
| 2 | Email code | `auth.signInWithOtp`, `auth.verifyOtp` (type `email`) | 6 boxes, paste support, resend after 60 s, code expires in 10 min. |
| 3 | Board · empty | `apps` | One action: Add an app. States the identifiers-only rule. |
| 4 | Board | `apps`, `resources`, `social_channels`, latest `social_posts`, latest `metrics_daily` | Summary strip (apps / being worked on / posts due). Filter chips: All, Live, Building, Needs a post. Cards sorted worst lamp first, then name. Pull to refresh. Search by name. FAB "+ App". |
| 5 | App · Stack | `resources` for the app | In-use strip on top. Rows: kind icon, provider, project + account in mono. Tap = copy project; trailing icon = open `link`. Long-press = edit / delete. |
| 6 | In-use sheet | `apps.in_use_by`, `in_use_since` | Chips: Me, Claude, ChatGPT, Cursor, Someone else (free text). Remembers last choice. "Mark as free" clears both fields. |
| 7 | Add to stack | insert/update `resources` | Kind chips → provider dropdown (from catalog, plus type-your-own) → account → project → link (auto-suggested). Warn if a value looks like a secret. |
| 8 | App · Social | `social_channels`, `social_posts` | Channel rows with lamp, cadence, last post; "Log" button. Recent posts below (swipe to delete with undo). Add channel sheet: platform, handle, cadence 1–90 days. |
| 9 | Log a post | insert `social_posts` | When (defaults now), one or more links, note. Opened from Android share sheet with the shared URL pre-filled; if the URL's host matches a platform, pre-select that channel. |
| 10 | Due | all channels across apps | Grouped Late / Due today / Coming up (next 7 days). Badge count on the nav tab = late + due. Logging shows a snackbar with Undo. |
| 11 | App · Numbers | `metrics_daily` (last 14 days) | Total users, new in 24 h, sparkline of new users, visitors and page views. Empty state: "Numbers start tomorrow at 6 AM IST." |
| 12 | Account | `profiles` | Plan card with app meter, email, daily reminder time, theme, Admin (only if `is_admin`), WhatsApp help, privacy/terms, log out, version. |
| 13 | Free limit | DB error `FREE_LIMIT` on `apps` insert | Calm sheet explaining the 2-app limit and that Pro is on the website. No buy button in the app. |

Add app sheet (from the FAB, not drawn separately): name, URL, status (idea / building / live / paused / retired), colour from 8 swatches.

## The lamp rule (same as the web)

```
days = floor((now - last_posted_at) / 1 day)
never posted          → grey  (never)
days >= cadence * 2   → red   (late)
days >= cadence       → amber (due)
otherwise             → green (ok)
```
A card's lamp is its worst channel. Order of worst: late > due > never > ok.

## Components

- **Lamp**: 9 dp dot with a 3 dp soft halo in the matching wash colour. Always paired with text (never colour alone).
- **Chip**: 22–32 dp tall, 6 dp radius. Selected = cobalt wash + cobalt ink. Provider chips use the mono face.
- **Card**: surface, 1 dp line border, 12 dp radius, no shadow. Only the FAB and bottom sheets carry elevation.
- **Bottom sheet**: 20 dp top radius, drag handle, scrim behind. Primary button full width at the bottom.
- **In-use strip**: cobalt wash when claimed, plain surface with border when free.
- **Snackbar**: ink background, amber "Undo".

## Type

- Schibsted Grotesk (400–800) for everything readable. Screen titles 22 sp / 700 / −0.02 em; card titles 16 sp / 700; body 14 sp; captions 12 sp.
- JetBrains Mono (400/500) for identifiers: project refs, repo paths, domains, numbers in tables.
- Uppercase section labels: 11 sp, 700, +0.06 em tracking.

## States to build

Loading (skeleton cards, not spinners) · empty · error with Retry · offline banner with last-updated time · pull-to-refresh · session expired → back to Log in with a message.

## Accessibility

48 dp minimum touch targets, content descriptions on every icon button, lamp state spoken as text ("X, late, 7 days since last post"), dynamic type up to 200 % without clipping, contrast AA in both themes.

## Not in version 1

In-app purchase, admin editing, team members, home-screen widget (good v1.1 candidate: a 2×2 widget showing the Due count and worst lamp).
