create table if not exists public.community_wechat_qr_codes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '常州 AI Club 微信群',
  image_url text not null,
  note text,
  starts_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default timezone('utc', now()) + interval '7 days',
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint community_wechat_qr_codes_expires_after_starts
    check (expires_at > starts_at)
);

drop trigger if exists community_wechat_qr_codes_set_updated_at on public.community_wechat_qr_codes;
create trigger community_wechat_qr_codes_set_updated_at
  before update on public.community_wechat_qr_codes
  for each row execute procedure public.set_updated_at();

alter table public.community_wechat_qr_codes enable row level security;

drop policy if exists "active wechat qr codes are publicly readable" on public.community_wechat_qr_codes;
create policy "active wechat qr codes are publicly readable"
  on public.community_wechat_qr_codes
  for select
  using (
    is_active = true
    and starts_at <= now()
    and expires_at > now()
  );

drop policy if exists "wechat qr codes are readable by staff" on public.community_wechat_qr_codes;
create policy "wechat qr codes are readable by staff"
  on public.community_wechat_qr_codes
  for select
  to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "wechat qr codes are manageable by staff" on public.community_wechat_qr_codes;
create policy "wechat qr codes are manageable by staff"
  on public.community_wechat_qr_codes
  for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));
