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

## 2. 初始化数据库

把这个 SQL 跑到 Supabase：

- `supabase/migrations/202603290001_initial_community_schema.sql`

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

## 3. 打开 Google 登录

在 Supabase Auth 里启用 Google Provider，然后在 Google Cloud Console 配好 OAuth。

推荐先只做 Google，把网站账号体系和成员资料跑顺。微信建议放到第二阶段，作为“登录后绑定”的身份补充。

## 4. 当前代码入口

- 登录页：`/login`
- OAuth 回调：`/auth/callback`
- 账号页：`/account`
- SSR client：`src/lib/supabase/server.ts`
- Browser client：`src/lib/supabase/client.ts`
- Session refresh：`proxy.ts`

## 5. 第二阶段建议

接下来最适合继续做的顺序：

1. 登录后完善资料
2. 活动报名写入 `event_registrations`
3. 账号页显示活动参与记录
4. 增加微信绑定表单和扫码绑定流程
