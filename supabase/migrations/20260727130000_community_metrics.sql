create table if not exists public.community_metrics (
  metric_key text primary key,
  numeric_value integer not null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint community_metrics_key_not_blank check (length(trim(metric_key)) > 0),
  constraint community_metrics_numeric_value_nonnegative check (numeric_value >= 0)
);

drop trigger if exists community_metrics_set_updated_at on public.community_metrics;
create trigger community_metrics_set_updated_at
  before update on public.community_metrics
  for each row execute procedure public.set_updated_at();

insert into public.community_metrics (metric_key, numeric_value)
values ('member_count', 500)
on conflict (metric_key) do nothing;

alter table public.community_metrics enable row level security;

drop policy if exists "community metrics are publicly readable" on public.community_metrics;
create policy "community metrics are publicly readable"
  on public.community_metrics
  for select
  using (true);

drop policy if exists "community metrics are insertable by system admins" on public.community_metrics;
create policy "community metrics are insertable by system admins"
  on public.community_metrics
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'system.manage_settings'));

drop policy if exists "community metrics are updatable by system admins" on public.community_metrics;
create policy "community metrics are updatable by system admins"
  on public.community_metrics
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'system.manage_settings'))
  with check (private.has_admin_permission(auth.uid(), 'system.manage_settings'));

grant select on public.community_metrics to anon;
grant select, insert, update on public.community_metrics to authenticated;
