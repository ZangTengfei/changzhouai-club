grant select, insert, update, delete
  on public.member_badge_awards
  to authenticated;

drop policy if exists "member badges are readable by member admins"
  on public.member_badge_awards;
create policy "member badges are readable by member admins"
  on public.member_badge_awards
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.read'));

drop policy if exists "member badges are manageable by badge admins"
  on public.member_badge_awards;
create policy "member badges are manageable by badge admins"
  on public.member_badge_awards
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'members.manage_badges'))
  with check (private.has_admin_permission(auth.uid(), 'members.manage_badges'));

grant select, insert, update, delete
  on public.event_checkin_tokens
  to authenticated;

drop policy if exists "checkin tokens are manageable by event operators"
  on public.event_checkin_tokens;
create policy "checkin tokens are manageable by event operators"
  on public.event_checkin_tokens
  for all
  to authenticated
  using (
    private.has_admin_permission(
      auth.uid(),
      'events.update_registration_status'
    )
  )
  with check (
    private.has_admin_permission(
      auth.uid(),
      'events.update_registration_status'
    )
  );
