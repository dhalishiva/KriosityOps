export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  country: string | null;
  plan: 'free' | 'pro';
  plan_provider: 'razorpay' | 'paypal' | null;
  plan_renews_at: string | null;
  is_admin: boolean;
  created_at: string;
};

export type AppStatus = 'idea' | 'building' | 'live' | 'paused' | 'retired';

export type App = {
  id: string;
  owner_id: string;
  name: string;
  url: string | null;
  description: string | null;
  status: AppStatus;
  color: string;
  in_use_by: string | null;
  in_use_since: string | null;
  created_at: string;
  updated_at: string;
};

export type Resource = {
  id: string;
  app_id: string;
  kind: string;
  provider: string;
  account: string | null;
  project: string | null;
  link: string | null;
  notes: string | null;
  created_at: string;
};

export type Channel = {
  id: string;
  app_id: string;
  platform: string;
  handle: string | null;
  cadence_days: number;
  created_at: string;
};

export type Post = {
  id: string;
  channel_id: string;
  app_id: string;
  posted_at: string;
  links: string[];
  note: string | null;
};

export type Metric = {
  app_id: string;
  day: string;
  users_total: number | null;
  users_new_24h: number | null;
  visitors_24h: number | null;
  pageviews_24h: number | null;
};

/** A channel with what the screens need to draw its lamp. */
export type ChannelState = Channel & { lastPostedAt: string | null; appName: string; appColor: string };

export type BoardRow = {
  app: App;
  stack: Pick<Resource, 'kind' | 'provider' | 'project'>[];
  channels: ChannelState[];
  usersNew: number | null;
  usersTotal: number | null;
};
