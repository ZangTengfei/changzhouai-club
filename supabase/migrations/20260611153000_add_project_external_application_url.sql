alter table public.project_opportunities
  add column if not exists external_application_url text;
