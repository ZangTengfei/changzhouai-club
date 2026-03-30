drop policy if exists "cooperation leads are insertable by anyone" on public.cooperation_leads;

create policy "cooperation leads are insertable by anyone"
  on public.cooperation_leads
  for insert
  with check (true);
