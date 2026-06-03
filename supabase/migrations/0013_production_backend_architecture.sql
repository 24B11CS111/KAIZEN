-- =============================================================
-- KAIZEN.SYS - 0013 Production backend architecture
--
-- Purpose:
--   Add the missing production SaaS backend systems around the
--   existing KAIZEN schema without redesigning frontend contracts.
--
-- Safe to run in Supabase SQL Editor after the existing migrations.
-- This migration is additive and idempotent where PostgreSQL permits.
-- =============================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------
-- 1. ENUMS / TYPE EXTENSIONS
-- -----------------------------------------------------------------

do $$ begin
  create type public.subscription_plan_t as enum ('free', 'intermediate_49', 'btech_99', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status_t as enum ('pending', 'approved', 'rejected', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.admin_role_t as enum ('owner', 'admin', 'support', 'analyst');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.workout_mode_t as enum ('home', 'gym', 'hybrid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.difficulty_t as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.subscription_status_t add value if not exists 'inactive';
exception when others then null; end $$;

do $$ begin
  alter type public.subscription_status_t add value if not exists 'terminated';
exception when others then null; end $$;

-- -----------------------------------------------------------------
-- 2. PROFILE HARDENING / AUTH SUPPORT
-- -----------------------------------------------------------------

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists subscription_plan public.subscription_plan_t not null default 'free';
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists is_suspended boolean not null default false;
alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists suspension_reason text;
alter table public.profiles add column if not exists main_goal_other text;

do $$ begin
  alter table public.profiles
    add constraint profiles_age_range_chk check (age is null or age between 10 and 120);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_daily_time_chk check (daily_time_min is null or daily_time_min between 15 and 600);
exception when duplicate_object then null; end $$;

create unique index if not exists profiles_email_unique_ci_idx
  on public.profiles (lower(email))
  where email is not null;
create index if not exists profiles_admin_status_idx on public.profiles (is_admin, subscription_status);
create index if not exists profiles_suspended_idx on public.profiles (is_suspended) where is_suspended = true;
create index if not exists profiles_last_active_idx on public.profiles (last_active_at desc);
create index if not exists profiles_expiry_active_idx on public.profiles (expiry_date)
  where subscription_status = 'active';

create or replace function public.private_is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and (p.is_admin = true or p.role = 'admin')
      and coalesce(p.is_suspended, false) = false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.private_is_admin(auth.uid());
$$;

create or replace function public.sync_profile_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if lower(coalesce(new.email, '')) = 'hrixofficial@gmail.com' then
    new.is_admin := true;
    new.role := 'admin';
    new.is_suspended := false;
    new.suspended_at := null;
    new.suspension_reason := null;
    return new;
  end if;

  if new.is_admin = true then
    new.role := 'admin';
  elsif new.role = 'admin' then
    new.is_admin := true;
  else
    new.is_admin := false;
  end if;

  if new.is_suspended = true and (TG_OP = 'INSERT' or old.is_suspended is distinct from true) then
    new.suspended_at := coalesce(new.suspended_at, now());
  elsif new.is_suspended = false then
    new.suspended_at := null;
    new.suspension_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_admin_sync on public.profiles;
create trigger profiles_admin_sync
before insert or update of email, role, is_admin, is_suspended, suspended_at, suspension_reason
on public.profiles
for each row execute function public.sync_profile_admin_fields();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_name text := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, ''), '@', 1)
  );
begin
  insert into public.profiles (
    id, email, full_name, role, is_admin, subscription_status, subscription_plan
  )
  values (
    new.id,
    v_email,
    nullif(v_name, ''),
    case when v_email = 'hrixofficial@gmail.com' then 'admin'::public.user_role_t else 'user'::public.user_role_t end,
    v_email = 'hrixofficial@gmail.com',
    'pending'::public.subscription_status_t,
    'free'::public.subscription_plan_t
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        is_admin = case when excluded.email = 'hrixofficial@gmail.com' then true else public.profiles.is_admin end,
        role = case when excluded.email = 'hrixofficial@gmail.com' then 'admin'::public.user_role_t else public.profiles.role end,
        updated_at = now();

  insert into public.user_progress (user_id, current_day, completed_days, streak, longest_streak, last_completed_date, updated_at)
  values (new.id, 1, '{}'::int[], 0, 0, null, now())
  on conflict (user_id) do nothing;

  insert into public.streaks (user_id, current_streak, longest_streak, last_completed_date, updated_at)
  values (new.id, 0, 0, null, now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

update public.profiles
set is_admin = true,
    role = 'admin',
    is_suspended = false,
    suspended_at = null,
    suspension_reason = null
where lower(email) = 'hrixofficial@gmail.com';

-- -----------------------------------------------------------------
-- 3. ONBOARDING / AI PLAN NORMALIZATION
-- -----------------------------------------------------------------

alter table public.onboarding_data add column if not exists main_goal_other text;
alter table public.onboarding_data add column if not exists interests text[] not null default '{}';
alter table public.onboarding_data add column if not exists discipline_preferences text[] not null default '{}';
alter table public.onboarding_data add column if not exists health_information jsonb not null default '{}'::jsonb;
alter table public.onboarding_data add column if not exists productivity_preferences jsonb not null default '{}'::jsonb;
alter table public.onboarding_data add column if not exists version int not null default 1;
alter table public.onboarding_data add column if not exists updated_at timestamptz not null default now();

create index if not exists onboarding_user_latest_idx on public.onboarding_data (user_id, created_at desc);

alter table public.ai_plans add column if not exists plan_name text;
alter table public.ai_plans add column if not exists status text not null default 'active';
alter table public.ai_plans add column if not exists source_model text;
alter table public.ai_plans add column if not exists starts_on date;
alter table public.ai_plans add column if not exists updated_at timestamptz not null default now();

create table if not exists public.ai_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.ai_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day integer not null check (day between 1 and 365),
  title text,
  study_mission text,
  practice_mission text,
  build_mission text,
  workout_mission text,
  discipline_mission text,
  recovery_mission text,
  mission_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, day)
);

