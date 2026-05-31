create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  role_key text not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_permissions (
  permission_key text primary key,
  module text not null,
  action text not null,
  sensitivity_level text not null default 'L1',
  description text
);

create table if not exists public.admin_role_permissions (
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  permission_key text not null references public.admin_permissions(permission_key) on delete cascade,
  primary key (role_id, permission_key)
);

create table if not exists public.member_admin_roles (
  member_id uuid not null references public.members(id) on delete cascade,
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  note text,
  primary key (member_id, role_id)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists member_admin_roles_member_idx
  on public.member_admin_roles (member_id, expires_at);

create index if not exists member_admin_roles_role_idx
  on public.member_admin_roles (role_id);

create index if not exists admin_audit_logs_actor_idx
  on public.admin_audit_logs (actor_id, created_at desc);

create index if not exists admin_audit_logs_resource_idx
  on public.admin_audit_logs (resource_type, resource_id, created_at desc);

drop trigger if exists admin_roles_set_updated_at on public.admin_roles;
create trigger admin_roles_set_updated_at
  before update on public.admin_roles
  for each row execute procedure public.set_updated_at();

insert into public.admin_permissions (
  permission_key,
  module,
  action,
  sensitivity_level,
  description
)
values
  ('admin.access', 'system', 'access', 'L1', '进入社区后台'),
  ('events.read', 'events', 'read', 'L1', '查看活动列表、详情和草稿'),
  ('events.write', 'events', 'write', 'L1', '新增和编辑活动'),
  ('events.publish', 'events', 'publish', 'L1', '发布、下架或调整活动前台状态'),
  ('events.delete', 'events', 'delete', 'L4', '删除活动或关键活动资料'),
  ('events.manage_photos', 'events', 'manage_photos', 'L1', '管理活动照片和封面'),
  ('events.read_registrations', 'events', 'read_registrations', 'L1', '查看报名名单'),
  ('events.read_registration_contact', 'events', 'read_registration_contact', 'L2', '查看报名联系方式和备注'),
  ('events.update_registration_status', 'events', 'update_registration_status', 'L1', '修改报名和签到状态'),
  ('events.export_registrations', 'events', 'export_registrations', 'L3', '导出活动报名名单'),
  ('updates.read', 'updates', 'read', 'L1', '查看社区动态投稿'),
  ('updates.review', 'updates', 'review', 'L1', '审核社区动态'),
  ('updates.publish', 'updates', 'publish', 'L1', '发布社区动态到前台'),
  ('updates.pin', 'updates', 'pin', 'L1', '置顶、精选和排序社区动态'),
  ('updates.delete', 'updates', 'delete', 'L3', '删除社区动态'),
  ('social.write', 'social', 'write', 'L1', '管理社交平台入口和二维码'),
  ('ai_news.run', 'ai_news', 'run', 'L1', '运行 AI 信息雷达'),
  ('members.read', 'members', 'read', 'L1', '查看成员基础列表和详情'),
  ('members.read_contact', 'members', 'read_contact', 'L2', '查看成员联系方式、加入申请备注'),
  ('members.write_profile', 'members', 'write_profile', 'L1', '编辑成员展示资料和加入申请流程'),
  ('members.manage_status', 'members', 'manage_status', 'L3', '修改成员状态'),
  ('members.manage_co_builder', 'members', 'manage_co_builder', 'L2', '设置共建者公开身份'),
  ('members.manage_roles', 'members', 'manage_roles', 'L4', '授予或移除成员后台角色'),
  ('members.export', 'members', 'export', 'L4', '导出成员数据'),
  ('projects.read', 'projects', 'read', 'L1', '查看共建项目和公开机会'),
  ('projects.write', 'projects', 'write', 'L1', '新增和编辑项目机会'),
  ('projects.review_applications', 'projects', 'review_applications', 'L2', '查看和处理项目申请'),
  ('projects.read_application_contact', 'projects', 'read_application_contact', 'L2', '查看项目申请联系方式'),
  ('projects.export_applications', 'projects', 'export_applications', 'L3', '导出项目申请'),
  ('projects.delete', 'projects', 'delete', 'L4', '删除项目机会或申请'),
  ('works.read', 'works', 'read', 'L1', '查看成员作品'),
  ('works.write', 'works', 'write', 'L1', '新增和编辑成员作品'),
  ('works.review', 'works', 'review', 'L1', '审核成员作品'),
  ('works.publish', 'works', 'publish', 'L1', '发布成员作品'),
  ('works.delete', 'works', 'delete', 'L3', '删除成员作品'),
  ('leads.read', 'leads', 'read', 'L1', '查看合作线索基础信息'),
  ('leads.read_sensitive', 'leads', 'read_sensitive', 'L3', '查看合作联系人、预算和内部备注'),
  ('leads.write', 'leads', 'write', 'L2', '修改合作线索状态和备注'),
  ('leads.match_members', 'leads', 'match_members', 'L2', '添加和调整合作成员匹配'),
  ('leads.export', 'leads', 'export', 'L4', '导出合作线索'),
  ('leads.delete', 'leads', 'delete', 'L4', '删除合作线索'),
  ('sponsors.read', 'sponsors', 'read', 'L1', '查看赞助者资料'),
  ('sponsors.write', 'sponsors', 'write', 'L1', '新增和编辑赞助者'),
  ('sponsors.manage_images', 'sponsors', 'manage_images', 'L1', '管理赞助者图片'),
  ('sponsors.publish', 'sponsors', 'publish', 'L1', '控制赞助者前台展示、排序和推荐'),
  ('sponsors.delete', 'sponsors', 'delete', 'L4', '删除赞助者资料'),
  ('storage.upload_event_assets', 'storage', 'upload_event_assets', 'L1', '上传活动图片'),
  ('storage.upload_community_assets', 'storage', 'upload_community_assets', 'L1', '上传社区动态图片'),
  ('storage.upload_sponsor_assets', 'storage', 'upload_sponsor_assets', 'L1', '上传赞助者图片'),
  ('storage.delete_assets', 'storage', 'delete_assets', 'L3', '删除上传素材'),
  ('system.manage_roles', 'system', 'manage_roles', 'L4', '管理角色和授权'),
  ('system.view_audit_logs', 'system', 'view_audit_logs', 'L4', '查看审计日志'),
  ('system.manage_settings', 'system', 'manage_settings', 'L4', '管理系统级配置')
on conflict (permission_key) do update
set
  module = excluded.module,
  action = excluded.action,
  sensitivity_level = excluded.sensitivity_level,
  description = excluded.description;

insert into public.admin_roles (role_key, name, description, sort_order)
values
  ('super_admin', '超级管理员', '拥有全部后台权限，含角色授权、审计日志和系统设置。', 10),
  ('ops_lead', '运营负责人', '负责日常运营，可管理大部分内容、成员、项目和合作数据。', 20),
  ('event_publisher', '活动发布员', '可创建、编辑、发布活动并管理活动图片。', 30),
  ('event_assistant', '活动协助员', '可查看活动与报名名单，更新报名或签到状态。', 40),
  ('event_operator', '活动协作者', '兼具活动发布和现场协助权限，不含导出和删除。', 50),
  ('content_operator', '内容协作者', '负责社区动态、社交入口和 AI 信息雷达。', 60),
  ('project_operator', '项目协作者', '负责共建项目机会和项目申请处理。', 70),
  ('member_operator', '成员协作者', '负责成员基础资料、加入申请和共建身份维护。', 80),
  ('partner_operator', '合作协作者', '负责合作线索跟进、成员匹配和赞助者资料维护。', 90),
  ('viewer', '只读观察者', '可查看基础后台模块，不含敏感字段和写操作。', 100)
on conflict (role_key) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

with role_permissions(role_key, permission_key) as (
  values
    ('super_admin', 'admin.access'),
    ('super_admin', 'events.read'),
    ('super_admin', 'events.write'),
    ('super_admin', 'events.publish'),
    ('super_admin', 'events.delete'),
    ('super_admin', 'events.manage_photos'),
    ('super_admin', 'events.read_registrations'),
    ('super_admin', 'events.read_registration_contact'),
    ('super_admin', 'events.update_registration_status'),
    ('super_admin', 'events.export_registrations'),
    ('super_admin', 'updates.read'),
    ('super_admin', 'updates.review'),
    ('super_admin', 'updates.publish'),
    ('super_admin', 'updates.pin'),
    ('super_admin', 'updates.delete'),
    ('super_admin', 'social.write'),
    ('super_admin', 'ai_news.run'),
    ('super_admin', 'members.read'),
    ('super_admin', 'members.read_contact'),
    ('super_admin', 'members.write_profile'),
    ('super_admin', 'members.manage_status'),
    ('super_admin', 'members.manage_co_builder'),
    ('super_admin', 'members.manage_roles'),
    ('super_admin', 'members.export'),
    ('super_admin', 'projects.read'),
    ('super_admin', 'projects.write'),
    ('super_admin', 'projects.review_applications'),
    ('super_admin', 'projects.read_application_contact'),
    ('super_admin', 'projects.export_applications'),
    ('super_admin', 'projects.delete'),
    ('super_admin', 'works.read'),
    ('super_admin', 'works.write'),
    ('super_admin', 'works.review'),
    ('super_admin', 'works.publish'),
    ('super_admin', 'works.delete'),
    ('super_admin', 'leads.read'),
    ('super_admin', 'leads.read_sensitive'),
    ('super_admin', 'leads.write'),
    ('super_admin', 'leads.match_members'),
    ('super_admin', 'leads.export'),
    ('super_admin', 'leads.delete'),
    ('super_admin', 'sponsors.read'),
    ('super_admin', 'sponsors.write'),
    ('super_admin', 'sponsors.manage_images'),
    ('super_admin', 'sponsors.publish'),
    ('super_admin', 'sponsors.delete'),
    ('super_admin', 'storage.upload_event_assets'),
    ('super_admin', 'storage.upload_community_assets'),
    ('super_admin', 'storage.upload_sponsor_assets'),
    ('super_admin', 'storage.delete_assets'),
    ('super_admin', 'system.manage_roles'),
    ('super_admin', 'system.view_audit_logs'),
    ('super_admin', 'system.manage_settings'),

    ('ops_lead', 'admin.access'),
    ('ops_lead', 'events.read'),
    ('ops_lead', 'events.write'),
    ('ops_lead', 'events.publish'),
    ('ops_lead', 'events.manage_photos'),
    ('ops_lead', 'events.read_registrations'),
    ('ops_lead', 'events.read_registration_contact'),
    ('ops_lead', 'events.update_registration_status'),
    ('ops_lead', 'events.export_registrations'),
    ('ops_lead', 'updates.read'),
    ('ops_lead', 'updates.review'),
    ('ops_lead', 'updates.publish'),
    ('ops_lead', 'updates.pin'),
    ('ops_lead', 'updates.delete'),
    ('ops_lead', 'social.write'),
    ('ops_lead', 'ai_news.run'),
    ('ops_lead', 'members.read'),
    ('ops_lead', 'members.read_contact'),
    ('ops_lead', 'members.write_profile'),
    ('ops_lead', 'members.manage_status'),
    ('ops_lead', 'members.manage_co_builder'),
    ('ops_lead', 'projects.read'),
    ('ops_lead', 'projects.write'),
    ('ops_lead', 'projects.review_applications'),
    ('ops_lead', 'projects.read_application_contact'),
    ('ops_lead', 'projects.export_applications'),
    ('ops_lead', 'works.read'),
    ('ops_lead', 'works.write'),
    ('ops_lead', 'works.review'),
    ('ops_lead', 'works.publish'),
    ('ops_lead', 'works.delete'),
    ('ops_lead', 'leads.read'),
    ('ops_lead', 'leads.read_sensitive'),
    ('ops_lead', 'leads.write'),
    ('ops_lead', 'leads.match_members'),
    ('ops_lead', 'sponsors.read'),
    ('ops_lead', 'sponsors.write'),
    ('ops_lead', 'sponsors.manage_images'),
    ('ops_lead', 'sponsors.publish'),
    ('ops_lead', 'storage.upload_event_assets'),
    ('ops_lead', 'storage.upload_community_assets'),
    ('ops_lead', 'storage.upload_sponsor_assets'),

    ('event_publisher', 'admin.access'),
    ('event_publisher', 'events.read'),
    ('event_publisher', 'events.write'),
    ('event_publisher', 'events.publish'),
    ('event_publisher', 'events.manage_photos'),
    ('event_publisher', 'events.read_registrations'),
    ('event_publisher', 'storage.upload_event_assets'),

    ('event_assistant', 'admin.access'),
    ('event_assistant', 'events.read'),
    ('event_assistant', 'events.read_registrations'),
    ('event_assistant', 'events.update_registration_status'),

    ('event_operator', 'admin.access'),
    ('event_operator', 'events.read'),
    ('event_operator', 'events.write'),
    ('event_operator', 'events.publish'),
    ('event_operator', 'events.manage_photos'),
    ('event_operator', 'events.read_registrations'),
    ('event_operator', 'events.update_registration_status'),
    ('event_operator', 'storage.upload_event_assets'),

    ('content_operator', 'admin.access'),
    ('content_operator', 'updates.read'),
    ('content_operator', 'updates.review'),
    ('content_operator', 'updates.publish'),
    ('content_operator', 'updates.pin'),
    ('content_operator', 'social.write'),
    ('content_operator', 'ai_news.run'),
    ('content_operator', 'events.manage_photos'),
    ('content_operator', 'storage.upload_community_assets'),
    ('content_operator', 'storage.upload_event_assets'),

    ('project_operator', 'admin.access'),
    ('project_operator', 'projects.read'),
    ('project_operator', 'projects.write'),
    ('project_operator', 'projects.review_applications'),
    ('project_operator', 'projects.read_application_contact'),

    ('member_operator', 'admin.access'),
    ('member_operator', 'members.read'),
    ('member_operator', 'members.write_profile'),
    ('member_operator', 'members.manage_co_builder'),

    ('partner_operator', 'admin.access'),
    ('partner_operator', 'leads.read'),
    ('partner_operator', 'leads.write'),
    ('partner_operator', 'leads.match_members'),
    ('partner_operator', 'sponsors.read'),
    ('partner_operator', 'sponsors.write'),
    ('partner_operator', 'sponsors.manage_images'),
    ('partner_operator', 'storage.upload_sponsor_assets'),

    ('viewer', 'admin.access'),
    ('viewer', 'events.read'),
    ('viewer', 'updates.read'),
    ('viewer', 'members.read'),
    ('viewer', 'projects.read'),
    ('viewer', 'works.read'),
    ('viewer', 'sponsors.read')
)
insert into public.admin_role_permissions (role_id, permission_key)
select admin_roles.id, role_permissions.permission_key
from role_permissions
inner join public.admin_roles on admin_roles.role_key = role_permissions.role_key
on conflict (role_id, permission_key) do nothing;

insert into public.member_admin_roles (member_id, role_id, granted_by, note)
select members.id, admin_roles.id, members.id, '由 members.status=admin 自动映射'
from public.members
inner join public.admin_roles on admin_roles.role_key = 'super_admin'
where members.status = 'admin'
on conflict (member_id, role_id) do nothing;

insert into public.member_admin_roles (member_id, role_id, granted_by, note)
select members.id, admin_roles.id, members.id, '由 members.status=organizer 自动映射'
from public.members
inner join public.admin_roles on admin_roles.role_key = 'ops_lead'
where members.status = 'organizer'
on conflict (member_id, role_id) do nothing;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.has_admin_permission(
  requested_user_uuid uuid,
  requested_permission text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members
    where members.id = requested_user_uuid
      and members.status <> 'paused'
      and (
        members.status = 'admin'
        or exists (
          select 1
          from public.member_admin_roles
          inner join public.admin_role_permissions
            on admin_role_permissions.role_id = member_admin_roles.role_id
          where member_admin_roles.member_id = requested_user_uuid
            and admin_role_permissions.permission_key = requested_permission
            and (
              member_admin_roles.expires_at is null
              or member_admin_roles.expires_at > timezone('utc', now())
            )
        )
      )
  );
$$;

create or replace function private.list_admin_permissions_for_user(requested_user_uuid uuid)
returns table(permission_key text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct admin_permissions.permission_key
  from public.admin_permissions
  where exists (
    select 1
    from public.members
    where members.id = requested_user_uuid
      and members.status = 'admin'
      and members.status <> 'paused'
  )

  union

  select distinct admin_role_permissions.permission_key
  from public.member_admin_roles
  inner join public.admin_role_permissions
    on admin_role_permissions.role_id = member_admin_roles.role_id
  inner join public.members
    on members.id = member_admin_roles.member_id
  where member_admin_roles.member_id = requested_user_uuid
    and members.status <> 'paused'
    and (
      member_admin_roles.expires_at is null
      or member_admin_roles.expires_at > timezone('utc', now())
    );
$$;

create or replace function public.list_current_admin_permissions()
returns table(permission_key text)
language sql
stable
security invoker
set search_path = public, private
as $$
  select private_permissions.permission_key
  from private.list_admin_permissions_for_user(auth.uid()) as private_permissions;
$$;

revoke all on function private.has_admin_permission(uuid, text) from public;
revoke all on function private.list_admin_permissions_for_user(uuid) from public;
revoke all on function public.list_current_admin_permissions() from public;
grant execute on function private.has_admin_permission(uuid, text) to authenticated;
grant execute on function private.list_admin_permissions_for_user(uuid) to authenticated;
grant execute on function public.list_current_admin_permissions() to authenticated;

alter table public.admin_roles enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.member_admin_roles enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin roles are readable by admins" on public.admin_roles;
create policy "admin roles are readable by admins"
  on public.admin_roles
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'admin.access'));

