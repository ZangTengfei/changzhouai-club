alter table public.cooperation_leads
  add column if not exists admin_note text;
