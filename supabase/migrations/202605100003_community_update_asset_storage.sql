insert into storage.buckets (id, name, public)
values ('community-update-assets', 'community-update-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "community update assets are publicly readable" on storage.objects;
create policy "community update assets are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'community-update-assets');

drop policy if exists "community update assets are insertable by owner" on storage.objects;
create policy "community update assets are insertable by owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-update-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'updates'
  );

drop policy if exists "community update assets are updatable by owner" on storage.objects;
create policy "community update assets are updatable by owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'community-update-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'updates'
  )
  with check (
    bucket_id = 'community-update-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'updates'
  );

drop policy if exists "community update assets are deletable by owner" on storage.objects;
create policy "community update assets are deletable by owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-update-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'updates'
  );