drop policy if exists "admin roles are manageable by system admins" on public.admin_roles;
create policy "admin roles are manageable by system admins"
  on public.admin_roles
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'system.manage_roles'))
  with check (private.has_admin_permission(auth.uid(), 'system.manage_roles'));

drop policy if exists "admin permissions are readable by admins" on public.admin_permissions;
create policy "admin permissions are readable by admins"
  on public.admin_permissions
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'admin.access'));

drop policy if exists "admin role permissions are readable by admins" on public.admin_role_permissions;
create policy "admin role permissions are readable by admins"
  on public.admin_role_permissions
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'admin.access'));

drop policy if exists "admin role permissions are manageable by system admins" on public.admin_role_permissions;
create policy "admin role permissions are manageable by system admins"
  on public.admin_role_permissions
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'system.manage_roles'))
  with check (private.has_admin_permission(auth.uid(), 'system.manage_roles'));

drop policy if exists "member admin roles are readable by owner or system admins" on public.member_admin_roles;
create policy "member admin roles are readable by owner or system admins"
  on public.member_admin_roles
  for select
  to authenticated
  using (
    member_id = auth.uid()
    or private.has_admin_permission(auth.uid(), 'system.manage_roles')
  );

drop policy if exists "member admin roles are manageable by system admins" on public.member_admin_roles;
create policy "member admin roles are manageable by system admins"
  on public.member_admin_roles
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'system.manage_roles'))
  with check (private.has_admin_permission(auth.uid(), 'system.manage_roles'));

