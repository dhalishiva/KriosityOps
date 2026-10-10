// Signed-in billing actions: start a Razorpay subscription, confirm it, confirm a PayPal subscription, cancel.
import { admin, cors, hmacHex, json, paypal, razorpay, safeEqual, setPlan, userFrom } from '../_shared/util.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'Use POST.' }, 405);

  const user = await userFrom(req);
  if (!user) return json(req, { error: 'Log in again to continue.' }, 401);

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: 'Bad request.' }, 400);
  }

  try {
    switch (body.action) {
      case 'razorpay_create': {
        const planId = Deno.env.get('RAZORPAY_PLAN_ID');
        if (!planId) return json(req, { error: 'Razorpay is not set up yet.' }, 503);
        const r = await razorpay('/subscriptions', {
          method: 'POST',
          body: JSON.stringify({ plan_id: planId, total_count: 120, customer_notify: 1, notes: { user_id: user.id, email: user.email } }),
        });
        if (!r.ok) return json(req, { error: r.data?.error?.description ?? 'Razorpay refused the request.' }, 502);
        await admin().from('subscriptions').upsert(
          { user_id: user.id, provider: 'razorpay', provider_subscription_id: r.data.id, status: r.data.status, currency: 'INR', raw: r.data },
          { onConflict: 'provider_subscription_id' },
        );
        return json(req, { subscription_id: r.data.id, key_id: Deno.env.get('RAZORPAY_KEY_ID') });
      }

      case 'razorpay_verify': {
        const { razorpay_payment_id: pay, razorpay_subscription_id: sub, razorpay_signature: sig } = body;
        if (!pay || !sub || !sig) return json(req, { error: 'Missing payment details.' }, 400);
        const expected = await hmacHex(Deno.env.get('RAZORPAY_KEY_SECRET')!, `${pay}|${sub}`);
        if (!safeEqual(expected, sig)) return json(req, { error: 'Payment signature did not match. Nothing was changed.' }, 400);
        const { data: row } = await admin().from('subscriptions').select('user_id').eq('provider_subscription_id', sub).maybeSingle();
        if (!row || row.user_id !== user.id) return json(req, { error: 'This subscription belongs to another account.' }, 403);
        const r = await razorpay(`/subscriptions/${sub}`);
        const end = r.data?.current_end ? new Date(r.data.current_end * 1000).toISOString() : new Date(Date.now() + 31 * 864e5).toISOString();
        await setPlan({ userId: user.id, provider: 'razorpay', subscriptionId: sub, status: r.data?.status ?? 'active', pro: true, periodEnd: end, amountMinor: 29900, currency: 'INR', raw: r.data });
        return json(req, { ok: true });
      }

      case 'paypal_activate': {
        const id = body.subscription_id;
        if (!id) return json(req, { error: 'Missing subscription.' }, 400);
        const r = await paypal(`/v1/billing/subscriptions/${encodeURIComponent(id)}`);
        if (!r.ok) return json(req, { error: 'PayPal could not find that subscription.' }, 502);
        const s = r.data;
        if (s.custom_id !== user.id) return json(req, { error: 'This subscription belongs to another account.' }, 403);
        if (s.plan_id !== Deno.env.get('PAYPAL_PLAN_ID')) return json(req, { error: 'That is not the KriosityOps Pro plan.' }, 400);
        if (!['ACTIVE', 'APPROVED'].includes(s.status)) return json(req, { error: `PayPal says the subscription is ${s.status.toLowerCase()}.` }, 400);
        const end = s.billing_info?.next_billing_time ?? new Date(Date.now() + 31 * 864e5).toISOString();
        const amount = Number(s.billing_info?.last_payment?.amount?.value ?? 9);
        await setPlan({ userId: user.id, provider: 'paypal', subscriptionId: id, status: s.status, pro: true, periodEnd: end, amountMinor: Math.round(amount * 100), currency: 'USD', raw: s });
        return json(req, { ok: true });
      }

      case 'cancel': {
        const { data: subs } = await admin()
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'authenticated', 'ACTIVE', 'APPROVED'])
          .order('created_at', { ascending: false });
        const s = subs?.[0];
        if (!s) return json(req, { error: 'No active subscription to cancel.' }, 404);
        if (s.provider === 'razorpay') {
          const r = await razorpay(`/subscriptions/${s.provider_subscription_id}/cancel`, { method: 'POST', body: JSON.stringify({ cancel_at_cycle_end: 1 }) });
          if (!r.ok) return json(req, { error: r.data?.error?.description ?? 'Razorpay could not cancel it.' }, 502);
        } else {
          const r = await paypal(`/v1/billing/subscriptions/${s.provider_subscription_id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: 'Cancelled by customer in KriosityOps' }) });
          if (!r.ok && r.status !== 422) return json(req, { error: 'PayPal could not cancel it.' }, 502);
        }
        // Pro stays until the paid period ends; a daily job moves expired accounts to Free.
        await admin().from('subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', s.id);
        return json(req, { ok: true });
      }

      default:
        return json(req, { error: 'Unknown action.' }, 400);
    }
  } catch (e) {
    console.error(e);
    return json(req, { error: 'Billing is unavailable right now. Try again in a minute.' }, 500);
  }
});