create index if not exists ai_plans_user_latest_idx on public.ai_plans (user_id, created_at desc);
create index if not exists ai_plan_days_user_day_idx on public.ai_plan_days (user_id, day);
create index if not exists ai_plan_days_plan_day_idx on public.ai_plan_days (plan_id, day);

-- -----------------------------------------------------------------
-- 4. PROGRESS / STREAK / DISCIPLINE SYSTEMS
-- -----------------------------------------------------------------

alter table public.user_progress add column if not exists xp_points int not null default 0;
alter table public.user_progress add column if not exists consistency_percentage numeric(5,2) not null default 0;
alter table public.user_progress add column if not exists total_points int not null default 0;
alter table public.user_progress add column if not exists premium_unlocked boolean not null default false;
alter table public.user_progress add column if not exists mission_completion_status jsonb not null default '{}'::jsonb;

alter table public.user_progress_days add column if not exists notes text;
alter table public.user_progress_days add column if not exists xp_awarded int not null default 100;
alter table public.user_progress_days add column if not exists completion_percentage numeric(5,2) not null default 100;
alter table public.user_progress_days add column if not exists updated_at timestamptz not null default now();

alter table public.daily_logs add column if not exists study_completed boolean not null default false;
alter table public.daily_logs add column if not exists practice_completed boolean not null default false;
alter table public.daily_logs add column if not exists build_completed boolean not null default false;
alter table public.daily_logs add column if not exists workout_completed boolean not null default false;
alter table public.daily_logs add column if not exists discipline_completed boolean not null default false;
alter table public.daily_logs add column if not exists recovery_completed boolean not null default false;
alter table public.daily_logs add column if not exists workout_minutes integer not null default 0;
alter table public.daily_logs add column if not exists discipline_score integer not null default 0;
alter table public.daily_logs add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.daily_logs
    add constraint daily_logs_discipline_score_chk check (discipline_score between 0 and 100);
exception when duplicate_object then null; end $$;

create table if not exists public.discipline_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  habit_key text not null,
  score integer not null default 0 check (score between 0 and 100),
  completed boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date, habit_key)
);

create table if not exists public.streak_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_date date not null,
  event_type text not null check (event_type in ('started', 'continued', 'reset', 'restored')),
  previous_streak int not null default 0,
  new_streak int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roadmap_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  active_plan_id uuid references public.ai_plans(id) on delete set null,
  current_day int not null default 1 check (current_day between 1 and 365),
  completed_days int[] not null default '{}'::int[],
  completion_percent numeric(5,2) not null default 0,
  last_completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists daily_logs_user_day_idx on public.daily_logs (user_id, day);
create index if not exists daily_logs_completed_idx on public.daily_logs (user_id, completed_at desc) where completed = true;
create index if not exists user_progress_days_user_day_idx on public.user_progress_days (user_id, day);
create index if not exists discipline_logs_user_date_idx on public.discipline_logs (user_id, log_date desc);
create index if not exists streak_events_user_date_idx on public.streak_events (user_id, event_date desc);
create index if not exists user_progress_consistency_idx on public.user_progress (consistency_percentage desc);

-- -----------------------------------------------------------------
-- 5. WORKOUT SYSTEMS
-- -----------------------------------------------------------------

create table if not exists public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text,
  mode public.workout_mode_t not null default 'home',
  difficulty public.difficulty_t not null default 'beginner',
  duration_weeks int not null default 4,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.workout_programs(id) on delete cascade,
  day int not null,
  title text not null,
  focus_area text,
  estimated_minutes int,
  recovery_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, day)
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_name text not null,
  sets int,
  reps text,
  duration_seconds int,
  rest_seconds int,
  equipment text,
  sort_order int not null default 0,
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_workout_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_day_id uuid references public.workout_days(id) on delete set null,
  day int,
  completed boolean not null default false,
  completed_at timestamptz,
  minutes_completed int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_day_id)
);

create index if not exists workout_programs_active_idx on public.workout_programs (is_active, mode, difficulty);
create index if not exists workout_days_program_day_idx on public.workout_days (program_id, day);
create index if not exists workout_exercises_day_order_idx on public.workout_exercises (workout_day_id, sort_order);
create index if not exists user_workout_progress_user_idx on public.user_workout_progress (user_id, completed_at desc);

-- -----------------------------------------------------------------
-- 6. SUBSCRIPTION / PAYMENT / UTR SYSTEMS
-- -----------------------------------------------------------------

