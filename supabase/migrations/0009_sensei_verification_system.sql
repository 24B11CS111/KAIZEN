-- 0009_sensei_verification_system.sql
--
-- Sensei verification hardening:
--   * explicit admin flag on profiles
--   * optional rejection reason on utr_logs
--   * stronger admin detection
--   * approval / rejection functions aligned with the KAIZEN admin workflow

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles
set is_admin = true
where role = 'admin';

create index if not exists profiles_is_admin_idx on public.profiles (is_admin);

alter table public.utr_logs
  add column if not exists rejection_reason text;

create or replace function public.sync_profile_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin = true then
    new.role := 'admin';
  elsif new.role = 'admin' then
    new.is_admin := true;
  else
    new.is_admin := false;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_admin_sync on public.profiles;
create trigger profiles_admin_sync
before insert or update of role, is_admin on public.profiles
for each row execute function public.sync_profile_admin_fields();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (role = 'admin' or is_admin = true)
  );
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
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select user_id, plan_amount
    into v_user, v_amount
  from public.utr_logs
  where id = p_utr_id
    and status = 'pending'
  for update;

  if v_user is null then
    raise exception 'utr not found or already reviewed';
  end if;

  update public.utr_logs
    set status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        rejection_reason = null
  where id = p_utr_id;

  update public.profiles
    set subscription_status = 'active',
        plan_amount = v_amount,
        start_date = now(),
        expiry_date = now() + interval '30 days'
  where id = v_user;

  delete from public.user_progress_days where user_id = v_user;
  delete from public.daily_logs where user_id = v_user;
  delete from public.progress_logs where user_id = v_user;
  delete from public.user_progress where user_id = v_user;

  insert into public.user_progress (
    user_id,
    current_day,
    completed_days,
    streak,
    longest_streak,
    last_completed_date,
    updated_at
  )
  values (v_user, 1, '{}'::int[], 0, 0, null, now())
  on conflict (user_id) do update
    set current_day = 1,
        completed_days = '{}'::int[],
        streak = 0,
        longest_streak = 0,
        last_completed_date = null,
        updated_at = now();

  insert into public.streaks (
    user_id,
    current_streak,
    longest_streak,
    last_completed_date,
    updated_at
  )
  values (v_user, 0, 0, null, now())
  on conflict (user_id) do update
    set current_streak = 0,
        longest_streak = 0,
        last_completed_date = null,
        updated_at = now();
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
  v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select user_id
    into v_user
  from public.utr_logs
  where id = p_utr_id
    and status = 'pending'
  for update;

  if v_user is null then
    raise exception 'utr not found or already reviewed';
  end if;

  update public.utr_logs
    set status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        rejection_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_utr_id;

  update public.profiles
    set subscription_status = 'rejected'
  where id = v_user;
end;
$$;
