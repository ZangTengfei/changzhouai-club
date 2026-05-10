create table if not exists public.community_updates (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.members(id) on delete cascade,
  update_type text not null default 'share',
  title text,
  content text not null,
  tags text[] not null default '{}',
  related_type text,
  related_id uuid,
  related_url text,
  status text not null default 'pending',
  moderation_note text,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  view_count integer not null default 0,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_pinned boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint community_updates_type_check
    check (update_type in ('activity', 'project', 'share', 'help', 'collab', 'official')),
  constraint community_updates_status_check
    check (status in ('pending', 'published', 'changes_requested', 'rejected', 'archived')),
  constraint community_updates_related_type_check
    check (related_type is null or related_type in ('event', 'work', 'project', 'doc', 'external')),
  constraint community_updates_content_not_blank
    check (length(trim(content)) > 0)
);

create table if not exists public.community_update_images (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.community_updates(id) on delete cascade,
  image_url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists community_updates_set_updated_at on public.community_updates;
create trigger community_updates_set_updated_at
  before update on public.community_updates
  for each row execute procedure public.set_updated_at();

create index if not exists community_updates_public_display_idx
  on public.community_updates (
    status,
    is_pinned desc,
    is_featured desc,
    sort_order asc,
    published_at desc,
    created_at desc
  );

create index if not exists community_updates_author_idx
  on public.community_updates (author_id, created_at desc);

create index if not exists community_updates_type_idx
  on public.community_updates (update_type, status, published_at desc);

create index if not exists community_update_images_update_idx
  on public.community_update_images (update_id, sort_order asc, created_at asc);

alter table public.community_updates enable row level security;
alter table public.community_update_images enable row level security;

drop policy if exists "published community updates are publicly readable" on public.community_updates;
create policy "published community updates are publicly readable"
  on public.community_updates
  for select
  using (
    status = 'published'
    and exists (
      select 1
      from public.members
      where members.id = community_updates.author_id
        and members.is_publicly_visible = true
        and members.status in ('active', 'organizer', 'admin')
    )
  );

drop policy if exists "community updates are readable by owners" on public.community_updates;
create policy "community updates are readable by owners"
  on public.community_updates
  for select
  to authenticated
  using (author_id = auth.uid());

drop policy if exists "community updates are readable by staff" on public.community_updates;
create policy "community updates are readable by staff"
  on public.community_updates
  for select
  to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "community updates can be submitted by owners" on public.community_updates;
create policy "community updates can be submitted by owners"
  on public.community_updates
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and created_by = auth.uid()
    and status = 'pending'
    and is_featured = false
    and is_pinned = false
  );

drop policy if exists "community updates can be deleted by owners before publish" on public.community_updates;
create policy "community updates can be deleted by owners before publish"
  on public.community_updates
  for delete
  to authenticated
  using (
    author_id = auth.uid()
    and status <> 'published'
  );

drop policy if exists "community updates are manageable by staff" on public.community_updates;
create policy "community updates are manageable by staff"
  on public.community_updates
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop policy if exists "community update images are publicly readable" on public.community_update_images;
create policy "community update images are publicly readable"
  on public.community_update_images
  for select
  using (
    exists (
      select 1
      from public.community_updates
      where community_updates.id = community_update_images.update_id
        and community_updates.status = 'published'
        and exists (
          select 1
          from public.members
          where members.id = community_updates.author_id
            and members.is_publicly_visible = true
            and members.status in ('active', 'organizer', 'admin')
        )
    )
  );

drop policy if exists "community update images are readable by owners" on public.community_update_images;
create policy "community update images are readable by owners"
  on public.community_update_images
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.community_updates
      where community_updates.id = community_update_images.update_id
        and community_updates.author_id = auth.uid()
    )
  );

drop policy if exists "community update images can be submitted by owners" on public.community_update_images;
create policy "community update images can be submitted by owners"
  on public.community_update_images
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.community_updates
      where community_updates.id = community_update_images.update_id
        and community_updates.author_id = auth.uid()
        and community_updates.status <> 'published'
    )
  );

drop policy if exists "community update images can be deleted by owners before publish" on public.community_update_images;
create policy "community update images can be deleted by owners before publish"
  on public.community_update_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.community_updates
      where community_updates.id = community_update_images.update_id
        and community_updates.author_id = auth.uid()
        and community_updates.status <> 'published'
    )
  );

drop policy if exists "community update images are manageable by staff" on public.community_update_images;
create policy "community update images are manageable by staff"
  on public.community_update_images
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

grant select on public.community_updates to anon;
grant select on public.community_update_images to anon;
grant select, insert, update, delete on public.community_updates to authenticated;
grant select, insert, update, delete on public.community_update_images to authenticated;
