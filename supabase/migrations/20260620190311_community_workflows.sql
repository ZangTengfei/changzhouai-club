insert into public.admin_permissions (
  permission_key,
  module,
  action,
  sensitivity_level,
  description
)
values
  ('workflows.read', 'workflows', 'read', 'L1', '查看运营工作流、任务和产物'),
  ('workflows.write', 'workflows', 'write', 'L1', '创建和编辑运营工作流'),
  ('workflows.assign', 'workflows', 'assign', 'L1', '分配运营工作流负责人和任务'),
  ('workflows.review', 'workflows', 'review', 'L2', '审核工作流产物和节点'),
  ('workflows.publish', 'workflows', 'publish', 'L2', '确认官网、社媒或外部同步发布动作'),
  ('workflows.manage_templates', 'workflows', 'manage_templates', 'L3', '管理运营工作流模板'),
  ('workflows.delete', 'workflows', 'delete', 'L4', '删除运营工作流或关键流程资料'),
  ('ai_jobs.run', 'ai_jobs', 'run', 'L1', '运行工作流中的 AI 节点'),
  ('ai_jobs.review', 'ai_jobs', 'review', 'L2', '审核 AI 生成产物'),
  ('ai_jobs.cancel', 'ai_jobs', 'cancel', 'L2', '取消或重试 AI 任务')
on conflict (permission_key) do update
set
  module = excluded.module,
  action = excluded.action,
  sensitivity_level = excluded.sensitivity_level,
  description = excluded.description;

with role_permissions(role_key, permission_key) as (
  values
    ('super_admin', 'workflows.read'),
    ('super_admin', 'workflows.write'),
    ('super_admin', 'workflows.assign'),
    ('super_admin', 'workflows.review'),
    ('super_admin', 'workflows.publish'),
    ('super_admin', 'workflows.manage_templates'),
    ('super_admin', 'workflows.delete'),
    ('super_admin', 'ai_jobs.run'),
    ('super_admin', 'ai_jobs.review'),
    ('super_admin', 'ai_jobs.cancel'),

    ('ops_lead', 'workflows.read'),
    ('ops_lead', 'workflows.write'),
    ('ops_lead', 'workflows.assign'),
    ('ops_lead', 'workflows.review'),
    ('ops_lead', 'workflows.publish'),
    ('ops_lead', 'ai_jobs.run'),
    ('ops_lead', 'ai_jobs.review'),
    ('ops_lead', 'ai_jobs.cancel'),

    ('event_publisher', 'workflows.read'),
    ('event_publisher', 'workflows.write'),
    ('event_publisher', 'workflows.assign'),
    ('event_publisher', 'workflows.review'),
    ('event_publisher', 'workflows.publish'),
    ('event_publisher', 'ai_jobs.run'),
    ('event_publisher', 'ai_jobs.review'),

    ('event_operator', 'workflows.read'),
    ('event_operator', 'workflows.write'),
    ('event_operator', 'workflows.assign'),
    ('event_operator', 'workflows.review'),
    ('event_operator', 'workflows.publish'),
    ('event_operator', 'ai_jobs.run'),
    ('event_operator', 'ai_jobs.review'),

    ('event_assistant', 'workflows.read'),

    ('content_operator', 'workflows.read'),
    ('content_operator', 'workflows.write'),
    ('content_operator', 'workflows.review'),
    ('content_operator', 'ai_jobs.run'),
    ('content_operator', 'ai_jobs.review'),

    ('project_operator', 'workflows.read'),
    ('project_operator', 'workflows.write'),

    ('partner_operator', 'workflows.read'),
    ('partner_operator', 'workflows.write'),

    ('viewer', 'workflows.read')
)
insert into public.admin_role_permissions (role_id, permission_key)
select admin_roles.id, role_permissions.permission_key
from role_permissions
inner join public.admin_roles on admin_roles.role_key = role_permissions.role_key
on conflict (role_id, permission_key) do nothing;

