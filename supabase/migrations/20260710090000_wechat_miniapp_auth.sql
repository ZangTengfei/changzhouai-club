create table if not exists public.user_account_links (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  canonical_user_id uuid not null references auth.users(id) on delete cascade,
  link_source text not null default 'self',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_account_links_source_check
    check (link_source in ('self', 'wechat_unionid', 'manual_merge'))
);

create index if not exists user_account_links_canonical_user_idx
  on public.user_account_links (canonical_user_id);

insert into public.user_account_links (auth_user_id, canonical_user_id, link_source)
select users.id, users.id, 'self'
from auth.users
on conflict (auth_user_id) do nothing;

create or replace function public.handle_new_user_account_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_account_links (auth_user_id, canonical_user_id, link_source)
  values (new.id, new.id, 'self')
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_account_link_created on auth.users;
create trigger on_auth_user_account_link_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_account_link();

drop trigger if exists user_account_links_set_updated_at on public.user_account_links;
create trigger user_account_links_set_updated_at
  before update on public.user_account_links
  for each row execute procedure public.set_updated_at();

create or replace function public.resolve_community_user_id(requested_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when requested_user_id is null then null
    else coalesce(
      (
        select links.canonical_user_id
        from public.user_account_links as links
        where links.auth_user_id = requested_user_id
      ),
      requested_user_id
    )
  end;
$$;

create or replace function public.current_community_user_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select public.resolve_community_user_id(auth.uid());
$$;

revoke all on function public.resolve_community_user_id(uuid) from public;
revoke all on function public.current_community_user_id() from public;
grant execute on function public.resolve_community_user_id(uuid) to authenticated, service_role;
grant execute on function public.current_community_user_id() to authenticated, service_role;

alter table public.user_identities
  add column if not exists provider_app_id text not null default '',
  add column if not exists provider_channel text,
  add column if not exists identity_data jsonb not null default '{}'::jsonb,
  add column if not exists last_seen_at timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.user_identities
  drop constraint if exists user_identities_provider_provider_user_id_key;

alter table public.user_identities
  drop constraint if exists user_identities_provider_channel_check;

alter table public.user_identities
  add constraint user_identities_provider_channel_check
    check (
      provider_channel is null
      or provider_channel in ('website', 'official_account', 'mini_program')
    );

alter table public.user_identities
  drop constraint if exists user_identities_provider_app_user_key;

alter table public.user_identities
  add constraint user_identities_provider_app_user_key
    unique (provider, provider_app_id, provider_user_id);

create index if not exists user_identities_provider_union_idx
  on public.user_identities (provider, provider_union_id)
  where provider_union_id is not null;

drop trigger if exists user_identities_set_updated_at on public.user_identities;
create trigger user_identities_set_updated_at
  before update on public.user_identities
  for each row execute procedure public.set_updated_at();

create table if not exists public.wechat_union_accounts (
  union_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists wechat_union_accounts_user_idx
  on public.wechat_union_accounts (user_id);

insert into public.wechat_union_accounts (union_id, user_id)
select
  identities.provider_union_id,
  (array_agg(identities.user_id order by identities.user_id))[1]
from public.user_identities as identities
where identities.provider = 'wechat'
  and identities.provider_union_id is not null
group by identities.provider_union_id
having count(distinct identities.user_id) = 1
on conflict (union_id) do nothing;

drop trigger if exists wechat_union_accounts_set_updated_at on public.wechat_union_accounts;
create trigger wechat_union_accounts_set_updated_at
  before update on public.wechat_union_accounts
  for each row execute procedure public.set_updated_at();

create table if not exists public.miniapp_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint miniapp_sessions_expiry_check check (expires_at > created_at)
);

create index if not exists miniapp_sessions_user_idx
  on public.miniapp_sessions (user_id, created_at desc);

alter table public.user_account_links enable row level security;
alter table public.wechat_union_accounts enable row level security;
alter table public.miniapp_sessions enable row level security;

drop policy if exists "account links are readable by account users"
  on public.user_account_links;
create policy "account links are readable by account users"
  on public.user_account_links
  for select
  to authenticated
  using (
    auth_user_id = auth.uid()
    or canonical_user_id = public.current_community_user_id()
  );

drop policy if exists "user identities are readable by owner"
  on public.user_identities;
create policy "user identities are readable by owner"
  on public.user_identities
  for select
  to authenticated
  using (user_id = public.current_community_user_id());

drop policy if exists "user identities are insertable by owner"
  on public.user_identities;

revoke all on public.user_account_links from anon, authenticated;
grant select on public.user_account_links to authenticated;
grant select, insert, update, delete on public.user_account_links to service_role;

revoke all on public.user_identities from anon, authenticated;
grant select on public.user_identities to authenticated;
grant select, insert, update, delete on public.user_identities to service_role;

revoke all on public.wechat_union_accounts from anon, authenticated;
grant select, insert, update, delete on public.wechat_union_accounts to service_role;

revoke all on public.miniapp_sessions from anon, authenticated;
grant select, insert, update, delete on public.miniapp_sessions to service_role;
