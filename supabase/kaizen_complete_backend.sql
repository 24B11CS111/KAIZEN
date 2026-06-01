-- KAIZEN.SYS Complete Production Backend Architecture
-- Copy-paste runnable in Supabase SQL Editor.
-- This script is additive and upgrade-safe for an existing KAIZEN project.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status_t') then
    create type public.subscription_status_t as enum (
      'pending',
      'active',
      'expired',
      'inactive',
      'rejected',
      'terminated',
      'banned'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_plan_t') then
    create type public.subscription_plan_t as enum (
      'free',
      'intermediate_49',
      'btech_99',
      'custom'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status_t') then
    create type public.payment_status_t as enum (
      'pending',
      'approved',
      'rejected',
      'failed',
      'refunded'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workout_mode_t') then
    create type public.workout_mode_t as enum (
      'home',
      'gym',
      'hybrid'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'difficulty_t') then
    create type public.difficulty_t as enum (
      'beginner',
      'intermediate',
      'advanced'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_action_t') then
    create type public.admin_action_t as enum (
      'approve_utr',
      'reject_utr',
      'ban_user',
      'unban_user',
      'extend_subscription',
      'reset_progress',
      'impersonation_note'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Core utility functions
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

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
      and p.is_admin = true
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

create or replace function public.subscription_plan_amount(p_plan public.subscription_plan_t)
returns integer
language sql
immutable
as $$
  select case p_plan
    when 'intermediate_49' then 49
    when 'btech_99' then 99
    else 0
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
  select p_status = 'active'
    and p_expiry is not null
    and p_expiry > now();
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  whatsapp text,
  gender text,
  age integer,
  occupation text,
  branch text,
  goal text,
  skill_level text,
  daily_available_time integer,
  workout_preference jsonb not null default '{}'::jsonb,
  path_type text,
  field_of_study text,
  daily_time_min integer,
  main_goal text,
  main_goal_other text,
  workout_location text,
  fitness_level text,
  subscription_status public.subscription_status_t not null default 'pending',
  subscription_plan public.subscription_plan_t not null default 'free',
  expiry_date timestamptz,
  streak integer not null default 0,
  progress_percentage numeric(5,2) not null default 0,
  total_completed_days integer not null default 0,
  is_admin boolean not null default false,
  last_active_at timestamptz,
  onboarded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists daily_available_time integer;
alter table public.profiles add column if not exists workout_preference jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists subscription_plan public.subscription_plan_t not null default 'free';
alter table public.profiles add column if not exists streak integer not null default 0;
alter table public.profiles add column if not exists progress_percentage numeric(5,2) not null default 0;
alter table public.profiles add column if not exists total_completed_days integer not null default 0;
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists is_admin boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'plan_amount'
  ) then
    update public.profiles
    set subscription_plan = case
      when coalesce(plan_amount, 0) = 49 then 'intermediate_49'::public.subscription_plan_t
      when coalesce(plan_amount, 0) = 99 then 'btech_99'::public.subscription_plan_t
      else subscription_plan
    end
    where subscription_plan = 'free';
  end if;
end
$$;

create index if not exists idx_profiles_subscription_status on public.profiles(subscription_status);
create index if not exists idx_profiles_subscription_plan on public.profiles(subscription_plan);
create index if not exists idx_profiles_branch on public.profiles(branch);
create index if not exists idx_profiles_last_active_at on public.profiles(last_active_at desc);
create index if not exists idx_profiles_created_at on public.profiles(created_at desc);

drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Onboarding
-- ---------------------------------------------------------------------------

create table if not exists public.onboarding_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text,
  age integer,
  gender text,
  occupation text,
  field_of_study text,
  daily_time_min integer,
  skill_level text,
  main_goal text,
  main_goal_other text,
  interests text[] not null default '{}',
  discipline_preferences text[] not null default '{}',
  health_information jsonb not null default '{}'::jsonb,
  workout_type text,
  productivity_preferences jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id)
);

alter table public.onboarding_data add column if not exists interests text[] not null default '{}';
alter table public.onboarding_data add column if not exists discipline_preferences text[] not null default '{}';
alter table public.onboarding_data add column if not exists health_information jsonb not null default '{}'::jsonb;
alter table public.onboarding_data add column if not exists workout_type text;
alter table public.onboarding_data add column if not exists productivity_preferences jsonb not null default '{}'::jsonb;
alter table public.onboarding_data add column if not exists version integer not null default 1;
alter table public.onboarding_data add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists idx_onboarding_user_id on public.onboarding_data(user_id);

drop trigger if exists trg_onboarding_touch_updated_at on public.onboarding_data;
create trigger trg_onboarding_touch_updated_at
before update on public.onboarding_data
for each row
execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- AI personalization / plans
-- ---------------------------------------------------------------------------

create table if not exists public.ai_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text,
  track_id text,
  track_label text,
  version integer not null default 1,
  generated_plan jsonb not null default '{}'::jsonb,
  source_model text,
  status text not null default 'active',
  starts_on date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.ai_plans add column if not exists plan_name text;
alter table public.ai_plans add column if not exists source_model text;
alter table public.ai_plans add column if not exists status text not null default 'active';
alter table public.ai_plans add column if not exists starts_on date;
alter table public.ai_plans add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.ai_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.ai_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 365),
  study_mission text,
  practice_mission text,
  build_mission text,
  workout_mission text,
  discipline_mission text,
  recovery_mission text,
  mission_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(plan_id, day_number)
);

