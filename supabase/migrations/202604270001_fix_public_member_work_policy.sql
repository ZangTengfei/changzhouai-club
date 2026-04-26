create or replace function public.is_public_member(member_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members
    where members.id = member_uuid
      and members.is_publicly_visible = true
      and members.status in ('active', 'organizer', 'admin')
  );
$$;

grant execute on function public.is_public_member(uuid) to anon;
grant execute on function public.is_public_member(uuid) to authenticated;

drop policy if exists "public member works are readable" on public.member_works;
create policy "public member works are readable"
  on public.member_works
  for select
  using (
    is_public = true
    and public.is_public_member(member_works.member_id)
  );

grant select on public.member_works to anon;
grant select, insert, update, delete on public.member_works to authenticated;
