-- Owner accounts become admins on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    lower(new.email) in ('shiva.dhali@kriosity.in', 'shivadhali89@gmail.com')
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Daily: move Pro accounts whose paid time ran out (a day of grace) back to Free
create extension if not exists pg_cron with schema extensions;

create or replace function public.expire_pro_plans()
returns void language sql security definer set search_path = '' as $$
  update public.profiles
     set plan = 'free', plan_provider = null, plan_renews_at = null
   where plan = 'pro'
     and plan_provider is not null
     and plan_renews_at is not null
     and plan_renews_at < now() - interval '1 day';
$$;
revoke execute on function public.expire_pro_plans() from public, anon, authenticated;

select cron.schedule('expire-pro-plans', '30 0 * * *', $$select public.expire_pro_plans()$$);