create table if not exists public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  kind text not null default 'event'
    check (kind in ('event', 'project', 'content', 'course', 'general')),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workflow_template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workflow_templates(id) on delete cascade,
  step_key text not null,
  title text not null,
  description text,
  stage text,
  default_assignee_role text,
  default_due_offset_days integer,
  ai_job_type text,
  requires_review boolean not null default false,
  sort_order integer not null default 100,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (template_id, step_key)
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.workflow_templates(id) on delete set null,
  title text not null,
  summary text,
  kind text not null default 'event'
    check (kind in ('event', 'project', 'content', 'course', 'general')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'waiting_review', 'completed', 'paused', 'cancelled')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  owner_id uuid references public.members(id) on delete set null,
  related_event_id uuid references public.events(id) on delete set null,
  related_project_id uuid references public.project_opportunities(id) on delete set null,
  related_lead_id uuid references public.cooperation_leads(id) on delete set null,
  starts_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  template_step_id uuid references public.workflow_template_steps(id) on delete set null,
  step_key text not null,
  title text not null,
  description text,
  stage text,
  status text not null default 'todo'
    check (
      status in (
        'todo',
        'doing',
        'waiting_input',
        'waiting_ai',
        'waiting_review',
        'changes_requested',
        'approved',
        'done',
        'blocked',
        'skipped'
      )
    ),
  assignee_id uuid references public.members(id) on delete set null,
  reviewer_id uuid references public.members(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  sort_order integer not null default 100,
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (run_id, step_key)
);

