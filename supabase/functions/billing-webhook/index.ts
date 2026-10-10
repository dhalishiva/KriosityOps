// Payment provider webhooks. URL: .../functions/v1/billing-webhook?provider=razorpay | ?provider=paypal
import { admin, hmacHex, paypal, safeEqual, setPlan } from '../_shared/util.ts';

const ok = () => new Response('ok');

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const provider = new URL(req.url).searchParams.get('provider');
  const raw = await req.text();

  try {
    if (provider === 'razorpay') {
      const sig = req.headers.get('x-razorpay-signature') ?? '';
      const expected = await hmacHex(Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!, raw);
      if (!safeEqual(expected, sig)) return new Response('bad signature', { status: 401 });
      const evt = JSON.parse(raw);
      const sub = evt.payload?.subscription?.entity;
      if (!sub) return ok();
      // Razorpay sends every subscription in the account here (Mahina too). Only act on the KriosityOps plan.
      if (sub.plan_id !== Deno.env.get('RAZORPAY_PLAN_ID')) return ok();
      const userId = sub.notes?.user_id ?? (await lookup(sub.id));
      if (!userId) return ok();
      const end = sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null;
      const pay = evt.payload?.payment?.entity;
      switch (evt.event) {
        case 'subscription.activated':
        case 'subscription.charged':
        case 'subscription.resumed':
          await setPlan({ userId, provider: 'razorpay', subscriptionId: sub.id, status: 'active', pro: true, periodEnd: end, amountMinor: pay?.amount ?? 29900, currency: 'INR', raw: sub });
          break;
        case 'subscription.cancelled':
        case 'subscription.completed':
          // Paid time still counts; the daily job downgrades once it runs out.
          await setPlan({ userId, provider: 'razorpay', subscriptionId: sub.id, status: 'cancelled', pro: !!end && new Date(end) > new Date(), periodEnd: end, raw: sub });
          break;
        case 'subscription.halted':
        case 'subscription.paused':
          await setPlan({ userId, provider: 'razorpay', subscriptionId: sub.id, status: evt.event.split('.')[1], pro: false, raw: sub });
          break;
      }
      return ok();
    }

    if (provider === 'paypal') {
      const h = (n: string) => req.headers.get(n) ?? '';
      const verify = await paypal('/v1/notifications/verify-webhook-signature', {
        method: 'POST',
        body: JSON.stringify({
          auth_algo: h('paypal-auth-algo'),
          cert_url: h('paypal-cert-url'),
          transmission_id: h('paypal-transmission-id'),
          transmission_sig: h('paypal-transmission-sig'),
          transmission_time: h('paypal-transmission-time'),
          webhook_id: Deno.env.get('PAYPAL_WEBHOOK_ID'),
          webhook_event: JSON.parse(raw),
        }),
      });
      if (verify.data?.verification_status !== 'SUCCESS') return new Response('bad signature', { status: 401 });
      const evt = JSON.parse(raw);
      const r = evt.resource ?? {};
      // Subscription events carry the subscription; payment events point to it with billing_agreement_id
      const subId: string | undefined = evt.event_type.startsWith('BILLING.SUBSCRIPTION') ? r.id : r.billing_agreement_id;
      if (!subId) return ok();
      const full = await paypal(`/v1/billing/subscriptions/${subId}`);
      const s = full.data ?? {};
      // Ignore subscriptions for other products on the same PayPal account
      if (s.plan_id && s.plan_id !== Deno.env.get('PAYPAL_PLAN_ID')) return ok();
      const userId = s.custom_id ?? (await lookup(subId));
      if (!userId) return ok();
      const end = s.billing_info?.next_billing_time ?? null;
      switch (evt.event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
        case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        case 'PAYMENT.SALE.COMPLETED':
          await setPlan({ userId, provider: 'paypal', subscriptionId: subId, status: 'ACTIVE', pro: true, periodEnd: end, amountMinor: 900, currency: 'USD', raw: s });
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED': {
          const { data: prof } = await admin().from('profiles').select('plan_renews_at').eq('id', userId).maybeSingle();
          const paidUntil = prof?.plan_renews_at;
          await setPlan({ userId, provider: 'paypal', subscriptionId: subId, status: 'cancelled', pro: !!paidUntil && new Date(paidUntil) > new Date(), periodEnd: paidUntil, raw: s });
          break;
        }
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
        case 'BILLING.SUBSCRIPTION.EXPIRED':
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
          await setPlan({ userId, provider: 'paypal', subscriptionId: subId, status: evt.event_type.split('.').pop()!.toLowerCase(), pro: false, raw: s });
          break;
      }
      return ok();
    }

    return new Response('unknown provider', { status: 400 });
  } catch (e) {
    console.error(e);
    return new Response('error', { status: 500 });
  }
});

async function lookup(subId: string) {
  const { data } = await admin().from('subscriptions').select('user_id').eq('provider_subscription_id', subId).maybeSingle();
  return data?.user_id as string | undefined;
}
