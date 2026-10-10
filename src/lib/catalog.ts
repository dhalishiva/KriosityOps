// What a resource can be, and which providers we offer for each kind.
// "Other" is always allowed; users can type any provider name.

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

export const PLATFORMS: { id: string; label: string; handleHint: string }[] = [
  { id: 'x', label: 'X', handleHint: '@handle' },
  { id: 'reddit', label: 'Reddit', handleHint: 'r/subreddit' },
  { id: 'linkedin', label: 'LinkedIn', handleHint: 'Profile or page' },
  { id: 'pinterest', label: 'Pinterest', handleHint: 'Board or account' },
  { id: 'instagram', label: 'Instagram', handleHint: '@handle' },
  { id: 'youtube', label: 'YouTube', handleHint: 'Channel' },
  { id: 'facebook', label: 'Facebook', handleHint: 'Page or group' },
  { id: 'threads', label: 'Threads', handleHint: '@handle' },
  { id: 'producthunt', label: 'Product Hunt', handleHint: 'Product page' },
  { id: 'hackernews', label: 'Hacker News', handleHint: 'Username' },
  { id: 'indiehackers', label: 'Indie Hackers', handleHint: 'Username or group' },
  { id: 'other', label: 'Other', handleHint: 'Where you post' },
];

export const platformLabel = (id: string) => PLATFORMS.find((p) => p.id === id)?.label ?? id;

export type Freshness = 'ok' | 'due' | 'late' | 'never';

/** Green until the cadence is reached, amber when due, red at twice the cadence. */
export function freshness(lastPostedAt: string | null | undefined, cadenceDays: number, now = Date.now()): { state: Freshness; days: number | null } {
  if (!lastPostedAt) return { state: 'never', days: null };
  const days = Math.floor((now - new Date(lastPostedAt).getTime()) / 86400000);
  if (days >= cadenceDays * 2) return { state: 'late', days };
  if (days >= cadenceDays) return { state: 'due', days };
  return { state: 'ok', days };
}

export function ago(days: number | null): string {
  if (days === null) return 'Never posted';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export const APP_STATUSES = ['idea', 'building', 'live', 'paused', 'retired'] as const;
export const WORKERS = ['Me', 'Claude', 'ChatGPT', 'Cursor', 'Copilot', 'Gemini', 'A teammate'];
export const APP_COLORS = ['#2B4BF2', '#16A36A', '#E5484D', '#F5A524', '#8E4EC6', '#0E9FB5', '#14213D', '#D6409F'];
