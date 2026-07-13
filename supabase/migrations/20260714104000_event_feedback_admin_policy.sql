grant select on public.event_feedback to authenticated;

drop policy if exists "event feedback is readable by event operators"
  on public.event_feedback;
create policy "event feedback is readable by event operators"
  on public.event_feedback
  for select
  to authenticated
  using (
    private.has_admin_permission(auth.uid(), 'events.read_registrations')
  );
