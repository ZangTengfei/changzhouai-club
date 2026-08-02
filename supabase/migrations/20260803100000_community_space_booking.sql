create table if not exists public.community_space_resources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{2,20}$'),
  name text not null check (char_length(name) between 1 and 40),
  resource_type text not null check (resource_type in ('desk', 'meeting_room')),
  desk_mode text check (desk_mode in ('flexible', 'fixed')),
  capacity smallint not null default 1 check (capacity between 1 and 30),
  area_label text not null check (char_length(area_label) between 1 and 40),
  x_percent numeric(5, 2) not null check (x_percent between 0 and 100),
  y_percent numeric(5, 2) not null check (y_percent between 0 and 100),
  width_percent numeric(5, 2) not null check (width_percent > 0 and width_percent <= 100),
  height_percent numeric(5, 2) not null check (height_percent > 0 and height_percent <= 100),
  rotation_degrees smallint not null default 0 check (rotation_degrees between -180 and 180),
  status text not null default 'active' check (status in ('active', 'disabled')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (resource_type = 'desk' and desk_mode is not null and capacity = 1)
    or (resource_type = 'meeting_room' and desk_mode is null)
  )
);

create table if not exists public.community_fixed_desk_assignments (
  resource_id uuid primary key references public.community_space_resources(id) on delete cascade,
  opc_name text not null check (char_length(opc_name) between 1 and 80),
  user_id uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_space_bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.community_space_resources(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  purpose text check (purpose is null or char_length(purpose) <= 200),
  attendee_count smallint not null default 1 check (attendee_count between 1 and 30),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at > starts_at),
  check (ends_at - starts_at between interval '30 minutes' and interval '24 hours')
);

create table if not exists public.community_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact text not null check (char_length(contact) between 2 and 100),
  note text check (note is null or char_length(note) <= 300),
  status text not null default 'submitted' check (status in ('submitted', 'processed')),
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_space_bookings_resource_time_idx
  on public.community_space_bookings (resource_id, starts_at, ends_at)
  where status = 'confirmed';

create index if not exists community_space_bookings_user_time_idx
  on public.community_space_bookings (user_id, starts_at desc);

create unique index if not exists community_access_requests_one_submitted_idx
  on public.community_access_requests (user_id)
  where status = 'submitted';

drop trigger if exists community_space_resources_set_updated_at on public.community_space_resources;
create trigger community_space_resources_set_updated_at
  before update on public.community_space_resources
  for each row execute procedure public.set_updated_at();

drop trigger if exists community_fixed_desk_assignments_set_updated_at on public.community_fixed_desk_assignments;
create trigger community_fixed_desk_assignments_set_updated_at
  before update on public.community_fixed_desk_assignments
  for each row execute procedure public.set_updated_at();

drop trigger if exists community_space_bookings_set_updated_at on public.community_space_bookings;
create trigger community_space_bookings_set_updated_at
  before update on public.community_space_bookings
  for each row execute procedure public.set_updated_at();

drop trigger if exists community_access_requests_set_updated_at on public.community_access_requests;
create trigger community_access_requests_set_updated_at
  before update on public.community_access_requests
  for each row execute procedure public.set_updated_at();

create or replace function public.enforce_community_flexible_desk_minimum()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_desk_count integer;
  assigned_desk_count integer;
  target_type text;
begin
  select resource_type
    into target_type
  from public.community_space_resources
  where id = new.resource_id;

  if target_type is distinct from 'desk' then
    raise exception 'fixed_assignment_requires_desk';
  end if;

  select count(*)
    into active_desk_count
  from public.community_space_resources
  where resource_type = 'desk'
    and desk_mode = 'flexible'
    and status = 'active';

  select count(*)
    into assigned_desk_count
  from public.community_fixed_desk_assignments
  inner join public.community_space_resources
    on community_space_resources.id = community_fixed_desk_assignments.resource_id
  where community_fixed_desk_assignments.resource_id <> new.resource_id
    and community_space_resources.resource_type = 'desk'
    and community_space_resources.desk_mode = 'flexible'
    and community_space_resources.status = 'active';

  if active_desk_count - assigned_desk_count - 1 < 6 then
    raise exception 'minimum_flexible_desks_required';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_community_flexible_desk_minimum on public.community_fixed_desk_assignments;
