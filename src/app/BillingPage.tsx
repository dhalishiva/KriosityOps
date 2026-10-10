import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase, friendlyError } from '../lib/supabase';
import { ENV, FREE_APP_LIMIT, PRO_PRICE, guessCurrency, type Currency } from '../lib/config';
import { useTitle } from './useTitle';

type Sub = { id: string; provider: string; status: string; amount_minor: number | null; currency: string | null; current_period_end: string | null; created_at: string };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: unknown) => void) => void };
    paypal?: { Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void>; close?: () => void } };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection or ad blocker.'));
    document.head.appendChild(s);
  });
}

async function callBilling(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('billing', { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const detail = ctx ? await ctx.json().catch(() => null) : null;
    throw new Error(detail?.error || error.message);
  }
  return data;
}

export default function BillingPage() {
  useTitle('Billing');
  const { profile, session, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const [cur, setCur] = useState<Currency>(guessCurrency());
  const [subs, setSubs] = useState<Sub[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const paypalRef = useRef<HTMLDivElement>(null);
  const isPro = profile?.plan === 'pro';
  const upgrade = params.get('upgrade') === '1';

  async function loadSubs() {
    const { data } = await supabase.from('subscriptions').select('id,provider,status,amount_minor,currency,current_period_end,created_at').order('created_at', { ascending: false });
    setSubs((data as Sub[]) ?? []);
  }
  useEffect(() => {
    loadSubs();
  }, []);

  // PayPal renders its own buttons into a container
  useEffect(() => {
    if (isPro || cur !== 'USD' || !ENV.paypalClientId || !ENV.paypalPlanId || !paypalRef.current || !session) return;
    let cancelled = false;
    const el = paypalRef.current;
    el.innerHTML = '';
    loadScript(`https://www.paypal.com/sdk/js?client-id=${ENV.paypalClientId}&vault=true&intent=subscription&components=buttons`)
      .then(() => {
        if (cancelled || !window.paypal) return;
        return window.paypal
          .Buttons({
            style: { layout: 'vertical', shape: 'rect', label: 'subscribe', height: 44 },
            createSubscription: (_d: unknown, actions: { subscription: { create: (o: unknown) => Promise<string> } }) =>
              actions.subscription.create({ plan_id: ENV.paypalPlanId, custom_id: session.user.id }),
            onApprove: async (data: { subscriptionID: string }) => {
              setBusy(true);
              setError('');
              try {
                await callBilling({ action: 'paypal_activate', subscription_id: data.subscriptionID });
                await refreshProfile();
                await loadSubs();
                setMsg('You’re on Pro. Add as many apps as you like.');
              } catch (e) {
                setError(friendlyError(e));
              } finally {
                setBusy(false);
              }
            },
            onError: () => setError('PayPal could not complete the payment. Nothing was charged. Try again.'),
          })
          .render(el);
      })
      .catch((e) => setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro, cur, session]);

  async function payRazorpay() {
    setBusy(true);
    setError('');
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      const { subscription_id, key_id } = await callBilling({ action: 'razorpay_create' });
      const rzp = new window.Razorpay!({
        key: key_id,
        subscription_id,
        name: 'KriosityOps',
        description: 'Pro plan, monthly',
        prefill: { email: session?.user.email, name: profile?.full_name ?? undefined },
        theme: { color: '#2B4BF2' },
        handler: async (resp: Record<string, string>) => {
          try {
            await callBilling({ action: 'razorpay_verify', ...resp });
            await refreshProfile();
            await loadSubs();
            setMsg('You’re on Pro. Add as many apps as you like.');
          } catch (e) {
            setError(friendlyError(e));
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm('Cancel Pro? It stays on until the end of the month you’ve paid for.')) return;
    setBusy(true);
    setError('');
    try {
      await callBilling({ action: 'cancel' });
      await loadSubs();
      await refreshProfile();
      setMsg('Your subscription is cancelled. Pro stays on until the end of the paid month.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  const active = subs.find((s) => ['active', 'authenticated', 'ACTIVE'].includes(s.status));
  const razorpayReady = Boolean(ENV.razorpayKeyId);
  const paypalReady = Boolean(ENV.paypalClientId && ENV.paypalPlanId);

  return (
    <div className="page page-narrow">
      <div className="page-top">
        <div>
          <h1>Billing</h1>
          <p className="page-sub">
            You’re on <strong>{isPro ? 'Pro' : 'Free'}</strong>
            {isPro && profile?.plan_renews_at && `, renews ${new Date(profile.plan_renews_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`}
            {!isPro && `: up to ${FREE_APP_LIMIT} apps`}.
          </p>
        </div>
      </div>

      {msg && (
        <p className="callout callout-ok" role="status">
          {msg}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!isPro && (
        <section className={`panel upgrade ${upgrade ? 'upgrade-focus' : ''}`} aria-labelledby="up-h">
          <h2 id="up-h">Upgrade to Pro</h2>
          <p className="page-sub">Unlimited apps, daily user snapshots as they roll out, and priority help on WhatsApp.</p>
          <div className="price-switch" role="radiogroup" aria-label="Where you’re paying from">
            {(['INR', 'USD'] as Currency[]).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cur === c} className={cur === c ? 'is-on' : ''} onClick={() => setCur(c)}>
                {c === 'INR' ? 'India: ₹, Razorpay' : 'US, EU and elsewhere: $, PayPal'}
              </button>
            ))}
          </div>
          <p className="upgrade-price">
            {PRO_PRICE[cur].label} <span>a month</span>
          </p>
          {cur === 'INR' ? (
            razorpayReady ? (
              <button type="button" className="btn btn-primary" disabled={busy} onClick={payRazorpay}>
                {busy ? 'Opening Razorpay…' : 'Pay with UPI or card'}
              </button>
            ) : (
              <p className="hint">Razorpay payments are being switched on. Message us on WhatsApp to upgrade now.</p>
            )
          ) : paypalReady ? (
            <div ref={paypalRef} className="paypal-box" />
          ) : (
            <p className="hint">PayPal payments are being switched on. Message us on WhatsApp to upgrade now.</p>
          )}
          <p className="hint">Cancel any time from this page. See the <a href="/refund">refund policy</a>.</p>
        </section>
      )}

      {isPro && (
        <section className="panel" aria-labelledby="pro-h">
          <h2 id="pro-h">Your subscription</h2>
          <p className="page-sub">
            Paid through {profile?.plan_provider === 'paypal' ? 'PayPal' : 'Razorpay'}.
          </p>
          {active ? (
            <button type="button" className="btn btn-danger" disabled={busy} onClick={cancel}>
              Cancel subscription
            </button>
          ) : (
            <p className="hint">This subscription won’t renew.</p>
          )}
        </section>
      )}

      {subs.length > 0 && (
        <section className="panel" aria-labelledby="hist-h">
          <h2 id="hist-h">History</h2>
          <table className="tbl">
            <thead>
              <tr>
                <th>Started</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                  <td>{s.provider === 'paypal' ? 'PayPal' : 'Razorpay'}</td>
                  <td>{s.status.toLowerCase()}</td>
                  <td>{s.amount_minor ? `${s.currency === 'INR' ? '₹' : '$'}${(s.amount_minor / 100).toFixed(s.currency === 'INR' ? 0 : 2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
