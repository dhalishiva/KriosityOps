export const SITE = {
  name: 'KriosityOps',
  url: 'https://ops.kriosity.in',
  privacy: 'https://ops.kriosity.in/privacy',
  terms: 'https://ops.kriosity.in/terms',
  pricing: 'https://ops.kriosity.in/pricing',
  signup: 'https://ops.kriosity.in/signup',
  resetRedirect: 'https://ops.kriosity.in/login',
  whatsapp: '919716414417',
  supportEmail: 'support@kriosity.in',
};

export const FREE_APP_LIMIT = 2;

export const ENV = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xfskyegiwupjkuepiavx.supabase.co',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

export const waLink = (text = 'Hi, I need help with KriosityOps') =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
