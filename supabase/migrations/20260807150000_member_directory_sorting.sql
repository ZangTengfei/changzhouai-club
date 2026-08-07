alter table public.members
  add column if not exists directory_priority smallint not null default 0,
  add column if not exists directory_featured_until timestamptz,
  add column if not exists directory_feature_reason text;

alter table public.members
  drop constraint if exists members_directory_priority_check,
  add constraint members_directory_priority_check
    check (directory_priority between 0 and 30),
  drop constraint if exists members_directory_feature_reason_check,
  add constraint members_directory_feature_reason_check
    check (directory_feature_reason is null or char_length(directory_feature_reason) <= 100);

update public.members
set directory_priority = 10
where is_featured_on_home = true
  and directory_priority = 0;

create index if not exists members_public_directory_sort_idx
  on public.members (
    is_publicly_visible,
    status,
    directory_priority desc,
    joined_at desc
  );
