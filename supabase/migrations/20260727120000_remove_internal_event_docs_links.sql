update public.events
set docs_url = null
where docs_url = '/docs'
   or docs_url like '/docs/%';
