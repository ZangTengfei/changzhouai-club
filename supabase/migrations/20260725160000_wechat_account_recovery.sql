create table if not exists public.account_recovery_intents (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  source_user_id uuid not null references auth.users(id) on delete cascade,
  target_email_hash text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint account_recovery_intents_token_hash_check
    check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint account_recovery_intents_email_hash_check
    check (target_email_hash ~ '^[a-f0-9]{64}$'),
  constraint account_recovery_intents_expiry_check
    check (expires_at > created_at)
);

create index if not exists account_recovery_intents_source_created_idx
  on public.account_recovery_intents (source_user_id, created_at desc);

create table if not exists public.account_merge_audits (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid references public.account_recovery_intents(id) on delete set null,
  source_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  merge_source text not null default 'wechat_email_recovery',
  choices jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint account_merge_audits_source_check
    check (merge_source in ('wechat_email_recovery', 'manual_merge'))
);

create index if not exists account_merge_audits_users_created_idx
  on public.account_merge_audits (target_user_id, source_user_id, created_at desc);

alter table public.account_recovery_intents enable row level security;
alter table public.account_merge_audits enable row level security;

revoke all on public.account_recovery_intents from anon, authenticated;
revoke all on public.account_merge_audits from anon, authenticated;
grant select, insert, update, delete on public.account_recovery_intents to service_role;
grant select, insert on public.account_merge_audits to service_role;

create or replace function public.is_staff(user_uuid uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.members
    where id = public.resolve_community_user_id(user_uuid)
      and status in ('organizer', 'admin')
  );
$$;

create or replace function private.has_admin_permission(
  requested_user_uuid uuid,
  requested_permission text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members
    where members.id = public.resolve_community_user_id(requested_user_uuid)
      and members.status <> 'paused'
      and (
        members.status = 'admin'
        or exists (
          select 1
          from public.member_admin_roles
          inner join public.admin_role_permissions
            on admin_role_permissions.role_id = member_admin_roles.role_id
          where member_admin_roles.member_id = public.resolve_community_user_id(requested_user_uuid)
            and admin_role_permissions.permission_key = requested_permission
            and (
              member_admin_roles.expires_at is null
              or member_admin_roles.expires_at > timezone('utc', now())
            )
        )
      )
  );
$$;

