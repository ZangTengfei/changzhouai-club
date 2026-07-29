alter type public.registration_status add value if not exists 'pending' before 'registered';

alter table public.events
  add column if not exists registration_mode text not null default 'instant',
  add column if not exists registration_capacity integer;

alter table public.events
  drop constraint if exists events_registration_mode_check,
  add constraint events_registration_mode_check
    check (registration_mode in ('instant', 'review')),
  drop constraint if exists events_registration_capacity_check,
  add constraint events_registration_capacity_check
    check (registration_capacity is null or registration_capacity > 0);

comment on column public.events.registration_mode is
  'instant means immediate confirmation; review means pending until staff review';

comment on column public.events.registration_capacity is
  'Maximum confirmed registrations; null means unlimited';
