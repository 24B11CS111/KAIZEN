-- =============================================================
-- KAIZEN.SYS - Combined initial migration (idempotent)
--
-- Run ONCE in the Supabase SQL Editor on a fresh project.
-- Safe to re-run: every CREATE uses IF NOT EXISTS or DO/EXCEPTION.
--
-- Execution order:
--   1. Extensions
--   2. Enums
--   3. Helper functions (no table deps)
--   4. Tables (in FK dependency order)
--   5. Indexes
--   6. Trigger functions + triggers
--   7. RPCs
--   8. RLS policies
--   9. Realtime publication
-- =============================================================

-- ===== 1. EXTENSIONS =====
create extension if not exists "pgcrypto";

-- ===== 2. ENUMS =====
do $$ begin
  create type subscription_status_t as enum ('pending','active','expired','rejected','banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type utr_status_t as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role_t as enum ('user','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type path_type_t as enum ('intermediate','btech');
exception when duplicate_object then null; end $$;

-- ===== 3. HELPER FUNCTIONS (no table deps) =====
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ===== 4. TABLES (FK-ordered) =====

-- 4a. profiles - depends on auth.users
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  role                user_role_t not null default 'user',
  subscription_status subscription_status_t not null default 'pending',
  plan_amount         integer,
  start_date          timestamptz,
  expiry_date         timestamptz,
  whatsapp            text unique,
  full_name           text,
  path_type           path_type_t,
  branch              text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 4b. utr_logs - FK -> profiles
create table if not exists public.utr_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  utr_number   text not null,
  plan_amount  integer not null,
  status       utr_status_t not null default 'pending',
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz,
  ip_address   inet,
  created_at   timestamptz not null default now(),
  constraint utr_number_12_digits check (utr_number ~ '^[0-9]{12}$'),
  constraint utr_number_unique unique (utr_number)
);

-- 4c. user_progress - FK -> profiles
create table if not exists public.user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  day          int  not null check (day between 1 and 30),
  completed    boolean not null default true,
  completed_at timestamptz not null default now(),
  unique (user_id, day)
);

-- 4d. progress_logs - legacy mirror of user_progress (FK -> profiles)
create table if not exists public.progress_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  day_number   int  not null check (day_number between 1 and 30),
  completed    boolean not null default false,
  completed_at timestamptz,
  unique (user_id, day_number)
);

-- 4e. streaks - FK -> profiles
create table if not exists public.streaks (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  current_streak       int not null default 0,
  longest_streak       int not null default 0,
  last_completed_date  date,
  updated_at           timestamptz not null default now()
);

-- 4f. xp_log - FK -> profiles
create table if not exists public.xp_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      int  not null,
  reason      text not null,
  day_number  int,
  created_at  timestamptz not null default now()
);

-- 4g. activity_log - FK -> profiles
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ===== 5. INDEXES =====
create index if not exists profiles_role_idx           on public.profiles (role);
create index if not exists profiles_status_idx         on public.profiles (subscription_status);
create index if not exists utr_logs_status_idx         on public.utr_logs (status, created_at);
create index if not exists utr_logs_user_idx           on public.utr_logs (user_id);
create index if not exists user_progress_user_idx      on public.user_progress (user_id);
create unique index if not exists user_progress_one_per_day_idx
  on public.user_progress (user_id, ((completed_at at time zone 'UTC')::date));
create index if not exists progress_logs_user_idx      on public.progress_logs (user_id);
create index if not exists xp_log_user_created_idx     on public.xp_log (user_id, created_at desc);
create index if not exists activity_log_user_created_idx on public.activity_log (user_id, created_at desc);
create index if not exists activity_log_user_type_idx  on public.activity_log (user_id, type);

-- ===== 6. TRIGGER FUNCTIONS + TRIGGERS (after all tables exist) =====

-- updated_at touchers
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists streaks_touch on public.streaks;
create trigger streaks_touch before update on public.streaks
  for each row execute function public.touch_updated_at();