create or replace function private.list_admin_permissions_for_user(requested_user_uuid uuid)
returns table(permission_key text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct admin_permissions.permission_key
  from public.admin_permissions
  where exists (
    select 1
    from public.members
    where members.id = public.resolve_community_user_id(requested_user_uuid)
      and members.status = 'admin'
      and members.status <> 'paused'
  )

  union

  select distinct admin_role_permissions.permission_key
  from public.member_admin_roles
  inner join public.admin_role_permissions
    on admin_role_permissions.role_id = member_admin_roles.role_id
  inner join public.members
    on members.id = member_admin_roles.member_id
  where member_admin_roles.member_id = public.resolve_community_user_id(requested_user_uuid)
    and members.status <> 'paused'
    and (
      member_admin_roles.expires_at is null
      or member_admin_roles.expires_at > timezone('utc', now())
    );
$$;

create or replace function public.list_current_admin_permissions()
returns table(permission_key text)
language sql
stable
security invoker
set search_path = public, private
as $$
  select private_permissions.permission_key
  from private.list_admin_permissions_for_user(
    public.current_community_user_id()
  ) as private_permissions;
$$;

drop policy if exists "profiles are readable by owner or staff" on public.profiles;
create policy "profiles are readable by owner or staff"
  on public.profiles
  for select
  using (public.current_community_user_id() = id or public.is_staff(auth.uid()));

drop policy if exists "profiles are updatable by owner" on public.profiles;
create policy "profiles are updatable by owner"
  on public.profiles
  for update
  using (public.current_community_user_id() = id)
  with check (public.current_community_user_id() = id);

drop policy if exists "members are readable by owner or staff" on public.members;
create policy "members are readable by owner or staff"
  on public.members
  for select
  using (public.current_community_user_id() = id or public.is_staff(auth.uid()));

drop policy if exists "members are updatable by owner" on public.members;
drop policy if exists "members are updatable by owner or staff" on public.members;
create policy "members are updatable by owner or staff"
  on public.members
  for update
  using (public.current_community_user_id() = id or public.is_staff(auth.uid()))
  with check (public.current_community_user_id() = id or public.is_staff(auth.uid()));

drop policy if exists "registrations are readable by owner or staff" on public.event_registrations;
create policy "registrations are readable by owner or staff"
  on public.event_registrations
  for select
  using (public.current_community_user_id() = user_id or public.is_staff(auth.uid()));

drop policy if exists "registrations are insertable by owner" on public.event_registrations;
create policy "registrations are insertable by owner"
  on public.event_registrations
  for insert
  with check (public.current_community_user_id() = user_id);

drop policy if exists "registrations are updatable by owner or staff" on public.event_registrations;
create policy "registrations are updatable by owner or staff"
  on public.event_registrations
  for update
  using (public.current_community_user_id() = user_id or public.is_staff(auth.uid()))
  with check (public.current_community_user_id() = user_id or public.is_staff(auth.uid()));

drop policy if exists "attendance is readable by owner or staff" on public.event_attendance;
create policy "attendance is readable by owner or staff"
  on public.event_attendance
  for select
  using (public.current_community_user_id() = user_id or public.is_staff(auth.uid()));

drop policy if exists "member works are readable by owners" on public.member_works;
create policy "member works are readable by owners"
  on public.member_works
  for select
  to authenticated
  using (member_id = public.current_community_user_id());

drop policy if exists "member works can be submitted by owners" on public.member_works;
create policy "member works can be submitted by owners"
  on public.member_works
  for insert
  to authenticated
  with check (
    member_id = public.current_community_user_id()
    and is_public = false
    and is_featured = false
    and review_status = 'pending'
  );

drop policy if exists "member works can be updated by owners" on public.member_works;
create policy "member works can be updated by owners"
  on public.member_works
  for update
  to authenticated
  using (member_id = public.current_community_user_id())
  with check (
    member_id = public.current_community_user_id()
    and is_public = false
    and is_featured = false
    and review_status = 'pending'
  );

drop policy if exists "member works can be deleted by owners before publish" on public.member_works;
create policy "member works can be deleted by owners before publish"
  on public.member_works
  for delete
  to authenticated
  using (member_id = public.current_community_user_id() and is_public = false);

drop policy if exists "community update likes are readable by owners" on public.community_update_likes;
create policy "community update likes are readable by owners"
  on public.community_update_likes
  for select
  to authenticated
  using (user_id = public.current_community_user_id());

drop policy if exists "community update likes can be inserted by owners" on public.community_update_likes;
create policy "community update likes can be inserted by owners"
  on public.community_update_likes
  for insert
  to authenticated
  with check (
    user_id = public.current_community_user_id()
    and exists (
      select 1
      from public.community_updates
      where community_updates.id = community_update_likes.update_id
        and community_updates.status = 'published'
    )
  );

drop policy if exists "community update likes can be deleted by owners" on public.community_update_likes;
create policy "community update likes can be deleted by owners"
  on public.community_update_likes
  for delete
  to authenticated
  using (user_id = public.current_community_user_id());

drop policy if exists "project applications are readable by owner or staff" on public.project_applications;
create policy "project applications are readable by owner or staff"
  on public.project_applications
  for select
  using (
    public.is_staff(auth.uid())
    or applicant_user_id = public.current_community_user_id()
  );

drop policy if exists "project applications are insertable for open projects" on public.project_applications;
create policy "project applications are insertable for open projects"
  on public.project_applications
  for insert
  with check (
    (applicant_user_id is null or applicant_user_id = public.current_community_user_id())
    and exists (
      select 1
      from public.project_opportunities
      where project_opportunities.id = project_applications.project_id
        and project_opportunities.status = 'recruiting'
        and (
          project_opportunities.visibility = 'public'
          or (
            project_opportunities.visibility = 'members'
            and exists (
              select 1
              from public.members
              where members.id = public.current_community_user_id()
                and members.status in ('active', 'organizer', 'admin')
            )
          )
        )
    )
  );

drop policy if exists "member avatars are insertable by owner" on storage.objects;
create policy "member avatars are insertable by owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
  );