drop policy if exists "admin audit logs are readable by audit viewers" on public.admin_audit_logs;
create policy "admin audit logs are readable by audit viewers"
  on public.admin_audit_logs
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'system.view_audit_logs'));

drop policy if exists "admin audit logs are insertable by admins" on public.admin_audit_logs;
create policy "admin audit logs are insertable by admins"
  on public.admin_audit_logs
  for insert
  to authenticated
  with check (actor_id = auth.uid() and private.has_admin_permission(auth.uid(), 'admin.access'));

grant select on public.admin_roles to authenticated;
grant select on public.admin_permissions to authenticated;
grant select on public.admin_role_permissions to authenticated;
grant select, insert, update, delete on public.member_admin_roles to authenticated;
grant select, insert on public.admin_audit_logs to authenticated;

create policy "profiles are readable by member readers"
  on public.profiles
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.read'));

create policy "profiles are updatable by member profile writers"
  on public.profiles
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.write_profile'))
  with check (private.has_admin_permission(auth.uid(), 'members.write_profile'));

create policy "members are readable by member readers"
  on public.members
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.read'));

create policy "members are updatable by member operators"
  on public.members
  for update
  to authenticated
  using (
    private.has_admin_permission(auth.uid(), 'members.write_profile')
    or private.has_admin_permission(auth.uid(), 'members.manage_status')
    or private.has_admin_permission(auth.uid(), 'members.manage_co_builder')
  )
  with check (
    private.has_admin_permission(auth.uid(), 'members.write_profile')
    or private.has_admin_permission(auth.uid(), 'members.manage_status')
    or private.has_admin_permission(auth.uid(), 'members.manage_co_builder')
  );

