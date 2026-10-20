# KriosityOps for Android

The phone companion to [ops.kriosity.in](https://ops.kriosity.in): check the board, copy a project ref, log a social post (also straight from Android's share sheet), and claim or release an app. Screens follow `../android-ui/` (open `index.html` there).

Expo SDK 58 · React Native 0.88 · Expo Router · TypeScript · Supabase · TanStack Query. Package `in.kriosity.ops`.

## What's in it

| Screen | File |
| --- | --- |
| Log in / new account with a 6-digit email code (no passwords, same as the web) | `src/app/login.tsx`, `src/app/otp.tsx` |
| Board: summary, filters, search, app cards sorted worst lamp first, add app | `src/app/(tabs)/index.tsx` |
| Due: late / due now / never posted / coming up, log inline with Undo | `src/app/(tabs)/due.tsx` |
| Account: plan, reminder time, theme, admin, WhatsApp help, log out | `src/app/(tabs)/account.tsx` |
| App: who's working on it, Stack / Social / Numbers tabs, edit, delete | `src/app/app/[id].tsx` |
| Admin (admins only, read-only) | `src/app/admin.tsx` |
| Shared from another app → pick channel → log post | `src/app/share.tsx`, `src/app/+native-intent.ts` |

- **Backend**: the existing KriosityOps Supabase project. No new tables. Row-level security keeps every query to the signed-in user's rows. Only the publishable (anon) key is in the app.
- **Session** is stored in the Android keystore (`expo-secure-store`, chunked).
- **Offline**: the last board is cached for 7 days and shown with an "Offline · last updated" bar.
- **Reminders**: local notifications, no server. Each time the board loads, the next 7 days are planned at your chosen hour, and only days with something due get a reminder.
- **No in-app purchase.** Google Play requires Play Billing for subscriptions sold inside an app, so the app shows the plan and the 2-app limit but has no buy button, prices or checkout link.

## Run it on your phone (development)

```bash
cd mobile
npm install
cp .env.example .env          # paste the publishable key (same as VITE_SUPABASE_ANON_KEY on Vercel)
npx expo start
```

The app uses native modules that Expo Go may not include (share intent, secure store), so the reliable way is a development build:

```bash
npx eas-cli@latest login
npx eas-cli@latest init                       # links the project to your Expo account (adds projectId to app.json)
npx eas-cli@latest build -p android --profile development
```

Install the APK it gives you, then `npx expo start` and scan the QR code.

## Build an APK or a Play Store bundle

Set the two variables once in EAS (they are public values, but EAS doesn't read your local `.env`):

```bash
npx eas-cli@latest env:set --name EXPO_PUBLIC_SUPABASE_URL --value https://xfskyegiwupjkuepiavx.supabase.co --environment preview --environment production --environment development --visibility plaintext
npx eas-cli@latest env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value sb_publishable_... --environment preview --environment production --environment development --visibility plaintext
```

Then:

```bash
npm run build:apk     # installable APK to share or sideload (profile "preview")
npm run build:aab     # Play Store bundle (profile "production", version code auto-increments)
npx eas-cli@latest submit -p android --profile production   # uploads to the Play Console internal track
```

EAS creates and keeps the signing key on the first build. For Play: create the app in the Play Console with package `in.kriosity.ops`, and use https://ops.kriosity.in/privacy as the privacy policy URL.

## Supabase settings to check

- **Email codes**: the Magic Link and Confirm signup templates must show `{{ .Token }}` (the repo's `supabase/email-templates/` already do), with a 6-digit OTP.
- **Captcha**: if you turn on Cloudflare Turnstile under Auth → Attack protection, code requests from the app are refused (the app can't show the web captcha) and the app says so. Leave it off, or add a native captcha later.

## Checks

```bash
npm run typecheck
npm run lint
npx expo export --platform android   # bundles the JS exactly as a release build would
```

## Icons

`assets/` holds the KriosityOps mark (navy square, two green rows, one amber row): `icon.png` (1024), adaptive `android-icon-foreground/background/monochrome.png`, `splash-icon.png`, `notification-icon.png` (white silhouette).