create index if not exists idx_ai_plans_user_id on public.ai_plans(user_id, created_at desc);
create index if not exists idx_ai_plan_days_user_day on public.ai_plan_days(user_id, day_number);
create index if not exists idx_ai_plan_days_plan_day on public.ai_plan_days(plan_id, day_number);

drop trigger if exists trg_ai_plans_touch_updated_at on public.ai_plans;
create trigger trg_ai_plans_touch_updated_at
before update on public.ai_plans
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_ai_plan_days_touch_updated_at on public.ai_plan_days;
create trigger trg_ai_plan_days_touch_updated_at
before update on public.ai_plan_days
for each row
execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Progress + daily mission tracking
-- ---------------------------------------------------------------------------

create table if not exists public.user_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_day integer not null default 1,
  completed_days integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  consistency_percentage numeric(5,2) not null default 0,
  active_day integer not null default 1,
  last_completed_date date,
  xp_points integer not null default 0,
  total_points integer not null default 0,
  premium_unlocked boolean not null default false,
  mission_completion_status jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_progress add column if not exists consistency_percentage numeric(5,2) not null default 0;
alter table public.user_progress add column if not exists active_day integer not null default 1;
alter table public.user_progress add column if not exists xp_points integer not null default 0;
alter table public.user_progress add column if not exists total_points integer not null default 0;
alter table public.user_progress add column if not exists premium_unlocked boolean not null default false;
alter table public.user_progress add column if not exists mission_completion_status jsonb not null default '{}'::jsonb;
alter table public.user_progress add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.user_progress_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_day_id uuid references public.ai_plan_days(id) on delete set null,
  day_number integer not null,
  study_completed boolean not null default false,
  practice_completed boolean not null default false,
  build_completed boolean not null default false,
  workout_completed boolean not null default false,
  discipline_completed boolean not null default false,
  recovery_completed boolean not null default false,
  completion_percentage numeric(5,2) not null default 0,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, day_number)
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day integer not null check (day between 1 and 365),
  completed boolean not null default false,
  study_completed boolean not null default false,
  practice_completed boolean not null default false,
  build_completed boolean not null default false,
  workout_completed boolean not null default false,
  discipline_completed boolean not null default false,
  recovery_completed boolean not null default false,
  workout_minutes integer not null default 0,
  discipline_score integer not null default 0 check (discipline_score between 0 and 100),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, day)
);

alter table public.daily_logs add column if not exists study_completed boolean not null default false;
alter table public.daily_logs add column if not exists practice_completed boolean not null default false;
alter table public.daily_logs add column if not exists build_completed boolean not null default false;
alter table public.daily_logs add column if not exists workout_completed boolean not null default false;
alter table public.daily_logs add column if not exists discipline_completed boolean not null default false;
alter table public.daily_logs add column if not exists recovery_completed boolean not null default false;
alter table public.daily_logs add column if not exists workout_minutes integer not null default 0;
alter table public.daily_logs add column if not exists discipline_score integer not null default 0;
alter table public.daily_logs add column if not exists notes text;
alter table public.daily_logs add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null,
  reference_table text,
  reference_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.xp_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null,
  points integer not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_progress_days_user_day on public.user_progress_days(user_id, day_number);
create index if not exists idx_daily_logs_user_day on public.daily_logs(user_id, day);
create index if not exists idx_daily_logs_user_completed_at on public.daily_logs(user_id, completed_at desc);
create index if not exists idx_activity_log_user_created on public.activity_log(user_id, created_at desc);
create index if not exists idx_xp_log_user_created on public.xp_log(user_id, created_at desc);

drop trigger if exists trg_user_progress_touch_updated_at on public.user_progress;
create trigger trg_user_progress_touch_updated_at
before update on public.user_progress
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_user_progress_days_touch_updated_at on public.user_progress_days;
create trigger trg_user_progress_days_touch_updated_at
before update on public.user_progress_days
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_daily_logs_touch_updated_at on public.daily_logs;
create trigger trg_daily_logs_touch_updated_at
before update on public.daily_logs
for each row
execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Workout system
-- ---------------------------------------------------------------------------

