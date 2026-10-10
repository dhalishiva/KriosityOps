-- KriosityOps core schema
-- Every row belongs to one owner (auth.users.id). RLS on every table.

create extension if not exists pgcrypto;

-- ───────────── profiles ─────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  country text,                       -- ISO-2, used to pick Razorpay (IN) or PayPal
  plan text not null default 'free' check (plan in ('free','pro')),
  plan_provider text check (plan_provider in ('razorpay','paypal')),
  plan_renews_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- New auth user → profile row
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check used by policies (security definer avoids RLS recursion)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Users may edit only safe columns of their own profile
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- service role (webhooks) has no auth.uid(); signed-in non-admins cannot touch billing/admin fields
  if auth.uid() is not null and not public.is_admin() then
    new.plan := old.plan;
    new.plan_provider := old.plan_provider;
    new.plan_renews_at := old.plan_renews_at;
    new.is_admin := old.is_admin;
    new.email := old.email;
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ───────────── apps ─────────────
create table public.apps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 80),
  url text,
  description text,
  status text not null default 'live' check (status in ('idea','building','live','paused','retired')),
  color text not null default '#E8572A',
  in_use_by text,                     -- e.g. "Claude", "ChatGPT", "Me" — who is touching it now
  in_use_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index apps_owner_idx on public.apps(owner_id);

-- Free plan: up to 2 apps
create or replace function public.enforce_app_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_plan text; v_count int;
begin
  select plan into v_plan from public.profiles where id = new.owner_id;
  if coalesce(v_plan,'free') = 'free' then
    select count(*) into v_count from public.apps where owner_id = new.owner_id;
    if v_count >= 2 then
      raise exception 'FREE_LIMIT: The free plan includes 2 apps. Upgrade to Pro for unlimited apps.'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

create trigger apps_limit before insert on public.apps
  for each row execute function public.enforce_app_limit();

-- ───────────── resources (the registry) ─────────────
-- Identifiers only. Never passwords or service keys.
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('database','hosting','repo','domain','payments','email','storage','analytics','other')),
  provider text not null,
  account text,                       -- login email / account name
  project text,                       -- project name, ref, repo, domain
  link text,                          -- console URL
  notes text,
  created_at timestamptz not null default now()
);
create index resources_app_idx on public.resources(app_id);

-- ───────────── social log ─────────────
create table public.social_channels (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  platform text not null,             -- x, reddit, linkedin, pinterest, instagram, youtube, producthunt, other
  handle text,                        -- @handle, r/subreddit, page name
  cadence_days int not null default 3 check (cadence_days between 1 and 90),
  created_at timestamptz not null default now(),
  unique (app_id, platform, handle)
);
create index social_channels_app_idx on public.social_channels(app_id);

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.social_channels(id) on delete cascade,
  app_id uuid not null references public.apps(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  posted_at timestamptz not null default now(),
  links text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);
create index social_posts_channel_idx on public.social_posts(channel_id, posted_at desc);

-- ───────────── daily metrics (filled by the 6 AM IST job, phase 3) ─────────────
create table public.metrics_daily (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  users_total int,
  users_new_24h int,
  visitors_24h int,
  pageviews_24h int,
  source text,
  created_at timestamptz not null default now(),
  unique (app_id, day)
);

-- ───────────── billing ─────────────
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('razorpay','paypal')),
  provider_subscription_id text not null unique,
  status text not null,
  amount_minor int,
  currency text,
  current_period_end timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions(user_id);

-- ───────────── contact form ─────────────
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- ───────────── RLS ─────────────
alter table public.profiles enable row level security;
alter table public.apps enable row level security;
alter table public.resources enable row level security;
alter table public.social_channels enable row level security;
alter table public.social_posts enable row level security;
alter table public.metrics_daily enable row level security;
alter table public.subscriptions enable row level security;
alter table public.contact_messages enable row level security;

create policy "own profile read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "own profile update" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy "own apps" on public.apps for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "admin read apps" on public.apps for select to authenticated
  using (public.is_admin());

-- Child rows: owner must match and the parent app must belong to the same owner
create policy "own resources" on public.resources for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid())
    and exists (select 1 from public.apps a where a.id = app_id and a.owner_id = (select auth.uid())));

create policy "own channels" on public.social_channels for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid())
    and exists (select 1 from public.apps a where a.id = app_id and a.owner_id = (select auth.uid())));

create policy "own posts" on public.social_posts for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid())
    and exists (select 1 from public.social_channels c
                where c.id = channel_id and c.app_id = social_posts.app_id and c.owner_id = (select auth.uid())));

create policy "own metrics read" on public.metrics_daily for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "own subscriptions read" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- contact form inserts go through the edge function (service role); admins can read
create policy "admin read contact" on public.contact_messages for select to authenticated
  using (public.is_admin());

-- updated_at on apps
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger apps_touch before update on public.apps
  for each row execute function public.touch_updated_at();

-- ───────────── admin stats (one call for the admin dashboard) ─────────────
create or replace function public.admin_stats()
returns json language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return json_build_object(
    'users_total', (select count(*) from public.profiles),
    'users_24h',   (select count(*) from public.profiles where created_at > now() - interval '24 hours'),
    'users_7d',    (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'pro_users',   (select count(*) from public.profiles where plan = 'pro'),
    'apps_total',  (select count(*) from public.apps),
    'posts_7d',    (select count(*) from public.social_posts where posted_at > now() - interval '7 days'),
    'messages',    (select count(*) from public.contact_messages)
  );
end $$;

revoke execute on function public.admin_stats() from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.enforce_app_limit() from anon, authenticated;
