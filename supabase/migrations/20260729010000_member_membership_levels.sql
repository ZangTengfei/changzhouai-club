create or replace function public.set_member_membership_level(
  p_member_id uuid,
  p_level integer
)
returns void
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null
    or not private.has_admin_permission(actor_id, 'members.manage_co_builder') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_level < 0 or p_level > 3 then
    raise exception 'invalid_membership_level' using errcode = '22023';
  end if;

  if not exists (select 1 from public.members where id = p_member_id) then
    raise exception 'member_not_found' using errcode = 'P0002';
  end if;

  update public.members
  set is_co_builder = p_level >= 1
  where id = p_member_id;

  delete from public.member_badge_awards
  where user_id = p_member_id
    and badge_code in ('co_builder', 'core_builder', 'honor_builder');

  if p_level = 2 then
    insert into public.member_badge_awards (
      user_id,
      badge_code,
      label,
      description,
      source,
      awarded_by
    ) values (
      p_member_id,
      'core_builder',
      '核心共建',
      '持续承担社区核心工作',
      'admin',
      actor_id
    );
  elsif p_level = 3 then
    insert into public.member_badge_awards (
      user_id,
      badge_code,
      label,
      description,
      source,
      awarded_by
    ) values (
      p_member_id,
      'honor_builder',
      '荣誉共建',
      '长期贡献并获得社区授予',
      'admin',
      actor_id
    );
  end if;
end;
$$;

revoke all on function public.set_member_membership_level(uuid, integer) from public;
grant execute on function public.set_member_membership_level(uuid, integer) to authenticated;
grant execute on function public.set_member_membership_level(uuid, integer) to service_role;
