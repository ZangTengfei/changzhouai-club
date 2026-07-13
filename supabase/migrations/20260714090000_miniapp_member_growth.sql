create table if not exists public.member_badge_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.members(id) on delete cascade,
  badge_code text not null,
  label text not null,
  description text,
  source text not null default 'admin',
  awarded_by uuid references auth.users(id) on delete set null,
  awarded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint member_badge_awards_source_check
    check (source in ('admin', 'system')),
  constraint member_badge_awards_code_check
    check (badge_code ~ '^[a-z][a-z0-9_]{1,63}$'),
  unique (user_id, badge_code)
);

create index if not exists member_badge_awards_user_awarded_idx
  on public.member_badge_awards (user_id, awarded_at desc);

alter table public.member_badge_awards enable row level security;

revoke all on public.member_badge_awards from anon, authenticated;
grant select, insert, update, delete on public.member_badge_awards to service_role;

insert into public.admin_permissions (
  permission_key,
  module,
  action,
  sensitivity_level,
  description
)
values (
  'members.manage_badges',
  'members',
  'manage_badges',
  'L2',
  '授予或移除成员公开徽章'
)
on conflict (permission_key) do update
set
  module = excluded.module,
  action = excluded.action,
  sensitivity_level = excluded.sensitivity_level,
  description = excluded.description;

insert into public.admin_role_permissions (role_id, permission_key)
select roles.id, 'members.manage_badges'
from public.admin_roles as roles
where roles.role_key in ('super_admin', 'ops_lead', 'member_operator')
on conflict (role_id, permission_key) do nothing;
