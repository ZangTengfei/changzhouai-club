alter table public.events
  add column if not exists agenda text,
  add column if not exists speaker_lineup text,
  add column if not exists registration_note text,
  add column if not exists recap text;
