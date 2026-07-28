grant select
  on public.miniapp_consents
  to authenticated;

drop policy if exists "event portrait consents are readable by registration admins"
  on public.miniapp_consents;
create policy "event portrait consents are readable by registration admins"
  on public.miniapp_consents
  for select
  to authenticated
  using (
    policy_version like 'event-portrait:%'
    and private.has_admin_permission(
      auth.uid(),
      'events.read_registrations'
    )
  );
