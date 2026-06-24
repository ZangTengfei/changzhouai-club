create table if not exists public.wechat_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  provider_state text not null,
  redirect_uri text not null,
  code_challenge text,
  code_challenge_method text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wechat_oauth_codes (
  id uuid primary key default gen_random_uuid(),
  auth_code_hash text not null unique,
  access_token_hash text unique,
  claims jsonb not null,
  redirect_uri text not null,
  code_challenge text,
  code_challenge_method text,
  code_expires_at timestamptz not null,
  access_token_expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists wechat_oauth_states_expires_at_idx
  on public.wechat_oauth_states (expires_at);

create index if not exists wechat_oauth_codes_code_expires_at_idx
  on public.wechat_oauth_codes (code_expires_at);

create index if not exists wechat_oauth_codes_access_token_expires_at_idx
  on public.wechat_oauth_codes (access_token_expires_at);

alter table public.wechat_oauth_states enable row level security;
alter table public.wechat_oauth_codes enable row level security;

revoke all on public.wechat_oauth_states from anon, authenticated;
revoke all on public.wechat_oauth_codes from anon, authenticated;

grant select, insert, update, delete on public.wechat_oauth_states to service_role;
grant select, insert, update, delete on public.wechat_oauth_codes to service_role;
