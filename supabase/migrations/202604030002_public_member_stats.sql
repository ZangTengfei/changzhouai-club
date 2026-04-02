drop function if exists public.get_public_member_stats();

create function public.get_public_member_stats()
returns table (
  registered_members bigint,
  public_members bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.members) as registered_members,
    (
      select count(*)
      from public.members
      where is_publicly_visible = true
        and status in ('active', 'organizer', 'admin')
    ) as public_members;
$$;

grant execute on function public.get_public_member_stats() to anon;
grant execute on function public.get_public_member_stats() to authenticated;
