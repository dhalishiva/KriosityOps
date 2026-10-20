// Same catalog and rules as the web app (src/lib/catalog.ts in the repo root).

export type Kind = 'database' | 'hosting' | 'repo' | 'domain' | 'payments' | 'email' | 'storage' | 'analytics' | 'other';

export const KINDS: { id: Kind; label: string; projectHint: string }[] = [
  { id: 'database', label: 'Database', projectHint: 'Project name or ref' },
  { id: 'hosting', label: 'Hosting', projectHint: 'Project or service name' },
  { id: 'repo', label: 'Code repo', projectHint: 'owner/repo' },
  { id: 'domain', label: 'Domain', projectHint: 'example.com' },
  { id: 'payments', label: 'Payments', projectHint: 'Account or plan' },
  { id: 'email', label: 'Email', projectHint: 'Mailbox or sending domain' },
  { id: 'storage', label: 'Storage', projectHint: 'Bucket name' },
  { id: 'analytics', label: 'Analytics', projectHint: 'Property or site' },
  { id: 'other', label: 'Other', projectHint: 'Name or ID' },
];

export const PROVIDERS: Record<Kind, string[]> = {
  database: ['Supabase', 'Firebase', 'Neon', 'MongoDB Atlas', 'PlanetScale', 'Turso', 'Appwrite', 'Self-hosted Postgres', 'MySQL'],
  hosting: ['Vercel', 'Netlify', 'Render', 'Railway', 'Cloudflare Pages', 'Fly.io', 'Hostinger', 'AWS', 'DigitalOcean', 'Heroku'],
  repo: ['GitHub', 'GitLab', 'Bitbucket'],
  domain: ['Hostinger', 'GoDaddy', 'Namecheap', 'Cloudflare', 'Squarespace', 'Porkbun'],
  payments: ['Razorpay', 'Stripe', 'PayPal', 'Paddle', 'Lemon Squeezy', 'Cashfree'],
  email: ['Microsoft 365', 'Google Workspace', 'Resend', 'SendGrid', 'Zoho Mail', 'Amazon SES'],
  storage: ['Supabase Storage', 'AWS S3', 'Cloudflare R2', 'Cloudinary'],
  analytics: ['Vercel Analytics', 'Google Analytics', 'Search Console', 'Plausible', 'PostHog'],
  other: [],
};

const KIND_ORDER = KINDS.map((k) => k.id as string);
export const byKind = (a: { kind: string }, b: { kind: string }) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
export const kindLabel = (k: string) => KINDS.find((x) => x.id === k)?.label ?? k;

/** Build a console link from what the user typed, when the provider has a predictable URL. */
export function suggestLink(provider: string, project: string): string {
  const p = project.trim();
  if (!p) return '';
  switch (provider) {
    case 'Supabase':
      return /^[a-z0-9]{20}$/.test(p) ? `https://supabase.com/dashboard/project/${p}` : '';
    case 'GitHub':
      return /^[\w.-]+\/[\w.-]+$/.test(p) ? `https://github.com/${p}` : '';
    case 'GitLab':
      return /^[\w.-]+\/[\w./-]+$/.test(p) ? `https://gitlab.com/${p}` : '';
    case 'Bitbucket':
      return /^[\w.-]+\/[\w.-]+$/.test(p) ? `https://bitbucket.org/${p}` : '';
    case 'Render':
      return 'https://dashboard.render.com/';
    case 'Netlify':
      return /^[\w-]+$/.test(p) ? `https://app.netlify.com/sites/${p}` : '';
    default:
      return '';
  }
}

/** True when a value looks like a secret key rather than a name or id. */
export function looksSecret(v: string | null | undefined): boolean {
  const s = (v ?? '').trim();
  if (!s) return false;
  if (/^(sk_|rk_|rzp_live_|rzp_test_|eyJ|ghp_|gho_|github_pat_|AKIA|sb_secret_|xox[bp]-)/.test(s)) return true;
  if (/\s/.test(s) || s.includes('/') || s.includes('@') || s.includes('.')) return false;
  return s.length >= 32 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s);
}

