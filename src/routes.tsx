import type { ReactElement } from 'react';
import Home from './marketing/Home';
import { ContactPage, PricingPage, PrivacyPage, RefundPage, TermsPage } from './marketing/Pages';
import { SITE } from './lib/config';

export type PageMeta = { title: string; description: string };

/** Marketing pages: rendered to static HTML at build time for search engines. */
export const MARKETING: { path: string; element: ReactElement; meta: PageMeta; priority: number }[] = [
  {
    path: '/',
    element: <Home />,
    priority: 1,
    meta: {
      title: 'KriosityOps: one board for every app you run',
      description: SITE.description,
    },
  },
  {
    path: '/pricing',
    element: <PricingPage />,
    priority: 0.8,
    meta: {
      title: 'Pricing | KriosityOps',
      description: 'Free for 2 apps. Pro is ₹299 a month in India or $9 a month elsewhere, for unlimited apps. Pay with Razorpay or PayPal, cancel any time.',
    },
  },
  {
    path: '/contact',
    element: <ContactPage />,
    priority: 0.5,
    meta: { title: 'Contact | KriosityOps', description: 'Reach the KriosityOps team on WhatsApp, by email, or with the contact form.' },
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
    priority: 0.3,
    meta: { title: 'Privacy policy | KriosityOps', description: 'What KriosityOps collects, why, and how to delete your data.' },
  },
  {
    path: '/terms',
    element: <TermsPage />,
    priority: 0.3,
    meta: { title: 'Terms of service | KriosityOps', description: 'The terms for using KriosityOps.' },
  },
  {
    path: '/refund',
    element: <RefundPage />,
    priority: 0.3,
    meta: { title: 'Refunds and cancellation | KriosityOps', description: 'How to cancel KriosityOps Pro and when we refund.' },
  },
];
