create table if not exists public.miniapp_content_interactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null,
  content_id text not null,
  is_favorited boolean not null default false,
  last_read_at timestamptz,
  last_shared_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, content_type, content_id),
  constraint miniapp_content_interactions_type_check
    check (content_type in ('news', 'group_digest')),
  constraint miniapp_content_interactions_id_check
    check (char_length(content_id) between 1 and 160)
);

create index if not exists miniapp_content_interactions_favorites_idx
  on public.miniapp_content_interactions (user_id, updated_at desc)
  where is_favorited = true;

create table if not exists public.miniapp_group_digest_publications (
  report_id bigint primary key,
  is_published boolean not null default false,
  published_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists miniapp_group_digest_publications_published_idx
  on public.miniapp_group_digest_publications (published_at desc)
  where is_published = true;

drop trigger if exists miniapp_content_interactions_set_updated_at
  on public.miniapp_content_interactions;
create trigger miniapp_content_interactions_set_updated_at
  before update on public.miniapp_content_interactions
  for each row execute procedure public.set_updated_at();

drop trigger if exists miniapp_group_digest_publications_set_updated_at
  on public.miniapp_group_digest_publications;
create trigger miniapp_group_digest_publications_set_updated_at
  before update on public.miniapp_group_digest_publications
  for each row execute procedure public.set_updated_at();

alter table public.miniapp_content_interactions enable row level security;
alter table public.miniapp_group_digest_publications enable row level security;

revoke all on public.miniapp_content_interactions from anon, authenticated;
revoke all on public.miniapp_group_digest_publications from anon, authenticated;

grant select, insert, update, delete on public.miniapp_content_interactions to service_role;
grant select, insert, update, delete on public.miniapp_group_digest_publications to service_role;
