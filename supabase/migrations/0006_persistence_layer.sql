-- =============================================================
-- KAIZEN.SYS - Persistence + Adaptive Execution Layer
--
-- Aligns the database with the canonical Adaptive Execution spec:
--   1. ai_plans        - the user's generated 30-day plan (JSONB)
--   2. user_progress   - one-row summary per user (fast dashboard read)
--   3. daily_logs      - per-day completion with optional notes
--
-- Strategy:
--   - Rename user_plans -> ai_plans (column plan -> generated_plan)
--   - Rename existing user_progress -> user_progress_days (per-day log)
--   - Create the new user_progress (summary) table
--   - Create daily_logs
--   - Backfill summary + daily_logs from user_progress_days
--   - Update complete_day RPC to maintain all three (+ legacy mirror)
--   - Keep progress_logs / streaks intact for backwards compat
--
-- Idempotent: safe to re-run on a freshly migrated DB.
-- =============================================================

-- ============ 1. ai_plans (rename of user_plans) ============
do $$ begin
  alter table public.user_plans rename to ai_plans;
exception
  when undefined_table then null;       -- already renamed
  when duplicate_table  then null;      -- ai_plans already exists too
end $$;

do $$ begin
  alter table public.ai_plans rename column plan to generated_plan;
exception when undefined_column then null;
       when duplicate_column then null; end $$;

-- Drop & recreate the index/policies under their new names.
drop index  if exists user_plans_user_latest_idx;
drop policy if exists user_plans_select_own on public.ai_plans;
drop policy if exists user_plans_insert_own on public.ai_plans;
drop policy if exists user_plans_admin_read on public.ai_plans;

create index if not exists ai_plans_user_latest_idx
  on public.ai_plans (user_id, created_at desc);

alter table public.ai_plans enable row level security;

drop policy if exists ai_plans_select_own on public.ai_plans;
drop policy if exists ai_plans_insert_own on public.ai_plans;
drop policy if exists ai_plans_admin_read on public.ai_plans;

create policy ai_plans_select_own on public.ai_plans
  for select using (auth.uid() = user_id);
create policy ai_plans_insert_own on public.ai_plans
  for insert with check (auth.uid() = user_id);
create policy ai_plans_admin_read on public.ai_plans
  for select using (public.is_admin());

-- ============ 2. Rename user_progress -> user_progress_days ============
do $$ begin
  -- Only rename if the source still has `day` column (per-day log shape).
  -- The new summary table uses `current_day` so this check prevents
  -- double-renaming on re-runs.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'user_progress'
      and column_name  = 'day'
  ) then
    alter table public.user_progress rename to user_progress_days;
  end if;
exception when undefined_table then null; end $$;

-- Re-index + RLS under the new physical name.
drop index  if exists user_progress_user_idx;
drop index  if exists user_progress_one_per_day_idx;

create index if not exists user_progress_days_user_idx
  on public.user_progress_days (user_id);
create unique index if not exists user_progress_days_one_per_day_idx
  on public.user_progress_days (user_id, ((completed_at at time zone 'UTC')::date));

alter table public.user_progress_days enable row level security;
drop policy if exists up_select_own  on public.user_progress_days;
drop policy if exists up_insert_own  on public.user_progress_days;
drop policy if exists up_admin_read  on public.user_progress_days;
create policy upd_select_own on public.user_progress_days
  for select using (auth.uid() = user_id);
create policy upd_insert_own on public.user_progress_days
  for insert with check (auth.uid() = user_id);
create policy upd_admin_read on public.user_progress_days
  for select using (public.is_admin());

-- ============ 3. user_progress (summary, one row per user) ============
create table if not exists public.user_progress (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  current_day     int  not null default 1   check (current_day between 1 and 31),
  completed_days  int[] not null default '{}'::int[],
  streak          int  not null default 0,
  longest_streak  int  not null default 0,
  last_completed_date date,
  updated_at      timestamptz not null default now()
);

create index if not exists user_progress_updated_idx
  on public.user_progress (updated_at desc);

alter table public.user_progress enable row level security;
drop policy if exists user_progress_select_own on public.user_progress;
drop policy if exists user_progress_admin_read on public.user_progress;
create policy user_progress_select_own on public.user_progress
  for select using (auth.uid() = user_id);
create policy user_progress_admin_read on public.user_progress
  for select using (public.is_admin());

-- touch updated_at trigger
drop trigger if exists user_progress_touch on public.user_progress;
create trigger user_progress_touch before update on public.user_progress
  for each row execute function public.touch_updated_at();

-- ============ 4. daily_logs (per-day completion + notes) ============
create table if not exists public.daily_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  day           int  not null check (day between 1 and 30),
  completed     boolean not null default true,
  notes         text,
  completed_at  timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists daily_logs_user_idx
  on public.daily_logs (user_id, completed_at desc);

alter table public.daily_logs enable row level security;
drop policy if exists daily_logs_select_own on public.daily_logs;
drop policy if exists daily_logs_insert_own on public.daily_logs;
drop policy if exists daily_logs_update_own on public.daily_logs;
drop policy if exists daily_logs_admin_read on public.daily_logs;
create policy daily_logs_select_own on public.daily_logs
  for select using (auth.uid() = user_id);
create policy daily_logs_insert_own on public.daily_logs
  for insert with check (auth.uid() = user_id);
create policy daily_logs_update_own on public.daily_logs
  for update using (auth.uid() = user_id);
create policy daily_logs_admin_read on public.daily_logs
  for select using (public.is_admin());

