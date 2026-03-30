alter table public.community_join_requests
  add column if not exists invited_to_register_at timestamptz,
  add column if not exists joined_group_at timestamptz,
  add column if not exists first_attended_event_at timestamptz,
  add column if not exists converted_to_member_at timestamptz,
  add column if not exists converted_member_id uuid references public.members(id) on delete set null;
