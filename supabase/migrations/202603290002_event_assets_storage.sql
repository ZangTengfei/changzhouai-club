insert into storage.buckets (id, name, public)
values ('event-assets', 'event-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "event assets are publicly readable" on storage.objects;
create policy "event assets are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'event-assets');

drop policy if exists "event assets are insertable by staff" on storage.objects;
create policy "event assets are insertable by staff"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-assets'
    and public.is_staff(auth.uid())
  );

drop policy if exists "event assets are updatable by staff" on storage.objects;
create policy "event assets are updatable by staff"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'event-assets'
    and public.is_staff(auth.uid())
  )
  with check (
    bucket_id = 'event-assets'
    and public.is_staff(auth.uid())
  );

drop policy if exists "event assets are deletable by staff" on storage.objects;
create policy "event assets are deletable by staff"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'event-assets'
    and public.is_staff(auth.uid())
  );
