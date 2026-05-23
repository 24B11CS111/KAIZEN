-- =============================================================
-- KAIZEN.SYS - Onboarding migration
--
-- Adds:
--   1. Onboarding-related columns to public.profiles
--   2. public.onboarding_data table for the full questionnaire snapshot
--   3. Helpful enums + RLS policies + indexes
--
-- Idempotent: safe to run on an existing DB. Will NOT touch
-- pre-existing rows; just extends the schema.
-- =============================================================

-- ===== 1. ENUMS =====
do $$ begin
  create type gender_t as enum ('male','female','non_binary','prefer_not_to_say');
exception when duplicate_object then null; end $$;

do $$ begin
  create type occupation_t as enum (
    'school_student',
    'intermediate_student',
    'college_student',
    'working_professional',
    'job_seeker',
    'self_employed',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type skill_level_t as enum ('beginner','intermediate','advanced');
exception when duplicate_object then null; end $$;

do $$ begin
  create type main_goal_t as enum (
    'crack_placements',
    'full_stack_dev',
    'improve_discipline',
    'aiml_mastery',
    'build_projects',
    'learn_programming',
    'prepare_exams',
    'other'
  );
exception when duplicate_object then null; end $$;

-- ===== 2. PROFILES ADDITIONS =====
alter table public.profiles add column if not exists age              int;
alter table public.profiles add column if not exists gender           gender_t;
alter table public.profiles add column if not exists occupation       occupation_t;
alter table public.profiles add column if not exists field_of_study   text;
alter table public.profiles add column if not exists daily_time_min   int;
alter table public.profiles add column if not exists skill_level      skill_level_t;
alter table public.profiles add column if not exists main_goal        main_goal_t;
alter table public.profiles add column if not exists onboarded_at     timestamptz;

-- Defensive check constraints
do $$ begin
  alter table public.profiles
    add constraint profiles_age_range_chk check (age is null or (age between 10 and 120));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_daily_time_chk check (daily_time_min is null or daily_time_min between 15 and 600);
exception when duplicate_object then null; end $$;

-- ===== 3. ONBOARDING_DATA TABLE =====
-- Stores the full structured snapshot of the questionnaire so we can
-- evolve UX over time without losing the original answers. One row per
-- completion; latest row wins for display purposes.
create table if not exists public.onboarding_data (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,

  full_name         text not null,
  age               int  not null check (age between 10 and 120),
  gender            gender_t not null,
  occupation        occupation_t not null,
  field_of_study    text not null,
  daily_time_min    int  not null check (daily_time_min between 15 and 600),
  skill_level       skill_level_t not null,
  main_goal         main_goal_t not null,
  main_goal_other   text,

  source            text default 'web',
  raw               jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists onboarding_data_user_idx
  on public.onboarding_data (user_id, created_at desc);

-- ===== 4. RLS =====
alter table public.onboarding_data enable row level security;

drop policy if exists onb_select_own on public.onboarding_data;
drop policy if exists onb_insert_own on public.onboarding_data;
drop policy if exists onb_admin_read on public.onboarding_data;

create policy onb_select_own on public.onboarding_data
  for select using (auth.uid() = user_id);

create policy onb_insert_own on public.onboarding_data
  for insert with check (auth.uid() = user_id);

create policy onb_admin_read on public.onboarding_data
  for select using (public.is_admin());

-- ===== 5. CONVENIENCE: is_onboarded() helper =====
create or replace function public.is_onboarded(p_user_id uuid default auth.uid())
returns boolean
language sql stable as $$
  select coalesce(
    (select onboarded_at is not null from public.profiles where id = p_user_id),
    false
  );
$$;

grant execute on function public.is_onboarded(uuid) to authenticated;

-- =============================================================
-- DONE.
-- Verify with:
--   select column_name from information_schema.columns
--     where table_schema='public' and table_name='profiles'
--     and column_name in ('age','gender','occupation','main_goal','onboarded_at');
--   select count(*) from public.onboarding_data;
-- =============================================================
