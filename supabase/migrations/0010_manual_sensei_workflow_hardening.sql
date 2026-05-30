-- 0010_manual_sensei_workflow_hardening.sql
--
-- Final hardening for the manual Sensei approval workflow.
-- Prevent normal users from self-activating premium fields on their own
-- profile row even though they are still allowed to edit safe identity
-- fields such as full_name / whatsapp during onboarding.

create or replace function public.guard_profile_self_update()
returns trigger
language plpgsql
as $$
begin
  -- Service-role writes are trusted and are used by server routes.
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- Admins can manage the full row.
  if public.is_admin() then
    return new;
  end if;

  -- For non-admin users, block writes to protected subscription/admin fields.
  if auth.uid() = old.id then
    if new.role is distinct from old.role
      or new.is_admin is distinct from old.is_admin
      or new.subscription_status is distinct from old.subscription_status
      or new.plan_amount is distinct from old.plan_amount
      or new.start_date is distinct from old.start_date
      or new.expiry_date is distinct from old.expiry_date then
      raise exception 'forbidden_profile_update';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_self_update on public.profiles;
create trigger profiles_guard_self_update
before update on public.profiles
for each row
execute function public.guard_profile_self_update();
