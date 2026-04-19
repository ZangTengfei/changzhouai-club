alter table public.sponsors
  add column if not exists tier text not null default 'supporter';

alter table public.sponsors
  drop constraint if exists sponsors_tier_check;

alter table public.sponsors
  add constraint sponsors_tier_check
  check (tier in ('core', 'partner', 'supporter'));

update public.sponsors
set tier = case
  when slug = 'changzhou-telecom' then 'core'
  when slug = 'caic-yuandian' then 'partner'
  else tier
end;
