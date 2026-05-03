-- =============================================================
-- KAIZEN.SYS migration 0004 - NUCLEAR FIX for "Database error saving new user"
--
-- Drops the on_auth_user_created trigger entirely. The application
-- (browser-side, after supabase.auth.signUp) will create the profile
-- row explicitly using the INSERT policy. No trigger means no
-- chance of the trigger raising during sign-up.
--
-- Run this in Supabase SQL Editor.
-- =============================================================

-- 1. Drop the trigger and its function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- 2. Make sure the INSERT policy exists so the client can create
--    its own profile after signup.
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- 3. Backfill any auth.users that have no profile row.
--    Idempotent: safe to run repeatedly.
insert into public.profiles (id, email, role, subscription_status)
select
  u.id,
  coalesce(u.email, ''),
  'user'::user_role_t,
  'pending'::subscription_status_t
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
  and u.email is not null;

-- 4. Sanity: confirm we have the columns + types we expect
do $$
declare cnt int;
begin
  select count(*) into cnt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name in ('id','email','role','subscription_status','full_name','whatsapp','path_type','branch');
  if cnt < 8 then
    raise notice 'profiles table is missing some columns. Re-run 0001 and 0002.';
  else
    raise notice 'profiles table OK with all required columns.';
  end if;
end $$;
