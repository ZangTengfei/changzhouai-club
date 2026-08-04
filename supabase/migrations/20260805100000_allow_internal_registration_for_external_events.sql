create or replace function public.submit_event_registration(
  p_event_id uuid,
  p_user_id uuid,
  p_note text default null,
  p_allow_admin_only boolean default false
)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row public.events%rowtype;
  existing_row public.event_registrations%rowtype;
  registration_row public.event_registrations%rowtype;
  next_status public.registration_status;
  confirmed_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and public.current_community_user_id() <> p_user_id then
    raise exception 'registration_user_mismatch' using errcode = '42501';
  end if;

  if char_length(coalesce(p_note, '')) > 500 then
    raise exception 'invalid_registration_note' using errcode = '22023';
  end if;

  select *
  into event_row
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;

  if event_row.status <> 'scheduled' then
    raise exception 'registration_closed' using errcode = 'P0001';
  end if;

  if event_row.visibility = 'admin_only'
    and not (
      coalesce(auth.role(), '') = 'service_role'
      and p_allow_admin_only
    )
    and not private.has_admin_permission(auth.uid(), 'events.read') then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;

  if event_row.registration_url is not null then
    raise exception 'external_registration_required' using errcode = 'P0001';
  end if;

  select *
  into existing_row
  from public.event_registrations
  where event_id = p_event_id and user_id = p_user_id
  for update;

  if existing_row.id is not null and existing_row.status = 'registered' then
    update public.event_registrations
    set note = nullif(btrim(coalesce(p_note, '')), '')
    where id = existing_row.id
    returning * into registration_row;

    return registration_row;
  end if;

  if event_row.registration_mode = 'review' then
    next_status := 'pending';
  else
    select count(*)::integer
    into confirmed_count
    from public.event_registrations
    where event_id = p_event_id
      and status = 'registered'
      and (existing_row.id is null or id <> existing_row.id);

    next_status := case
      when event_row.registration_capacity is null
        or confirmed_count < event_row.registration_capacity
        then 'registered'::public.registration_status
      else 'waitlisted'::public.registration_status
    end;
  end if;

  insert into public.event_registrations (event_id, user_id, note, status)
  values (
    p_event_id,
    p_user_id,
    nullif(btrim(coalesce(p_note, '')), ''),
    next_status
  )
  on conflict (event_id, user_id) do update
    set note = excluded.note,
        status = excluded.status
  returning * into registration_row;

  return registration_row;
end;
$$;

revoke all on function public.submit_event_registration(uuid, uuid, text, boolean)
  from public;
grant execute on function public.submit_event_registration(uuid, uuid, text, boolean)
  to authenticated, service_role;