drop policy if exists "member avatars are updatable by owner" on storage.objects;
create policy "member avatars are updatable by owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
  )
  with check (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
  );

drop policy if exists "member avatars are deletable by owner" on storage.objects;
create policy "member avatars are deletable by owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
  );

drop policy if exists "member work assets are insertable by owner" on storage.objects;
create policy "member work assets are insertable by owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'member-work-assets'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
    and (storage.foldername(name))[2] = 'works'
  );

drop policy if exists "member work assets are updatable by owner" on storage.objects;
create policy "member work assets are updatable by owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'member-work-assets'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
    and (storage.foldername(name))[2] = 'works'
  )
  with check (
    bucket_id = 'member-work-assets'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
    and (storage.foldername(name))[2] = 'works'
  );

drop policy if exists "member work assets are deletable by owner" on storage.objects;
create policy "member work assets are deletable by owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'member-work-assets'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
    and (storage.foldername(name))[2] = 'works'
  );

drop policy if exists "community update assets are insertable by owner" on storage.objects;
create policy "community update assets are insertable by owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'community-update-assets'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
    and (storage.foldername(name))[2] = 'updates'
  );

drop policy if exists "community update assets are updatable by owner" on storage.objects;
create policy "community update assets are updatable by owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'community-update-assets'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
    and (storage.foldername(name))[2] = 'updates'
  )
  with check (
    bucket_id = 'community-update-assets'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
    and (storage.foldername(name))[2] = 'updates'
  );

drop policy if exists "community update assets are deletable by owner" on storage.objects;
create policy "community update assets are deletable by owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'community-update-assets'
    and (storage.foldername(name))[1] = public.current_community_user_id()::text
    and (storage.foldername(name))[2] = 'updates'
  );

create or replace function public.toggle_community_update_like(target_update_id uuid)
returns table(liked boolean, like_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := public.current_community_user_id();
  next_like_count integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.community_updates
    where id = target_update_id and status = 'published'
  ) then
    return query select false, 0;
    return;
  end if;

  if exists (
    select 1 from public.community_update_likes
    where update_id = target_update_id and user_id = current_user_id
  ) then
    delete from public.community_update_likes
    where update_id = target_update_id and user_id = current_user_id;

    update public.community_updates
    set like_count = greatest(community_updates.like_count - 1, 0)
    where id = target_update_id
    returning community_updates.like_count into next_like_count;

    return query select false, coalesce(next_like_count, 0);
    return;
  end if;

  insert into public.community_update_likes (update_id, user_id)
  values (target_update_id, current_user_id)
  on conflict do nothing;

  update public.community_updates
  set like_count = community_updates.like_count + 1
  where id = target_update_id
  returning community_updates.like_count into next_like_count;

  return query select true, coalesce(next_like_count, 0);
end;
$$;

