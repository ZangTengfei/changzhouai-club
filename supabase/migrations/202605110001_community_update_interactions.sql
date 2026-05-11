create table if not exists public.community_update_likes (
  update_id uuid not null references public.community_updates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (update_id, user_id)
);

create index if not exists community_update_likes_user_idx
  on public.community_update_likes (user_id, created_at desc);

alter table public.community_update_likes enable row level security;

create or replace function public.set_community_updates_updated_at()
returns trigger
language plpgsql
as $$
begin
  if row(
    new.author_id,
    new.update_type,
    new.title,
    new.content,
    new.tags,
    new.related_type,
    new.related_id,
    new.related_url,
    new.status,
    new.moderation_note,
    new.sort_order,
    new.is_featured,
    new.is_pinned,
    new.published_at,
    new.reviewed_by
  ) is distinct from row(
    old.author_id,
    old.update_type,
    old.title,
    old.content,
    old.tags,
    old.related_type,
    old.related_id,
    old.related_url,
    old.status,
    old.moderation_note,
    old.sort_order,
    old.is_featured,
    old.is_pinned,
    old.published_at,
    old.reviewed_by
  ) then
    new.updated_at = timezone('utc', now());
  else
    new.updated_at = old.updated_at;
  end if;

  return new;
end;
$$;

drop trigger if exists community_updates_set_updated_at on public.community_updates;
create trigger community_updates_set_updated_at
  before update on public.community_updates
  for each row execute procedure public.set_community_updates_updated_at();

drop policy if exists "community update likes are readable by owners" on public.community_update_likes;
create policy "community update likes are readable by owners"
  on public.community_update_likes
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "community update likes are readable by staff" on public.community_update_likes;
create policy "community update likes are readable by staff"
  on public.community_update_likes
  for select
  to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "community update likes can be inserted by owners" on public.community_update_likes;
create policy "community update likes can be inserted by owners"
  on public.community_update_likes
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.community_updates
      where community_updates.id = community_update_likes.update_id
        and community_updates.status = 'published'
    )
  );

drop policy if exists "community update likes can be deleted by owners" on public.community_update_likes;
create policy "community update likes can be deleted by owners"
  on public.community_update_likes
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "community update likes are manageable by staff" on public.community_update_likes;
create policy "community update likes are manageable by staff"
  on public.community_update_likes
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create or replace function public.increment_community_update_view(target_update_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_view_count integer;
begin
  update public.community_updates
  set view_count = view_count + 1
  where id = target_update_id
    and status = 'published'
  returning view_count into next_view_count;

  return coalesce(next_view_count, 0);
end;
$$;

create or replace function public.toggle_community_update_like(target_update_id uuid)
returns table(liked boolean, like_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  next_like_count integer;
  inserted_count integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.community_updates
    where id = target_update_id
      and status = 'published'
  ) then
    return query select false, 0;
    return;
  end if;

  if exists (
    select 1
    from public.community_update_likes
    where update_id = target_update_id
      and user_id = current_user_id
  ) then
    delete from public.community_update_likes
    where update_id = target_update_id
      and user_id = current_user_id;

    update public.community_updates
    set like_count = greatest(like_count - 1, 0)
    where id = target_update_id
    returning community_updates.like_count into next_like_count;

    return query select false, coalesce(next_like_count, 0);
    return;
  end if;

  insert into public.community_update_likes (update_id, user_id)
  values (target_update_id, current_user_id)
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    update public.community_updates
    set like_count = like_count + 1
    where id = target_update_id
    returning community_updates.like_count into next_like_count;
  else
    select community_updates.like_count
    into next_like_count
    from public.community_updates
    where id = target_update_id;
  end if;

  return query select true, coalesce(next_like_count, 0);
end;
$$;

grant select, insert, delete on public.community_update_likes to authenticated;
grant execute on function public.increment_community_update_view(uuid) to anon, authenticated;
grant execute on function public.toggle_community_update_like(uuid) to authenticated;