create policy "events are readable by event readers"
  on public.events
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.read'));

create policy "events are insertable by event writers"
  on public.events
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'events.write'));

create policy "events are updatable by event writers"
  on public.events
  for update
  to authenticated
  using (
    private.has_admin_permission(auth.uid(), 'events.write')
    or private.has_admin_permission(auth.uid(), 'events.publish')
  )
  with check (
    private.has_admin_permission(auth.uid(), 'events.write')
    or private.has_admin_permission(auth.uid(), 'events.publish')
  );

create policy "events are deletable by event deleters"
  on public.events
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.delete'));

create policy "event photos are manageable by photo managers"
  on public.event_photos
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.manage_photos'))
  with check (private.has_admin_permission(auth.uid(), 'events.manage_photos'));

create policy "registrations are readable by event registration readers"
  on public.event_registrations
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.read_registrations'));

create policy "registrations are updatable by event registration operators"
  on public.event_registrations
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.update_registration_status'))
  with check (private.has_admin_permission(auth.uid(), 'events.update_registration_status'));

create policy "attendance is readable by event registration readers"
  on public.event_attendance
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.read_registrations'));

create policy "attendance is manageable by event registration operators"
  on public.event_attendance
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.update_registration_status'))
  with check (private.has_admin_permission(auth.uid(), 'events.update_registration_status'));

