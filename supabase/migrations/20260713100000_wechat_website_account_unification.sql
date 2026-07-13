create or replace function public.promote_miniapp_anchor_to_wechat_user(
  source_user_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if source_user_id is null or target_user_id is null or source_user_id = target_user_id then
    raise exception 'invalid_account_promotion';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = source_user_id
      and raw_app_meta_data ->> 'account_anchor' = 'wechat_miniapp'
  ) then
    raise exception 'source_is_not_miniapp_anchor';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'target_user_not_found';
  end if;

  update public.profiles as target
  set
    display_name = coalesce(nullif(target.display_name, ''), source.display_name),
    avatar_url = coalesce(nullif(target.avatar_url, ''), source.avatar_url),
    city = coalesce(nullif(target.city, ''), source.city),
    bio = coalesce(nullif(target.bio, ''), source.bio),
    role_label = coalesce(nullif(target.role_label, ''), source.role_label),
    organization = coalesce(nullif(target.organization, ''), source.organization),
    wechat = coalesce(nullif(target.wechat, ''), source.wechat),
    monthly_time = coalesce(nullif(target.monthly_time, ''), source.monthly_time),
    skills = array(
      select distinct value
      from unnest(coalesce(target.skills, '{}'::text[]) || coalesce(source.skills, '{}'::text[])) as value
      where value <> ''
    ),
    interests = array(
      select distinct value
      from unnest(coalesce(target.interests, '{}'::text[]) || coalesce(source.interests, '{}'::text[])) as value
      where value <> ''
    )
  from public.profiles as source
  where target.id = target_user_id
    and source.id = source_user_id;

  update public.members as target
  set
    willing_to_attend = target.willing_to_attend or source.willing_to_attend,
    willing_to_share = target.willing_to_share or source.willing_to_share,
    willing_to_join_projects = target.willing_to_join_projects or source.willing_to_join_projects,
    onboarding_completed_at = coalesce(target.onboarding_completed_at, source.onboarding_completed_at)
  from public.members as source
  where target.id = target_user_id
    and source.id = source_user_id;

  insert into public.event_registrations (event_id, user_id, note, status, created_at)
  select event_id, target_user_id, note, status, created_at
  from public.event_registrations
  where user_id = source_user_id
  on conflict (event_id, user_id) do update
  set
    note = coalesce(public.event_registrations.note, excluded.note),
    status = case
      when public.event_registrations.status = 'registered' or excluded.status = 'registered'
        then 'registered'::public.registration_status
      when public.event_registrations.status = 'waitlisted' or excluded.status = 'waitlisted'
        then 'waitlisted'::public.registration_status
      else 'cancelled'::public.registration_status
    end;

  delete from public.event_registrations where user_id = source_user_id;

  update public.miniapp_sessions
  set user_id = target_user_id
  where user_id = source_user_id;

  insert into public.miniapp_consents (user_id, policy_version, accepted_at, created_at)
  select target_user_id, policy_version, accepted_at, created_at
  from public.miniapp_consents
  where user_id = source_user_id
  on conflict (user_id, policy_version) do update
  set accepted_at = greatest(public.miniapp_consents.accepted_at, excluded.accepted_at);

  delete from public.miniapp_consents where user_id = source_user_id;

  insert into public.miniapp_event_subscriptions (
    user_id,
    event_id,
    template_id,
    status,
    send_at,
    sent_at,
    last_error,
    created_at,
    updated_at
  )
  select
    target_user_id,
    event_id,
    template_id,
    status,
    send_at,
    sent_at,
    last_error,
    created_at,
    updated_at
  from public.miniapp_event_subscriptions
  where user_id = source_user_id
  on conflict (user_id, event_id, template_id) do update
  set
    status = case
      when public.miniapp_event_subscriptions.status = 'sent' or excluded.status = 'sent' then 'sent'
      when public.miniapp_event_subscriptions.status = 'accepted' or excluded.status = 'accepted' then 'accepted'
      else public.miniapp_event_subscriptions.status
    end,
    send_at = coalesce(public.miniapp_event_subscriptions.send_at, excluded.send_at),
    sent_at = coalesce(public.miniapp_event_subscriptions.sent_at, excluded.sent_at),
    last_error = coalesce(public.miniapp_event_subscriptions.last_error, excluded.last_error);

  delete from public.miniapp_event_subscriptions where user_id = source_user_id;

  update public.miniapp_analytics_events
  set user_id = target_user_id
  where user_id = source_user_id;

  update public.user_identities
  set user_id = target_user_id
  where user_id = source_user_id;

  update public.wechat_union_accounts
  set user_id = target_user_id
  where user_id = source_user_id;

  update public.user_account_links
  set canonical_user_id = target_user_id,
      link_source = 'wechat_unionid'
  where canonical_user_id = source_user_id;

  insert into public.user_account_links (auth_user_id, canonical_user_id, link_source)
  values
    (source_user_id, target_user_id, 'wechat_unionid'),
    (target_user_id, target_user_id, 'self')
  on conflict (auth_user_id) do update
  set
    canonical_user_id = excluded.canonical_user_id,
    link_source = excluded.link_source;
end;
$$;

revoke all on function public.promote_miniapp_anchor_to_wechat_user(uuid, uuid) from public;
grant execute on function public.promote_miniapp_anchor_to_wechat_user(uuid, uuid) to service_role;
