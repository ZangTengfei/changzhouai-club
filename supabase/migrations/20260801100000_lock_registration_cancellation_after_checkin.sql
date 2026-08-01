drop policy if exists "registrations are updatable by owner or staff"
  on public.event_registrations;

create policy "registrations are cancellable by owner before checkin"
  on public.event_registrations
  for update
  to authenticated
  using (
    public.current_community_user_id() = user_id
    and status <> 'cancelled'
    and exists (
      select 1
      from public.events
      where events.id = event_registrations.event_id
        and events.status = 'scheduled'
    )
    and not exists (
      select 1
      from public.event_attendance
      where event_attendance.event_id = event_registrations.event_id
        and event_attendance.user_id = event_registrations.user_id
        and event_attendance.checked_in_at is not null
    )
  )
  with check (
    public.current_community_user_id() = user_id
    and status = 'cancelled'
    and exists (
      select 1
      from public.events
      where events.id = event_registrations.event_id
        and events.status = 'scheduled'
    )
    and not exists (
      select 1
      from public.event_attendance
      where event_attendance.event_id = event_registrations.event_id
        and event_attendance.user_id = event_registrations.user_id
        and event_attendance.checked_in_at is not null
    )
  );
