create table if not exists public.project_opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  description text,
  opportunity_type text not null default 'project',
  status text not null default 'draft',
  visibility text not null default 'public',
  role_tags text[] not null default '{}',
  topic_tags text[] not null default '{}',
  headcount_label text,
  time_commitment text,
  compensation text,
  deadline_at timestamptz,
  location text,
  application_cta text,
  application_note text,
  source_lead_id uuid references public.cooperation_leads(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_opportunities_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint project_opportunities_type_check
    check (opportunity_type in (
      'crowdsource',
      'project',
      'project_manager',
      'enterprise',
      'role',
      'idea'
    )),
  constraint project_opportunities_status_check
    check (status in (
      'draft',
      'recruiting',
      'matching',
      'in_progress',
      'filled',
      'closed',
      'archived'
    )),
  constraint project_opportunities_visibility_check
    check (visibility in ('public', 'members', 'private'))
);

create table if not exists public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_opportunities(id) on delete cascade,
  applicant_user_id uuid references auth.users(id) on delete set null,
  applicant_name text not null,
  contact_wechat text,
  contact_phone text,
  contact_email text,
  role_interest text,
  available_time text,
  experience_summary text,
  portfolio_url text,
  note text,
  status text not null default 'new',
  admin_note text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_applications_status_check
    check (status in (
      'new',
      'reviewing',
      'contacted',
      'shortlisted',
      'introduced',
      'active',
      'not_fit',
      'withdrawn'
    ))
);

drop trigger if exists project_opportunities_set_updated_at on public.project_opportunities;
create trigger project_opportunities_set_updated_at
  before update on public.project_opportunities
  for each row execute procedure public.set_updated_at();

drop trigger if exists project_applications_set_updated_at on public.project_applications;
create trigger project_applications_set_updated_at
  before update on public.project_applications
  for each row execute procedure public.set_updated_at();

create index if not exists project_opportunities_public_display_idx
  on public.project_opportunities (
    visibility,
    status,
    is_featured desc,
    sort_order asc,
    created_at desc
  );

create index if not exists project_applications_project_id_idx
  on public.project_applications (project_id, created_at desc);

alter table public.project_opportunities enable row level security;
alter table public.project_applications enable row level security;

drop policy if exists "project opportunities are readable by visible audience"
  on public.project_opportunities;
create policy "project opportunities are readable by visible audience"
  on public.project_opportunities
  for select
  using (
    public.is_staff(auth.uid())
    or (
      status <> 'draft'
      and visibility = 'public'
    )
    or (
      status <> 'draft'
      and visibility = 'members'
      and exists (
        select 1
        from public.members
        where members.id = auth.uid()
          and members.status in ('active', 'organizer', 'admin')
      )
    )
  );

drop policy if exists "project opportunities are manageable by staff"
  on public.project_opportunities;
create policy "project opportunities are manageable by staff"
  on public.project_opportunities
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop policy if exists "project applications are readable by owner or staff"
  on public.project_applications;
create policy "project applications are readable by owner or staff"
  on public.project_applications
  for select
  using (
    public.is_staff(auth.uid())
    or (auth.uid() is not null and applicant_user_id = auth.uid())
  );

drop policy if exists "project applications are insertable for open projects"
  on public.project_applications;
create policy "project applications are insertable for open projects"
  on public.project_applications
  for insert
  with check (
    (
      applicant_user_id is null
      or applicant_user_id = auth.uid()
    )
    and
    exists (
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
              where members.id = auth.uid()
                and members.status in ('active', 'organizer', 'admin')
            )
          )
        )
    )
  );

drop policy if exists "project applications are manageable by staff"
  on public.project_applications;
create policy "project applications are manageable by staff"
  on public.project_applications
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

grant select on public.project_opportunities to anon, authenticated;
grant insert, update, delete on public.project_opportunities to authenticated;
grant insert on public.project_applications to anon, authenticated;
grant select, update, delete on public.project_applications to authenticated;
