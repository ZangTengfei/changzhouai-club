drop function if exists public.list_public_members();

create function public.list_public_members()
returns table (
  id uuid,
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
    profiles.role_label,
    profiles.organization,
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
