alter table public.profiles
  add column if not exists industry_tags text[] not null default '{}',
  add column if not exists capability_summary text,
  add column if not exists seeking_summary text;

create index if not exists profiles_industry_tags_gin_idx
  on public.profiles using gin (industry_tags);

create index if not exists profiles_skills_gin_idx
  on public.profiles using gin (skills);
