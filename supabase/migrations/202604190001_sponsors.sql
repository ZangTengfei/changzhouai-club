create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sponsor_label text,
  logo_url text,
  summary text,
  description text,
  website_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sponsor_images (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists sponsors_set_updated_at on public.sponsors;
create trigger sponsors_set_updated_at
  before update on public.sponsors
  for each row execute procedure public.set_updated_at();

alter table public.sponsors enable row level security;
alter table public.sponsor_images enable row level security;

drop policy if exists "sponsors are publicly readable when active" on public.sponsors;
create policy "sponsors are publicly readable when active"
  on public.sponsors
  for select
  using (is_active = true or public.is_staff(auth.uid()));

drop policy if exists "sponsors are manageable by staff" on public.sponsors;
create policy "sponsors are manageable by staff"
  on public.sponsors
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop policy if exists "sponsor images are publicly readable for active sponsors" on public.sponsor_images;
create policy "sponsor images are publicly readable for active sponsors"
  on public.sponsor_images
  for select
  using (
    exists (
      select 1
      from public.sponsors
      where sponsors.id = sponsor_images.sponsor_id
        and (sponsors.is_active = true or public.is_staff(auth.uid()))
    )
  );

drop policy if exists "sponsor images are manageable by staff" on public.sponsor_images;
create policy "sponsor images are manageable by staff"
  on public.sponsor_images
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

insert into public.sponsors (
  slug,
  name,
  sponsor_label,
  logo_url,
  summary,
  description,
  display_order,
  is_active
)
values
  (
    'changzhou-telecom',
    '常州电信',
    '首位赞助者',
    '/china-telecom-logo.svg',
    '为社区交流与活动连接提供支持，和我们一起把更多本地实践者聚在一起。',
    '常州电信支持常州人工智能国际社区持续组织线下交流、主题分享与本地 AI 实践者连接。',
    10,
    true
  ),
  (
    'caic-yuandian',
    '常州人工智能国际社区',
    '社区共建伙伴',
    '/caic-yuandian.png',
    '以社区空间、资源连接与长期共建支持，陪伴常州 AI 生态持续成长。',
    '常州人工智能国际社区围绕本地 AI 生态建设，支持活动组织、资源连接和实践者共创。',
    20,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  sponsor_label = excluded.sponsor_label,
  logo_url = excluded.logo_url,
  summary = excluded.summary,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = excluded.is_active;