create policy "talks are manageable by event writers"
  on public.talks
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.write'))
  with check (private.has_admin_permission(auth.uid(), 'events.write'));

create policy "join requests are readable by member readers"
  on public.community_join_requests
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.read'));

create policy "join requests are manageable by member writers"
  on public.community_join_requests
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.write_profile'))
  with check (private.has_admin_permission(auth.uid(), 'members.write_profile'));

create policy "cooperation leads are readable by lead readers"
  on public.cooperation_leads
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'leads.read'));

create policy "cooperation leads are updatable by lead writers"
  on public.cooperation_leads
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'leads.write'))
  with check (private.has_admin_permission(auth.uid(), 'leads.write'));

create policy "cooperation leads are deletable by lead deleters"
  on public.cooperation_leads
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'leads.delete'));

create policy "cooperation lead matches are readable by lead readers"
  on public.cooperation_lead_matches
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'leads.read'));

create policy "cooperation lead matches are manageable by match managers"
  on public.cooperation_lead_matches
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'leads.match_members'))
  with check (private.has_admin_permission(auth.uid(), 'leads.match_members'));

create policy "sponsors are readable by sponsor readers"
  on public.sponsors
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'sponsors.read'));

create policy "sponsors are insertable by sponsor writers"
  on public.sponsors
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'sponsors.write'));