create table if not exists public.workflow_artifacts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  step_id uuid references public.workflow_steps(id) on delete set null,
  artifact_type text not null
    check (
      artifact_type in (
        'brief',
        'poster',
        'signup_form',
        'event_page',
        'photo',
        'audio',
        'video',
        'deck',
        'recap',
        'social_draft',
        'knowledge_note',
        'file_index',
        'external_link',
        'other'
      )
    ),
  title text not null,
  description text,
  local_path text,
  storage_url text,
  external_url text,
  visibility text not null default 'internal'
    check (visibility in ('public', 'internal', 'private')),
  ai_usable boolean not null default true,
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'in_review', 'approved', 'published', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.workflow_runs(id) on delete cascade,
  step_id uuid references public.workflow_steps(id) on delete set null,
  job_type text not null,
  engine text not null default 'deepseek'
    check (engine in ('deepseek', 'openai', 'dify', 'codex', 'manual')),
  model text,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'needs_review')),
  prompt text,
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  error_message text,
  cost_estimate numeric(12, 6),
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workflow_approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  step_id uuid references public.workflow_steps(id) on delete set null,
  artifact_id uuid references public.workflow_artifacts(id) on delete set null,
  ai_job_id uuid references public.ai_jobs(id) on delete set null,
  approval_type text not null
    check (
      approval_type in (
        'artifact_review',
        'event_publish',
        'social_publish',
        'external_sync',
        'data_export',
        'codex_execution',
        'other'
      )
    ),
  title text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  requested_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  due_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workflow_comments (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  step_id uuid references public.workflow_steps(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  visibility text not null default 'internal'
    check (visibility in ('public', 'internal', 'private')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists workflow_template_steps_template_idx
  on public.workflow_template_steps (template_id, sort_order);
create index if not exists workflow_runs_status_idx
  on public.workflow_runs (status, due_at);
create index if not exists workflow_runs_related_event_idx
  on public.workflow_runs (related_event_id);
create index if not exists workflow_runs_owner_idx
  on public.workflow_runs (owner_id);
create index if not exists workflow_steps_run_idx
  on public.workflow_steps (run_id, sort_order);
create index if not exists workflow_steps_assignee_idx
  on public.workflow_steps (assignee_id, status, due_at);
create index if not exists workflow_artifacts_run_idx
  on public.workflow_artifacts (run_id, created_at desc);
create index if not exists ai_jobs_run_idx
  on public.ai_jobs (run_id, created_at desc);
create index if not exists ai_jobs_status_idx
  on public.ai_jobs (status, created_at desc);
create index if not exists workflow_approvals_status_idx
  on public.workflow_approvals (status, created_at desc);
create index if not exists workflow_comments_run_idx
  on public.workflow_comments (run_id, created_at desc);

drop trigger if exists workflow_templates_set_updated_at on public.workflow_templates;
create trigger workflow_templates_set_updated_at
  before update on public.workflow_templates
  for each row execute procedure public.set_updated_at();

drop trigger if exists workflow_runs_set_updated_at on public.workflow_runs;
create trigger workflow_runs_set_updated_at
  before update on public.workflow_runs
  for each row execute procedure public.set_updated_at();

drop trigger if exists workflow_steps_set_updated_at on public.workflow_steps;
create trigger workflow_steps_set_updated_at
  before update on public.workflow_steps
  for each row execute procedure public.set_updated_at();

drop trigger if exists workflow_artifacts_set_updated_at on public.workflow_artifacts;
create trigger workflow_artifacts_set_updated_at
  before update on public.workflow_artifacts
  for each row execute procedure public.set_updated_at();

drop trigger if exists ai_jobs_set_updated_at on public.ai_jobs;
create trigger ai_jobs_set_updated_at
  before update on public.ai_jobs
  for each row execute procedure public.set_updated_at();

drop trigger if exists workflow_approvals_set_updated_at on public.workflow_approvals;
create trigger workflow_approvals_set_updated_at
  before update on public.workflow_approvals
  for each row execute procedure public.set_updated_at();

drop trigger if exists workflow_comments_set_updated_at on public.workflow_comments;
create trigger workflow_comments_set_updated_at
  before update on public.workflow_comments
  for each row execute procedure public.set_updated_at();

alter table public.workflow_templates enable row level security;
alter table public.workflow_template_steps enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.workflow_artifacts enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.workflow_approvals enable row level security;
alter table public.workflow_comments enable row level security;

grant select on public.workflow_templates to authenticated;
grant select on public.workflow_template_steps to authenticated;
grant select, insert, update, delete on public.workflow_runs to authenticated;
grant select, insert, update, delete on public.workflow_steps to authenticated;
grant select, insert, update, delete on public.workflow_artifacts to authenticated;
grant select, insert, update, delete on public.ai_jobs to authenticated;
grant select, insert, update, delete on public.workflow_approvals to authenticated;
grant select, insert, update, delete on public.workflow_comments to authenticated;

drop policy if exists "workflow templates are readable by workflow admins" on public.workflow_templates;
create policy "workflow templates are readable by workflow admins"
  on public.workflow_templates
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.read'));

drop policy if exists "workflow templates are manageable by template admins" on public.workflow_templates;
create policy "workflow templates are manageable by template admins"
  on public.workflow_templates
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.manage_templates'))
  with check (private.has_admin_permission(auth.uid(), 'workflows.manage_templates'));

drop policy if exists "workflow template steps are readable by workflow admins" on public.workflow_template_steps;
create policy "workflow template steps are readable by workflow admins"
  on public.workflow_template_steps
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.read'));

drop policy if exists "workflow template steps are manageable by template admins" on public.workflow_template_steps;
create policy "workflow template steps are manageable by template admins"
  on public.workflow_template_steps
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.manage_templates'))
  with check (private.has_admin_permission(auth.uid(), 'workflows.manage_templates'));

drop policy if exists "workflow runs are readable by workflow admins" on public.workflow_runs;
create policy "workflow runs are readable by workflow admins"
  on public.workflow_runs
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.read'));

drop policy if exists "workflow runs are insertable by workflow writers" on public.workflow_runs;
create policy "workflow runs are insertable by workflow writers"
  on public.workflow_runs
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'workflows.write'));

drop policy if exists "workflow runs are updatable by workflow writers" on public.workflow_runs;
create policy "workflow runs are updatable by workflow writers"
  on public.workflow_runs
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.write'))
  with check (private.has_admin_permission(auth.uid(), 'workflows.write'));

drop policy if exists "workflow runs are deletable by workflow admins" on public.workflow_runs;
create policy "workflow runs are deletable by workflow admins"
  on public.workflow_runs
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.delete'));

drop policy if exists "workflow steps are readable by workflow admins" on public.workflow_steps;
create policy "workflow steps are readable by workflow admins"
  on public.workflow_steps
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.read'));

drop policy if exists "workflow steps are manageable by workflow writers" on public.workflow_steps;
create policy "workflow steps are manageable by workflow writers"
  on public.workflow_steps
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.write'))
  with check (private.has_admin_permission(auth.uid(), 'workflows.write'));

drop policy if exists "workflow artifacts are readable by workflow admins" on public.workflow_artifacts;
create policy "workflow artifacts are readable by workflow admins"
  on public.workflow_artifacts
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.read'));

drop policy if exists "workflow artifacts are manageable by workflow writers" on public.workflow_artifacts;
create policy "workflow artifacts are manageable by workflow writers"
  on public.workflow_artifacts
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.write'))
  with check (private.has_admin_permission(auth.uid(), 'workflows.write'));

drop policy if exists "ai jobs are readable by workflow admins" on public.ai_jobs;
create policy "ai jobs are readable by workflow admins"
  on public.ai_jobs
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.read'));

drop policy if exists "ai jobs are insertable by ai runners" on public.ai_jobs;
create policy "ai jobs are insertable by ai runners"
  on public.ai_jobs
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'ai_jobs.run'));

