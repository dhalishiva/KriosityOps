import { useState, type FormEvent, type ReactNode } from 'react';
import { MarketingLayout } from './Layout';
import { PricingTable } from './PricingTable';
import { Faq } from './Faq';
import { SITE, waLink, ENV } from '../lib/config';

function PageHead({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className="page-head">
      <div className="mk-wrap">
        <h1>{title}</h1>
        {lede && <p className="hero-lede">{lede}</p>}
      </div>
    </header>
  );
}

export function PricingPage() {
  return (
    <MarketingLayout>
      <PageHead title="Pricing" lede="Free for your first two apps. Pro is one flat monthly price for as many apps as you run." />
      <section className="pricing pricing-page">
        <div className="mk-wrap">
          <PricingTable />
        </div>
      </section>
      <section className="faqs">
        <div className="mk-wrap faq-wrap">
          <h2>Questions</h2>
          <Faq />
        </div>
      </section>
    </MarketingLayout>
  );
}

export function ContactPage() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get('company')) return; // honeypot
    setState('sending');
    try {
      const res = await fetch(`${ENV.supabaseUrl}/functions/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ENV.supabaseKey },
        body: JSON.stringify({ name: fd.get('name'), email: fd.get('email'), message: fd.get('message') }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'The message did not send.');
      setState('sent');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'The message did not send.');
      setState('error');
    }
  }

  return (
    <MarketingLayout>
      <PageHead title="Contact" lede="Questions about KriosityOps, billing or a feature you need. A person replies, usually the same day." />
      <section className="contact">
        <div className="mk-wrap contact-grid">
          {state === 'sent' ? (
            <div className="contact-done" role="status">
              <h2>Message sent.</h2>
              <p>We’ll reply to the email you gave. For anything urgent, use WhatsApp.</p>
            </div>
          ) : (
            <form className="form" onSubmit={submit}>
              <label>
                Your name
                <input name="name" required maxLength={80} autoComplete="name" />
              </label>
              <label>
                Email
                <input name="email" type="email" required maxLength={120} autoComplete="email" />
              </label>
              <label>
                Message
                <textarea name="message" required rows={6} maxLength={4000} />
              </label>
              <label className="visually-hidden" aria-hidden="true">
                Company
                <input name="company" tabIndex={-1} autoComplete="off" />
              </label>
              {state === 'error' && (
                <p className="form-error" role="alert">
                  {err} Try again, or email {SITE.supportEmail}.
                </p>
              )}
              <button className="btn btn-primary" disabled={state === 'sending'}>
                {state === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
          <aside className="contact-side">
            <h2>Other ways to reach us</h2>
            <p>
              WhatsApp: <a href={waLink()} target="_blank" rel="noopener noreferrer">+91 97164 14417</a>
            </p>
            <p>
              Support: <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
            </p>
            <p>
              General: <a href={`mailto:${SITE.helloEmail}`}>{SITE.helloEmail}</a>
            </p>
            <p className="board-muted">{SITE.company}, Noida, Uttar Pradesh, India</p>
          </aside>
        </div>
      </section>
    </MarketingLayout>
  );
}

function Legal({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <MarketingLayout>
      <PageHead title={title} lede={`Last updated ${updated}.`} />
      <article className="legal">
        <div className="mk-wrap legal-body">{children}</div>
      </article>
    </MarketingLayout>
  );
}

export function PrivacyPage() {
  return (
    <Legal title="Privacy policy" updated="10 October 2026">
      <p>
        KriosityOps (“we”) is operated by {SITE.company}, Noida, India. This policy explains what we collect when you use ops.kriosity.in and what we do
        with it.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Your email address and name, to create your account and sign you in with a one-time code.</li>
        <li>What you enter: app names, links, registry entries (provider, account name, project name or ref, console link, notes) and social post links.</li>
        <li>Billing records from Razorpay or PayPal: subscription ID, status, amount and renewal date. We never see or store card or UPI details.</li>
        <li>Basic usage analytics from Vercel Analytics, which does not use cookies.</li>
      </ul>
      <h2>What we never ask for</h2>
      <p>
        The registry is designed for identifiers only. Do not enter passwords, API keys, service-role keys or tokens. If you do, delete them; we will not use
        them.
      </p>
      <h2>How we use it</h2>
      <p>To run the service, send sign-in codes and service emails, process payments, answer support requests and keep the service secure. We do not sell your data or use it for advertising.</p>
      <h2>Where it is stored</h2>
      <p>Data is stored with Supabase (database and authentication) and the site is served by Vercel. Each account can read only its own data, enforced in the database.</p>
      <h2>Your choices</h2>
      <p>
        You can edit or delete any app and its entries at any time. To delete your account and all data, email {SITE.supportEmail} from your account email
        and we will do it within 7 days.
      </p>
      <h2>Contact</h2>
      <p>Questions about privacy: {SITE.supportEmail}.</p>
    </Legal>
  );
}

export function TermsPage() {
  return (
    <Legal title="Terms of service" updated="10 October 2026">
      <p>These terms are an agreement between you and {SITE.company} (“we”), which operates KriosityOps. By creating an account you accept them.</p>
      <h2>The service</h2>
      <p>KriosityOps lets you record where your apps run, log your social posts and, on Pro, view daily usage snapshots. We may improve or change features over time.</p>
      <h2>Your account</h2>
      <p>You are responsible for activity under your account and for the accuracy of what you enter. Do not store secrets such as passwords or API keys in the registry.</p>
      <h2>Plans and payment</h2>
      <p>
        The Free plan covers up to 2 apps. Pro is billed monthly in advance: in Indian rupees through Razorpay for customers in India, and in US dollars through
        PayPal elsewhere. Prices may change with 30 days’ notice by email.
      </p>
      <h2>Acceptable use</h2>
      <p>Do not use the service to break the law, to attack other systems, or to store content you have no right to store.</p>
      <h2>Availability and liability</h2>
      <p>
        We work to keep the service available but do not guarantee it will be uninterrupted. To the extent the law allows, our total liability is limited to the
        amount you paid us in the 3 months before a claim.
      </p>
      <h2>Ending</h2>
      <p>You can stop using the service and delete your account at any time. We may suspend accounts that break these terms.</p>
      <h2>Law</h2>
      <p>These terms are governed by the laws of India. Courts in Gautam Buddh Nagar, Uttar Pradesh have jurisdiction.</p>
      <p>Contact: {SITE.supportEmail}</p>
    </Legal>
  );
}

export function RefundPage() {
  return (
    <Legal title="Refunds and cancellation" updated="10 October 2026">
      <h2>Cancelling</h2>
      <p>
        Cancel Pro from Billing in the app at any time. Your subscription stops renewing, and Pro stays active until the end of the month you have paid for.
        After that your account moves to Free; if you have more than 2 apps, they stay visible but you cannot add new ones.
      </p>
      <h2>Refunds</h2>
      <p>
        If you are charged by mistake, or you cancel within 7 days of your first Pro payment, email {SITE.supportEmail} from your account email and we will
        refund the payment in full. Other partial months are not refunded.
      </p>
      <p>Approved refunds go back to the original payment method through Razorpay or PayPal, usually within 5 to 7 working days.</p>
      <h2>Contact</h2>
      <p>
        {SITE.company}, Noida, Uttar Pradesh, India. Email {SITE.supportEmail} or WhatsApp +91 97164 14417.
      </p>
    </Legal>
  );
}

export function NotFoundPage() {
  return (
    <MarketingLayout>
      <PageHead title="This page isn’t here." lede="The link may be old. Go back to the home page or open your board." />
      <div className="mk-wrap" style={{ display: 'flex', gap: 12, paddingBottom: 96 }}>
        <a className="btn btn-primary" href="/">Home</a>
        <a className="btn btn-ghost" href="/app">Open your board</a>
      </div>
    </MarketingLayout>
  );
}