alter table public.utr_logs add column if not exists subscription_id uuid;
alter table public.utr_logs add column if not exists payment_id uuid;
alter table public.utr_logs add column if not exists rejection_reason text;
alter table public.utr_logs add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code public.subscription_plan_t not null unique,
  name text not null,
  amount integer not null check (amount >= 0),
  currency text not null default 'INR',
  duration_days integer not null default 30 check (duration_days > 0),
  is_active boolean not null default true,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_code public.subscription_plan_t not null default 'free',
  status public.subscription_status_t not null default 'pending',
  amount integer not null default 0,
  currency text not null default 'INR',
  started_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  source text not null default 'manual_utr',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  utr_log_id uuid references public.utr_logs(id) on delete set null,
  provider text not null default 'upi',
  utr_number text,
  amount integer not null check (amount >= 0),
  currency text not null default 'INR',
  status public.payment_status_t not null default 'pending',
  paid_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.utr_logs
    add constraint utr_logs_subscription_fk
    foreign key (subscription_id) references public.subscriptions(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.utr_logs
    add constraint utr_logs_payment_fk
    foreign key (payment_id) references public.payments(id) on delete set null;
exception when duplicate_object then null; end $$;

insert into public.subscription_plans (code, name, amount, duration_days, features)
values
  ('free', 'Free', 0, 30, '{"access":"limited"}'::jsonb),
  ('intermediate_49', 'Intermediate', 49, 30, '{"path":"intermediate","premium":true}'::jsonb),
  ('btech_99', 'B.Tech', 99, 30, '{"path":"btech","premium":true}'::jsonb)
on conflict (code) do update
set name = excluded.name,
    amount = excluded.amount,
    duration_days = excluded.duration_days,
    features = excluded.features,
    updated_at = now();

create index if not exists subscriptions_user_status_idx on public.subscriptions (user_id, status, expires_at desc);
create index if not exists subscriptions_expiring_idx on public.subscriptions (expires_at)
  where status = 'active';
create index if not exists payments_user_created_idx on public.payments (user_id, created_at desc);
create index if not exists payments_status_created_idx on public.payments (status, created_at desc);
create index if not exists payments_utr_idx on public.payments (utr_number) where utr_number is not null;
create unique index if not exists payments_utr_log_unique_idx on public.payments (utr_log_id)
  where utr_log_id is not null;
create index if not exists utr_logs_pending_idx on public.utr_logs (created_at desc) where status = 'pending';
create index if not exists utr_logs_reviewed_idx on public.utr_logs (reviewed_at desc) where reviewed_at is not null;

-- Backfill payment rows from historical UTR logs.
insert into public.payments (
  user_id, utr_log_id, utr_number, amount, status, paid_at, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at
)
select
  u.user_id,
  u.id,
  u.utr_number,
  u.plan_amount,
  u.status::text::public.payment_status_t,
  case when u.status = 'approved' then coalesce(u.reviewed_at, u.created_at) else null end,
  u.reviewed_by,
  u.reviewed_at,
  u.rejection_reason,
  u.created_at,
  now()
from public.utr_logs u
where not exists (select 1 from public.payments p where p.utr_log_id = u.id);

update public.utr_logs u
set payment_id = p.id
from public.payments p
where p.utr_log_id = u.id
  and u.payment_id is null;

-- -----------------------------------------------------------------
-- 7. ADMIN SYSTEMS / AUDIT / ANALYTICS
-- -----------------------------------------------------------------

create table if not exists public.admin_role_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.admin_role_t not null default 'support',
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, role)
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_daily (
  day date primary key,
  total_users integer not null default 0,
  active_users integer not null default 0,
  suspended_users integer not null default 0,
  pending_approvals integer not null default 0,
  daily_active_users integer not null default 0,
  premium_conversions integer not null default 0,
  workout_completions integer not null default 0,
  revenue integer not null default 0,
  branch_distribution jsonb not null default '{}'::jsonb,
  plan_distribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.admin_role_memberships (user_id, role, metadata)
select id, 'owner'::public.admin_role_t, '{"permanent":true,"source":"0013"}'::jsonb
from public.profiles
where lower(email) = 'hrixofficial@gmail.com'
on conflict (user_id, role) do update
set revoked_at = null,
    metadata = public.admin_role_memberships.metadata || excluded.metadata;

create index if not exists admin_memberships_user_idx on public.admin_role_memberships (user_id, revoked_at);
create index if not exists admin_actions_admin_idx on public.admin_actions (admin_id, created_at desc);
create index if not exists admin_actions_target_idx on public.admin_actions (target_user_id, created_at desc);
create index if not exists analytics_daily_created_idx on public.analytics_daily (created_at desc);

-- -----------------------------------------------------------------
-- 8. REALTIME / PRESENCE SYSTEMS
-- -----------------------------------------------------------------

create table if not exists public.online_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel_key text not null,
  pathname text,
  user_agent text,
  ip_address inet,
  online_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, channel_key)
);

create table if not exists public.realtime_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_type text not null,
  topic text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists online_sessions_last_seen_idx on public.online_sessions (last_seen_at desc);
create index if not exists online_sessions_user_idx on public.online_sessions (user_id, last_seen_at desc);
create index if not exists realtime_events_topic_created_idx on public.realtime_events (topic, created_at desc);
create index if not exists realtime_events_user_created_idx on public.realtime_events (user_id, created_at desc);

