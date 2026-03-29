create extension if not exists pgcrypto;

create type public.member_status as enum (
  'pending',
  'active',
  'organizer',
  'admin',
  'paused'
);

create type public.event_status as enum (
  'draft',
  'scheduled',
  'completed',
  'cancelled'
);

create type public.registration_status as enum (
  'registered',
  'waitlisted',
  'cancelled'
);

create type public.attendance_status as enum (
  'attended',
  'absent',
  'late',
  'speaker'
);

create type public.lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'won',
  'lost'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  city text default '常州',
  bio text,
  skills text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.members (
  id uuid primary key references public.profiles(id) on delete cascade,
  status public.member_status not null default 'active',
  willing_to_share boolean not null default false,
  willing_to_join_projects boolean not null default false,
  joined_at timestamptz not null default timezone('utc', now()),
  last_active_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  provider_email text,
  provider_union_id text,
  created_at timestamptz not null default timezone('utc', now()),
  linked_at timestamptz not null default timezone('utc', now()),
  unique (provider, provider_user_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  event_at timestamptz,
  venue text,
  city text default '常州',
  cover_image_url text,
  status public.event_status not null default 'scheduled',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  note text,
  status public.registration_status not null default 'registered',
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, user_id)
);

create table if not exists public.event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.attendance_status not null default 'attended',
  checked_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, user_id)
);

create table if not exists public.talks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  speaker_id uuid references auth.users(id) on delete set null,
  title text not null,
  summary text,
  topic_tags text[] not null default '{}',
  project_stage text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cooperation_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_wechat text,
  contact_phone text,
  requirement_type text,
  requirement_summary text not null,
  budget_range text,
  desired_timeline text,
  status public.lead_status not null default 'new',
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.members (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
  before update on public.members
  for each row execute procedure public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

drop trigger if exists talks_set_updated_at on public.talks;
create trigger talks_set_updated_at
  before update on public.talks
  for each row execute procedure public.set_updated_at();

drop trigger if exists leads_set_updated_at on public.cooperation_leads;
create trigger leads_set_updated_at
  before update on public.cooperation_leads
  for each row execute procedure public.set_updated_at();

create or replace function public.is_staff(user_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.members
    where id = user_uuid
      and status in ('organizer', 'admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.user_identities enable row level security;
alter table public.events enable row level security;
alter table public.event_photos enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_attendance enable row level security;
alter table public.talks enable row level security;
alter table public.cooperation_leads enable row level security;

create policy "profiles are readable by owner or staff"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_staff(auth.uid()));

create policy "profiles are updatable by owner"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "members are readable by owner or staff"
  on public.members
  for select
  using (auth.uid() = id or public.is_staff(auth.uid()));

create policy "members are updatable by owner"
  on public.members
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "user identities are readable by owner"
  on public.user_identities
  for select
  using (auth.uid() = user_id);

create policy "user identities are insertable by owner"
  on public.user_identities
  for insert
  with check (auth.uid() = user_id);

create policy "events are publicly readable except drafts"
  on public.events
  for select
  using (status <> 'draft' or public.is_staff(auth.uid()));

create policy "events are manageable by staff"
  on public.events
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "event photos are publicly readable for visible events"
  on public.event_photos
  for select
  using (
    exists (
      select 1
      from public.events
      where events.id = event_photos.event_id
        and (events.status <> 'draft' or public.is_staff(auth.uid()))
    )
  );

create policy "event photos are manageable by staff"
  on public.event_photos
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "registrations are readable by owner or staff"
  on public.event_registrations
  for select
  using (auth.uid() = user_id or public.is_staff(auth.uid()));

create policy "registrations are insertable by owner"
  on public.event_registrations
  for insert
  with check (auth.uid() = user_id);

create policy "registrations are updatable by owner or staff"
  on public.event_registrations
  for update
  using (auth.uid() = user_id or public.is_staff(auth.uid()))
  with check (auth.uid() = user_id or public.is_staff(auth.uid()));

create policy "attendance is readable by owner or staff"
  on public.event_attendance
  for select
  using (auth.uid() = user_id or public.is_staff(auth.uid()));

create policy "attendance is manageable by staff"
  on public.event_attendance
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "talks are publicly readable for visible events"
  on public.talks
  for select
  using (
    exists (
      select 1
      from public.events
      where events.id = talks.event_id
        and (events.status <> 'draft' or public.is_staff(auth.uid()))
    )
  );

create policy "talks are manageable by staff"
  on public.talks
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "cooperation leads are readable by staff"
  on public.cooperation_leads
  for select
  using (public.is_staff(auth.uid()));

create policy "cooperation leads are manageable by staff"
  on public.cooperation_leads
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));