create trigger enforce_community_flexible_desk_minimum
  before insert or update of resource_id on public.community_fixed_desk_assignments
  for each row execute procedure public.enforce_community_flexible_desk_minimum();

create or replace function public.ensure_community_flexible_desk_minimum()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  flexible_desk_count integer;
begin
  select count(*)
    into flexible_desk_count
  from public.community_space_resources
  where resource_type = 'desk'
    and desk_mode = 'flexible'
    and status = 'active'
    and not exists (
      select 1
      from public.community_fixed_desk_assignments
      where community_fixed_desk_assignments.resource_id = community_space_resources.id
    );

  if flexible_desk_count < 6 then
    raise exception 'minimum_flexible_desks_required';
  end if;

  return null;
end;
$$;

drop trigger if exists ensure_community_flexible_desks_after_resource_change on public.community_space_resources;
create constraint trigger ensure_community_flexible_desks_after_resource_change
  after insert or update or delete on public.community_space_resources
  deferrable initially deferred
  for each row execute procedure public.ensure_community_flexible_desk_minimum();

drop trigger if exists ensure_community_flexible_desks_after_assignment_change on public.community_fixed_desk_assignments;
create constraint trigger ensure_community_flexible_desks_after_assignment_change
  after insert or update or delete on public.community_fixed_desk_assignments
  deferrable initially deferred
  for each row execute procedure public.ensure_community_flexible_desk_minimum();

create or replace function public.submit_community_space_booking(
  p_resource_id uuid,
  p_user_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_purpose text default null,
  p_attendee_count integer default 1
)
returns public.community_space_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  resource_row public.community_space_resources%rowtype;
  booking_row public.community_space_bookings%rowtype;
begin
  if p_ends_at <= p_starts_at
    or p_ends_at - p_starts_at < interval '30 minutes'
    or p_ends_at - p_starts_at > interval '24 hours' then
    raise exception 'invalid_booking_time';
  end if;

  if p_starts_at < timezone('utc', now()) - interval '5 minutes' then
    raise exception 'booking_time_in_past';
  end if;

  if not exists (
    select 1
    from public.members
    where id = p_user_id
      and status in ('active', 'organizer', 'admin')
  ) then
    raise exception 'community_membership_required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_user_id
      and nullif(trim(coalesce(display_name, '')), '') is not null
      and trim(display_name) <> '微信用户'
  ) then
    raise exception 'community_profile_required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_resource_id::text, 0));

  select *
    into resource_row
  from public.community_space_resources
  where id = p_resource_id
    and status = 'active';

  if not found then
    raise exception 'space_resource_unavailable';
  end if;

  if resource_row.resource_type = 'desk' and (
    resource_row.desk_mode = 'fixed'
    or exists (
      select 1
      from public.community_fixed_desk_assignments
      where resource_id = p_resource_id
    )
  ) then
    raise exception 'fixed_desk_unavailable';
  end if;

  if p_attendee_count < 1 or p_attendee_count > resource_row.capacity then
    raise exception 'attendee_count_exceeds_capacity';
  end if;

  if resource_row.resource_type = 'meeting_room'
    and nullif(trim(coalesce(p_purpose, '')), '') is null then
    raise exception 'meeting_purpose_required';
  end if;

  if exists (
    select 1
    from public.community_space_bookings
    where resource_id = p_resource_id
      and status = 'confirmed'
      and starts_at < p_ends_at
      and ends_at > p_starts_at
  ) then
    raise exception 'space_resource_already_booked';
  end if;

  insert into public.community_space_bookings (
    resource_id,
    user_id,
    starts_at,
    ends_at,
    purpose,
    attendee_count
  ) values (
    p_resource_id,
    p_user_id,
    p_starts_at,
    p_ends_at,
    nullif(trim(coalesce(p_purpose, '')), ''),
    p_attendee_count
  )
  returning * into booking_row;

  return booking_row;