drop policy if exists "ai jobs are updatable by ai operators" on public.ai_jobs;
create policy "ai jobs are updatable by ai operators"
  on public.ai_jobs
  for update
  to authenticated
  using (
    private.has_admin_permission(auth.uid(), 'ai_jobs.run')
    or private.has_admin_permission(auth.uid(), 'ai_jobs.review')
    or private.has_admin_permission(auth.uid(), 'ai_jobs.cancel')
  )
  with check (
    private.has_admin_permission(auth.uid(), 'ai_jobs.run')
    or private.has_admin_permission(auth.uid(), 'ai_jobs.review')
    or private.has_admin_permission(auth.uid(), 'ai_jobs.cancel')
  );

drop policy if exists "ai jobs are deletable by workflow admins" on public.ai_jobs;
create policy "ai jobs are deletable by workflow admins"
  on public.ai_jobs
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.delete'));

drop policy if exists "workflow approvals are readable by workflow admins" on public.workflow_approvals;
create policy "workflow approvals are readable by workflow admins"
  on public.workflow_approvals
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.read'));

drop policy if exists "workflow approvals are insertable by workflow writers" on public.workflow_approvals;
create policy "workflow approvals are insertable by workflow writers"
  on public.workflow_approvals
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'workflows.write'));

drop policy if exists "workflow approvals are reviewable by reviewers" on public.workflow_approvals;
create policy "workflow approvals are reviewable by reviewers"
  on public.workflow_approvals
  for update
  to authenticated
  using (
    private.has_admin_permission(auth.uid(), 'workflows.review')
    or private.has_admin_permission(auth.uid(), 'workflows.publish')
  )
  with check (
    private.has_admin_permission(auth.uid(), 'workflows.review')
    or private.has_admin_permission(auth.uid(), 'workflows.publish')
  );

drop policy if exists "workflow approvals are deletable by workflow admins" on public.workflow_approvals;
create policy "workflow approvals are deletable by workflow admins"
  on public.workflow_approvals
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.delete'));

drop policy if exists "workflow comments are readable by workflow admins" on public.workflow_comments;
create policy "workflow comments are readable by workflow admins"
  on public.workflow_comments
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.read'));

drop policy if exists "workflow comments are insertable by workflow admins" on public.workflow_comments;
create policy "workflow comments are insertable by workflow admins"
  on public.workflow_comments
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'workflows.read'));

drop policy if exists "workflow comments are updatable by workflow writers" on public.workflow_comments;
create policy "workflow comments are updatable by workflow writers"
  on public.workflow_comments
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.write'))
  with check (private.has_admin_permission(auth.uid(), 'workflows.write'));