create table if not exists public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text,
  mode public.workout_mode_t not null default 'home',
  difficulty public.difficulty_t not null default 'beginner',
  duration_weeks integer not null default 4,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.workout_programs(id) on delete cascade,
  day_number integer not null,
  title text not null,
  focus_area text,
  estimated_minutes integer,
  recovery_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(program_id, day_number)
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_name text not null,
  sets integer,
  reps text,
  duration_seconds integer,
  rest_seconds integer,
  equipment text,
  sort_order integer not null default 0,
  instructions text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_mode public.workout_mode_t not null default 'home',
  preferred_difficulty public.difficulty_t not null default 'beginner',
  available_equipment text[] not null default '{}',
  injuries jsonb not null default '[]'::jsonb,
  preferred_days integer[] not null default '{}',
  preferred_duration_minutes integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_workout_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.workout_programs(id) on delete cascade,
  workout_day_id uuid references public.workout_days(id) on delete set null,
  completed boolean not null default false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, program_id, workout_day_id)
);

create index if not exists idx_workout_programs_mode_difficulty on public.workout_programs(mode, difficulty);
create index if not exists idx_workout_days_program_day on public.workout_days(program_id, day_number);
create index if not exists idx_workout_exercises_day_sort on public.workout_exercises(workout_day_id, sort_order);
create index if not exists idx_user_workout_progress_user_program on public.user_workout_progress(user_id, program_id);

