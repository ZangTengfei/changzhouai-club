alter table public.project_opportunities
  add column if not exists application_requires_login boolean not null default false;

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
          not project_opportunities.application_requires_login
          or (
            auth.uid() is not null
            and project_applications.applicant_user_id = auth.uid()
          )
        )
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