drop policy if exists "workflow comments are deletable by workflow admins" on public.workflow_comments;
create policy "workflow comments are deletable by workflow admins"
  on public.workflow_comments
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'workflows.delete'));

insert into public.workflow_templates (
  template_key,
  name,
  description,
  kind,
  sort_order,
  metadata
)
values (
  'event_full_cycle',
  '新活动全流程',
  '从主题分析、筹备发布、现场执行到复盘分发的常州 AI Club 活动工作流。',
  'event',
  10,
  '{"recommended": true, "owner_module": "events"}'::jsonb
)
on conflict (template_key) do update
set
  name = excluded.name,
  description = excluded.description,
  kind = excluded.kind,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata;

with event_template as (
  select id
  from public.workflow_templates
  where template_key = 'event_full_cycle'
),
template_steps(step_key, title, description, stage, default_due_offset_days, ai_job_type, requires_review, sort_order, metadata) as (
  values
    ('topic_analysis', '主题分析', '确认活动主题、目标人群、价值主张和风险点。', 'planning', -21, 'event_topic_analysis', true, 10, '{"output_type": "brief"}'::jsonb),
    ('event_plan', '活动方案', '沉淀活动流程、嘉宾分工、场地物料和报名策略。', 'planning', -18, 'event_plan_draft', true, 20, '{"output_type": "brief"}'::jsonb),
    ('speaker_venue', '嘉宾场地', '确认嘉宾、主持、协办方、场地、设备和物料。', 'prep', -14, null, false, 30, '{"output_type": "checklist"}'::jsonb),
    ('poster_signup', '海报报名', '生成主视觉、完成海报终稿、创建报名入口。', 'prep', -10, 'event_poster_brief', true, 40, '{"output_type": "poster"}'::jsonb),
    ('website_publish', '官网发布', '生成并审核官网活动页草稿，确认前台发布。', 'publish', -7, 'event_page_draft', true, 50, '{"output_type": "event_page"}'::jsonb),
    ('social_prewarm', '社群预热', '生成群公告、朋友圈、公众号、小红书等预热文案。', 'publish', -5, 'event_social_prewarm', true, 60, '{"output_type": "social_draft"}'::jsonb),
    ('onsite_execution', '现场执行', '跟进签到、拍照、录音、PPT、问题收集和现场异常。', 'onsite', 0, null, false, 70, '{"output_type": "file_index"}'::jsonb),
    ('recap', '活动复盘', '整理现场资料，产出复盘总结、亮点和待跟进事项。', 'recap', 2, 'event_recap', true, 80, '{"output_type": "recap"}'::jsonb),
    ('social_distribution', '社媒分发', '将复盘材料改写成多平台社媒草稿。', 'distribution', 3, 'event_social_distribution', true, 90, '{"output_type": "social_draft"}'::jsonb),
    ('knowledge_archive', '知识库归档', '生成活动档案、素材索引和共建资料同步清单。', 'archive', 5, 'event_knowledge_archive', true, 100, '{"output_type": "knowledge_note"}'::jsonb),
    ('lead_followup', '合作线索跟进', '从活动复盘中提炼企业需求、成员匹配和项目机会。', 'followup', 7, 'event_lead_followup', true, 110, '{"output_type": "lead"}'::jsonb)
)
insert into public.workflow_template_steps (
  template_id,
  step_key,
  title,
  description,
  stage,
  default_due_offset_days,
  ai_job_type,
  requires_review,
  sort_order,
  metadata
)
select
  event_template.id,
  template_steps.step_key,
  template_steps.title,
  template_steps.description,
  template_steps.stage,
  template_steps.default_due_offset_days,
  template_steps.ai_job_type,
  template_steps.requires_review,
  template_steps.sort_order,
  template_steps.metadata
from event_template
cross join template_steps
on conflict (template_id, step_key) do update
set
  title = excluded.title,
  description = excluded.description,
  stage = excluded.stage,
  default_due_offset_days = excluded.default_due_offset_days,
  ai_job_type = excluded.ai_job_type,
  requires_review = excluded.requires_review,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata;