end;
$$;

revoke all on function public.submit_community_space_booking(uuid, uuid, timestamptz, timestamptz, text, integer) from public;
grant execute on function public.submit_community_space_booking(uuid, uuid, timestamptz, timestamptz, text, integer) to service_role;

alter table public.community_space_resources enable row level security;
alter table public.community_fixed_desk_assignments enable row level security;
alter table public.community_space_bookings enable row level security;
alter table public.community_access_requests enable row level security;

revoke all on table public.community_fixed_desk_assignments from anon, authenticated;
revoke all on table public.community_space_bookings from anon;
revoke all on table public.community_access_requests from anon;

grant select on table public.community_space_resources to anon, authenticated;
grant select, insert, update on table public.community_space_bookings to authenticated;
grant select, insert, update on table public.community_access_requests to authenticated;
grant all on table public.community_space_resources to service_role;
grant all on table public.community_fixed_desk_assignments to service_role;
grant all on table public.community_space_bookings to service_role;
grant all on table public.community_access_requests to service_role;

drop policy if exists "Community space resources are publicly readable" on public.community_space_resources;
create policy "Community space resources are publicly readable"
  on public.community_space_resources
  for select
  using (true);

drop policy if exists "Members can read their own space bookings" on public.community_space_bookings;
create policy "Members can read their own space bookings"
  on public.community_space_bookings
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "Members can insert their own space bookings" on public.community_space_bookings;
create policy "Members can insert their own space bookings"
  on public.community_space_bookings
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Members can cancel their own space bookings" on public.community_space_bookings;
create policy "Members can cancel their own space bookings"
  on public.community_space_bookings
  for update
  to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()))
  with check (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "Members can read their own access requests" on public.community_access_requests;
create policy "Members can read their own access requests"
  on public.community_access_requests
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "Members can submit their own access requests" on public.community_access_requests;
create policy "Members can submit their own access requests"
  on public.community_access_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Staff can process access requests" on public.community_access_requests;
create policy "Staff can process access requests"
  on public.community_access_requests
  for update
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

insert into public.community_space_resources (
  code, name, resource_type, desk_mode, capacity, area_label,
  x_percent, y_percent, width_percent, height_percent, sort_order
)
select
  'D' || lpad(((row_number - 1) * 4 + column_number)::text, 2, '0'),
  '工位 ' || lpad(((row_number - 1) * 4 + column_number)::text, 2, '0'),
  'desk',
  'flexible',
  1,
  '办公大厅',
  8 + (column_number - 1) * 13,
  16 + (row_number - 1) * 11,
  9,
  7,
  (row_number - 1) * 4 + column_number
from generate_series(1, 6) as desk_rows(row_number)
cross join generate_series(1, 4) as desk_columns(column_number)
on conflict (code) do update set
  name = excluded.name,
  resource_type = excluded.resource_type,
  desk_mode = excluded.desk_mode,
  capacity = excluded.capacity,
  area_label = excluded.area_label,
  x_percent = excluded.x_percent,
  y_percent = excluded.y_percent,
  width_percent = excluded.width_percent,
  height_percent = excluded.height_percent,
  sort_order = excluded.sort_order;

insert into public.community_space_resources (
  code, name, resource_type, capacity, area_label,
  x_percent, y_percent, width_percent, height_percent, sort_order
) values
  ('MR-01', '会议室 1', 'meeting_room', 6, '前台右侧', 66, 12, 27, 20, 101),
  ('MR-02', '会议室 2', 'meeting_room', 8, '办公大厅南侧', 9, 83, 34, 14, 102)
on conflict (code) do update set
  name = excluded.name,
  resource_type = excluded.resource_type,
  desk_mode = excluded.desk_mode,
  capacity = excluded.capacity,
  area_label = excluded.area_label,
  x_percent = excluded.x_percent,
  y_percent = excluded.y_percent,
  width_percent = excluded.width_percent,
  height_percent = excluded.height_percent,
  sort_order = excluded.sort_order;
