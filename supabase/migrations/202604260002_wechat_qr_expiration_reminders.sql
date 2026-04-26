alter table public.community_wechat_qr_codes
  add column if not exists expiration_reminded_at timestamptz;
