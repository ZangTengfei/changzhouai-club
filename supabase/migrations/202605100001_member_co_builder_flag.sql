alter table public.members
  add column if not exists is_co_builder boolean not null default false;

create index if not exists members_public_tier_idx
  on public.members (is_publicly_visible, status, is_co_builder, joined_at);

drop function if exists public.list_public_members();

create function public.list_public_members()
returns table (
  id uuid,
  public_slug text,
  display_name text,
  avatar_url text,
  city text,
  role_label text,
  organization text,
  bio text,
  skills text[],
  status public.member_status,
  willing_to_share boolean,
  willing_to_join_projects boolean,
  is_co_builder boolean,
  is_publicly_visible boolean,
  is_featured_on_home boolean,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.public_slug,
    profiles.display_name,
    profiles.avatar_url,
    coalesce(profiles.city, '常州') as city,
    profiles.role_label,
    profiles.organization,
    profiles.bio,
    profiles.skills,
    members.status,
    members.willing_to_share,
    members.willing_to_join_projects,
    members.is_co_builder,
    members.is_publicly_visible,
    members.is_featured_on_home,
    members.joined_at
  from public.profiles
  inner join public.members on members.id = profiles.id
  where members.is_publicly_visible = true
    and members.status in ('active', 'organizer', 'admin')
  order by
    case
      when members.status = 'admin' then 0
      when members.status = 'organizer' then 1
      when members.is_co_builder then 2
      else 3
    end,
    members.joined_at asc,
    coalesce(profiles.display_name, profiles.email, profiles.id::text);
$$;

grant execute on function public.list_public_members() to anon;
grant execute on function public.list_public_members() to authenticated;