-- ============ 5. Backfill from user_progress_days ============
-- daily_logs: one row per completed day, no notes.
insert into public.daily_logs (user_id, day, completed, notes, completed_at)
select user_id, day, completed, null, completed_at
from public.user_progress_days
on conflict (user_id, day) do nothing;

-- user_progress summary: aggregate per user.
insert into public.user_progress (
  user_id, current_day, completed_days, streak, longest_streak, last_completed_date, updated_at
)
select
  upd.user_id,
  least(31, coalesce(max(upd.day) filter (where upd.completed), 0) + 1),
  coalesce(array_agg(upd.day order by upd.day) filter (where upd.completed), '{}'::int[]),
  coalesce(s.current_streak, 0),
  coalesce(s.longest_streak, 0),
  s.last_completed_date,
  now()
from public.user_progress_days upd
left join public.streaks s on s.user_id = upd.user_id
group by upd.user_id, s.current_streak, s.longest_streak, s.last_completed_date
on conflict (user_id) do nothing;

-- ============ 6. Trigger: log_progress fires on user_progress_days ============
-- The trigger was created against user_progress in 0000, which is now
-- user_progress_days after the rename. Postgres rebinds triggers to the
-- renamed table automatically, so no recreate is needed. But we re-define
-- here for safety in fresh installs.
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

drop trigger if exists user_progress_log on public.user_progress_days;
create trigger user_progress_log after insert on public.user_progress_days
  for each row execute function public.log_progress();

-- ============ 7. Updated complete_day RPC ============
-- Now writes to user_progress_days + daily_logs + user_progress summary.
-- Accepts an optional notes string.
create or replace function public.complete_day(
  p_day   int,
  p_notes text default null
)
returns table(current_streak int, longest_streak int, current_day int)
language plpgsql security definer set search_path = public as $$
declare
  v_user        uuid := auth.uid();
  v_today       date := (now() at time zone 'UTC')::date;
  v_status      subscription_status_t;
  v_last        date;
  v_current     int;
  v_longest     int;
  v_completed   int[];
  v_next_day    int;
begin
  if v_user is null then raise exception 'unauthorized'; end if;
  if p_day < 1 or p_day > 30 then raise exception 'invalid day'; end if;

  select subscription_status into v_status
    from public.profiles where id = v_user for update;
  if v_status is null or v_status <> 'active' then
    raise exception 'subscription not active';
  end if;

  if exists (
    select 1 from public.user_progress_days
    where user_id = v_user and (completed_at at time zone 'UTC')::date = v_today
  ) then raise exception 'daily limit reached'; end if;

  if exists (
    select 1 from public.user_progress_days where user_id = v_user and day = p_day
  ) then raise exception 'already completed'; end if;

  -- 1. Per-day log (fires the log_progress trigger -> xp_log + activity_log).
  insert into public.user_progress_days (user_id, day, completed, completed_at)
  values (v_user, p_day, true, now());

  -- 2. Legacy mirror (kept for back-compat with older readers).
  insert into public.progress_logs (user_id, day_number, completed, completed_at)
  values (v_user, p_day, true, now())
  on conflict (user_id, day_number) do update
    set completed = true, completed_at = excluded.completed_at;

  -- 3. Daily log with notes.
  insert into public.daily_logs (user_id, day, completed, notes, completed_at)
  values (v_user, p_day, true, p_notes, now())
  on conflict (user_id, day) do update
    set completed = true,
        notes      = coalesce(excluded.notes, public.daily_logs.notes),
        completed_at = excluded.completed_at;

  -- 4. Streak compute (same logic as before).
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

  -- 5. Summary upsert: maintain current_day + completed_days array.
  select coalesce(completed_days, '{}'::int[]) into v_completed
    from public.user_progress where user_id = v_user;
  v_completed := array(
    select distinct unnest(v_completed || array[p_day]) order by 1
  );
  -- Compute next current_day = lowest 1..30 not in completed_days, capped at 31 if all done.
  v_next_day := 31;
  for i in 1..30 loop
    if not (i = any(v_completed)) then v_next_day := i; exit; end if;
  end loop;

  insert into public.user_progress (
    user_id, current_day, completed_days, streak, longest_streak, last_completed_date, updated_at
  )
  values (v_user, v_next_day, v_completed, v_current, v_longest, v_today, now())
  on conflict (user_id) do update set
    current_day         = excluded.current_day,
    completed_days      = excluded.completed_days,
    streak              = excluded.streak,
    longest_streak      = excluded.longest_streak,
    last_completed_date = excluded.last_completed_date,
    updated_at          = now();

  return query select v_current, v_longest, v_next_day;
end;
$$;

revoke all on function public.complete_day(int, text) from public;
grant execute on function public.complete_day(int, text) to authenticated;

-- ============ 8. Realtime publication ============
do $$ begin alter publication supabase_realtime add table public.ai_plans;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.user_progress_days;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.user_progress;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.daily_logs;
exception when others then null; end $$;

-- ============ 9. reset_progress also clears the summary + daily_logs ============
create or replace function public.reset_progress(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  delete from public.user_progress_days where user_id = p_user_id;
  delete from public.daily_logs         where user_id = p_user_id;
  delete from public.progress_logs      where user_id = p_user_id;
  delete from public.user_progress      where user_id = p_user_id;
  update public.streaks
    set current_streak = 0, last_completed_date = null
    where user_id = p_user_id;
end;
$$;

-- =============================================================
-- DONE. Verify with:
--   select table_name from information_schema.tables
--     where table_schema='public'
--       and table_name in ('ai_plans','user_progress','user_progress_days','daily_logs');
--   select column_name from information_schema.columns
--     where table_name='user_progress' and table_schema='public';
--   select count(*) from public.user_progress;
--   select count(*) from public.daily_logs;
-- =============================================================
