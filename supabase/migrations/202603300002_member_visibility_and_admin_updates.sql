alter table public.members
  add column if not exists is_publicly_visible boolean not null default false;

update public.members
set is_publicly_visible = willing_to_share
where is_publicly_visible = false
  and willing_to_share = true;

drop function if exists public.list_public_members();

drop policy if exists "members are updatable by owner" on public.members;

create policy "members are updatable by owner or staff"
  on public.members
  for update
  using (auth.uid() = id or public.is_staff(auth.uid()))
  with check (auth.uid() = id or public.is_staff(auth.uid()));

create or replace function public.list_public_members()
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  city text,
  bio text,
  skills text[],
  status public.member_status,
  willing_to_share boolean,
  willing_to_join_projects boolean,
  is_publicly_visible boolean,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.display_name,
    profiles.avatar_url,
    coalesce(profiles.city, '常州') as city,
    profiles.bio,
    profiles.skills,
    members.status,
    members.willing_to_share,
    members.willing_to_join_projects,
    members.is_publicly_visible,
    members.joined_at
  from public.profiles
  inner join public.members on members.id = profiles.id
  where members.is_publicly_visible = true
    and members.status in ('active', 'organizer', 'admin')
  order by
    case members.status
      when 'admin' then 0
      when 'organizer' then 1
      else 2
    end,
    members.joined_at asc,
    coalesce(profiles.display_name, profiles.email, profiles.id::text);
$$;

grant execute on function public.list_public_members() to anon;
grant execute on function public.list_public_members() to authenticated;
