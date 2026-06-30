alter table public.member_works
  add column if not exists qr_code_image_url text;
