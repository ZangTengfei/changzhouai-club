do $migration$
declare
  current_definition text;
  updated_definition text;
begin
  select pg_get_functiondef(
    'public.merge_recovered_wechat_account(uuid,jsonb)'::regprocedure
  ) into current_definition;

  updated_definition := replace(
    current_definition,
    $old$  if not exists (
    select 1 from auth.identities
    where user_id = source_id and provider = 'custom:wechat'
  ) then$old$,
    $new$  if not exists (
    select 1 from auth.identities
    where user_id = source_id and provider = 'custom:wechat'
  ) and not exists (
    select 1 from public.user_identities
    where user_id = source_id and provider = 'wechat'
  ) then$new$
  );

  if updated_definition = current_definition then
    raise exception 'merge_recovered_wechat_account source check was not found';
  end if;

  execute updated_definition;
end;
$migration$;
