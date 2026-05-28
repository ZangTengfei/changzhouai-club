alter table public.events
  add column if not exists registration_url text;
