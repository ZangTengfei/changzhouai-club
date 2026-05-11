alter table public.project_applications
  add column if not exists applicant_occupation text;
