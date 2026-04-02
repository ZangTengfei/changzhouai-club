alter table public.members
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists admin_registration_notified_at timestamptz;

update public.members as members
set
  onboarding_completed_at = coalesce(
    members.onboarding_completed_at,
    timezone('utc', now())
  ),
  admin_registration_notified_at = coalesce(
    members.admin_registration_notified_at,
    timezone('utc', now())
  )
from public.profiles as profiles
where profiles.id = members.id
  and nullif(trim(coalesce(profiles.display_name, '')), '') is not null
  and nullif(trim(coalesce(profiles.wechat, '')), '') is not null;
