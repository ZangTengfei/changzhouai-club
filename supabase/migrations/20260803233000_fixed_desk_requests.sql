create table if not exists public.community_fixed_desk_requests (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.community_space_resources(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text check (note is null or char_length(note) <= 500),
  public_profile_consent_at timestamptz not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'rejected', 'withdrawn', 'released')),
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text check (review_note is null or char_length(review_note) <= 500),
  reviewed_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.community_fixed_desk_assignments
  add column if not exists request_id uuid
    references public.community_fixed_desk_requests(id) on delete set null;

alter table public.community_fixed_desk_assignments
  add column if not exists public_profile_consent_at timestamptz;

create unique index if not exists community_fixed_desk_assignments_user_idx
  on public.community_fixed_desk_assignments (user_id)
  where user_id is not null;

create unique index if not exists community_fixed_desk_requests_one_submitted_per_user_idx
  on public.community_fixed_desk_requests (user_id)
  where status = 'submitted';

create unique index if not exists community_fixed_desk_requests_one_approved_per_user_idx
  on public.community_fixed_desk_requests (user_id)
  where status = 'approved';

create index if not exists community_fixed_desk_requests_resource_status_idx
  on public.community_fixed_desk_requests (resource_id, status, created_at desc);

drop trigger if exists community_fixed_desk_requests_set_updated_at
  on public.community_fixed_desk_requests;
create trigger community_fixed_desk_requests_set_updated_at
  before update on public.community_fixed_desk_requests
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
  target_mode text;
begin
  select resource_type, desk_mode
    into target_type, target_mode
  from public.community_space_resources
  where id = new.resource_id;

  if target_type is distinct from 'desk' then
    raise exception 'fixed_assignment_requires_desk';
  end if;

  if target_mode is distinct from 'flexible' then
    return new;
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
    and desk_mode = 'fixed'
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

create or replace function public.release_community_fixed_desk_assignment(
  p_resource_id uuid,
  p_actor_id uuid,
  p_allow_staff boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_row public.community_fixed_desk_assignments%rowtype;
begin
  perform pg_advisory_xact_lock(
    hashtextextended('fixed-desk-resource:' || p_resource_id::text, 0)
  );

  select *
    into assignment_row
  from public.community_fixed_desk_assignments
  where resource_id = p_resource_id
  for update;

  if not found then
    raise exception 'fixed_desk_assignment_not_found';
  end if;

  if assignment_row.user_id is distinct from p_actor_id and not p_allow_staff then
    raise exception 'fixed_desk_release_forbidden';
  end if;

  delete from public.community_fixed_desk_assignments
  where resource_id = p_resource_id;

  if assignment_row.request_id is not null then
    update public.community_fixed_desk_requests
    set
      status = 'released',
      released_at = timezone('utc', now())
    where id = assignment_row.request_id
      and status = 'approved';
  end if;

  return p_resource_id;
end;
$$;

revoke all on function public.submit_community_fixed_desk_request(uuid, uuid, text, boolean)
  from public;
revoke all on function public.review_community_fixed_desk_request(uuid, uuid, text, text)
  from public;
revoke all on function public.release_community_fixed_desk_assignment(uuid, uuid, boolean)
  from public;

grant execute on function public.submit_community_fixed_desk_request(uuid, uuid, text, boolean)
  to service_role;
grant execute on function public.review_community_fixed_desk_request(uuid, uuid, text, text)
  to service_role;
grant execute on function public.release_community_fixed_desk_assignment(uuid, uuid, boolean)
  to service_role;

alter table public.community_fixed_desk_requests enable row level security;
revoke all on table public.community_fixed_desk_requests from anon, authenticated;
grant all on table public.community_fixed_desk_requests to service_role;

insert into public.admin_permissions (
  permission_key,
  module,
  action,
  sensitivity_level,
  description
)
values
  ('spaces.read', 'spaces', 'read', 'L1', '查看空间工位和固定工位申请'),
  ('spaces.manage_fixed_desks', 'spaces', 'manage_fixed_desks', 'L2', '审批、驳回或释放固定工位')
on conflict (permission_key) do update
set
  module = excluded.module,
  action = excluded.action,
  sensitivity_level = excluded.sensitivity_level,
  description = excluded.description;

insert into public.admin_role_permissions (role_id, permission_key)
select roles.id, permissions.permission_key
from public.admin_roles as roles
cross join (
  values ('spaces.read'), ('spaces.manage_fixed_desks')
) as permissions(permission_key)
where roles.role_key in ('super_admin', 'ops_lead')
on conflict (role_id, permission_key) do nothing;
