-- =============================================================
-- KAIZEN.SYS — initial schema
-- Tables: profiles, utr_logs, progress_logs, streaks
-- Includes: enums, indexes, UNIQUE constraints, RLS, helpers, RPC
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type subscription_status_t as enum ('pending','active','expired','rejected','banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type utr_status_t as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role_t as enum ('user','admin');
exception when duplicate_object then null; end $$;

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role_t not null default 'user',
  subscription_status subscription_status_t not null default 'pending',
  plan_amount integer,                       -- 49 or 99 (paise-free, just rupees)
  start_date timestamptz,
  expiry_date timestamptz,
  whatsapp text unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_whatsapp_idx on public.profiles (whatsapp);
create index if not exists profiles_status_idx on public.profiles (subscription_status);
create index if not exists profiles_expiry_idx on public.profiles (expiry_date);

-- ---------- UTR LOGS ----------
create table if not exists public.utr_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  utr_number text not null unique,
  plan_amount integer not null,
  status utr_status_t not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  ip_address inet,
  created_at timestamptz not null default now(),
  constraint utr_number_12_digits check (utr_number ~ '^[0-9]{12}$')
);

create index if not exists utr_logs_user_idx on public.utr_logs (user_id);
create index if not exists utr_logs_status_idx on public.utr_logs (status);
create index if not exists utr_logs_created_idx on public.utr_logs (created_at desc);

-- ---------- PROGRESS LOGS ----------
create table if not exists public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_number int not null check (day_number between 1 and 30),
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, day_number)
);

create index if not exists progress_logs_user_idx on public.progress_logs (user_id);

-- ---------- STREAKS ----------
create table if not exists public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_completed_date date,
  updated_at timestamptz not null default now()
);

-- ---------- HELPER: keep updated_at fresh ----------
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists streaks_touch on public.streaks;
create trigger streaks_touch before update on public.streaks
  for each row execute function public.touch_updated_at();

-- ---------- HELPER: is_admin() ----------
create or replace function public.is_admin() returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- ---------- HELPER: is_subscription_active() ----------
create or replace function public.is_subscription_active(uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = uid
      and subscription_status = 'active'
      and expiry_date is not null
      and expiry_date > now()
  );
$$ language sql stable security definer set search_path = public;

