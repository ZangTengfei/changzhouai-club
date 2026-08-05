create table if not exists public.member_private_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null unique,
  display_name text not null,
  aliases text[] not null default '{}',
  identity_status text not null default 'named'
    check (identity_status in ('named', 'partial', 'anonymous')),
  linked_user_id uuid references public.members(id) on delete set null,
  profile_summary text,
  roles text[] not null default '{}',
  organizations text[] not null default '{}',
  industry_tags text[] not null default '{}',
  capability_tags text[] not null default '{}',
  interest_tags text[] not null default '{}',
  needs text[] not null default '{}',
  offers text[] not null default '{}',
  review_status text not null default 'pending'
    check (review_status in ('pending', 'reviewed', 'needs_confirmation')),
  sharing_consent_status text not null default 'not_requested'
    check (sharing_consent_status in ('not_requested', 'pending', 'granted', 'revoked')),
  sharing_consent_scope text,
  sharing_consent_at timestamptz,
  linked_at timestamptz,
  linked_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists member_private_profiles_linked_user_unique
  on public.member_private_profiles (linked_user_id)
  where linked_user_id is not null;

create index if not exists member_private_profiles_review_idx
  on public.member_private_profiles (review_status, display_name);

create table if not exists public.member_private_profile_evidence (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.member_private_profiles(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  event_date date not null,
  event_match_status text not null default 'unmatched'
    check (event_match_status in ('matched_by_date', 'ambiguous_date', 'unmatched')),
  source_title text not null,
  summary_filename text not null,
  transcript_filename text,
  source_locator text,
  observation_kind text not null default 'event_profile'
    check (observation_kind in ('attendance', 'event_profile', 'background', 'capability', 'interest', 'need', 'offer')),
  observation text not null,
  confidence numeric(4, 3) not null default 0.750
    check (confidence >= 0 and confidence <= 1),
  source_fingerprint text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists member_private_profile_evidence_profile_idx
  on public.member_private_profile_evidence (profile_id, event_date desc);

create index if not exists member_private_profile_evidence_event_idx
  on public.member_private_profile_evidence (event_id)
  where event_id is not null;

drop trigger if exists member_private_profiles_set_updated_at on public.member_private_profiles;
create trigger member_private_profiles_set_updated_at
  before update on public.member_private_profiles
  for each row execute procedure public.set_updated_at();

insert into public.admin_permissions (
  permission_key,
  module,
  action,
  sensitivity_level,
  description
)
values
  (
    'members.read_private_profile',
    'members',
    'read_private_profile',
    'L3',
    '查看从活动逐字稿和内部资料整理的成员私有画像'
  ),
  (
    'members.write_private_profile',
    'members',
    'write_private_profile',
    'L3',
    '复核成员私有画像并关联社区账号'
  )
on conflict (permission_key) do update
set
  module = excluded.module,
  action = excluded.action,
  sensitivity_level = excluded.sensitivity_level,
  description = excluded.description;

insert into public.admin_role_permissions (role_id, permission_key)
select roles.id, permissions.permission_key
from public.admin_roles as roles
cross join (
  values
    ('members.read_private_profile'),
    ('members.write_private_profile')
) as permissions(permission_key)
where roles.role_key in ('super_admin', 'ops_lead', 'member_operator')
on conflict (role_id, permission_key) do nothing;

alter table public.member_private_profiles enable row level security;
alter table public.member_private_profile_evidence enable row level security;

revoke all on table public.member_private_profiles from anon;
revoke all on table public.member_private_profile_evidence from anon;
revoke delete on table public.member_private_profiles from authenticated;
revoke delete on table public.member_private_profile_evidence from authenticated;
grant select, insert, update on table public.member_private_profiles to authenticated;
grant select, insert, update on table public.member_private_profile_evidence to authenticated;

drop policy if exists "private member profiles are readable by profile readers"
  on public.member_private_profiles;
create policy "private member profiles are readable by profile readers"
  on public.member_private_profiles
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.read_private_profile'));

drop policy if exists "private member profiles are writable by profile writers"
  on public.member_private_profiles;
create policy "private member profiles are writable by profile writers"
  on public.member_private_profiles
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.write_private_profile'))
  with check (private.has_admin_permission(auth.uid(), 'members.write_private_profile'));

drop policy if exists "private member evidence is readable by profile readers"
  on public.member_private_profile_evidence;
create policy "private member evidence is readable by profile readers"
  on public.member_private_profile_evidence
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.read_private_profile'));

drop policy if exists "private member evidence is writable by profile writers"
  on public.member_private_profile_evidence;
create policy "private member evidence is writable by profile writers"
  on public.member_private_profile_evidence
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.write_private_profile'))
  with check (private.has_admin_permission(auth.uid(), 'members.write_private_profile'));

comment on table public.member_private_profiles is
  '仅限授权后台人员查看的成员画像，不作为任何公开成员资料的数据源。';

comment on column public.member_private_profiles.sharing_consent_status is
  '仅记录未来可能取得的展示授权；现有前台和小程序不得读取本表。';

comment on table public.member_private_profile_evidence is
  '成员画像的来源证据。活动关联只按日期匹配，AI 自动标题不参与匹配。';
