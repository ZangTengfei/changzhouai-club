# Supabase Auth + Data Setup

这个项目已经预留了 `Supabase Auth + Postgres` 的基础代码，目标是先跑通：

1. Google 登录
2. 统一社区账号
3. 成员资料与活动数据的正式底座
4. 后续微信绑定预留

## 1. 配置环境变量

复制 `.env.example` 为 `.env.local`，补这两个值：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` 先不是必须，后续做表格同步或管理脚本时再加。

如果你想在“有人完成注册资料”后收到邮件，再额外补这些可选值：

- `RESEND_API_KEY`
- `ADMIN_NOTIFICATION_EMAIL`
- `ADMIN_NOTIFICATION_FROM_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

## 2. 初始化数据库

把这个 SQL 跑到 Supabase：

- `supabase/migrations/202603290001_initial_community_schema.sql`
- `supabase/migrations/202603290002_event_assets_storage.sql`
- `supabase/seed/202603290002_seed_existing_events.sql`

这份 SQL 会创建：

- `profiles`
- `members`
- `user_identities`
- `events`
- `event_photos`
- `event_registrations`
- `event_attendance`
- `talks`
- `cooperation_leads`

同时也会创建：

- `handle_new_user()`：新用户注册后自动生成 `profile + member`
- `is_staff()`：供 RLS 权限判断 `organizer/admin`
- 基础 RLS policies

种子 SQL 会把目前网站里已经公开展示的 6 场历史活动写入 `events` 表，状态都是 `completed`。
同时会同步写入 `event_photos`，让首页、活动页和归档页统一从数据库读取历史活动内容。

历史活动图片现在建议放到 Supabase Storage：

- bucket: `event-assets`
- 历史图片路径：`events/historical/<filename>`

如果你需要把仓库里的历史图片批量迁移到 Storage，可以运行：

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/migrate-event-images-to-storage.mjs
```

注意：

- 现在历史活动展示已经不再依赖仓库里的静态活动数组
- 在生产环境里，记得先执行这份种子 SQL，再部署删除静态回退后的代码

## 3. 新增下一场待报名活动

当你要开放下一场活动报名时，只要在 Supabase 里插入一条 `status = 'scheduled'` 的 `events` 记录，网站活动页就会自动显示报名入口。

最小字段建议：

- `slug`
- `title`
- `summary`
- `event_at`
- `venue`
- `city`
- `status = 'scheduled'`

## 4. 打开 Google 登录

在 Supabase Auth 里启用 Google Provider，然后在 Google Cloud Console 配好 OAuth。

推荐先只做 Google，把网站账号体系和成员资料跑顺。微信建议放到第二阶段，作为“登录后绑定”的身份补充。

## 5. 当前代码入口

- 登录页：`/login`
- OAuth 回调：`/auth/callback`
- 账号页：`/account`
- SSR client：`src/lib/supabase/server.ts`
- Browser client：`src/lib/supabase/client.ts`
- Session refresh：`proxy.ts`
- 活动报名 action：`src/app/events/actions.ts`
- 账号资料 action：`src/app/account/actions.ts`
- 邮件通知：`src/lib/email.ts`

## 6. 第二阶段建议

接下来最适合继续做的顺序：

1. 登录后完善资料
2. 活动报名写入 `event_registrations`
3. 账号页显示活动参与记录
4. 增加微信绑定表单和扫码绑定流程

## 7. 开启活动后台权限

活动后台地址是：

- `/admin`

第一次使用时，需要先把你的账号提升为 `admin` 或 `organizer`。

可以在 Supabase SQL Editor 执行：

```sql
update public.members
set status = 'admin'
where id = '<你的 auth user id>';
```

这个 `id` 可以直接在网站账号页 `/account` 里看到。
