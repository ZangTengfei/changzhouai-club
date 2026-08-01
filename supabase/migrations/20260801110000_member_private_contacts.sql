create table if not exists public.member_private_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone_number text not null,
  phone_country_code text,
  phone_last4 text not null check (phone_last4 ~ '^[0-9]{4}$'),
  phone_verified_at timestamptz not null,
  phone_source text not null default 'wechat' check (phone_source = 'wechat'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_member_private_contacts_updated_at on public.member_private_contacts;
create trigger set_member_private_contacts_updated_at
  before update on public.member_private_contacts
  for each row execute procedure public.set_updated_at();

alter table public.member_private_contacts enable row level security;

revoke all on table public.member_private_contacts from anon;
revoke insert, update, delete on table public.member_private_contacts from authenticated;
grant select on table public.member_private_contacts to authenticated;

drop policy if exists "Members and contact readers can view private contacts" on public.member_private_contacts;
create policy "Members and contact readers can view private contacts"
  on public.member_private_contacts
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or private.has_admin_permission(auth.uid(), 'events.read_registration_contact')
  );