create policy "sponsors are updatable by sponsor writers"
  on public.sponsors
  for update
  to authenticated
  using (
    private.has_admin_permission(auth.uid(), 'sponsors.write')
    or private.has_admin_permission(auth.uid(), 'sponsors.publish')
  )
  with check (
    private.has_admin_permission(auth.uid(), 'sponsors.write')
    or private.has_admin_permission(auth.uid(), 'sponsors.publish')
  );

create policy "sponsors are deletable by sponsor deleters"
  on public.sponsors
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'sponsors.delete'));

create policy "sponsor images are manageable by sponsor image managers"
  on public.sponsor_images
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'sponsors.manage_images'))
  with check (private.has_admin_permission(auth.uid(), 'sponsors.manage_images'));

create policy "wechat qr codes are readable by social managers"
  on public.community_wechat_qr_codes
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'social.write'));

create policy "wechat qr codes are manageable by social managers"
  on public.community_wechat_qr_codes
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'social.write'))
  with check (private.has_admin_permission(auth.uid(), 'social.write'));

create policy "member works are readable by work readers"
  on public.member_works
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'works.read'));

create policy "member works are insertable by work writers"
  on public.member_works
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'works.write'));

create policy "member works are updatable by work operators"
  on public.member_works
  for update
  to authenticated
  using (
    private.has_admin_permission(auth.uid(), 'works.write')
    or private.has_admin_permission(auth.uid(), 'works.review')
    or private.has_admin_permission(auth.uid(), 'works.publish')
  )
  with check (
    private.has_admin_permission(auth.uid(), 'works.write')
    or private.has_admin_permission(auth.uid(), 'works.review')
    or private.has_admin_permission(auth.uid(), 'works.publish')
  );

create policy "member works are deletable by work deleters"
  on public.member_works
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'works.delete'));

create policy "project opportunities are readable by project readers"
  on public.project_opportunities
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'projects.read'));