-- ---------- AUTO-PROFILE on auth.users insert ----------
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, role, subscription_status)
  values (
    new.id,
    new.email,
    case when new.email = current_setting('app.admin_email', true) then 'admin' else 'user' end,
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RPC: approve_utr (admin) ----------
create or replace function public.approve_utr(p_utr_id uuid)
returns void as $$
declare v_user uuid; v_amount int;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select user_id, plan_amount into v_user, v_amount
  from public.utr_logs where id = p_utr_id and status = 'pending'
  for update;

  if v_user is null then
    raise exception 'utr not found or already reviewed';
  end if;

  update public.utr_logs
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_utr_id;

  -- ALWAYS new 30-day cycle (never extend)
  update public.profiles set
    subscription_status = 'active',
    plan_amount = v_amount,
    start_date = now(),
    expiry_date = now() + interval '30 days'
  where id = v_user;

  -- reset progress + streak on new cycle
  delete from public.progress_logs where user_id = v_user;
  insert into public.streaks (user_id, current_streak, longest_streak, last_completed_date)
    values (v_user, 0, 0, null)
    on conflict (user_id) do update
      set current_streak = 0, last_completed_date = null;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- RPC: reject_utr (admin) ----------
create or replace function public.reject_utr(p_utr_id uuid)
returns void as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select user_id into v_user from public.utr_logs where id = p_utr_id;
  if v_user is null then raise exception 'utr not found'; end if;

  update public.utr_logs
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_utr_id;
  update public.profiles set subscription_status = 'rejected' where id = v_user;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- RPC: ban_user (admin) ----------
create or replace function public.ban_user(p_user_id uuid)
returns void as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.profiles set subscription_status = 'banned', expiry_date = now()
    where id = p_user_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- RPC: reset_progress (admin "god mode") ----------
create or replace function public.reset_progress(p_user_id uuid)
returns void as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.progress_logs where user_id = p_user_id;
  update public.streaks set current_streak = 0, last_completed_date = null
    where user_id = p_user_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- RPC: complete_day (user) ----------
-- atomic: marks day complete + updates streak with proper logic
create or replace function public.complete_day(p_day int)
returns table (current_streak int, longest_streak int) as $$
declare
  v_uid uuid := auth.uid();
  v_last date;
  v_today date := (now() at time zone 'utc')::date;
  v_cur int;
  v_long int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_day < 1 or p_day > 30 then raise exception 'invalid day'; end if;
  if not public.is_subscription_active(v_uid) then
    raise exception 'subscription not active';
  end if;

  insert into public.progress_logs (user_id, day_number, completed, completed_at)
    values (v_uid, p_day, true, now())
    on conflict (user_id, day_number)
      do update set completed = true, completed_at = now();

  insert into public.streaks (user_id, current_streak, longest_streak, last_completed_date)
    values (v_uid, 1, 1, v_today)
    on conflict (user_id) do nothing;

  select s.current_streak, s.longest_streak, s.last_completed_date
    into v_cur, v_long, v_last
    from public.streaks s where s.user_id = v_uid for update;

  if v_last is null or v_last < v_today - 1 then
    v_cur := 1;                          -- reset (skipped a day)
  elsif v_last = v_today - 1 then
    v_cur := v_cur + 1;                  -- consecutive
  end if;
  -- if v_last = v_today: same day, keep streak

  if v_cur > v_long then v_long := v_cur; end if;

  update public.streaks
    set current_streak = v_cur,
        longest_streak = v_long,
        last_completed_date = v_today
    where user_id = v_uid;

  return query select v_cur, v_long;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- AUTO-EXPIRE expired subscriptions (called on read) ----------
create or replace function public.touch_expiry(uid uuid) returns void as $$
begin
  update public.profiles
    set subscription_status = 'expired'
    where id = uid
      and subscription_status = 'active'
      and expiry_date is not null
      and expiry_date <= now();
end;
$$ language plpgsql security definer set search_path = public;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles      enable row level security;
alter table public.utr_logs      enable row level security;
alter table public.progress_logs enable row level security;
alter table public.streaks       enable row level security;

-- profiles: user can read/update own row; admin can read/update all
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- profiles: insert only by trigger / service role (no direct insert)
-- (no INSERT policy = denied for anon/auth)

-- utr_logs: user reads/inserts own; admin reads/updates all
drop policy if exists utr_select_self_or_admin on public.utr_logs;
create policy utr_select_self_or_admin on public.utr_logs
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists utr_insert_self on public.utr_logs;
create policy utr_insert_self on public.utr_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists utr_update_admin on public.utr_logs;
create policy utr_update_admin on public.utr_logs
  for update using (public.is_admin()) with check (public.is_admin());

-- progress_logs: user reads/writes own ONLY when active; admin reads
drop policy if exists progress_select_self_or_admin on public.progress_logs;
create policy progress_select_self_or_admin on public.progress_logs
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists progress_write_self_active on public.progress_logs;
create policy progress_write_self_active on public.progress_logs
  for insert with check (
    auth.uid() = user_id and public.is_subscription_active(auth.uid())
  );

drop policy if exists progress_update_self_active on public.progress_logs;
create policy progress_update_self_active on public.progress_logs
  for update using (
    auth.uid() = user_id and public.is_subscription_active(auth.uid())
  ) with check (auth.uid() = user_id);

-- streaks: user reads own; admin reads all; writes only via RPC (security definer)
drop policy if exists streaks_select_self_or_admin on public.streaks;
create policy streaks_select_self_or_admin on public.streaks
  for select using (auth.uid() = user_id or public.is_admin());
