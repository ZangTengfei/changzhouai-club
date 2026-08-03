create table if not exists public.community_space_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  image_url text not null check (image_url ~ '^https://'),
  sort_order integer not null default 0,
  is_hero boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists community_space_photos_one_hero_idx
  on public.community_space_photos (is_hero)
  where is_hero and status = 'active';

create index if not exists community_space_photos_order_idx
  on public.community_space_photos (status, sort_order, created_at);

drop trigger if exists community_space_photos_set_updated_at on public.community_space_photos;
create trigger community_space_photos_set_updated_at
  before update on public.community_space_photos
  for each row execute procedure public.set_updated_at();

insert into public.community_space_photos (title, image_url, sort_order, is_hero)
values
  (
    'AI Club OPC 共创办公区',
    'https://assets.changzhouai.club/event-assets/community/space/office-v1.jpg',
    10,
    true
  ),
  (
    '西太湖人工智能社区园区',
    'https://assets.changzhouai.club/event-assets/community/space/park-v1.jpg',
    20,
    false
  )
on conflict do nothing;

alter table public.community_access_requests
  add column if not exists review_note text
    check (review_note is null or char_length(review_note) <= 500),
  add column if not exists processed_by uuid,
  add column if not exists access_identifier text
    check (access_identifier is null or char_length(access_identifier) <= 100);

create or replace function public.guard_community_resource_disable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'active' and new.status = 'disabled' then
    if exists (
      select 1
      from public.community_fixed_desk_assignments
      where resource_id = new.id
    ) then
      raise exception 'resource_has_fixed_assignment';
    end if;

    if exists (
      select 1
      from public.community_space_bookings
      where resource_id = new.id
        and status = 'confirmed'
        and ends_at > timezone('utc', now())
    ) then
      raise exception 'resource_has_active_bookings';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_community_resource_disable on public.community_space_resources;
create trigger guard_community_resource_disable
  before update of status on public.community_space_resources
  for each row execute procedure public.guard_community_resource_disable();

insert into public.admin_permissions (
  permission_key,
  module,
  action,
  sensitivity_level,
  description
)
values
  ('spaces.manage_resources', 'spaces', 'manage_resources', 'L2', '启用或停用空间工位和会议室'),
  ('spaces.manage_bookings', 'spaces', 'manage_bookings', 'L2', '查看和取消空间预约'),
  ('spaces.manage_access', 'spaces', 'manage_access', 'L2', '查看并处理门禁申请'),
  ('spaces.manage_photos', 'spaces', 'manage_photos', 'L2', '上传和管理社区空间实景图片')
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
    ('spaces.manage_resources'),
    ('spaces.manage_bookings'),
    ('spaces.manage_access'),
    ('spaces.manage_photos')
) as permissions(permission_key)
where roles.role_key in ('super_admin', 'ops_lead')
on conflict (role_id, permission_key) do nothing;

alter table public.community_space_photos enable row level security;
grant select on table public.community_space_photos to anon, authenticated;
grant insert, update, delete on table public.community_space_photos to authenticated;
grant all on table public.community_space_photos to service_role;
grant update on table public.community_space_resources to authenticated;
grant select on table public.community_fixed_desk_assignments to authenticated;
grant select on table public.community_fixed_desk_requests to authenticated;

drop policy if exists "Fixed desk assignments are readable by space operators"
  on public.community_fixed_desk_assignments;
create policy "Fixed desk assignments are readable by space operators"
  on public.community_fixed_desk_assignments
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'spaces.read'));

drop policy if exists "Fixed desk requests are readable by space operators"
  on public.community_fixed_desk_requests;
create policy "Fixed desk requests are readable by space operators"
  on public.community_fixed_desk_requests
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'spaces.read'));

drop policy if exists "Active community space photos are publicly readable"
  on public.community_space_photos;
create policy "Active community space photos are publicly readable"
  on public.community_space_photos
  for select
  using (status = 'active' or private.has_admin_permission(auth.uid(), 'spaces.read'));

drop policy if exists "Space photos are manageable by space operators"
  on public.community_space_photos;
create policy "Space photos are manageable by space operators"
  on public.community_space_photos
  for all
  using (private.has_admin_permission(auth.uid(), 'spaces.manage_photos'))
  with check (private.has_admin_permission(auth.uid(), 'spaces.manage_photos'));

drop policy if exists "Space resources are manageable by space operators"
  on public.community_space_resources;
create policy "Space resources are manageable by space operators"
  on public.community_space_resources
  for update
  using (private.has_admin_permission(auth.uid(), 'spaces.manage_resources'))
  with check (private.has_admin_permission(auth.uid(), 'spaces.manage_resources'));

drop policy if exists "Space bookings are manageable by space operators"
  on public.community_space_bookings;
create policy "Space bookings are manageable by space operators"
  on public.community_space_bookings
  for update
  using (private.has_admin_permission(auth.uid(), 'spaces.manage_bookings'))
  with check (private.has_admin_permission(auth.uid(), 'spaces.manage_bookings'));

drop policy if exists "Access requests are manageable by space operators"
  on public.community_access_requests;
create policy "Access requests are manageable by space operators"
  on public.community_access_requests
  for update
  using (private.has_admin_permission(auth.uid(), 'spaces.manage_access'))
  with check (private.has_admin_permission(auth.uid(), 'spaces.manage_access'));
