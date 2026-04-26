alter table public.events
  add column if not exists docs_url text;

update public.events
set docs_url = '/docs/events/2026-03-21-ai-salon'
where docs_url is null
  and event_at::date = date '2026-03-21';

update public.events
set docs_url = '/docs/events/2026-04-11-gov-ai-salon'
where docs_url is null
  and event_at::date = date '2026-04-11';

update public.events
set docs_url = '/docs/events/2026-04-25-ai-salon'
where docs_url is null
  and event_at::date = date '2026-04-25';
