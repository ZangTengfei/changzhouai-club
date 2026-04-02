insert into storage.buckets (id, name, public)
values ('member-avatars', 'member-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "member avatars are publicly readable" on storage.objects;
create policy "member avatars are publicly readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'member-avatars');

drop policy if exists "member avatars are insertable by owner" on storage.objects;
create policy "member avatars are insertable by owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'member-avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "member avatars are updatable by owner" on storage.objects;
create policy "member avatars are updatable by owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'member-avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'member-avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "member avatars are deletable by owner" on storage.objects;
create policy "member avatars are deletable by owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'member-avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
