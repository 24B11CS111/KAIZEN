-- 0008_auth_signup_hardening.sql
--
-- Purpose:
--   1. Remove any stale auth.users -> profiles trigger that can crash signup.
--   2. Ensure every existing auth user has a companion profile row.
--   3. Ensure authenticated users can self-insert their own profile if needed.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert
  with check (auth.uid() = id);

insert into public.profiles (id, email)
select
  u.id,
  coalesce(u.email, '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
