create table if not exists public.member_works (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  title text not null,
  summary text not null,
  description text,
  work_type text not null default 'product',
  status text not null default 'launched',
  role_label text,
  cover_image_url text,
  website_url text,
  repo_url text,
  demo_url text,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  is_public boolean not null default false,
  is_featured boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint member_works_work_type_check
    check (work_type in ('product', 'project', 'tool', 'open_source', 'case', 'demo', 'service')),
  constraint member_works_status_check
    check (status in ('idea', 'building', 'launched', 'paused', 'archived'))
);

drop trigger if exists member_works_set_updated_at on public.member_works;
create trigger member_works_set_updated_at
  before update on public.member_works
  for each row execute procedure public.set_updated_at();

create index if not exists member_works_public_display_idx
  on public.member_works (is_public, is_featured desc, sort_order asc, created_at desc);

create index if not exists member_works_member_id_idx
  on public.member_works (member_id);

alter table public.member_works enable row level security;

drop policy if exists "public member works are readable" on public.member_works;
create policy "public member works are readable"
  on public.member_works
  for select
  using (
    is_public = true
    and exists (
      select 1
      from public.members
      where members.id = member_works.member_id
        and members.is_publicly_visible = true
        and members.status in ('active', 'organizer', 'admin')
    )
  );

drop policy if exists "member works are readable by staff" on public.member_works;
create policy "member works are readable by staff"
  on public.member_works
  for select
  to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "member works are manageable by staff" on public.member_works;
create policy "member works are manageable by staff"
  on public.member_works
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));