drop trigger if exists trg_workout_programs_touch_updated_at on public.workout_programs;
create trigger trg_workout_programs_touch_updated_at
before update on public.workout_programs
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_workout_days_touch_updated_at on public.workout_days;
create trigger trg_workout_days_touch_updated_at
before update on public.workout_days
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_workout_exercises_touch_updated_at on public.workout_exercises;
create trigger trg_workout_exercises_touch_updated_at
before update on public.workout_exercises
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_workout_preferences_touch_updated_at on public.workout_preferences;
create trigger trg_workout_preferences_touch_updated_at
before update on public.workout_preferences
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_user_workout_progress_touch_updated_at on public.user_workout_progress;
create trigger trg_user_workout_progress_touch_updated_at
before update on public.user_workout_progress
for each row
execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Payment, subscriptions, premium control
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan public.subscription_plan_t not null,
  status public.subscription_status_t not null default 'pending',
  starts_at timestamptz,
  expires_at timestamptz,
  auto_renew boolean not null default false,
  source text not null default 'manual_utr',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount integer not null default 0,
  currency text not null default 'INR',
  provider text not null default 'manual',
  provider_payment_id text,
  provider_order_id text,
  provider_signature text,
  utr_number text,
  status public.payment_status_t not null default 'pending',
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.utr_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  utr_number text not null,
  plan_amount integer not null default 0,
  plan_type public.subscription_plan_t not null default 'free',
  status public.payment_status_t not null default 'pending',
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  rejection_reason text,
  payment_id uuid references public.payments(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.utr_logs add column if not exists plan_type public.subscription_plan_t not null default 'free';
alter table public.utr_logs add column if not exists submitted_at timestamptz not null default timezone('utc', now());
alter table public.utr_logs add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.utr_logs add column if not exists payment_id uuid references public.payments(id) on delete set null;
alter table public.utr_logs add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.utr_logs
set plan_type = case
  when coalesce(plan_amount, 0) = 49 then 'intermediate_49'::public.subscription_plan_t
  when coalesce(plan_amount, 0) = 99 then 'btech_99'::public.subscription_plan_t
  else 'free'::public.subscription_plan_t
end
where plan_type = 'free';

create index if not exists idx_subscriptions_user_status on public.subscriptions(user_id, status);
create index if not exists idx_subscriptions_expires_at on public.subscriptions(expires_at);
create index if not exists idx_payments_user_status on public.payments(user_id, status, created_at desc);
create unique index if not exists idx_payments_provider_payment_id on public.payments(provider_payment_id)
where provider_payment_id is not null;
create index if not exists idx_utr_logs_user_status on public.utr_logs(user_id, status, created_at desc);
create unique index if not exists idx_utr_logs_utr_number_unique on public.utr_logs(utr_number);
create index if not exists idx_utr_logs_pending_created on public.utr_logs(status, created_at desc);

drop trigger if exists trg_subscriptions_touch_updated_at on public.subscriptions;
create trigger trg_subscriptions_touch_updated_at
before update on public.subscriptions
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_payments_touch_updated_at on public.payments;
create trigger trg_payments_touch_updated_at
before update on public.payments
for each row
execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Admin / Sensei / analytics
-- ---------------------------------------------------------------------------

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  action public.admin_action_t not null,
  target_table text,
  target_id uuid,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rejection_logs (
  id uuid primary key default gen_random_uuid(),
  utr_log_id uuid references public.utr_logs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  admin_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analytics_daily (
  day date primary key,
  total_users integer not null default 0,
  active_users integer not null default 0,
  daily_active_users integer not null default 0,
  premium_conversions integer not null default 0,
  workout_completions integer not null default 0,
  revenue integer not null default 0,
  branch_distribution jsonb not null default '{}'::jsonb,
  plan_distribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_actions_admin_created on public.admin_actions(admin_user_id, created_at desc);
create index if not exists idx_admin_actions_target_user on public.admin_actions(target_user_id, created_at desc);
create index if not exists idx_rejection_logs_user_created on public.rejection_logs(user_id, created_at desc);

drop trigger if exists trg_analytics_daily_touch_updated_at on public.analytics_daily;
create trigger trg_analytics_daily_touch_updated_at
before update on public.analytics_daily
for each row
execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Derived stats / synchronization functions
-- ---------------------------------------------------------------------------

create or replace function public.sync_profile_progress(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completed_days integer := 0;
  v_progress_percentage numeric(5,2) := 0;
  v_streak integer := 0;
  v_last_completed date;
  v_active boolean := false;
begin
  select
    coalesce(up.completed_days, 0),
    coalesce(up.current_streak, 0),
    up.last_completed_date,
    coalesce(up.premium_unlocked, false)
  into v_completed_days, v_streak, v_last_completed, v_active
  from public.user_progress up
  where up.user_id = p_user_id;

  v_progress_percentage := least(100, round((v_completed_days::numeric / 30::numeric) * 100, 2));

  update public.profiles
     set total_completed_days = v_completed_days,
         streak = v_streak,
         progress_percentage = v_progress_percentage,
         last_active_at = coalesce(last_active_at, timezone('utc', now()))
   where id = p_user_id;

  update public.user_progress
     set premium_unlocked = (
       select public.current_subscription_is_active(subscription_status, expiry_date)
       from public.profiles
       where id = p_user_id
     )
   where user_id = p_user_id;
end;
$$;

create or replace function public.log_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completed_days integer;
  v_last_completed date;
  v_current_streak integer := 0;
  v_longest_streak integer := 0;
  v_consistency numeric(5,2) := 0;
begin
  select count(*), max(day)
    into v_completed_days, v_last_completed
  from public.daily_logs
  where user_id = new.user_id
    and completed = true;

  select coalesce(max(current_streak), 0), coalesce(max(longest_streak), 0)
    into v_current_streak, v_longest_streak
  from public.user_progress
  where user_id = new.user_id;

  if v_completed_days > 0 then
    v_consistency := round((v_completed_days::numeric / greatest(new.day, 1)::numeric) * 100, 2);
  end if;

  insert into public.user_progress (
    user_id,
    current_day,
    completed_days,
    current_streak,
    longest_streak,
    consistency_percentage,
    active_day,
    last_completed_date
  )
  values (
    new.user_id,
    greatest(new.day + 1, 1),
    v_completed_days,
    v_current_streak,
    greatest(v_current_streak, v_longest_streak),
    v_consistency,
    greatest(new.day, 1),
    v_last_completed
  )
  on conflict (user_id) do update
  set current_day = excluded.current_day,
      completed_days = excluded.completed_days,
      current_streak = excluded.current_streak,
      longest_streak = greatest(public.user_progress.longest_streak, excluded.longest_streak),
      consistency_percentage = excluded.consistency_percentage,
      active_day = excluded.active_day,
      last_completed_date = excluded.last_completed_date,
      updated_at = timezone('utc', now());

  perform public.sync_profile_progress(new.user_id);

  insert into public.activity_log(user_id, activity_type, reference_table, reference_id, payload)
  values (
    new.user_id,
    case when new.completed then 'day_completed' else 'day_updated' end,
    'daily_logs',
    new.id,
    jsonb_build_object('day', new.day, 'completed', new.completed)
  );

  return new;
end;
$$;

drop trigger if exists trg_daily_logs_log_progress on public.daily_logs;
create trigger trg_daily_logs_log_progress
after insert or update on public.daily_logs
for each row
execute function public.log_progress();

create or replace function public.touch_subscription_state(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_subscription record;
begin
  update public.profiles
     set subscription_status = 'expired'
   where id = p_user_id
     and subscription_status = 'active'
     and expiry_date is not null
     and expiry_date <= now();

  select *
    into v_active_subscription
  from public.subscriptions
  where user_id = p_user_id
    and status = 'active'
    and expires_at > now()
  order by expires_at desc
  limit 1;

  if found then
    update public.profiles
       set subscription_status = 'active',
           subscription_plan = v_active_subscription.plan,
           expiry_date = v_active_subscription.expires_at
     where id = p_user_id;
  end if;

  perform public.sync_profile_progress(p_user_id);
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
  update public.subscriptions
     set status = 'expired',
         updated_at = timezone('utc', now())
   where status = 'active'
     and expires_at is not null
     and expires_at <= now();

  update public.profiles
     set subscription_status = 'expired'
   where subscription_status = 'active'
     and expiry_date is not null
     and expiry_date <= now();

  get diagnostics affected = row_count;
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
  v_row public.utr_logs%rowtype;
  v_subscription_id uuid;
  v_payment_id uuid;
  v_plan public.subscription_plan_t;
  v_amount integer;
  v_expires_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select *
    into v_row
  from public.utr_logs
  where id = p_utr_id
  for update;

  if not found then
    raise exception 'utr not found';
  end if;

  v_amount := coalesce(v_row.plan_amount, 0);
  v_plan := case
    when v_amount = 49 then 'intermediate_49'::public.subscription_plan_t
    when v_amount = 99 then 'btech_99'::public.subscription_plan_t
    else coalesce(v_row.plan_type, 'free'::public.subscription_plan_t)
  end;
  v_expires_at := timezone('utc', now()) + interval '30 days';

  insert into public.subscriptions (
    user_id,
    plan,
    status,
    starts_at,
    expires_at,
    source,
    metadata
  )
  values (
    v_row.user_id,
    v_plan,
    'active',
    timezone('utc', now()),
    v_expires_at,
    'manual_utr',
    jsonb_build_object('approved_utr_id', v_row.id)
  )
  returning id into v_subscription_id;

  insert into public.payments (
    user_id,
    subscription_id,
    amount,
    provider,
    utr_number,
    status,
    paid_at,
    metadata
  )
  values (
    v_row.user_id,
    v_subscription_id,
    v_amount,
    'manual',
    v_row.utr_number,
    'approved',
    timezone('utc', now()),
    jsonb_build_object('approved_utr_id', v_row.id)
  )
  returning id into v_payment_id;

  update public.utr_logs
     set status = 'approved',
         reviewed_at = timezone('utc', now()),
         reviewed_by = auth.uid(),
         payment_id = v_payment_id,
         plan_type = v_plan
   where id = v_row.id;

  update public.profiles
     set subscription_status = 'active',
         subscription_plan = v_plan,
         expiry_date = v_expires_at,
         last_active_at = timezone('utc', now())
   where id = v_row.user_id;

  update public.user_progress
     set premium_unlocked = true,
         updated_at = timezone('utc', now())
   where user_id = v_row.user_id;

  insert into public.admin_actions(admin_user_id, target_user_id, action, target_table, target_id, payload)
  values (
    auth.uid(),
    v_row.user_id,
    'approve_utr',
    'utr_logs',
    v_row.id,
    jsonb_build_object('amount', v_amount, 'plan', v_plan)
  );

  perform public.sync_profile_progress(v_row.user_id);
end;
$$;

create or replace function public.reject_utr(
  p_utr_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.utr_logs%rowtype;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select *
    into v_row
  from public.utr_logs
  where id = p_utr_id
  for update;

  if not found then
    raise exception 'utr not found';
  end if;

  update public.utr_logs
     set status = 'rejected',
         reviewed_at = timezone('utc', now()),
         reviewed_by = auth.uid(),
         rejection_reason = coalesce(p_reason, rejection_reason)
   where id = v_row.id;

  update public.profiles
     set subscription_status = 'inactive'
   where id = v_row.user_id
     and subscription_status <> 'active';

  insert into public.rejection_logs(utr_log_id, user_id, admin_user_id, reason)
  values (v_row.id, v_row.user_id, auth.uid(), coalesce(p_reason, 'Verification failed'));

  insert into public.admin_actions(admin_user_id, target_user_id, action, target_table, target_id, reason)
  values (auth.uid(), v_row.user_id, 'reject_utr', 'utr_logs', v_row.id, p_reason);
end;
$$;

create or replace function public.ban_user(p_user_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.profiles
     set subscription_status = 'banned'
   where id = p_user_id;

  insert into public.admin_actions(admin_user_id, target_user_id, action, target_table, target_id, reason)
  values (auth.uid(), p_user_id, 'ban_user', 'profiles', p_user_id, p_reason);
end;
$$;

create or replace function public.reset_progress(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  delete from public.user_progress_days where user_id = p_user_id;
  delete from public.daily_logs where user_id = p_user_id;
  delete from public.activity_log where user_id = p_user_id;
  delete from public.xp_log where user_id = p_user_id;

  insert into public.user_progress(user_id)
  values (p_user_id)
  on conflict (user_id) do update
  set current_day = 1,
      completed_days = 0,
      current_streak = 0,
      longest_streak = 0,
      consistency_percentage = 0,
      active_day = 1,
      last_completed_date = null,
      xp_points = 0,
      total_points = 0,
      mission_completion_status = '{}'::jsonb,
      updated_at = timezone('utc', now());

  update public.profiles
     set streak = 0,
         progress_percentage = 0,
         total_completed_days = 0
   where id = p_user_id;

  insert into public.admin_actions(admin_user_id, target_user_id, action, target_table, target_id)
  values (auth.uid(), p_user_id, 'reset_progress', 'profiles', p_user_id);
end;
$$;

create or replace function public.complete_day(
  p_day int,
  p_study_completed boolean default true,
  p_practice_completed boolean default true,
  p_build_completed boolean default true,
  p_workout_completed boolean default false,
  p_discipline_completed boolean default true,
  p_recovery_completed boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_completed boolean;
  v_points integer := 0;
begin
  if v_uid is null then
    raise exception 'unauthorized';
  end if;

  perform public.touch_subscription_state(v_uid);

  v_completed := p_study_completed
    and p_practice_completed
    and p_build_completed
    and p_discipline_completed;

  insert into public.daily_logs (
    user_id,
    day,
    completed,
    study_completed,
    practice_completed,
    build_completed,
    workout_completed,
    discipline_completed,
    recovery_completed,
    completed_at
  )
  values (
    v_uid,
    p_day,
    v_completed,
    p_study_completed,
    p_practice_completed,
    p_build_completed,
    p_workout_completed,
    p_discipline_completed,
    p_recovery_completed,
    case when v_completed then timezone('utc', now()) else null end
  )
  on conflict (user_id, day) do update
  set completed = excluded.completed,
      study_completed = excluded.study_completed,
      practice_completed = excluded.practice_completed,
      build_completed = excluded.build_completed,
      workout_completed = excluded.workout_completed,
      discipline_completed = excluded.discipline_completed,
      recovery_completed = excluded.recovery_completed,
      completed_at = excluded.completed_at,
      updated_at = timezone('utc', now());

  v_points :=
    (case when p_study_completed then 20 else 0 end) +
    (case when p_practice_completed then 20 else 0 end) +
    (case when p_build_completed then 20 else 0 end) +
    (case when p_workout_completed then 20 else 0 end) +
    (case when p_discipline_completed then 15 else 0 end) +
    (case when p_recovery_completed then 5 else 0 end);

  insert into public.xp_log(user_id, source, points, payload)
  values (
    v_uid,
    'complete_day',
    v_points,
    jsonb_build_object('day', p_day)
  );

  insert into public.user_progress_days (
    user_id,
    day_number,
    study_completed,
    practice_completed,
    build_completed,
    workout_completed,
    discipline_completed,
    recovery_completed,
    completion_percentage,
    completed_at
  )
  values (
    v_uid,
    p_day,
    p_study_completed,
    p_practice_completed,
    p_build_completed,
    p_workout_completed,
    p_discipline_completed,
    p_recovery_completed,
    round(((
      (case when p_study_completed then 1 else 0 end) +
      (case when p_practice_completed then 1 else 0 end) +
      (case when p_build_completed then 1 else 0 end) +
      (case when p_workout_completed then 1 else 0 end) +
      (case when p_discipline_completed then 1 else 0 end) +
      (case when p_recovery_completed then 1 else 0 end)
    )::numeric / 6::numeric) * 100, 2),
    case when v_completed then timezone('utc', now()) else null end
  )
  on conflict (user_id, day_number) do update
  set study_completed = excluded.study_completed,
      practice_completed = excluded.practice_completed,
      build_completed = excluded.build_completed,
      workout_completed = excluded.workout_completed,
      discipline_completed = excluded.discipline_completed,
      recovery_completed = excluded.recovery_completed,
      completion_percentage = excluded.completion_percentage,
      completed_at = excluded.completed_at,
      updated_at = timezone('utc', now());

  update public.user_progress
     set xp_points = coalesce(xp_points, 0) + v_points,
         total_points = coalesce(total_points, 0) + v_points,
         last_completed_date = case when v_completed then current_date else last_completed_date end,
         updated_at = timezone('utc', now())
   where user_id = v_uid;

  perform public.sync_profile_progress(v_uid);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    is_admin,
    subscription_status,
    subscription_plan,
    metadata
  )
  values (
    new.id,
    v_email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(v_email, '@', 1)),
    v_email = 'hrixofficial@gmail.com',
    'pending',
    'free',
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      is_admin = public.profiles.is_admin or excluded.is_admin,
      updated_at = timezone('utc', now());

  insert into public.user_progress(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.onboarding_data(user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(v_email, '@', 1)))
  on conflict (user_id) do nothing;

  insert into public.workout_preferences(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  if auth.uid() <> old.id and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if auth.uid() = old.id and not public.is_admin() then
    if new.is_admin is distinct from old.is_admin
      or new.subscription_status is distinct from old.subscription_status
      or new.subscription_plan is distinct from old.subscription_plan
      or new.expiry_date is distinct from old.expiry_date then
      raise exception 'forbidden protected profile update';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_self_update on public.profiles;
create trigger trg_profiles_guard_self_update
before update on public.profiles
for each row
execute function public.guard_profile_self_update();

create or replace function public.refresh_analytics_daily(p_day date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_users integer := 0;
  v_active_users integer := 0;
  v_daily_active integer := 0;
  v_premium_conversions integer := 0;
  v_workout_completions integer := 0;
  v_revenue integer := 0;
  v_branch_distribution jsonb := '{}'::jsonb;
  v_plan_distribution jsonb := '{}'::jsonb;
begin
  select count(*) into v_total_users from public.profiles;
  select count(*) into v_active_users from public.profiles where subscription_status = 'active';
  select count(distinct user_id) into v_daily_active
  from public.daily_logs
  where created_at::date = p_day;
  select count(distinct user_id) into v_premium_conversions
  from public.utr_logs
  where status = 'approved'
    and reviewed_at::date = p_day;
  select count(*) into v_workout_completions
  from public.daily_logs
  where workout_completed = true
    and coalesce(completed_at::date, created_at::date) = p_day;
  select coalesce(sum(amount), 0) into v_revenue
  from public.payments
  where status = 'approved'
    and coalesce(paid_at::date, created_at::date) = p_day;

  select coalesce(jsonb_object_agg(branch_key, branch_count), '{}'::jsonb)
    into v_branch_distribution
  from (
    select coalesce(nullif(branch, ''), 'unassigned') as branch_key, count(*) as branch_count
    from public.profiles
    group by 1
  ) s;

  select coalesce(jsonb_object_agg(plan_key, plan_count), '{}'::jsonb)
    into v_plan_distribution
  from (
    select subscription_plan::text as plan_key, count(*) as plan_count
    from public.profiles
    group by 1
  ) s;

  insert into public.analytics_daily (
    day,
    total_users,
    active_users,
    daily_active_users,
    premium_conversions,
    workout_completions,
    revenue,
    branch_distribution,
    plan_distribution
  )
  values (
    p_day,
    v_total_users,
    v_active_users,
    v_daily_active,
    v_premium_conversions,
    v_workout_completions,
    v_revenue,
    v_branch_distribution,
    v_plan_distribution
  )
  on conflict (day) do update
  set total_users = excluded.total_users,
      active_users = excluded.active_users,
      daily_active_users = excluded.daily_active_users,
      premium_conversions = excluded.premium_conversions,
      workout_completions = excluded.workout_completions,
      revenue = excluded.revenue,
      branch_distribution = excluded.branch_distribution,
      plan_distribution = excluded.plan_distribution,
      updated_at = timezone('utc', now());
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.onboarding_data enable row level security;
alter table public.ai_plans enable row level security;
alter table public.ai_plan_days enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_progress_days enable row level security;
alter table public.daily_logs enable row level security;
alter table public.activity_log enable row level security;
alter table public.xp_log enable row level security;
alter table public.workout_programs enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_preferences enable row level security;
alter table public.user_workout_progress enable row level security;
alter table public.utr_logs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.admin_actions enable row level security;
alter table public.rejection_logs enable row level security;
alter table public.analytics_daily enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles for select
using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists onboarding_select_own_or_admin on public.onboarding_data;
create policy onboarding_select_own_or_admin
on public.onboarding_data for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists onboarding_insert_own on public.onboarding_data;
create policy onboarding_insert_own
on public.onboarding_data for insert
with check (auth.uid() = user_id);

drop policy if exists onboarding_update_own_or_admin on public.onboarding_data;
create policy onboarding_update_own_or_admin
on public.onboarding_data for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_plans_select_own_or_admin on public.ai_plans;
create policy ai_plans_select_own_or_admin
on public.ai_plans for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_plans_insert_admin_or_owner on public.ai_plans;
create policy ai_plans_insert_admin_or_owner
on public.ai_plans for insert
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_plans_update_admin_or_owner on public.ai_plans;
create policy ai_plans_update_admin_or_owner
on public.ai_plans for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_plan_days_select_own_or_admin on public.ai_plan_days;
create policy ai_plan_days_select_own_or_admin
on public.ai_plan_days for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_plan_days_insert_admin_or_owner on public.ai_plan_days;
create policy ai_plan_days_insert_admin_or_owner
on public.ai_plan_days for insert
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_plan_days_update_admin_or_owner on public.ai_plan_days;
create policy ai_plan_days_update_admin_or_owner
on public.ai_plan_days for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists user_progress_select_own_or_admin on public.user_progress;
create policy user_progress_select_own_or_admin
on public.user_progress for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists user_progress_insert_own on public.user_progress;
create policy user_progress_insert_own
on public.user_progress for insert
with check (auth.uid() = user_id);

drop policy if exists user_progress_update_own_or_admin on public.user_progress;
create policy user_progress_update_own_or_admin
on public.user_progress for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists user_progress_days_select_own_or_admin on public.user_progress_days;
create policy user_progress_days_select_own_or_admin
on public.user_progress_days for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists user_progress_days_insert_own on public.user_progress_days;
create policy user_progress_days_insert_own
on public.user_progress_days for insert
with check (auth.uid() = user_id);

drop policy if exists user_progress_days_update_own_or_admin on public.user_progress_days;
create policy user_progress_days_update_own_or_admin
on public.user_progress_days for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists daily_logs_select_own_or_admin on public.daily_logs;
create policy daily_logs_select_own_or_admin
on public.daily_logs for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists daily_logs_insert_own on public.daily_logs;
create policy daily_logs_insert_own
on public.daily_logs for insert
with check (auth.uid() = user_id);

drop policy if exists daily_logs_update_own_or_admin on public.daily_logs;
create policy daily_logs_update_own_or_admin
on public.daily_logs for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists activity_log_select_own_or_admin on public.activity_log;
create policy activity_log_select_own_or_admin
on public.activity_log for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists xp_log_select_own_or_admin on public.xp_log;
create policy xp_log_select_own_or_admin
on public.xp_log for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists workout_programs_select_all on public.workout_programs;
create policy workout_programs_select_all
on public.workout_programs for select
using (true);

drop policy if exists workout_programs_admin_write on public.workout_programs;
create policy workout_programs_admin_write
on public.workout_programs for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists workout_days_select_all on public.workout_days;
create policy workout_days_select_all
on public.workout_days for select
using (true);

drop policy if exists workout_days_admin_write on public.workout_days;
create policy workout_days_admin_write
on public.workout_days for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists workout_exercises_select_all on public.workout_exercises;
create policy workout_exercises_select_all
on public.workout_exercises for select
using (true);

drop policy if exists workout_exercises_admin_write on public.workout_exercises;
create policy workout_exercises_admin_write
on public.workout_exercises for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists workout_preferences_select_own_or_admin on public.workout_preferences;
create policy workout_preferences_select_own_or_admin
on public.workout_preferences for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists workout_preferences_insert_own on public.workout_preferences;
create policy workout_preferences_insert_own
on public.workout_preferences for insert
with check (auth.uid() = user_id);

drop policy if exists workout_preferences_update_own_or_admin on public.workout_preferences;
create policy workout_preferences_update_own_or_admin
on public.workout_preferences for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists user_workout_progress_select_own_or_admin on public.user_workout_progress;
create policy user_workout_progress_select_own_or_admin
on public.user_workout_progress for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists user_workout_progress_insert_own on public.user_workout_progress;
create policy user_workout_progress_insert_own
on public.user_workout_progress for insert
with check (auth.uid() = user_id);

drop policy if exists user_workout_progress_update_own_or_admin on public.user_workout_progress;
create policy user_workout_progress_update_own_or_admin
on public.user_workout_progress for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists utr_logs_select_own_or_admin on public.utr_logs;
create policy utr_logs_select_own_or_admin
on public.utr_logs for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists utr_logs_insert_own on public.utr_logs;
create policy utr_logs_insert_own
on public.utr_logs for insert
with check (auth.uid() = user_id);

drop policy if exists utr_logs_update_admin on public.utr_logs;
create policy utr_logs_update_admin
on public.utr_logs for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists subscriptions_select_own_or_admin on public.subscriptions;
create policy subscriptions_select_own_or_admin
on public.subscriptions for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists subscriptions_insert_admin on public.subscriptions;
create policy subscriptions_insert_admin
on public.subscriptions for insert
with check (public.is_admin());

drop policy if exists subscriptions_update_admin on public.subscriptions;
create policy subscriptions_update_admin
on public.subscriptions for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists payments_select_own_or_admin on public.payments;
create policy payments_select_own_or_admin
on public.payments for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists payments_insert_admin on public.payments;
create policy payments_insert_admin
on public.payments for insert
with check (public.is_admin());

drop policy if exists payments_update_admin on public.payments;
create policy payments_update_admin
on public.payments for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists admin_actions_admin_only on public.admin_actions;
create policy admin_actions_admin_only
on public.admin_actions for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists rejection_logs_select_admin_or_owner on public.rejection_logs;
create policy rejection_logs_select_admin_or_owner
on public.rejection_logs for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists rejection_logs_insert_admin on public.rejection_logs;
create policy rejection_logs_insert_admin
on public.rejection_logs for insert
with check (public.is_admin());

drop policy if exists analytics_daily_admin_only on public.analytics_daily;
create policy analytics_daily_admin_only
on public.analytics_daily for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'daily_logs'
    ) then
      alter publication supabase_realtime add table public.daily_logs;
    end if;
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'user_progress'
    ) then
      alter publication supabase_realtime add table public.user_progress;
    end if;
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'user_progress_days'
    ) then
      alter publication supabase_realtime add table public.user_progress_days;
    end if;
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'utr_logs'
    ) then
      alter publication supabase_realtime add table public.utr_logs;
    end if;
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'subscriptions'
    ) then
      alter publication supabase_realtime add table public.subscriptions;
    end if;
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'payments'
    ) then
      alter publication supabase_realtime add table public.payments;
    end if;
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'activity_log'
    ) then
      alter publication supabase_realtime add table public.activity_log;
    end if;
    if not exists (
      select 1
      from pg_publication_rel pr
      join pg_class c on c.oid = pr.prrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_publication p on p.oid = pr.prpubid
      where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'analytics_daily'
    ) then
      alter publication supabase_realtime add table public.analytics_daily;
    end if;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Grants for authenticated runtime
-- ---------------------------------------------------------------------------

revoke all on function public.private_is_admin(uuid) from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_subscription_is_active(text, timestamptz) to authenticated;
grant execute on function public.touch_all_expired_subscriptions() to authenticated;
grant execute on function public.complete_day(int, boolean, boolean, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.approve_utr(uuid) to authenticated;
grant execute on function public.reject_utr(uuid, text) to authenticated;
grant execute on function public.ban_user(uuid, text) to authenticated;
grant execute on function public.reset_progress(uuid) to authenticated;
grant execute on function public.refresh_analytics_daily(date) to authenticated;

commit;
