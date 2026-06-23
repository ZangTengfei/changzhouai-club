alter table public.project_opportunities
  add column if not exists cover_image_url text;
