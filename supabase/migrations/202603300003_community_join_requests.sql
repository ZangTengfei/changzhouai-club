create type public.join_request_status as enum (
  'new',
  'contacted',
  'approved',
  'archived'
);

create table if not exists public.community_join_requests (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  wechat text not null,
  city text default '常州',
  role_label text,
  organization text,
  monthly_time text,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  note text,
  willing_to_attend boolean not null default true,
  willing_to_share boolean not null default false,
  willing_to_join_projects boolean not null default false,
  status public.join_request_status not null default 'new',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists join_requests_set_updated_at on public.community_join_requests;
create trigger join_requests_set_updated_at
  before update on public.community_join_requests
  for each row execute procedure public.set_updated_at();

alter table public.community_join_requests enable row level security;

create policy "join requests are insertable by anyone"
  on public.community_join_requests
  for insert
  with check (true);

create policy "join requests are readable by staff"
  on public.community_join_requests
  for select
  using (public.is_staff(auth.uid()));

create policy "join requests are manageable by staff"
  on public.community_join_requests
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));
