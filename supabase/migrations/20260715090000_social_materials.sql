create table if not exists public.social_materials (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'wechat',
  title text not null,
  content_markdown text not null default '',
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint social_materials_platform_check
    check (platform in ('wechat')),
  constraint social_materials_title_not_blank
    check (length(trim(title)) > 0)
);

drop trigger if exists social_materials_set_updated_at on public.social_materials;
create trigger social_materials_set_updated_at
  before update on public.social_materials
  for each row execute procedure public.set_updated_at();

create index if not exists social_materials_platform_updated_idx
  on public.social_materials (platform, updated_at desc);

alter table public.social_materials enable row level security;

drop policy if exists "social materials are readable by social managers" on public.social_materials;
create policy "social materials are readable by social managers"
  on public.social_materials
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'social.write'));

drop policy if exists "social materials are insertable by social managers" on public.social_materials;
create policy "social materials are insertable by social managers"
  on public.social_materials
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'social.write'));

drop policy if exists "social materials are updatable by social managers" on public.social_materials;
create policy "social materials are updatable by social managers"
  on public.social_materials
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'social.write'))
  with check (private.has_admin_permission(auth.uid(), 'social.write'));

drop policy if exists "social materials are deletable by social managers" on public.social_materials;
create policy "social materials are deletable by social managers"
  on public.social_materials
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'social.write'));

grant select, insert, update, delete on public.social_materials to authenticated;

update public.admin_permissions
set description = '管理社媒素材、平台入口和二维码'
where permission_key = 'social.write';