export const PLATFORMS: { id: string; label: string; handleHint: string; hosts: string[] }[] = [
  { id: 'x', label: 'X', handleHint: '@handle', hosts: ['x.com', 'twitter.com'] },
  { id: 'reddit', label: 'Reddit', handleHint: 'r/subreddit', hosts: ['reddit.com', 'redd.it'] },
  { id: 'linkedin', label: 'LinkedIn', handleHint: 'Profile or page', hosts: ['linkedin.com', 'lnkd.in'] },
  { id: 'pinterest', label: 'Pinterest', handleHint: 'Board or account', hosts: ['pinterest.com', 'pin.it'] },
  { id: 'instagram', label: 'Instagram', handleHint: '@handle', hosts: ['instagram.com'] },
  { id: 'youtube', label: 'YouTube', handleHint: 'Channel', hosts: ['youtube.com', 'youtu.be'] },
  { id: 'facebook', label: 'Facebook', handleHint: 'Page or group', hosts: ['facebook.com', 'fb.com', 'fb.watch'] },
  { id: 'threads', label: 'Threads', handleHint: '@handle', hosts: ['threads.net', 'threads.com'] },
  { id: 'producthunt', label: 'Product Hunt', handleHint: 'Product page', hosts: ['producthunt.com'] },
  { id: 'hackernews', label: 'Hacker News', handleHint: 'Username', hosts: ['news.ycombinator.com'] },
  { id: 'indiehackers', label: 'Indie Hackers', handleHint: 'Username or group', hosts: ['indiehackers.com'] },
  { id: 'other', label: 'Other', handleHint: 'Where you post', hosts: [] },
];

export const platformLabel = (id: string) => PLATFORMS.find((p) => p.id === id)?.label ?? id;

/** Which platform a shared URL belongs to, or null. */
export function platformForUrl(url: string): string | null {
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\.|^m\.|^mobile\./, '').toLowerCase();
  } catch {
    return null;
  }
  for (const p of PLATFORMS) if (p.hosts.some((h) => host === h || host.endsWith('.' + h))) return p.id;
  return null;
}

/** Pull the first http(s) URL out of shared text ("Check this https://x.com/... via @app"). */
export function firstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"')]+/i);
  return m ? m[0].replace(/[.,;!?]+$/, '') : null;
}

export type Freshness = 'ok' | 'due' | 'late' | 'never';

const DAY = 86400000;

/** Green until the cadence is reached, amber when due, red at twice the cadence. */
export function freshness(lastPostedAt: string | null | undefined, cadenceDays: number, now = Date.now()): { state: Freshness; days: number | null } {
  if (!lastPostedAt) return { state: 'never', days: null };
  const days = Math.max(0, Math.floor((now - new Date(lastPostedAt).getTime()) / DAY));
  if (days >= cadenceDays * 2) return { state: 'late', days };
  if (days >= cadenceDays) return { state: 'due', days };
  return { state: 'ok', days };
}

/** When the channel next turns amber. Null if it has never been posted to. */
export function nextDueAt(lastPostedAt: string | null, cadenceDays: number): Date | null {
  if (!lastPostedAt) return null;
  return new Date(new Date(lastPostedAt).getTime() + cadenceDays * DAY);
}

export const RANK: Record<Freshness, number> = { ok: 0, never: 1, due: 2, late: 3 };

export function worst<T extends { lastPostedAt: string | null; cadence_days: number }>(items: T[], now = Date.now()) {
  let w: (T & { state: Freshness; days: number | null }) | null = null;
  for (const it of items) {
    const f = freshness(it.lastPostedAt, it.cadence_days, now);
    if (!w || RANK[f.state] > RANK[w.state]) w = { ...it, ...f };
  }
  return w;
}

export function ago(days: number | null): string {
  if (days === null) return 'never';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export const APP_STATUSES = ['idea', 'building', 'live', 'paused', 'retired'] as const;
export const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const WORKERS = ['Me', 'Claude', 'ChatGPT', 'Cursor', 'Copilot', 'Gemini'];
export const APP_COLORS = ['#E8572A', '#2B4BF2', '#16A36A', '#8E4EC6', '#0E9FB5', '#F5A524', '#D6409F', '#14213D'];

export const stripUrl = (u: string | null) => (u ? u.replace(/^https?:\/\//, '').replace(/\/$/, '') : '');

export function sinceText(iso: string | null, now = Date.now()): string {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'}`;
}

export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (msg.includes('FREE_LIMIT')) return 'The free plan includes 2 apps.';
  if (/duplicate key/i.test(msg)) return 'That one already exists.';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Wait a minute and try again.';
  if (/Token has expired|invalid.*otp|otp.*invalid|expired/i.test(msg)) return 'That code is wrong or has expired. Request a new one.';
  if (/Invalid login credentials/i.test(msg)) return 'That email and password don’t match.';
  if (/Email not confirmed/i.test(msg)) return 'Confirm your email first, or log in with an email code.';
  if (/Signups not allowed|User not found/i.test(msg)) return 'No account uses that email. Create one on ops.kriosity.in.';
  if (/Network request failed|Failed to fetch|NetworkError/i.test(msg)) return 'Could not reach the server. Check your connection and try again.';
  return msg.replace(/^.*?:\s(?=[A-Z])/, '');
}

export const isFreeLimit = (e: unknown) => ((e as { message?: string })?.message ?? '').includes('FREE_LIMIT');