create or replace function public.merge_recovered_wechat_account(
  recovery_intent_id uuid,
  merge_choices jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  recovery_intent public.account_recovery_intents%rowtype;
  source_id uuid;
  target_id uuid;
  source_public_slug text;
begin
  select * into recovery_intent
  from public.account_recovery_intents
  where id = recovery_intent_id
  for update;

  if recovery_intent.id is null then
    raise exception 'recovery_intent_not_found';
  end if;

  source_id := recovery_intent.source_user_id;
  target_id := recovery_intent.target_user_id;

  if recovery_intent.consumed_at is not null then
    return public.resolve_community_user_id(source_id);
  end if;

  if recovery_intent.expires_at <= timezone('utc', now()) then
    raise exception 'recovery_intent_expired';
  end if;

  if target_id is null or source_id = target_id then
    raise exception 'invalid_recovery_accounts';
  end if;

  perform 1 from auth.users where id in (source_id, target_id) for update;

  if not exists (
    select 1 from auth.identities
    where user_id = source_id and provider = 'custom:wechat'
  ) then
    raise exception 'source_is_not_wechat_account';
  end if;

  if not exists (
    select 1 from auth.users
    where id = target_id
      and email is not null
      and email_confirmed_at is not null
  ) then
    raise exception 'target_email_not_verified';
  end if;

  if public.resolve_community_user_id(target_id) <> target_id then
    raise exception 'target_is_not_canonical';
  end if;

  if public.resolve_community_user_id(source_id) <> source_id then
    if public.resolve_community_user_id(source_id) = target_id then
      update public.account_recovery_intents
      set consumed_at = timezone('utc', now())
      where id = recovery_intent_id;
      return target_id;
    end if;
    raise exception 'source_already_merged';
  end if;

  if exists (
    select 1
    from public.wechat_union_accounts as target_union
    where target_union.user_id = target_id
      and not exists (
        select 1
        from public.wechat_union_accounts as source_union
        where source_union.user_id = source_id
          and source_union.union_id = target_union.union_id
      )
  ) then
    raise exception 'target_wechat_identity_conflict';
  end if;

  select public_slug into source_public_slug
  from public.profiles
  where id = source_id;

  if source_public_slug is not null
    and (select public_slug from public.profiles where id = target_id) is null
  then
    update public.profiles set public_slug = null where id = source_id;
    update public.profiles set public_slug = source_public_slug where id = target_id;
  end if;

  update public.profiles as target
  set
    display_name = case
      when merge_choices ->> 'display_name' = 'source'
        then coalesce(nullif(source.display_name, ''), target.display_name)
      else coalesce(nullif(target.display_name, ''), source.display_name)
    end,
    avatar_url = case
      when merge_choices ->> 'avatar_url' = 'source'
        then coalesce(nullif(source.avatar_url, ''), target.avatar_url)
      else coalesce(nullif(target.avatar_url, ''), source.avatar_url)
    end,
    wechat = case
      when merge_choices ->> 'wechat' = 'source'
        then coalesce(nullif(source.wechat, ''), target.wechat)
      else coalesce(nullif(target.wechat, ''), source.wechat)
    end,
    city = coalesce(nullif(target.city, ''), source.city),
    bio = coalesce(nullif(target.bio, ''), source.bio),
    role_label = coalesce(nullif(target.role_label, ''), source.role_label),
    organization = coalesce(nullif(target.organization, ''), source.organization),
    monthly_time = coalesce(nullif(target.monthly_time, ''), source.monthly_time),
    capability_summary = coalesce(nullif(target.capability_summary, ''), source.capability_summary),
    seeking_summary = coalesce(nullif(target.seeking_summary, ''), source.seeking_summary),
    skills = array(
      select distinct value
      from unnest(coalesce(target.skills, '{}'::text[]) || coalesce(source.skills, '{}'::text[])) as value
      where value <> ''
    ),
    interests = array(
      select distinct value
      from unnest(coalesce(target.interests, '{}'::text[]) || coalesce(source.interests, '{}'::text[])) as value
      where value <> ''
    ),
    industry_tags = array(
      select distinct value
      from unnest(coalesce(target.industry_tags, '{}'::text[]) || coalesce(source.industry_tags, '{}'::text[])) as value
      where value <> ''
    )
  from public.profiles as source
  where target.id = target_id and source.id = source_id;

  update public.members as target
  set
    willing_to_attend = target.willing_to_attend or source.willing_to_attend,
    willing_to_share = target.willing_to_share or source.willing_to_share,
    willing_to_join_projects = target.willing_to_join_projects or source.willing_to_join_projects,
    is_co_builder = target.is_co_builder or source.is_co_builder,
    joined_at = least(target.joined_at, source.joined_at),
    last_active_at = greatest(target.last_active_at, source.last_active_at),
    onboarding_completed_at = coalesce(target.onboarding_completed_at, source.onboarding_completed_at),
    admin_registration_notified_at = coalesce(
      target.admin_registration_notified_at,
      source.admin_registration_notified_at
    )
  from public.members as source
  where target.id = target_id and source.id = source_id;

  update public.members
  set
    is_publicly_visible = false,
    is_featured_on_home = false,
    is_co_builder = false
  where id = source_id;

  insert into public.event_registrations (event_id, user_id, note, status, created_at)
  select event_id, target_id, note, status, created_at
  from public.event_registrations where user_id = source_id
  on conflict (event_id, user_id) do update set
    note = coalesce(public.event_registrations.note, excluded.note),
    status = case
      when public.event_registrations.status = 'registered' or excluded.status = 'registered'
        then 'registered'::public.registration_status
      when public.event_registrations.status = 'waitlisted' or excluded.status = 'waitlisted'
        then 'waitlisted'::public.registration_status
      else 'cancelled'::public.registration_status
    end;
  delete from public.event_registrations where user_id = source_id;

  insert into public.event_attendance (event_id, user_id, status, checked_in_at, created_at)
  select event_id, target_id, status, checked_in_at, created_at
  from public.event_attendance where user_id = source_id
  on conflict (event_id, user_id) do update set
    status = excluded.status,
    checked_in_at = coalesce(public.event_attendance.checked_in_at, excluded.checked_in_at);
  delete from public.event_attendance where user_id = source_id;

  insert into public.event_feedback (event_id, user_id, rating, comment, submitted_at, updated_at)
  select event_id, target_id, rating, comment, submitted_at, updated_at
  from public.event_feedback where user_id = source_id
  on conflict (event_id, user_id) do nothing;
  delete from public.event_feedback where user_id = source_id;

  insert into public.community_update_likes (update_id, user_id, created_at)
  select update_id, target_id, created_at
  from public.community_update_likes where user_id = source_id
  on conflict (update_id, user_id) do nothing;
  delete from public.community_update_likes where user_id = source_id;
  update public.community_updates as updates
  set like_count = (
    select count(*)::integer
    from public.community_update_likes as likes
    where likes.update_id = updates.id
  )
  where exists (
    select 1 from public.community_update_likes
    where update_id = updates.id and user_id = target_id
  );

  insert into public.member_badge_awards (
    user_id, badge_code, label, description, source, awarded_by, awarded_at, created_at
  )
  select target_id, badge_code, label, description, source, awarded_by, awarded_at, created_at
  from public.member_badge_awards where user_id = source_id
  on conflict (user_id, badge_code) do nothing;
  delete from public.member_badge_awards where user_id = source_id;

  insert into public.member_admin_roles (
    member_id, role_id, granted_by, granted_at, expires_at, note
  )
  select target_id, role_id, granted_by, granted_at, expires_at, note
  from public.member_admin_roles where member_id = source_id
  on conflict (member_id, role_id) do update set
    expires_at = greatest(public.member_admin_roles.expires_at, excluded.expires_at),
    note = coalesce(public.member_admin_roles.note, excluded.note);
  delete from public.member_admin_roles where member_id = source_id;

  insert into public.cooperation_lead_matches (
    lead_id, member_id, status, note, created_by, created_at, updated_at
  )
  select lead_id, target_id, status, note, created_by, created_at, updated_at
  from public.cooperation_lead_matches where member_id = source_id
  on conflict (lead_id, member_id) do nothing;
  delete from public.cooperation_lead_matches where member_id = source_id;

  update public.member_works set member_id = target_id where member_id = source_id;
  update public.community_updates set author_id = target_id where author_id = source_id;
  update public.project_applications set applicant_user_id = target_id where applicant_user_id = source_id;

  insert into public.miniapp_consents (user_id, policy_version, accepted_at, created_at)
  select target_id, policy_version, accepted_at, created_at
  from public.miniapp_consents where user_id = source_id
  on conflict (user_id, policy_version) do update set
    accepted_at = greatest(public.miniapp_consents.accepted_at, excluded.accepted_at);
  delete from public.miniapp_consents where user_id = source_id;

  insert into public.miniapp_event_subscriptions (
    user_id, event_id, template_id, status, send_at, sent_at, last_error, created_at, updated_at
  )
  select target_id, event_id, template_id, status, send_at, sent_at, last_error, created_at, updated_at
  from public.miniapp_event_subscriptions where user_id = source_id
  on conflict (user_id, event_id, template_id) do update set
    status = case
      when public.miniapp_event_subscriptions.status = 'sent' or excluded.status = 'sent' then 'sent'
      when public.miniapp_event_subscriptions.status = 'accepted' or excluded.status = 'accepted' then 'accepted'
      else public.miniapp_event_subscriptions.status
    end,
    send_at = coalesce(public.miniapp_event_subscriptions.send_at, excluded.send_at),
    sent_at = coalesce(public.miniapp_event_subscriptions.sent_at, excluded.sent_at),
    last_error = coalesce(public.miniapp_event_subscriptions.last_error, excluded.last_error);
  delete from public.miniapp_event_subscriptions where user_id = source_id;

  insert into public.miniapp_content_interactions (
    user_id, content_type, content_id, is_favorited, last_read_at, last_shared_at, created_at, updated_at
  )
  select target_id, content_type, content_id, is_favorited, last_read_at, last_shared_at, created_at, updated_at
  from public.miniapp_content_interactions where user_id = source_id
  on conflict (user_id, content_type, content_id) do update set
    is_favorited = public.miniapp_content_interactions.is_favorited or excluded.is_favorited,
    last_read_at = greatest(public.miniapp_content_interactions.last_read_at, excluded.last_read_at),
    last_shared_at = greatest(public.miniapp_content_interactions.last_shared_at, excluded.last_shared_at);
  delete from public.miniapp_content_interactions where user_id = source_id;

  update public.miniapp_sessions set user_id = target_id where user_id = source_id;
  update public.miniapp_analytics_events set user_id = target_id where user_id = source_id;

  delete from public.user_identities as source_identity
  where source_identity.user_id = source_id
    and exists (
      select 1 from public.user_identities as target_identity
      where target_identity.user_id = target_id
        and target_identity.provider = source_identity.provider
        and target_identity.provider_app_id = source_identity.provider_app_id
        and target_identity.provider_user_id = source_identity.provider_user_id
    );
  update public.user_identities set user_id = target_id where user_id = source_id;
  update public.wechat_union_accounts set user_id = target_id where user_id = source_id;

  update public.user_account_links
  set canonical_user_id = target_id, link_source = 'manual_merge'
  where canonical_user_id = source_id;
  insert into public.user_account_links (auth_user_id, canonical_user_id, link_source)
  values
    (source_id, target_id, 'manual_merge'),
    (target_id, target_id, 'self')
  on conflict (auth_user_id) do update set
    canonical_user_id = excluded.canonical_user_id,
    link_source = excluded.link_source;

  update public.account_recovery_intents
  set consumed_at = timezone('utc', now())
  where id = recovery_intent_id;

  insert into public.account_merge_audits (
    intent_id, source_user_id, target_user_id, choices, result
  ) values (
    recovery_intent_id,
    source_id,
    target_id,
    coalesce(merge_choices, '{}'::jsonb),
    jsonb_build_object('canonical_user_id', target_id, 'status', 'completed')
  );

  return target_id;
end;
$$;

revoke all on function public.merge_recovered_wechat_account(uuid, jsonb) from public;
grant execute on function public.merge_recovered_wechat_account(uuid, jsonb) to service_role;