-- log_progress: write xp_log + activity_log when a day is sealed
create or replace function public.log_progress()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.xp_log (user_id, amount, reason, day_number)
  values (new.user_id, 100, 'day_completed', new.day);

  insert into public.activity_log (user_id, type, metadata)
  values (new.user_id, 'day_sealed', jsonb_build_object(
    'day', new.day,
    'completed_at', new.completed_at,
    'xp', 100
  ));
  return new;
end;
$$;

drop trigger if exists user_progress_log on public.user_progress;
create trigger user_progress_log after insert on public.user_progress
  for each row execute function public.log_progress();

-- ===== 7. RPCs (functions that USE the tables) =====

-- 7a. is_admin
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 7b. touch_expiry - flips active->expired when past expiry_date
create or replace function public.touch_expiry(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set subscription_status = 'expired'
  where id = uid
    and subscription_status = 'active'
    and expiry_date is not null
    and expiry_date <= now();
end;
$$;

-- 7c. complete_day
create or replace function public.complete_day(p_day int)
returns table(current_streak int, longest_streak int)
language plpgsql security definer set search_path = public as $$
declare
  v_user    uuid := auth.uid();
  v_today   date := (now() at time zone 'UTC')::date;
  v_status  subscription_status_t;
  v_last    date;
  v_current int;
  v_longest int;
begin
  if v_user is null then raise exception 'unauthorized'; end if;
  if p_day < 1 or p_day > 30 then raise exception 'invalid day'; end if;

  select subscription_status into v_status
    from public.profiles where id = v_user for update;
  if v_status is null or v_status <> 'active' then
    raise exception 'subscription not active';
  end if;

  if exists (
    select 1 from public.user_progress
    where user_id = v_user and (completed_at at time zone 'UTC')::date = v_today
  ) then raise exception 'daily limit reached'; end if;

  if exists (
    select 1 from public.user_progress where user_id = v_user and day = p_day
  ) then raise exception 'already completed'; end if;

  insert into public.user_progress (user_id, day, completed, completed_at)
  values (v_user, p_day, true, now());

  insert into public.progress_logs (user_id, day_number, completed, completed_at)
  values (v_user, p_day, true, now())
  on conflict (user_id, day_number) do update
    set completed = true, completed_at = excluded.completed_at;

  select s.current_streak, s.longest_streak, s.last_completed_date
    into v_current, v_longest, v_last
  from public.streaks s where s.user_id = v_user;

  if v_last is null or v_last < v_today - 1 then
    v_current := 1;
  elsif v_last = v_today - 1 then
    v_current := coalesce(v_current, 0) + 1;
  end if;
  v_longest := greatest(coalesce(v_longest, 0), v_current);

  insert into public.streaks (user_id, current_streak, longest_streak, last_completed_date)
  values (v_user, v_current, v_longest, v_today)
  on conflict (user_id) do update set
    current_streak      = excluded.current_streak,
    longest_streak      = excluded.longest_streak,
    last_completed_date = excluded.last_completed_date;

  return query select v_current, v_longest;
end;
$$;

-- 7d. reset_stale_streak
create or replace function public.reset_stale_streak()
returns table(was_reset boolean, current_streak int, longest_streak int)
language plpgsql security definer set search_path = public as $$
declare
  v_user    uuid := auth.uid();
  v_today   date := (now() at time zone 'UTC')::date;
  v_last    date;
  v_current int;
  v_longest int;
  v_reset   boolean := false;
begin
  if v_user is null then return query select false, 0, 0; return; end if;

  select s.last_completed_date, s.current_streak, s.longest_streak
    into v_last, v_current, v_longest
  from public.streaks s where s.user_id = v_user;

  if not found then return query select false, 0, 0; return; end if;

  if v_last is not null and coalesce(v_current, 0) > 0
     and v_last < (v_today - 1) then
    update public.streaks set current_streak = 0, updated_at = now()
     where user_id = v_user;
    v_reset := true;
    v_current := 0;
  end if;

  return query select v_reset, coalesce(v_current, 0), coalesce(v_longest, 0);
end;
$$;

-- 7e. approve_utr
create or replace function public.approve_utr(p_utr_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_amount int;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  select user_id, plan_amount into v_user, v_amount
  from public.utr_logs where id = p_utr_id and status = 'pending'
  for update;

  if v_user is null then raise exception 'utr not found or already reviewed'; end if;

  update public.utr_logs
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_utr_id;

  update public.profiles set
    subscription_status = 'active',
    plan_amount = v_amount,
    start_date = now(),
    expiry_date = now() + interval '30 days'
  where id = v_user;

  delete from public.user_progress where user_id = v_user;
  delete from public.progress_logs where user_id = v_user;
  insert into public.streaks (user_id, current_streak, longest_streak)
  values (v_user, 0, 0)
  on conflict (user_id) do update
    set current_streak = 0, longest_streak = greatest(public.streaks.longest_streak, 0);
end;
$$;

-- 7f. reject_utr
create or replace function public.reject_utr(p_utr_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select user_id into v_user from public.utr_logs where id = p_utr_id;
  if v_user is null then raise exception 'utr not found'; end if;

  update public.utr_logs
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_utr_id;
end;
$$;

-- 7g. ban_user / reset_progress
create or replace function public.ban_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.profiles set subscription_status = 'banned' where id = p_user_id;
end;
$$;

create or replace function public.reset_progress(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.user_progress where user_id = p_user_id;
  delete from public.progress_logs where user_id = p_user_id;
  update public.streaks
    set current_streak = 0, last_completed_date = null
    where user_id = p_user_id;
end;
$$;

-- 7h. get_you_vs_you
create or replace function public.get_you_vs_you()
returns table(
  this_week_days   int,
  last_week_days   int,
  this_week_xp     int,
  last_week_xp     int,
  current_streak   int,
  longest_streak   int,
  consistency_pct  int,
  improvement_pct  int
)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_now  date := (now() at time zone 'UTC')::date;
  v_this_start date := v_now - extract(dow from v_now)::int;
  v_last_start date := v_this_start - 7;
  v_this_days int; v_last_days int;
  v_this_xp int;   v_last_xp int;
  v_cur int;       v_long int;
begin
  if v_user is null then return; end if;

  select count(*)::int into v_this_days
  from public.user_progress
  where user_id = v_user and completed = true
    and (completed_at at time zone 'UTC')::date >= v_this_start
    and (completed_at at time zone 'UTC')::date <  v_this_start + 7;

  select count(*)::int into v_last_days
  from public.user_progress
  where user_id = v_user and completed = true
    and (completed_at at time zone 'UTC')::date >= v_last_start
    and (completed_at at time zone 'UTC')::date <  v_this_start;

  select coalesce(sum(amount), 0)::int into v_this_xp
  from public.xp_log
  where user_id = v_user
    and (created_at at time zone 'UTC')::date >= v_this_start
    and (created_at at time zone 'UTC')::date <  v_this_start + 7;

  select coalesce(sum(amount), 0)::int into v_last_xp
  from public.xp_log
  where user_id = v_user
    and (created_at at time zone 'UTC')::date >= v_last_start
    and (created_at at time zone 'UTC')::date <  v_this_start;

  select coalesce(s.current_streak, 0), coalesce(s.longest_streak, 0)
    into v_cur, v_long
  from public.streaks s where s.user_id = v_user;

  return query select
    v_this_days,
    v_last_days,
    v_this_xp,
    v_last_xp,
    coalesce(v_cur, 0),
    coalesce(v_long, 0),
    (v_this_days * 100 / greatest(1, extract(dow from v_now)::int + 1))::int,
    (case when v_last_xp > 0
          then ((v_this_xp - v_last_xp) * 100 / v_last_xp)::int
          else 0 end);
end;
$$;

revoke all on function public.complete_day(int)        from public;
revoke all on function public.reset_stale_streak()     from public;
revoke all on function public.get_you_vs_you()         from public;
revoke all on function public.touch_expiry(uuid)       from public;
revoke all on function public.approve_utr(uuid)        from public;
revoke all on function public.reject_utr(uuid)         from public;
revoke all on function public.ban_user(uuid)           from public;
revoke all on function public.reset_progress(uuid)     from public;

grant execute on function public.complete_day(int)     to authenticated;
grant execute on function public.reset_stale_streak()  to authenticated;
grant execute on function public.get_you_vs_you()      to authenticated;
grant execute on function public.touch_expiry(uuid)    to service_role;
grant execute on function public.approve_utr(uuid)     to authenticated;
grant execute on function public.reject_utr(uuid)      to authenticated;
grant execute on function public.ban_user(uuid)        to authenticated;
grant execute on function public.reset_progress(uuid)  to authenticated;

-- ===== 8. RLS POLICIES =====
alter table public.profiles      enable row level security;
alter table public.utr_logs      enable row level security;
alter table public.user_progress enable row level security;
alter table public.progress_logs enable row level security;
alter table public.streaks       enable row level security;
alter table public.xp_log        enable row level security;
alter table public.activity_log  enable row level security;

-- profiles
drop policy if exists profiles_select_own  on public.profiles;
drop policy if exists profiles_update_own  on public.profiles;
drop policy if exists profiles_insert_own  on public.profiles;
drop policy if exists profiles_admin_read  on public.profiles;
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_select_own  on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own  on public.profiles for update using (auth.uid() = id);
create policy profiles_insert_own  on public.profiles for insert with check (auth.uid() = id);
create policy profiles_admin_read  on public.profiles for select using (public.is_admin());
create policy profiles_admin_write on public.profiles for update using (public.is_admin());

-- utr_logs
drop policy if exists utr_select_own   on public.utr_logs;
drop policy if exists utr_insert_own   on public.utr_logs;
drop policy if exists utr_admin_read   on public.utr_logs;
drop policy if exists utr_admin_write  on public.utr_logs;
create policy utr_select_own  on public.utr_logs for select using (auth.uid() = user_id);
create policy utr_insert_own  on public.utr_logs for insert with check (auth.uid() = user_id);
create policy utr_admin_read  on public.utr_logs for select using (public.is_admin());
create policy utr_admin_write on public.utr_logs for update using (public.is_admin());

-- user_progress
drop policy if exists up_select_own on public.user_progress;
drop policy if exists up_insert_own on public.user_progress;
drop policy if exists up_admin_read on public.user_progress;
create policy up_select_own on public.user_progress for select using (auth.uid() = user_id);
create policy up_insert_own on public.user_progress for insert with check (auth.uid() = user_id);
create policy up_admin_read on public.user_progress for select using (public.is_admin());

-- progress_logs (legacy mirror)
drop policy if exists pl_select_own on public.progress_logs;
drop policy if exists pl_insert_own on public.progress_logs;
drop policy if exists pl_admin_read on public.progress_logs;
create policy pl_select_own on public.progress_logs for select using (auth.uid() = user_id);
create policy pl_insert_own on public.progress_logs for insert with check (auth.uid() = user_id);
create policy pl_admin_read on public.progress_logs for select using (public.is_admin());

-- streaks
drop policy if exists streaks_select_own on public.streaks;
drop policy if exists streaks_admin_read on public.streaks;
create policy streaks_select_own on public.streaks for select using (auth.uid() = user_id);
create policy streaks_admin_read on public.streaks for select using (public.is_admin());

-- xp_log
drop policy if exists xp_select_own on public.xp_log;
drop policy if exists xp_admin_read on public.xp_log;
create policy xp_select_own on public.xp_log for select using (auth.uid() = user_id);
create policy xp_admin_read on public.xp_log for select using (public.is_admin());

-- activity_log
drop policy if exists act_select_own on public.activity_log;
drop policy if exists act_admin_read on public.activity_log;
create policy act_select_own on public.activity_log for select using (auth.uid() = user_id);
create policy act_admin_read on public.activity_log for select using (public.is_admin());

-- ===== 9. REALTIME PUBLICATION =====
do $$ begin alter publication supabase_realtime add table public.user_progress;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.streaks;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.xp_log;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.profiles;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.activity_log;
exception when others then null; end $$;

-- =============================================================
-- DONE. Verify with:
--   select table_name from information_schema.tables where table_schema='public';
--   select routine_name from information_schema.routines where routine_schema='public';
-- =============================================================
