alter table public.community_wechat_qr_codes
  alter column title set default '常州 AI Club 官方微信';

alter table public.community_wechat_qr_codes
  alter column expires_at set default timezone('utc', now()) + interval '10 years';

alter table public.community_wechat_qr_codes
  drop column if exists expiration_reminded_at;
