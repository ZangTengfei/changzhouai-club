-- Every active desk is dual-purpose until it receives a fixed assignment:
-- it can be booked by time window and can receive a fixed-desk application.
-- Once assigned, bookings are blocked until the assignment is released.

update public.community_space_resources
set
  desk_mode = 'flexible',
  name = case
    when code ~ '^F[0-9]{2}$' then '集中办公室工位 ' || right(code, 2)
    else name
  end,
  updated_at = timezone('utc', now())
where resource_type = 'desk'
  and desk_mode = 'fixed';

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
  target_status text;
begin
  select resource_type, status
    into target_type, target_status
  from public.community_space_resources
  where id = new.resource_id;

  if target_type is distinct from 'desk' then
    raise exception 'fixed_assignment_requires_desk';
  end if;

  if target_status is distinct from 'active' then
    raise exception 'fixed_assignment_requires_active_desk';
  end if;

  select count(*)
    into active_desk_count
  from public.community_space_resources
  where resource_type = 'desk'
    and status = 'active';

  select count(*)
    into assigned_desk_count
  from public.community_fixed_desk_assignments
  inner join public.community_space_resources
    on community_space_resources.id = community_fixed_desk_assignments.resource_id
  where community_fixed_desk_assignments.resource_id <> new.resource_id
    and community_space_resources.resource_type = 'desk'
    and community_space_resources.status = 'active';

  if active_desk_count - assigned_desk_count - 1 < 6 then
    raise exception 'minimum_flexible_desks_required';
  end if;

  return new;
end;
$$;

create or replace function public.ensure_community_flexible_desks_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bookable_desk_count integer;
begin
  select count(*)
    into bookable_desk_count
  from public.community_space_resources
  where resource_type = 'desk'
    and status = 'active'
    and not exists (
      select 1
      from public.community_fixed_desk_assignments
      where community_fixed_desk_assignments.resource_id = community_space_resources.id
    );

  if bookable_desk_count < 6 then
    raise exception 'minimum_flexible_desks_required';
  end if;

  return null;
end;
$$;

drop trigger if exists ensure_community_flexible_desks_after_resource_change
  on public.community_space_resources;
create constraint trigger ensure_community_flexible_desks_after_resource_change
  after insert or update or delete on public.community_space_resources
  deferrable initially deferred
  for each row execute procedure public.ensure_community_flexible_desks_after_change();

drop trigger if exists ensure_community_flexible_desks_after_assignment_change
  on public.community_fixed_desk_assignments;
