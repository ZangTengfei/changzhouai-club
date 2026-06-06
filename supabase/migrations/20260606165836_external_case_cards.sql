create table if not exists public.external_case_cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  description text,
  card_type text not null default 'external',
  source_label text,
  cover_image_url text,
  external_url text not null,
  cta_label text not null default '查看详情',
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  is_public boolean not null default true,
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint external_case_cards_card_type_check
    check (card_type in ('external', 'project', 'case', 'tool', 'service'))
);

drop trigger if exists external_case_cards_set_updated_at on public.external_case_cards;
create trigger external_case_cards_set_updated_at
  before update on public.external_case_cards
  for each row execute procedure public.set_updated_at();

create index if not exists external_case_cards_public_display_idx
  on public.external_case_cards (is_public, is_featured desc, sort_order asc, created_at desc);

alter table public.external_case_cards enable row level security;

drop policy if exists "public external case cards are readable" on public.external_case_cards;
create policy "public external case cards are readable"
  on public.external_case_cards
  for select
  using (is_public = true);

drop policy if exists "external case cards are readable by work readers" on public.external_case_cards;
create policy "external case cards are readable by work readers"
  on public.external_case_cards
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'works.read'));

drop policy if exists "external case cards are insertable by work writers" on public.external_case_cards;
create policy "external case cards are insertable by work writers"
  on public.external_case_cards
  for insert
  to authenticated
  with check (private.has_admin_permission(auth.uid(), 'works.write'));

drop policy if exists "external case cards are updatable by work writers" on public.external_case_cards;
create policy "external case cards are updatable by work writers"
  on public.external_case_cards
  for update
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'works.write'))
  with check (private.has_admin_permission(auth.uid(), 'works.write'));

drop policy if exists "external case cards are deletable by work deleters" on public.external_case_cards;
create policy "external case cards are deletable by work deleters"
  on public.external_case_cards
  for delete
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'works.delete'));

grant select on public.external_case_cards to anon;
grant select, insert, update, delete on public.external_case_cards to authenticated;

insert into public.external_case_cards (
  slug,
  title,
  summary,
  card_type,
  source_label,
  external_url,
  cta_label,
  tags,
  sort_order,
  is_public,
  is_featured
)
values (
  'telecom-opc-display',
  '常州电信 OPC 揭榜挂帅项目',
  '汇总 11 个 AI 智能体项目的目标、团队、素材和周进度，进入展示管理后台查看实时详情。',
  'project',
  '常州电信 OPC',
  'https://opc.occcc.cc/display',
  '查看展示后台',
  array['智能体项目', '常州电信', 'OPC 共创'],
  -100,
  true,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  card_type = excluded.card_type,
  source_label = excluded.source_label,
  external_url = excluded.external_url,
  cta_label = excluded.cta_label,
  tags = excluded.tags,
  sort_order = excluded.sort_order,
  is_public = excluded.is_public,
  is_featured = excluded.is_featured,
  updated_at = timezone('utc', now());
