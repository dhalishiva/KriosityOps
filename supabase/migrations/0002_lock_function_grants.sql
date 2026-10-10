-- Trigger functions are never callable over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_app_limit() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
-- is_admin is used inside RLS policies; admin_stats checks is_admin itself.
revoke execute on function public.admin_stats() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.is_admin() to authenticated;
