create table if not exists public.event_checkin_tokens (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  token_hash text not null unique,
  starts_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint event_checkin_tokens_hash_check
    check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint event_checkin_tokens_window_check
    check (expires_at > starts_at)
);

create index if not exists event_checkin_tokens_active_idx
  on public.event_checkin_tokens (event_id, expires_at)
  where revoked_at is null;

create table if not exists public.event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null,
  comment text,
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint event_feedback_rating_check check (rating between 1 and 5),
  constraint event_feedback_comment_check
    check (comment is null or char_length(comment) <= 500),
  unique (event_id, user_id)
);

create index if not exists event_feedback_event_submitted_idx
  on public.event_feedback (event_id, submitted_at desc);

drop trigger if exists event_feedback_set_updated_at on public.event_feedback;
create trigger event_feedback_set_updated_at
  before update on public.event_feedback
  for each row execute procedure public.set_updated_at();

alter table public.event_checkin_tokens enable row level security;
alter table public.event_feedback enable row level security;

revoke all on public.event_checkin_tokens from anon, authenticated;
revoke all on public.event_feedback from anon, authenticated;

grant select, insert, update, delete on public.event_checkin_tokens to service_role;
grant select, insert, update, delete on public.event_feedback to service_role;
