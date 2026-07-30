alter table public.events
  add column if not exists location_latitude numeric(9, 6),
  add column if not exists location_longitude numeric(9, 6);

alter table public.events
  drop constraint if exists events_location_coordinates_check,
  add constraint events_location_coordinates_check check (
    (location_latitude is null and location_longitude is null)
    or (
      location_latitude is not null
      and location_longitude is not null
      and
      location_latitude between -90 and 90
      and location_longitude between -180 and 180
    )
  );

comment on column public.events.location_latitude is
  'Optional WGS84 latitude used by the WeChat mini program map action.';

comment on column public.events.location_longitude is
  'Optional WGS84 longitude used by the WeChat mini program map action.';