create constraint trigger ensure_community_flexible_desks_after_assignment_change
  after insert or update or delete on public.community_fixed_desk_assignments
  deferrable initially deferred
  for each row execute procedure public.ensure_community_flexible_desks_after_change();

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

  perform pg_advisory_xact_lock(
    hashtextextended('fixed-desk-resource:' || p_resource_id::text, 0)
  );

  select *
    into resource_row
  from public.community_space_resources
  where id = p_resource_id
    and status = 'active';

  if not found then
    raise exception 'space_resource_unavailable';
  end if;

  if resource_row.resource_type = 'desk' and exists (
    select 1
    from public.community_fixed_desk_assignments
    where resource_id = p_resource_id
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

create or replace function public.submit_community_fixed_desk_request(
  p_resource_id uuid,
  p_user_id uuid,
  p_note text default null,
  p_public_profile_consent boolean default false
)
returns public.community_fixed_desk_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.community_fixed_desk_requests%rowtype;
  resource_row public.community_space_resources%rowtype;
begin
  if not p_public_profile_consent then
    raise exception 'fixed_desk_public_profile_consent_required';
  end if;

  if char_length(coalesce(p_note, '')) > 500 then
    raise exception 'fixed_desk_request_note_too_long';
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

  perform pg_advisory_xact_lock(hashtextextended('fixed-desk-user:' || p_user_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('fixed-desk-resource:' || p_resource_id::text, 0));

  select *
    into resource_row
  from public.community_space_resources
  where id = p_resource_id
    and resource_type = 'desk'
    and status = 'active'
  for update;

  if not found then
    raise exception 'fixed_desk_not_applicable';
  end if;

  if exists (
    select 1
    from public.community_fixed_desk_assignments
    where resource_id = p_resource_id
  ) then
    raise exception 'fixed_desk_already_assigned';
  end if;

  if exists (
    select 1
    from public.community_fixed_desk_assignments
    where user_id = p_user_id
  ) then
    raise exception 'fixed_desk_user_already_assigned';
  end if;

  if exists (
    select 1
    from public.community_fixed_desk_requests
    where user_id = p_user_id
      and status = 'submitted'
  ) then
    raise exception 'fixed_desk_request_already_submitted';
  end if;

  insert into public.community_fixed_desk_requests (
    resource_id,
    user_id,
    note,
    public_profile_consent_at
  ) values (
    p_resource_id,
    p_user_id,
    nullif(trim(coalesce(p_note, '')), ''),
    timezone('utc', now())
  )
  returning * into request_row;

  return request_row;
end;
$$;

create or replace function public.review_community_fixed_desk_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_review_note text default null
)
returns public.community_fixed_desk_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.community_fixed_desk_requests%rowtype;
  applicant_name text;
begin
  if p_decision not in ('approve', 'reject') then
    raise exception 'invalid_fixed_desk_review_decision';
  end if;

  if char_length(coalesce(p_review_note, '')) > 500 then
    raise exception 'fixed_desk_review_note_too_long';
  end if;

  select *
    into request_row
  from public.community_fixed_desk_requests
  where id = p_request_id
    and status = 'submitted'
  for update;

  if not found then
    raise exception 'fixed_desk_request_not_reviewable';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('fixed-desk-user:' || request_row.user_id::text, 0)
  );
  perform pg_advisory_xact_lock(
    hashtextextended('fixed-desk-resource:' || request_row.resource_id::text, 0)
  );

  if p_decision = 'approve' then
    if request_row.public_profile_consent_at is null then
      raise exception 'fixed_desk_public_profile_consent_required';
    end if;

    if not exists (
      select 1
      from public.community_space_resources
      where id = request_row.resource_id
        and resource_type = 'desk'
        and status = 'active'
    ) then
      raise exception 'fixed_desk_not_applicable';
    end if;

    if exists (
      select 1
      from public.community_fixed_desk_assignments
      where resource_id = request_row.resource_id
    ) then
      raise exception 'fixed_desk_already_assigned';
    end if;

    if exists (
      select 1
      from public.community_fixed_desk_assignments
      where user_id = request_row.user_id
    ) then
      raise exception 'fixed_desk_user_already_assigned';
    end if;

    if exists (
      select 1
      from public.community_space_bookings
      where resource_id = request_row.resource_id
        and status = 'confirmed'
        and ends_at > timezone('utc', now())
    ) then
      raise exception 'fixed_desk_has_active_bookings';
    end if;

    select nullif(trim(coalesce(display_name, '')), '')
      into applicant_name
    from public.profiles
    where id = request_row.user_id;

    if applicant_name is null or applicant_name = '微信用户' then
      raise exception 'community_profile_required';
    end if;

    insert into public.community_fixed_desk_assignments (
      resource_id,
      opc_name,
      user_id,
      request_id,
      public_profile_consent_at,
      assigned_at
    ) values (
      request_row.resource_id,
      applicant_name,
      request_row.user_id,
      request_row.id,
      request_row.public_profile_consent_at,
      timezone('utc', now())
    );

    update public.community_fixed_desk_requests
    set
      status = 'approved',
      reviewed_by = p_reviewer_id,
      review_note = nullif(trim(coalesce(p_review_note, '')), ''),
      reviewed_at = timezone('utc', now())
    where id = request_row.id
    returning * into request_row;

    update public.community_fixed_desk_requests
    set
      status = 'rejected',
      reviewed_by = p_reviewer_id,
      review_note = '该工位已分配给其他常驻 OPC',
      reviewed_at = timezone('utc', now())
    where resource_id = request_row.resource_id
      and id <> request_row.id
      and status = 'submitted';
  else
    update public.community_fixed_desk_requests
    set
      status = 'rejected',
      reviewed_by = p_reviewer_id,
      review_note = nullif(trim(coalesce(p_review_note, '')), ''),
      reviewed_at = timezone('utc', now())
    where id = request_row.id
    returning * into request_row;
  end if;

  return request_row;
end;
$$;
