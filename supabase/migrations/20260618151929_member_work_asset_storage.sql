insert into storage.buckets (id, name, public)
values ('member-work-assets', 'member-work-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "member work assets are publicly readable" on storage.objects;
create policy "member work assets are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'member-work-assets');

drop policy if exists "member work assets are insertable by owner" on storage.objects;
create policy "member work assets are insertable by owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'member-work-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'works'
  );

drop policy if exists "member work assets are updatable by owner" on storage.objects;
create policy "member work assets are updatable by owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'member-work-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'works'
  )
  with check (
    bucket_id = 'member-work-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'works'
  );

drop policy if exists "member work assets are deletable by owner" on storage.objects;
create policy "member work assets are deletable by owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'member-work-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'works'
  );
