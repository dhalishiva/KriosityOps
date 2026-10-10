import { useEffect, useState } from 'react';
import { FREE_APP_LIMIT, PRO_PRICE, guessCurrency, type Currency } from '../lib/config';
import { newTab } from './Layout';

export function PricingTable({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const [cur, setCur] = useState<Currency>('USD');
  useEffect(() => setCur(guessCurrency()), []);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const pro = PRO_PRICE[cur];

  return (
    <div className="price">
      <div className="price-switch" role="radiogroup" aria-label="Currency">
        {(['INR', 'USD'] as Currency[]).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={cur === c} className={cur === c ? 'is-on' : ''} onClick={() => setCur(c)}>
            {c === 'INR' ? 'India (₹)' : 'Rest of world ($)'}
          </button>
        ))}
      </div>

      <div className="price-grid">
        <section className="price-plan" aria-labelledby="plan-free">
          <H id="plan-free">Free</H>
          <p className="price-amount">
            {cur === 'INR' ? '₹0' : '$0'}
            <span> forever</span>
          </p>
          <p className="price-for">For your first products.</p>
          <ul>
            <li>Up to {FREE_APP_LIMIT} apps</li>
            <li>Full registry: databases, hosts, repos, domains, payments</li>
            <li>Social post log with due and overdue lamps</li>
            <li>“Who’s working on it” marker</li>
          </ul>
          <a className="btn btn-ghost" href="/signup" {...newTab}>
            Start free
          </a>
        </section>

        <section className="price-plan price-pro" aria-labelledby="plan-pro">
          <H id="plan-pro">Pro</H>
          <p className="price-amount">
            {pro.label}
            <span> a month</span>
          </p>
          <p className="price-for">For a growing fleet.</p>
          <ul>
            <li>Unlimited apps</li>
            <li>Everything in Free</li>
            <li>Daily new and total users, and visitors, collected at 6 AM IST (rolling out)</li>
            <li>Priority help on WhatsApp</li>
          </ul>
          <a className="btn btn-primary" href="/signup?plan=pro" {...newTab}>
            Start with Pro
          </a>
          <p className="price-pay">{cur === 'INR' ? 'Paid through Razorpay with UPI or card.' : 'Paid through PayPal with card or PayPal balance.'} Cancel any time.</p>
        </section>
      </div>
    </div>
  );
}
