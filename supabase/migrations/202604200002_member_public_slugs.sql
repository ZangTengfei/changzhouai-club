alter table public.profiles
  add column if not exists public_slug text;

alter table public.profiles
  drop constraint if exists profiles_public_slug_format_check;

alter table public.profiles
  add constraint profiles_public_slug_format_check
  check (
    public_slug is null
    or (
      public_slug = lower(public_slug)
      and public_slug ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$'
      and public_slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and public_slug not in (
        'about',
        'account',
        'admin',
        'api',
        'archive',
        'cooperate',
        'docs',
        'edit',
        'events',
        'faq',
        'join',
        'login',
        'members',
        'new',
        'projects',
        'sponsors'
      )
    )
  );

create unique index if not exists profiles_public_slug_unique_idx
  on public.profiles (public_slug)
  where public_slug is not null;

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
    members.is_publicly_visible,
    members.is_featured_on_home,
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
