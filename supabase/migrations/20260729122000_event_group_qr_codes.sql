insert into storage.buckets (id, name, public)
values ('event-private-assets', 'event-private-assets', false)
on conflict (id) do update set public = false;

create table if not exists public.event_group_qr_codes (
  event_id uuid primary key references public.events(id) on delete cascade,
  storage_path text not null,
  note text,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists event_group_qr_codes_set_updated_at
  on public.event_group_qr_codes;
create trigger event_group_qr_codes_set_updated_at
  before update on public.event_group_qr_codes
  for each row execute procedure public.set_updated_at();

alter table public.event_group_qr_codes enable row level security;

drop policy if exists "event group qr codes are readable by event staff"
  on public.event_group_qr_codes;
create policy "event group qr codes are readable by event staff"
  on public.event_group_qr_codes
  for select
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.read'));

drop policy if exists "event group qr codes are manageable by event writers"
  on public.event_group_qr_codes;
create policy "event group qr codes are manageable by event writers"
  on public.event_group_qr_codes
  for all
  to authenticated
  using (private.has_admin_permission(auth.uid(), 'events.write'))
  with check (private.has_admin_permission(auth.uid(), 'events.write'));
