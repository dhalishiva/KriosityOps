import { FREE_APP_LIMIT } from '../lib/config';

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do you store my passwords or API keys?',
    a: 'No. The registry holds identifiers only: the account name or email, the project name or ref, and a link to its console. Never a password, service key or token.',
  },
  {
    q: 'What counts as an app?',
    a: `Anything you run and want to keep track of: a SaaS, a landing page, an Android app, a bot. The free plan holds ${FREE_APP_LIMIT}; Pro has no limit.`,
  },
  {
    q: 'My provider isn’t in the list.',
    a: 'Pick “Other” and type its name. The provider lists are shortcuts, not limits.',
  },
  {
    q: 'Does KriosityOps post to X or Reddit for me?',
    a: 'No. You post as you normally do, then log it here with the link. The log tells you which channel is due and which has gone quiet.',
  },
  {
    q: 'How will the daily user counts work?',
    a: 'You add one small read-only function to each Supabase project. Every morning at 6 AM IST, KriosityOps calls it for new and total users and saves a snapshot. This is rolling out to Pro next.',
  },
  {
    q: 'How do I pay, and can I cancel?',
    a: 'In India you pay in rupees through Razorpay (UPI or card). Everywhere else you pay in dollars through PayPal. Cancel from Billing at any time; Pro stays on until the end of the paid month.',
  },
];

export function Faq() {
  return (
    <div className="faq">
      {FAQS.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
