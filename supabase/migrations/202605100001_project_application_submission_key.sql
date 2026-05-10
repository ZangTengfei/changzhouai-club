alter table public.project_applications
  add column if not exists submission_key text;

create unique index if not exists project_applications_submission_key_idx
  on public.project_applications (submission_key)
  where submission_key is not null;
