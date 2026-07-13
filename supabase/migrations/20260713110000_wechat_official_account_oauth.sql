alter table public.wechat_oauth_states
  add column if not exists provider_channel text not null default 'website';

alter table public.wechat_oauth_states
  drop constraint if exists wechat_oauth_states_provider_channel_check;

alter table public.wechat_oauth_states
  add constraint wechat_oauth_states_provider_channel_check
    check (provider_channel in ('website', 'official_account'));

with unified_identities as (
  select
    identities.id,
    identities.identity_data -> 'custom_claims' ->> 'unionid' as union_id
  from auth.identities as identities
  where identities.provider = 'custom:wechat'
    and coalesce(
      identities.identity_data -> 'custom_claims' ->> 'unionid',
      ''
    ) <> ''
)
update auth.identities as identities
set
  provider_id = unified.union_id,
  identity_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        identities.identity_data,
        '{provider_id}',
        to_jsonb(unified.union_id),
        true
      ),
      '{sub}',
      to_jsonb(unified.union_id),
      true
    ),
    '{custom_claims,channel}',
    to_jsonb('website'::text),
    true
  )
from unified_identities as unified
where identities.id = unified.id
  and identities.provider_id <> unified.union_id;