create or replace function public.upsert_online_session(
  p_channel_key text,
  p_pathname text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'unauthorized'; end if;

  insert into public.online_sessions (user_id, channel_key, pathname, metadata, online_at, last_seen_at)
  values (v_user, p_channel_key, p_pathname, coalesce(p_metadata, '{}'::jsonb), now(), now())
  on conflict (user_id, channel_key) do update
  set pathname = excluded.pathname,
      metadata = public.online_sessions.metadata || excluded.metadata,
      last_seen_at = now();

  update public.profiles
  set last_active_at = now()
  where id = v_user;
end;
$$;

create or replace function public.prune_stale_online_sessions(p_cutoff interval default interval '5 minutes')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
begin
  delete from public.online_sessions
  where last_seen_at < now() - p_cutoff;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- -----------------------------------------------------------------
-- 9. TRIGGERS / RPCS
-- -----------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_onboarding_touch_updated_at on public.onboarding_data;
create trigger trg_onboarding_touch_updated_at
before update on public.onboarding_data
for each row execute function public.touch_updated_at();

drop trigger if exists trg_ai_plans_touch_updated_at on public.ai_plans;
create trigger trg_ai_plans_touch_updated_at
before update on public.ai_plans
for each row execute function public.touch_updated_at();

drop trigger if exists trg_ai_plan_days_touch_updated_at on public.ai_plan_days;
create trigger trg_ai_plan_days_touch_updated_at
before update on public.ai_plan_days
for each row execute function public.touch_updated_at();

drop trigger if exists trg_user_progress_days_touch_updated_at on public.user_progress_days;
create trigger trg_user_progress_days_touch_updated_at
before update on public.user_progress_days
for each row execute function public.touch_updated_at();

drop trigger if exists trg_daily_logs_touch_updated_at on public.daily_logs;
create trigger trg_daily_logs_touch_updated_at
before update on public.daily_logs
for each row execute function public.touch_updated_at();

drop trigger if exists trg_discipline_logs_touch_updated_at on public.discipline_logs;
create trigger trg_discipline_logs_touch_updated_at
before update on public.discipline_logs
for each row execute function public.touch_updated_at();

drop trigger if exists trg_subscriptions_touch_updated_at on public.subscriptions;
create trigger trg_subscriptions_touch_updated_at
before update on public.subscriptions
for each row execute function public.touch_updated_at();

drop trigger if exists trg_payments_touch_updated_at on public.payments;
create trigger trg_payments_touch_updated_at
before update on public.payments
for each row execute function public.touch_updated_at();

create or replace function public.log_admin_action(
  p_action text,
  p_target_user_id uuid default null,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.admin_actions (admin_id, target_user_id, action, reason, metadata)
  values (auth.uid(), p_target_user_id, p_action, nullif(trim(coalesce(p_reason, '')), ''), coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.current_subscription_is_active(
  p_status text,
  p_expiry timestamptz
)
returns boolean
language sql
stable
as $$
  select p_status = 'active' and p_expiry is not null and p_expiry > now();
$$;

create or replace function public.touch_expiry(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set subscription_status = 'expired'
   where id = uid
     and subscription_status = 'active'
     and expiry_date is not null
     and expiry_date <= now();

  update public.subscriptions
     set status = 'expired'
   where user_id = uid
     and status = 'active'
     and expires_at is not null
     and expires_at <= now();
end;
$$;

create or replace function public.touch_all_expired_subscriptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
begin
  update public.profiles
     set subscription_status = 'expired'
   where subscription_status = 'active'
     and expiry_date is not null
     and expiry_date <= now();

  get diagnostics affected = row_count;

  update public.subscriptions
     set status = 'expired'
   where status = 'active'
     and expires_at is not null
     and expires_at <= now();

  return affected;
end;
$$;

create or replace function public.approve_utr(p_utr_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_amount int;
  v_plan public.subscription_plan_t;
  v_subscription_id uuid;
  v_payment_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  select user_id, plan_amount
    into v_user, v_amount
  from public.utr_logs
  where id = p_utr_id and status = 'pending'
  for update;

  if v_user is null then raise exception 'utr not found or already reviewed'; end if;

  v_plan := case
    when v_amount = 49 then 'intermediate_49'::public.subscription_plan_t
    when v_amount = 99 then 'btech_99'::public.subscription_plan_t
    else 'custom'::public.subscription_plan_t
  end;

  insert into public.subscriptions (user_id, plan_code, status, amount, started_at, expires_at, source, metadata)
  values (v_user, v_plan, 'active', v_amount, now(), now() + interval '30 days', 'manual_utr', jsonb_build_object('utr_id', p_utr_id))
  returning id into v_subscription_id;

  insert into public.payments (
    user_id, subscription_id, utr_log_id, utr_number, amount, status, paid_at, reviewed_by, reviewed_at
  )
  select user_id, v_subscription_id, id, utr_number, plan_amount, 'approved', now(), auth.uid(), now()
  from public.utr_logs
  where id = p_utr_id
  on conflict do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    update public.payments
       set subscription_id = v_subscription_id,
           status = 'approved',
           paid_at = now(),
           reviewed_by = auth.uid(),
           reviewed_at = now(),
           rejection_reason = null
     where utr_log_id = p_utr_id
     returning id into v_payment_id;
  end if;

  update public.utr_logs
     set status = 'approved',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         rejection_reason = null,
         subscription_id = v_subscription_id,
         payment_id = v_payment_id
   where id = p_utr_id;

  update public.profiles
     set subscription_status = 'active',
         subscription_plan = v_plan,
         plan_amount = v_amount,
         start_date = now(),
         expiry_date = now() + interval '30 days',
         is_suspended = false,
         suspended_at = null,
         suspension_reason = null
   where id = v_user;

  delete from public.user_progress_days where user_id = v_user;
  delete from public.daily_logs where user_id = v_user;
  delete from public.progress_logs where user_id = v_user;

  insert into public.user_progress (
    user_id, current_day, completed_days, streak, longest_streak,
    last_completed_date, xp_points, total_points, consistency_percentage,
    premium_unlocked, mission_completion_status, updated_at
  )
  values (v_user, 1, '{}'::int[], 0, 0, null, 0, 0, 0, true, '{}'::jsonb, now())
  on conflict (user_id) do update
    set current_day = 1,
        completed_days = '{}'::int[],
        streak = 0,
        longest_streak = 0,
        last_completed_date = null,
        premium_unlocked = true,
        updated_at = now();

  insert into public.streaks (user_id, current_streak, longest_streak, last_completed_date, updated_at)
  values (v_user, 0, 0, null, now())
  on conflict (user_id) do update
    set current_streak = 0,
        longest_streak = greatest(public.streaks.longest_streak, 0),
        last_completed_date = null,
        updated_at = now();

  perform public.log_admin_action('approve_utr', v_user, null, jsonb_build_object(
    'utr_id', p_utr_id,
    'amount', v_amount,
    'subscription_id', v_subscription_id,
    'payment_id', v_payment_id
  ));
end;
$$;

create or replace function public.reject_utr(p_utr_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  select user_id
    into v_user
  from public.utr_logs
  where id = p_utr_id and status = 'pending'
  for update;

  if v_user is null then raise exception 'utr not found or already reviewed'; end if;

  update public.utr_logs
     set status = 'rejected',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         rejection_reason = v_reason
   where id = p_utr_id;

  insert into public.payments (
    user_id, utr_log_id, utr_number, amount, status, reviewed_by, reviewed_at, rejection_reason
  )
  select user_id, id, utr_number, plan_amount, 'rejected', auth.uid(), now(), v_reason
  from public.utr_logs
  where id = p_utr_id
  on conflict do nothing;

  update public.payments
     set status = 'rejected',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         rejection_reason = v_reason
   where utr_log_id = p_utr_id;

  update public.profiles
     set subscription_status = 'rejected'
   where id = v_user
     and subscription_status <> 'active';

  perform public.log_admin_action('reject_utr', v_user, v_reason, jsonb_build_object('utr_id', p_utr_id));
end;
$$;

create or replace function public.ban_user(p_user_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  update public.profiles
     set subscription_status = 'banned',
         expiry_date = now(),
         is_suspended = true,
         suspended_at = now(),
         suspension_reason = nullif(trim(coalesce(p_reason, '')), '')
   where id = p_user_id
     and lower(email) <> 'hrixofficial@gmail.com';

  update public.subscriptions
     set status = 'banned',
         cancelled_at = now()
   where user_id = p_user_id
     and status in ('active', 'pending');

  perform public.log_admin_action('ban_user', p_user_id, p_reason, '{}'::jsonb);
end;
$$;

create or replace function public.unban_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  update public.profiles
     set is_suspended = false,
         suspended_at = null,
         suspension_reason = null,
         subscription_status = case
           when expiry_date is not null and expiry_date > now() then 'active'::public.subscription_status_t
           else 'expired'::public.subscription_status_t
         end
   where id = p_user_id;

  perform public.log_admin_action('unban_user', p_user_id, null, '{}'::jsonb);
end;
$$;

create or replace function public.reset_progress(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  delete from public.user_progress_days where user_id = p_user_id;
  delete from public.daily_logs where user_id = p_user_id;
  delete from public.progress_logs where user_id = p_user_id;
  delete from public.discipline_logs where user_id = p_user_id;
  delete from public.user_workout_progress where user_id = p_user_id;

  insert into public.user_progress (
    user_id, current_day, completed_days, streak, longest_streak,
    last_completed_date, xp_points, total_points, consistency_percentage,
    mission_completion_status, updated_at
  )
  values (p_user_id, 1, '{}'::int[], 0, 0, null, 0, 0, 0, '{}'::jsonb, now())
  on conflict (user_id) do update
    set current_day = 1,
        completed_days = '{}'::int[],
        streak = 0,
        longest_streak = 0,
        last_completed_date = null,
        xp_points = 0,
        total_points = 0,
        consistency_percentage = 0,
        mission_completion_status = '{}'::jsonb,
        updated_at = now();

  update public.streaks
     set current_streak = 0,
         last_completed_date = null,
         updated_at = now()
   where user_id = p_user_id;

  perform public.log_admin_action('reset_progress', p_user_id, null, '{}'::jsonb);
end;
$$;

create or replace function public.complete_day(p_day int, p_notes text default null)
returns table(current_streak int, longest_streak int, current_day int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (now() at time zone 'UTC')::date;
  v_status public.subscription_status_t;
  v_expiry timestamptz;
  v_last date;
  v_current int := 0;
  v_longest int := 0;
  v_completed int[] := '{}'::int[];
  v_next_day int := 31;
  v_xp int := 100;
  i int;
begin
  if v_user is null then raise exception 'unauthorized'; end if;
  if p_day < 1 or p_day > 30 then raise exception 'invalid day'; end if;

  select subscription_status, expiry_date
    into v_status, v_expiry
  from public.profiles
  where id = v_user
    and coalesce(is_suspended, false) = false
  for update;

  if v_status is null or v_status <> 'active' or (v_expiry is not null and v_expiry <= now()) then
    raise exception 'subscription not active';
  end if;

  if exists (
    select 1
    from public.user_progress_days
    where user_id = v_user
      and completed = true
      and (completed_at at time zone 'UTC')::date = v_today
  ) then
    raise exception 'daily limit reached';
  end if;

  if exists (
    select 1
    from public.user_progress_days
    where user_id = v_user and day = p_day and completed = true
  ) then
    raise exception 'already completed';
  end if;

  insert into public.user_progress_days (user_id, day, completed, completed_at, notes, xp_awarded, completion_percentage)
  values (v_user, p_day, true, now(), p_notes, v_xp, 100);

  insert into public.progress_logs (user_id, day_number, completed, completed_at)
  values (v_user, p_day, true, now())
  on conflict (user_id, day_number) do update
    set completed = true,
        completed_at = excluded.completed_at;

  insert into public.daily_logs (
    user_id, day, completed, notes, completed_at,
    study_completed, practice_completed, build_completed,
    workout_completed, discipline_completed, recovery_completed,
    discipline_score
  )
  values (v_user, p_day, true, p_notes, now(), true, true, true, true, true, true, 100)
  on conflict (user_id, day) do update
    set completed = true,
        notes = coalesce(excluded.notes, public.daily_logs.notes),
        completed_at = excluded.completed_at,
        study_completed = true,
        practice_completed = true,
        build_completed = true,
        workout_completed = true,
        discipline_completed = true,
        recovery_completed = true,
        discipline_score = greatest(public.daily_logs.discipline_score, 100),
        updated_at = now();

  select s.current_streak, s.longest_streak, s.last_completed_date
    into v_current, v_longest, v_last
  from public.streaks s
  where s.user_id = v_user
  for update;

  if v_last is null or v_last < v_today - 1 then
    insert into public.streak_events (user_id, event_date, event_type, previous_streak, new_streak)
    values (v_user, v_today, case when coalesce(v_current, 0) > 0 then 'reset' else 'started' end, coalesce(v_current, 0), 1);
    v_current := 1;
  elsif v_last = v_today - 1 then
    insert into public.streak_events (user_id, event_date, event_type, previous_streak, new_streak)
    values (v_user, v_today, 'continued', coalesce(v_current, 0), coalesce(v_current, 0) + 1);
    v_current := coalesce(v_current, 0) + 1;
  else
    v_current := greatest(coalesce(v_current, 0), 1);
  end if;
  v_longest := greatest(coalesce(v_longest, 0), v_current);

  insert into public.streaks (user_id, current_streak, longest_streak, last_completed_date, updated_at)
  values (v_user, v_current, v_longest, v_today, now())
  on conflict (user_id) do update
    set current_streak = excluded.current_streak,
        longest_streak = excluded.longest_streak,
        last_completed_date = excluded.last_completed_date,
        updated_at = now();

  select coalesce(completed_days, '{}'::int[]) into v_completed
  from public.user_progress
  where user_id = v_user;

  v_completed := array(select distinct unnest(v_completed || array[p_day]) order by 1);
  for i in 1..30 loop
    if not (i = any(v_completed)) then
      v_next_day := i;
      exit;
    end if;
  end loop;

  insert into public.user_progress (
    user_id, current_day, completed_days, streak, longest_streak,
    last_completed_date, xp_points, total_points, consistency_percentage,
    premium_unlocked, updated_at
  )
  values (
    v_user, v_next_day, v_completed, v_current, v_longest, v_today,
    v_xp, v_xp, round((array_length(v_completed, 1)::numeric / 30) * 100, 2),
    true, now()
  )
  on conflict (user_id) do update
    set current_day = excluded.current_day,
        completed_days = excluded.completed_days,
        streak = excluded.streak,
        longest_streak = excluded.longest_streak,
        last_completed_date = excluded.last_completed_date,
        xp_points = public.user_progress.xp_points + v_xp,
        total_points = public.user_progress.total_points + v_xp,
        consistency_percentage = excluded.consistency_percentage,
        premium_unlocked = true,
        updated_at = now();

  return query select v_current, v_longest, v_next_day;
end;
$$;

create or replace function public.log_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp int := coalesce(new.xp_awarded, 100);
begin
  insert into public.xp_log (user_id, amount, reason, day_number)
  values (new.user_id, v_xp, 'day_completed', new.day);

  insert into public.activity_log (user_id, type, metadata)
  values (new.user_id, 'day_sealed', jsonb_build_object(
    'day', new.day,
    'completed_at', new.completed_at,
    'xp', v_xp
  ));

  return new;
end;
$$;

drop trigger if exists user_progress_log on public.user_progress;
drop trigger if exists user_progress_log on public.user_progress_days;
create trigger user_progress_log
after insert on public.user_progress_days
for each row execute function public.log_progress();

create or replace function public.get_you_vs_you()
returns table(
  this_week_days int,
  last_week_days int,
  this_week_xp int,
  last_week_xp int,
  current_streak int,
  longest_streak int,
  consistency_pct int,
  improvement_pct int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now date := (now() at time zone 'UTC')::date;
  v_this_start date := v_now - extract(dow from v_now)::int;
  v_last_start date := v_this_start - 7;
  v_this_days int := 0;
  v_last_days int := 0;
  v_this_xp int := 0;
  v_last_xp int := 0;
  v_cur int := 0;
  v_long int := 0;
begin
  if v_user is null then return; end if;

  select count(*)::int into v_this_days
  from public.user_progress_days
  where user_id = v_user
    and completed = true
    and (completed_at at time zone 'UTC')::date >= v_this_start
    and (completed_at at time zone 'UTC')::date < v_this_start + 7;

  select count(*)::int into v_last_days
  from public.user_progress_days
  where user_id = v_user
    and completed = true
    and (completed_at at time zone 'UTC')::date >= v_last_start
    and (completed_at at time zone 'UTC')::date < v_this_start;

  select coalesce(sum(amount), 0)::int into v_this_xp
  from public.xp_log
  where user_id = v_user
    and (created_at at time zone 'UTC')::date >= v_this_start
    and (created_at at time zone 'UTC')::date < v_this_start + 7;

  select coalesce(sum(amount), 0)::int into v_last_xp
  from public.xp_log
  where user_id = v_user
    and (created_at at time zone 'UTC')::date >= v_last_start
    and (created_at at time zone 'UTC')::date < v_this_start;

  select coalesce(s.current_streak, 0), coalesce(s.longest_streak, 0)
    into v_cur, v_long
  from public.streaks s
  where s.user_id = v_user;

  return query select
    v_this_days,
    v_last_days,
    v_this_xp,
    v_last_xp,
    coalesce(v_cur, 0),
    coalesce(v_long, 0),
    (v_this_days * 100 / greatest(1, extract(dow from v_now)::int + 1))::int,
    case when v_last_xp > 0 then ((v_this_xp - v_last_xp) * 100 / v_last_xp)::int else 0 end;
end;
$$;

create or replace function public.reset_stale_streak()
returns table(was_reset boolean, current_streak int, longest_streak int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (now() at time zone 'UTC')::date;
  v_last date;
  v_current int := 0;
  v_longest int := 0;
begin
  if v_user is null then
    return query select false, 0, 0;
    return;
  end if;

  select s.last_completed_date, s.current_streak, s.longest_streak
    into v_last, v_current, v_longest
  from public.streaks s
  where s.user_id = v_user
  for update;

  if not found then
    return query select false, 0, 0;
    return;
  end if;

  if v_last is not null and coalesce(v_current, 0) > 0 and v_last < (v_today - 1) then
    update public.streaks
       set current_streak = 0,
           updated_at = now()
     where user_id = v_user;

    update public.user_progress
       set streak = 0,
           updated_at = now()
     where user_id = v_user;

    insert into public.streak_events (user_id, event_date, event_type, previous_streak, new_streak)
    values (v_user, v_today, 'reset', v_current, 0);

    return query select true, 0, coalesce(v_longest, 0);
    return;
  end if;

  return query select false, coalesce(v_current, 0), coalesce(v_longest, 0);
end;
$$;

create or replace function public.refresh_analytics_daily(p_day date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch_distribution jsonb := '{}'::jsonb;
  v_plan_distribution jsonb := '{}'::jsonb;
begin
  if not public.is_admin() and auth.role() <> 'service_role' then
    raise exception 'forbidden';
  end if;

  select coalesce(jsonb_object_agg(branch_key, branch_count), '{}'::jsonb)
    into v_branch_distribution
  from (
    select coalesce(nullif(branch, ''), path_type::text, 'unassigned') as branch_key, count(*) as branch_count
    from public.profiles
    group by 1
  ) s;

  select coalesce(jsonb_object_agg(plan_key, plan_count), '{}'::jsonb)
    into v_plan_distribution
  from (
    select coalesce(plan_amount::text, subscription_plan::text, 'free') as plan_key, count(*) as plan_count
    from public.profiles
    group by 1
  ) s;

  insert into public.analytics_daily (
    day, total_users, active_users, suspended_users, pending_approvals,
    daily_active_users, premium_conversions, workout_completions, revenue,
    branch_distribution, plan_distribution, updated_at
  )
  values (
    p_day,
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where subscription_status = 'active'),
    (select count(*) from public.profiles where is_suspended = true),
    (select count(*) from public.utr_logs where status = 'pending'),
    (select count(distinct user_id) from public.daily_logs where coalesce(completed_at, created_at)::date = p_day),
    (select count(distinct user_id) from public.utr_logs where status = 'approved' and reviewed_at::date = p_day),
    (select count(*) from public.daily_logs where workout_completed = true and coalesce(completed_at, created_at)::date = p_day),
    (select coalesce(sum(amount), 0)::int from public.payments where status = 'approved' and coalesce(paid_at, created_at)::date = p_day),
    v_branch_distribution,
    v_plan_distribution,
    now()
  )
  on conflict (day) do update
    set total_users = excluded.total_users,
        active_users = excluded.active_users,
        suspended_users = excluded.suspended_users,
        pending_approvals = excluded.pending_approvals,
        daily_active_users = excluded.daily_active_users,
        premium_conversions = excluded.premium_conversions,
        workout_completions = excluded.workout_completions,
        revenue = excluded.revenue,
        branch_distribution = excluded.branch_distribution,
        plan_distribution = excluded.plan_distribution,
        updated_at = now();
end;
$$;

-- -----------------------------------------------------------------
-- 10. RLS POLICIES
-- -----------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.onboarding_data enable row level security;
alter table public.ai_plans enable row level security;
alter table public.ai_plan_days enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_progress_days enable row level security;
alter table public.daily_logs enable row level security;
alter table public.discipline_logs enable row level security;
alter table public.streak_events enable row level security;
alter table public.user_roadmap_progress enable row level security;
alter table public.workout_programs enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.user_workout_progress enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.utr_logs enable row level security;
alter table public.admin_role_memberships enable row level security;
alter table public.admin_actions enable row level security;
alter table public.platform_settings enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.online_sessions enable row level security;
alter table public.realtime_events enable row level security;

drop policy if exists profiles_select_own_or_admin_0013 on public.profiles;
create policy profiles_select_own_or_admin_0013 on public.profiles
for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_own_0013 on public.profiles;
create policy profiles_insert_own_0013 on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own_or_admin_0013 on public.profiles;
create policy profiles_update_own_or_admin_0013 on public.profiles
for update using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists onboarding_own_or_admin_0013 on public.onboarding_data;
create policy onboarding_own_or_admin_0013 on public.onboarding_data
for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists onboarding_write_own_or_admin_0013 on public.onboarding_data;
create policy onboarding_write_own_or_admin_0013 on public.onboarding_data
for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists onboarding_update_own_or_admin_0013 on public.onboarding_data;
create policy onboarding_update_own_or_admin_0013 on public.onboarding_data
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_plans_own_or_admin_0013 on public.ai_plans;
create policy ai_plans_own_or_admin_0013 on public.ai_plans
for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists ai_plans_write_own_or_admin_0013 on public.ai_plans;
create policy ai_plans_write_own_or_admin_0013 on public.ai_plans
for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists ai_plans_update_own_or_admin_0013 on public.ai_plans;
create policy ai_plans_update_own_or_admin_0013 on public.ai_plans
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_plan_days_own_or_admin_0013 on public.ai_plan_days;
create policy ai_plan_days_own_or_admin_0013 on public.ai_plan_days
for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists ai_plan_days_write_own_or_admin_0013 on public.ai_plan_days;
create policy ai_plan_days_write_own_or_admin_0013 on public.ai_plan_days
for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists ai_plan_days_update_own_or_admin_0013 on public.ai_plan_days;
create policy ai_plan_days_update_own_or_admin_0013 on public.ai_plan_days
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists user_progress_own_or_admin_0013 on public.user_progress;
create policy user_progress_own_or_admin_0013 on public.user_progress
for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists user_progress_write_own_or_admin_0013 on public.user_progress;
create policy user_progress_write_own_or_admin_0013 on public.user_progress
for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists user_progress_update_own_or_admin_0013 on public.user_progress;
create policy user_progress_update_own_or_admin_0013 on public.user_progress
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists user_progress_days_own_or_admin_0013 on public.user_progress_days;
create policy user_progress_days_own_or_admin_0013 on public.user_progress_days
for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists user_progress_days_write_own_or_admin_0013 on public.user_progress_days;
create policy user_progress_days_write_own_or_admin_0013 on public.user_progress_days
for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists user_progress_days_update_own_or_admin_0013 on public.user_progress_days;
create policy user_progress_days_update_own_or_admin_0013 on public.user_progress_days
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists daily_logs_own_or_admin_0013 on public.daily_logs;
create policy daily_logs_own_or_admin_0013 on public.daily_logs
for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists daily_logs_write_own_or_admin_0013 on public.daily_logs;
create policy daily_logs_write_own_or_admin_0013 on public.daily_logs
for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists daily_logs_update_own_or_admin_0013 on public.daily_logs;
create policy daily_logs_update_own_or_admin_0013 on public.daily_logs
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists discipline_logs_own_or_admin_0013 on public.discipline_logs;
create policy discipline_logs_own_or_admin_0013 on public.discipline_logs
for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists discipline_logs_write_own_or_admin_0013 on public.discipline_logs;
create policy discipline_logs_write_own_or_admin_0013 on public.discipline_logs
for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists discipline_logs_update_own_or_admin_0013 on public.discipline_logs;
create policy discipline_logs_update_own_or_admin_0013 on public.discipline_logs
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists streak_events_own_or_admin_0013 on public.streak_events;
create policy streak_events_own_or_admin_0013 on public.streak_events
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists roadmap_own_or_admin_0013 on public.user_roadmap_progress;
create policy roadmap_own_or_admin_0013 on public.user_roadmap_progress
for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists roadmap_write_own_or_admin_0013 on public.user_roadmap_progress;
create policy roadmap_write_own_or_admin_0013 on public.user_roadmap_progress
for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists roadmap_update_own_or_admin_0013 on public.user_roadmap_progress;
create policy roadmap_update_own_or_admin_0013 on public.user_roadmap_progress
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists workout_programs_read_active_0013 on public.workout_programs;
create policy workout_programs_read_active_0013 on public.workout_programs
for select using (is_active = true or public.is_admin());

drop policy if exists workout_programs_admin_write_0013 on public.workout_programs;
create policy workout_programs_admin_write_0013 on public.workout_programs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists workout_days_read_0013 on public.workout_days;
create policy workout_days_read_0013 on public.workout_days
for select using (true);

drop policy if exists workout_days_admin_write_0013 on public.workout_days;
create policy workout_days_admin_write_0013 on public.workout_days
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists workout_exercises_read_0013 on public.workout_exercises;
create policy workout_exercises_read_0013 on public.workout_exercises
for select using (true);

drop policy if exists workout_exercises_admin_write_0013 on public.workout_exercises;
create policy workout_exercises_admin_write_0013 on public.workout_exercises
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists user_workout_progress_own_or_admin_0013 on public.user_workout_progress;
create policy user_workout_progress_own_or_admin_0013 on public.user_workout_progress
for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists user_workout_progress_write_own_or_admin_0013 on public.user_workout_progress;
create policy user_workout_progress_write_own_or_admin_0013 on public.user_workout_progress
for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists user_workout_progress_update_own_or_admin_0013 on public.user_workout_progress;
create policy user_workout_progress_update_own_or_admin_0013 on public.user_workout_progress
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists subscription_plans_read_0013 on public.subscription_plans;
create policy subscription_plans_read_0013 on public.subscription_plans
for select using (is_active = true or public.is_admin());

drop policy if exists subscription_plans_admin_write_0013 on public.subscription_plans;
create policy subscription_plans_admin_write_0013 on public.subscription_plans
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists subscriptions_own_or_admin_0013 on public.subscriptions;
create policy subscriptions_own_or_admin_0013 on public.subscriptions
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists subscriptions_admin_write_0013 on public.subscriptions;
create policy subscriptions_admin_write_0013 on public.subscriptions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists payments_own_or_admin_0013 on public.payments;
create policy payments_own_or_admin_0013 on public.payments
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists payments_admin_write_0013 on public.payments;
create policy payments_admin_write_0013 on public.payments
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists utr_logs_own_or_admin_0013 on public.utr_logs;
create policy utr_logs_own_or_admin_0013 on public.utr_logs
for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists utr_logs_insert_own_0013 on public.utr_logs;
create policy utr_logs_insert_own_0013 on public.utr_logs
for insert with check (auth.uid() = user_id);

drop policy if exists utr_logs_admin_update_0013 on public.utr_logs;
create policy utr_logs_admin_update_0013 on public.utr_logs
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_memberships_admin_only_0013 on public.admin_role_memberships;
create policy admin_memberships_admin_only_0013 on public.admin_role_memberships
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_actions_admin_only_0013 on public.admin_actions;
create policy admin_actions_admin_only_0013 on public.admin_actions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists platform_settings_admin_only_0013 on public.platform_settings;
create policy platform_settings_admin_only_0013 on public.platform_settings
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists analytics_admin_only_0013 on public.analytics_daily;
create policy analytics_admin_only_0013 on public.analytics_daily
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists online_sessions_own_or_admin_0013 on public.online_sessions;
create policy online_sessions_own_or_admin_0013 on public.online_sessions
for all using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists realtime_events_select_own_or_admin_0013 on public.realtime_events;
create policy realtime_events_select_own_or_admin_0013 on public.realtime_events
for select using (user_id is null or auth.uid() = user_id or public.is_admin());

drop policy if exists realtime_events_insert_own_or_admin_0013 on public.realtime_events;
create policy realtime_events_insert_own_or_admin_0013 on public.realtime_events
for insert with check (auth.uid() = user_id or public.is_admin());

-- -----------------------------------------------------------------
-- 11. REALTIME PUBLICATION
-- -----------------------------------------------------------------

do $$ begin alter publication supabase_realtime add table public.profiles;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.utr_logs;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.subscriptions;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.payments;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.user_progress;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.user_progress_days;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.daily_logs;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.discipline_logs;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.online_sessions;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.realtime_events;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.analytics_daily;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.admin_actions;
exception when others then null; end $$;

-- -----------------------------------------------------------------
-- 12. GRANTS
-- -----------------------------------------------------------------

revoke all on function public.private_is_admin(uuid) from public;
revoke all on function public.log_admin_action(text, uuid, text, jsonb) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_subscription_is_active(text, timestamptz) to authenticated;
grant execute on function public.touch_expiry(uuid) to authenticated, service_role;
grant execute on function public.touch_all_expired_subscriptions() to authenticated, service_role;
grant execute on function public.complete_day(int, text) to authenticated;
grant execute on function public.reset_stale_streak() to authenticated;
grant execute on function public.approve_utr(uuid) to authenticated;
grant execute on function public.reject_utr(uuid, text) to authenticated;
grant execute on function public.ban_user(uuid, text) to authenticated;
grant execute on function public.unban_user(uuid) to authenticated;
grant execute on function public.reset_progress(uuid) to authenticated;
grant execute on function public.refresh_analytics_daily(date) to authenticated, service_role;
grant execute on function public.upsert_online_session(text, text, jsonb) to authenticated;
grant execute on function public.prune_stale_online_sessions(interval) to authenticated, service_role;

-- -----------------------------------------------------------------
-- 13. INITIAL ANALYTICS SNAPSHOT
-- -----------------------------------------------------------------

do $$
begin
  if exists (select 1 from public.profiles where lower(email) = 'hrixofficial@gmail.com') then
    perform public.refresh_analytics_daily(current_date);
  end if;
exception when others then
  null;
end $$;

-- =============================================================
-- Verification:
--   select table_name from information_schema.tables
--    where table_schema = 'public'
--      and table_name in (
--        'subscriptions','payments','admin_actions','analytics_daily',
--        'online_sessions','discipline_logs','workout_programs'
--      );
-- =============================================================
