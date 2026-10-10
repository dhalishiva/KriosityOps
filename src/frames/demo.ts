import type { BoardRow } from '../lib/types';
import type { RegistryItem } from './Registry';
import type { ChannelItem } from './Channels';

// Sample fleet for the marketing page. Fixed clock so the server render matches the browser.
export const DEMO_NOW = Date.UTC(2026, 9, 10, 6, 0, 0);
const daysAgo = (d: number) => new Date(DEMO_NOW - d * 86400000 - 3600000).toISOString();

export const demoRows: BoardRow[] = [
  {
    app: { id: 'a1', name: 'Slotbook', url: 'https://slotbook.app', status: 'live', color: '#2B4BF2', in_use_by: null, in_use_since: null },
    stack: [
      { kind: 'database', provider: 'Supabase', project: 'qkzdplwmtyaxcvbnhgfe' },
      { kind: 'hosting', provider: 'Vercel', project: 'slotbook-web' },
      { kind: 'repo', provider: 'GitHub', project: 'maya/slotbook' },
      { kind: 'domain', provider: 'Namecheap', project: 'slotbook.app' },
    ],
    social: [
      { platform: 'x', lastPostedAt: daysAgo(1), cadence: 2 },
      { platform: 'reddit', lastPostedAt: daysAgo(2), cadence: 7 },
    ],
    usersNew: 14,
    usersTotal: 1286,
  },
  {
    app: { id: 'a2', name: 'Invoicely', url: 'https://invoicely.io', status: 'live', color: '#16A36A', in_use_by: 'Claude', in_use_since: daysAgo(0) },
    stack: [
      { kind: 'database', provider: 'Supabase', project: 'rvmtjqoaplxkswnbeyhd' },
      { kind: 'hosting', provider: 'Vercel', project: 'invoicely' },
      { kind: 'payments', provider: 'Stripe', project: 'acct live' },
    ],
    social: [
      { platform: 'linkedin', lastPostedAt: daysAgo(4), cadence: 3 },
      { platform: 'x', lastPostedAt: daysAgo(1), cadence: 2 },
    ],
    usersNew: 6,
    usersTotal: 412,
  },
  {
    app: { id: 'a3', name: 'Dropwave', url: 'https://dropwave.dev', status: 'building', color: '#F5A524', in_use_by: null, in_use_since: null },
    stack: [
      { kind: 'hosting', provider: 'Vercel', project: 'dropwave' },
      { kind: 'hosting', provider: 'Render', project: 'signal-server' },
      { kind: 'repo', provider: 'GitHub', project: 'maya/dropwave' },
    ],
    social: [{ platform: 'reddit', lastPostedAt: daysAgo(9), cadence: 4 }],
    usersNew: 0,
    usersTotal: 37,
  },
  {
    app: { id: 'a4', name: 'Pantry Pal', url: 'https://pantrypal.in', status: 'live', color: '#8E4EC6', in_use_by: null, in_use_since: null },
    stack: [
      { kind: 'database', provider: 'Neon', project: 'pantry-prod' },
      { kind: 'hosting', provider: 'Netlify', project: 'pantrypal' },
    ],
    social: [{ platform: 'instagram', lastPostedAt: null, cadence: 3 }],
    usersNew: 3,
    usersTotal: 208,
  },
];

export const demoRegistry: RegistryItem[] = [
  { id: 'r1', kind: 'database', provider: 'Supabase', account: 'maya@hey.com', project: 'rvmtjqoaplxkswnbeyhd', link: '#', notes: 'Second free account' },
  { id: 'r2', kind: 'hosting', provider: 'Vercel', account: 'maya-projects', project: 'invoicely', link: '#', notes: null },
  { id: 'r3', kind: 'repo', provider: 'GitHub', account: 'maya', project: 'maya/invoicely', link: '#', notes: null },
  { id: 'r4', kind: 'domain', provider: 'Namecheap', account: 'maya@hey.com', project: 'invoicely.io', link: null, notes: 'Renews in March' },
  { id: 'r5', kind: 'payments', provider: 'Stripe', account: 'Invoicely Ltd', project: 'acct live', link: null, notes: null },
  { id: 'r6', kind: 'email', provider: 'Resend', account: 'hello@invoicely.io', project: 'mail.invoicely.io', link: null, notes: 'OTP + receipts' },
];

export const demoChannels: ChannelItem[] = [
  { id: 'c1', platform: 'x', handle: '@invoicelyhq', cadence: 2, lastPostedAt: daysAgo(1), lastLinks: ['https://x.com/invoicelyhq/status/1844'], postCount: 31 },
  { id: 'c2', platform: 'linkedin', handle: 'Invoicely', cadence: 3, lastPostedAt: daysAgo(4), lastLinks: ['https://linkedin.com/posts/invoicely-launch'], postCount: 12 },
  { id: 'c3', platform: 'reddit', handle: 'r/SaaS', cadence: 7, lastPostedAt: daysAgo(16), lastLinks: ['https://reddit.com/r/SaaS/comments/abc'], postCount: 4 },
  { id: 'c4', platform: 'producthunt', handle: 'Invoicely', cadence: 30, lastPostedAt: null, lastLinks: [], postCount: 0 },
];
