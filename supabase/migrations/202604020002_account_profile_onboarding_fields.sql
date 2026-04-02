alter table public.profiles
  add column if not exists wechat text,
  add column if not exists monthly_time text,
  add column if not exists interests text[] not null default '{}';

alter table public.members
  add column if not exists willing_to_attend boolean not null default true;
