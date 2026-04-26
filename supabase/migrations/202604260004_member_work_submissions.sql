alter table public.member_works
  add column if not exists review_status text not null default 'pending';

update public.member_works
set review_status = case
  when is_public = true then 'approved'
  else review_status
end;

alter table public.member_works
  drop constraint if exists member_works_review_status_check;

alter table public.member_works
  add constraint member_works_review_status_check
    check (review_status in ('pending', 'approved', 'changes_requested', 'rejected'));

drop policy if exists "member works are readable by owners" on public.member_works;
create policy "member works are readable by owners"
  on public.member_works
  for select
  to authenticated
  using (member_id = auth.uid());

drop policy if exists "member works can be submitted by owners" on public.member_works;
create policy "member works can be submitted by owners"
  on public.member_works
  for insert
  to authenticated
  with check (
    member_id = auth.uid()
    and is_public = false
    and is_featured = false
    and review_status = 'pending'
  );

drop policy if exists "member works can be updated by owners" on public.member_works;
create policy "member works can be updated by owners"
  on public.member_works
  for update
  to authenticated
  using (member_id = auth.uid())
  with check (
    member_id = auth.uid()
    and is_public = false
    and is_featured = false
    and review_status = 'pending'
  );

drop policy if exists "member works can be deleted by owners before publish" on public.member_works;
create policy "member works can be deleted by owners before publish"
  on public.member_works
  for delete
  to authenticated
  using (
    member_id = auth.uid()
    and is_public = false
  );
