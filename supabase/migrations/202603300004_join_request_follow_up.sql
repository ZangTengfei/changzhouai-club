alter table public.community_join_requests
  add column if not exists admin_note text,
  add column if not exists contacted_at timestamptz,
  add column if not exists approved_at timestamptz;
