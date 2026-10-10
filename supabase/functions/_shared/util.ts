import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED = ['https://ops.kriosity.in', 'http://localhost:5173', 'http://localhost:4173'];

export function cors(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  const ok = ALLOWED.includes(origin) || /^https:\/\/kriosityops[\w-]*\.vercel\.app$/.test(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } });

export const admin = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

/** The signed-in user behind the request's JWT, or null. */
export async function userFrom(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  return data.user ?? null;
}

export async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const PAYPAL_BASE = () => (Deno.env.get('PAYPAL_ENV') === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com');

export async function paypal(path: string, init: RequestInit = {}) {
  const id = Deno.env.get('PAYPAL_CLIENT_ID')!;
  const secret = Deno.env.get('PAYPAL_CLIENT_SECRET')!;
  const tok = await fetch(`${PAYPAL_BASE()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  }).then((r) => r.json());
  if (!tok.access_token) throw new Error('PayPal sign-in failed. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  const res = await fetch(`${PAYPAL_BASE()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

export async function razorpay(path: string, init: RequestInit = {}) {
  const id = Deno.env.get('RAZORPAY_KEY_ID')!;
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

/** Make a user Pro (or move them back to Free) and record the subscription. */
export async function setPlan(opts: {
  userId: string;
  provider: 'razorpay' | 'paypal';
  subscriptionId: string;
  status: string;
  pro: boolean;
  periodEnd?: string | null;
  amountMinor?: number | null;
  currency?: string | null;
  raw?: unknown;
}) {
  const db = admin();
  await db.from('subscriptions').upsert(
    {
      user_id: opts.userId,
      provider: opts.provider,
      provider_subscription_id: opts.subscriptionId,
      status: opts.status,
      current_period_end: opts.periodEnd ?? null,
      amount_minor: opts.amountMinor ?? null,
      currency: opts.currency ?? null,
      raw: opts.raw ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'provider_subscription_id' },
  );
  await db
    .from('profiles')
    .update(
      opts.pro
        ? { plan: 'pro', plan_provider: opts.provider, plan_renews_at: opts.periodEnd ?? null }
        : { plan: 'free', plan_provider: null, plan_renews_at: null },
    )
    .eq('id', opts.userId);
}
