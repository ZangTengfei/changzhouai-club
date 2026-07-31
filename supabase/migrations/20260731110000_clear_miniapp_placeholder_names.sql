update public.profiles as profiles
set display_name = null
from auth.users as users
where profiles.id = users.id
  and profiles.display_name = '微信用户'
  and users.raw_app_meta_data ->> 'account_anchor' = 'wechat_miniapp';

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'name' - 'full_name'
where raw_app_meta_data ->> 'account_anchor' = 'wechat_miniapp'
  and (
    raw_user_meta_data ->> 'name' = '微信用户'
    or raw_user_meta_data ->> 'full_name' = '微信用户'
  );
