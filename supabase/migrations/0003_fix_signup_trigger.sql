-- =============================================================
-- KAIZEN.SYS migration 0003 - bulletproof signup trigger
--
-- Fixes: "Database error saving new user" during sign-up.
-- Root cause was the original trigger doing implicit text->enum
-- casting which can fail under certain Postgres settings, AND
-- not having an EXCEPTION handler so any failure aborts the
-- whole auth.signUp() call.
--
-- This rewrite:
--   1. Explicitly casts to enum types.
--   2. Wraps everything in BEGIN/EXCEPTION so the trigger
--      NEVER aborts the auth insert (worst case: profile gets
--      created later by the application).
--   3. Adds an INSERT policy on profiles so the application
--      can create / upsert the profile row directly as a
--      fallback if the trigger silently failed.
--
-- Run this in Supabase SQL Editor AFTER 0001 and 0002.
-- =============================================================

-- 1. Bulletproof trigger function ------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin_email text;
  v_role user_role_t;
begin
  -- read the admin email setting safely (NULL if unset)
  begin
    v_admin_email := current_setting('app.admin_email', true);
  exception when others then
    v_admin_email := null;
  end;

  v_role := case
    when v_admin_email is not null and new.email = v_admin_email
      then 'admin'::user_role_t
    else 'user'::user_role_t
  end;

  begin
    insert into public.profiles (id, email, role, subscription_status)
    values (
      new.id,
      new.email,
      v_role,
      'pending'::subscription_status_t
    )
    on conflict (id) do nothing;
  exception when others then
    -- Never abort the auth.users insert. If the profile insert
    -- fails for ANY reason, log it and let the app retry.
    raise log 'handle_new_user failed for %: %', new.email, sqlerrm;
  end;

  return new;
end;
$$;

-- Re-attach the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. INSERT policy on profiles (application-side fallback) -----
-- Lets a freshly-authenticated user create their own profile row
-- if the trigger somehow didn't.
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert
  with check (auth.uid() = id);

-- 3. Backfill any auth.users that have no profile row -----------
-- (Useful if previous failed signups left orphan auth users.)
insert into public.profiles (id, email, role, subscription_status)
select
  u.id,
  u.email,
  'user'::user_role_t,
  'pending'::subscription_status_t
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
  and u.email is not null;
