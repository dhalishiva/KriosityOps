export const SITE = {
  name: 'KriosityOps',
  url: 'https://ops.kriosity.in',
  tagline: 'Every app you’ve shipped, on one board.',
  description:
    'KriosityOps keeps a registry of every app you run — which database account, project ref, host and repo it lives on — plus a social post log and daily user counts. Free for 2 apps.',
  supportEmail: 'support@kriosity.in',
  helloEmail: 'hello@kriosity.in',
  whatsapp: '919716414417',
  company: 'Shiva Dhali Services',
  parent: 'Kriosity',
  parentUrl: 'https://kriosity.in',
};

export const FREE_APP_LIMIT = 2;

export type Currency = 'INR' | 'USD';

export const PRO_PRICE: Record<Currency, { amount: number; label: string; provider: 'razorpay' | 'paypal' }> = {
  INR: { amount: 299, label: '₹299', provider: 'razorpay' },
  USD: { amount: 9, label: '$9', provider: 'paypal' },
};

/** India → Razorpay in INR. Everyone else → PayPal in USD. */
export function guessCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'INR';
    const lang = (typeof navigator !== 'undefined' && navigator.language) || '';
    if (/-IN$/i.test(lang)) return 'INR';
  } catch {
    /* ignore */
  }
  return 'USD';
}

export const ENV = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  turnstileSiteKey: (import.meta.env.VITE_TURNSTILE_SITE_KEY as string) || '',
  razorpayKeyId: (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '',
  paypalClientId: (import.meta.env.VITE_PAYPAL_CLIENT_ID as string) || '',
  paypalPlanId: (import.meta.env.VITE_PAYPAL_PLAN_ID as string) || '',
};

export const waLink = (text = 'Hi, I have a question about KriosityOps') =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
