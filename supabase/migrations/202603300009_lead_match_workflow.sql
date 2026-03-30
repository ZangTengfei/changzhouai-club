do $$
begin
  create type public.lead_match_status as enum (
    'suggested',
    'contacted',
    'introduced',
    'active',
    'not_fit'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.cooperation_leads
  add column if not exists next_action text,
  add column if not exists next_action_at timestamptz,
  add column if not exists last_contacted_at timestamptz;

create table if not exists public.cooperation_lead_matches (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.cooperation_leads(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status public.lead_match_status not null default 'suggested',
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (lead_id, member_id)
);

drop trigger if exists cooperation_lead_matches_set_updated_at on public.cooperation_lead_matches;
create trigger cooperation_lead_matches_set_updated_at
  before update on public.cooperation_lead_matches
  for each row execute procedure public.set_updated_at();

alter table public.cooperation_lead_matches enable row level security;

drop policy if exists "cooperation lead matches are readable by staff" on public.cooperation_lead_matches;
create policy "cooperation lead matches are readable by staff"
  on public.cooperation_lead_matches
  for select
  using (public.is_staff(auth.uid()));

drop policy if exists "cooperation lead matches are manageable by staff" on public.cooperation_lead_matches;
create policy "cooperation lead matches are manageable by staff"
  on public.cooperation_lead_matches
  for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));
