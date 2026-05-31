-- 0011_subscription_expiry_maintenance.sql
--
-- Keeps subscription status aligned with expiry_date for admin reporting.

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
  return affected;
end;
$$;

revoke all on function public.touch_all_expired_subscriptions() from public;
grant execute on function public.touch_all_expired_subscriptions() to authenticated;