create policy "project opportunities are insertable by project writers"
  on public.project_opportunities
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'projects.write'));

create policy "project opportunities are updatable by project writers"
  on public.project_opportunities
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'projects.write'))
  with check (private.has_admin_permission(auth.uid(), 'projects.write'));

create policy "project opportunities are deletable by project deleters"
  on public.project_opportunities
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'projects.delete'));

create policy "project applications are readable by project reviewers"
  on public.project_applications
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'projects.review_applications'));

create policy "project applications are updatable by project reviewers"
  on public.project_applications
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'projects.review_applications'))
  with check (private.has_admin_permission(auth.uid(), 'projects.review_applications'));

create policy "project applications are deletable by project deleters"
  on public.project_applications
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'projects.delete'));

create policy "community updates are readable by update readers"
  on public.community_updates
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'updates.read'));

create policy "community updates are insertable by update reviewers"
  on public.community_updates
  for insert
  to authenticated
  with check (
    private.has_admin_permission(auth.uid(), 'updates.review')
    or private.has_admin_permission(auth.uid(), 'updates.publish')
  );

create policy "community updates are updatable by update operators"
  on public.community_updates
  for update
  to authenticated
  using (
    private.has_admin_permission(auth.uid(), 'updates.review')
    or private.has_admin_permission(auth.uid(), 'updates.publish')
    or private.has_admin_permission(auth.uid(), 'updates.pin')
  )
  with check (
    private.has_admin_permission(auth.uid(), 'updates.review')
    or private.has_admin_permission(auth.uid(), 'updates.publish')
    or private.has_admin_permission(auth.uid(), 'updates.pin')
  );

create policy "community updates are deletable by update deleters"
  on public.community_updates
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'updates.delete'));

create policy "community update images are manageable by update operators"
  on public.community_update_images
  for all
  to authenticated
  using (
    private.has_admin_permission(auth.uid(), 'updates.review')
    or private.has_admin_permission(auth.uid(), 'updates.publish')
  )
  with check (
    private.has_admin_permission(auth.uid(), 'updates.review')
    or private.has_admin_permission(auth.uid(), 'updates.publish')
  );

create policy "event assets are insertable by event asset uploaders"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-assets'
    and private.has_admin_permission(auth.uid(), 'storage.upload_event_assets')
  );

create policy "event assets are updatable by event asset uploaders"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'event-assets'
    and private.has_admin_permission(auth.uid(), 'storage.upload_event_assets')
  )
  with check (
    bucket_id = 'event-assets'
    and private.has_admin_permission(auth.uid(), 'storage.upload_event_assets')
  );

create policy "sponsor assets are insertable by sponsor asset uploaders"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-assets'
    and (storage.foldername(name))[1] = 'sponsors'
    and private.has_admin_permission(auth.uid(), 'storage.upload_sponsor_assets')
  );

create policy "sponsor assets are updatable by sponsor asset uploaders"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'event-assets'
    and (storage.foldername(name))[1] = 'sponsors'
    and private.has_admin_permission(auth.uid(), 'storage.upload_sponsor_assets')
  )
  with check (
    bucket_id = 'event-assets'
    and (storage.foldername(name))[1] = 'sponsors'
    and private.has_admin_permission(auth.uid(), 'storage.upload_sponsor_assets')
  );

create policy "community assets are insertable by community asset uploaders"
  on storage.objects
  for insert
  to authenticated
  with check (
    (
      (
        bucket_id = 'event-assets'
        and (storage.foldername(name))[1] = 'community'
      )
      or bucket_id = 'community-update-assets'
    )
    and private.has_admin_permission(auth.uid(), 'storage.upload_community_assets')
  );

create policy "community assets are updatable by community asset uploaders"
  on storage.objects
  for update
  to authenticated
  using (
    (
      (
        bucket_id = 'event-assets'
        and (storage.foldername(name))[1] = 'community'
      )
      or bucket_id = 'community-update-assets'
    )
    and private.has_admin_permission(auth.uid(), 'storage.upload_community_assets')
  )
  with check (
    (
      (
        bucket_id = 'event-assets'
        and (storage.foldername(name))[1] = 'community'
      )
      or bucket_id = 'community-update-assets'
    )
    and private.has_admin_permission(auth.uid(), 'storage.upload_community_assets')
  );
