# 国内自托管迁移演练 Runbook

这份文档用于把当前 Vercel + Supabase Cloud 的生产站，迁移到国内云服务器和自托管 Supabase 之前，先在 Mac 本地完成一次可重复的彩排。

推荐节奏：

1. Mac 本地空库演练，确认 migrations、登录、后台和上传流程能跑通。
2. Mac 本地生产数据恢复演练，确认真实数据、Auth 用户和 Storage 能迁干净。
3. 国内云预生产再跑一遍。
4. ICP 备案通过后冻结写入、最终同步、切 DNS。

官方参考：

- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Supabase self-hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)
- [Supabase restore from platform](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [Supabase Storage copy from platform](https://supabase.com/docs/guides/self-hosting/copy-from-platform-s3)

## 0. 本仓库已准备的文件

- `Dockerfile`：生产镜像，基于 Next.js standalone 输出。
- `.dockerignore`：避免把本地环境变量、`.next`、`node_modules` 打进镜像。
- `docker-compose.app.yml`：只启动本站 Next.js 应用，用于连接本地或预生产 Supabase。
- `.env.selfhost.example`：自托管演练环境变量模板。

`next.config.ts` 已启用 `output: "standalone"`，并会根据 `NEXT_PUBLIC_SUPABASE_URL` 自动放行自托管 Supabase Storage 图片域名。

## 1. 准备本地环境

确认本机有这些工具：

```bash
docker --version
docker compose version
node --version
npm --version
```

Node 建议使用 22.x。安装依赖：

```bash
npm install
```

复制演练环境模板：

```bash
cp .env.selfhost.example .env.selfhost.local
```

注意：`.env.selfhost.local` 会被 git 忽略，里面可以放本地 Supabase 的 anon/publishable key 和 service role key。

## 2. 空库演练：验证 migrations

这一轮不迁生产数据，只确认仓库里的 Supabase SQL 能完整跑通。

如果还没有 Supabase CLI：

```bash
npx supabase --version
```

如果仓库里还没有 `supabase/config.toml`，先初始化：

```bash
npx supabase init
```

启动本地 Supabase：

```bash
npx supabase start
```

CLI 会输出本地 API URL、anon key、service role key。把它们填到 `.env.selfhost.local` 或 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon key>
SUPABASE_SERVICE_ROLE_KEY=<local service_role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
ENABLE_VERCEL_INSIGHTS=false
```

重置并应用 migrations：

```bash
npx supabase db reset
```

如果需要历史活动种子数据，额外执行：

```bash
psql "<local database url>" -f supabase/seed/202603290002_seed_existing_events.sql
```

本地启动 Next.js：

```bash
npm run dev
```

打开 `http://localhost:3000` 后检查：

- 首页、活动页、成员页、项目页、动态页能打开。
- 邮箱注册/登录或 Google 登录流程能进入 `/account`。
- `/admin` 能识别管理员权限。
- 活动报名、合作线索、项目申请能写入数据库。
- 后台活动图片上传、成员头像上传、社区动态图片上传能写入 Storage。

## 3. 生产数据恢复演练

这一轮模拟正式迁移。不要直接在生产库上试错，先把 Supabase Cloud 导出的数据恢复到本地自托管实例。

建议建立目录保存备份文件，且不要提交：

```bash
mkdir -p output/migration-backups
```

按 Supabase 官方 restore 文档导出并恢复：

- roles
- schema
- data
- Auth 用户相关数据
- Storage metadata

恢复时注意：

- 空库演练适合用 migrations。
- 真实迁移应以生产 dump 为准，避免先跑 migrations 再重复导入导致冲突。
- 恢复后再用 migrations 对比，确认没有遗漏最近新增的 SQL。

## 4. Storage 迁移

当前项目至少使用这些 Supabase Storage bucket：

- `event-assets`：活动图片、赞助商图片、社群二维码。
- `member-avatars`：成员头像。
- `community-update-assets`：社区动态图片。

迁移目标是：bucket、object、public policy、数据库里的 URL 都一致。

建议按 Supabase 官方 Storage copy 文档迁移对象文件。完成后抽样检查：

- `event_photos.image_url`
- `events.cover_image_url`
- `profiles.avatar_url`
- `sponsors.logo_url`
- `sponsor_images.image_url`
- `community_wechat_qr_codes.image_url`
- `member_works.cover_image_url`
- `community_update_images.image_url`

本仓库也提供了一个基于 Supabase JS 的复制脚本，适合 Mac 本地彩排或小规模迁移：

```bash
set -a
source .env.local
SOURCE_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
SOURCE_SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
source .env.selfhost.local
TARGET_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
TARGET_SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
set +a

npm run storage:copy -- --dry-run
npm run storage:copy -- --upsert
```

默认复制 `event-assets`、`member-avatars`、`community-update-assets`。也可以用 `--bucket <bucket-id>` 指定单个 bucket。

如果数据库里仍然保存旧的 `https://<project>.supabase.co/storage/...`，在本地恢复库中先演练 URL 替换：

```sql
begin;

update public.events
set cover_image_url = replace(cover_image_url, 'https://<old-project>.supabase.co', 'https://<new-supabase-origin>')
where cover_image_url like 'https://<old-project>.supabase.co/%';

update public.event_photos
set image_url = replace(image_url, 'https://<old-project>.supabase.co', 'https://<new-supabase-origin>')
where image_url like 'https://<old-project>.supabase.co/%';

update public.profiles
set avatar_url = replace(avatar_url, 'https://<old-project>.supabase.co', 'https://<new-supabase-origin>')
where avatar_url like 'https://<old-project>.supabase.co/%';

update public.sponsors
set logo_url = replace(logo_url, 'https://<old-project>.supabase.co', 'https://<new-supabase-origin>')
where logo_url like 'https://<old-project>.supabase.co/%';

update public.sponsor_images
set image_url = replace(image_url, 'https://<old-project>.supabase.co', 'https://<new-supabase-origin>')
where image_url like 'https://<old-project>.supabase.co/%';

update public.community_wechat_qr_codes
set image_url = replace(image_url, 'https://<old-project>.supabase.co', 'https://<new-supabase-origin>')
where image_url like 'https://<old-project>.supabase.co/%';

update public.member_works
set cover_image_url = replace(cover_image_url, 'https://<old-project>.supabase.co', 'https://<new-supabase-origin>')
where cover_image_url like 'https://<old-project>.supabase.co/%';

update public.community_update_images
set image_url = replace(image_url, 'https://<old-project>.supabase.co', 'https://<new-supabase-origin>')
where image_url like 'https://<old-project>.supabase.co/%';

commit;
```

正式环境执行前先把 `begin` 后的更新改成 `select count(*)` 预估影响行数。

## 5. 用 Docker 跑本站应用

先确保 `.env.selfhost.local` 指向演练 Supabase。

如果 Next.js 运行在 Docker 容器里，`NEXT_PUBLIC_SUPABASE_URL` 必须同时被浏览器和容器访问到。不要盲目使用 `localhost`：浏览器里的 `localhost` 是 Mac，容器里的 `localhost` 是容器自己。更稳的做法是用局域网 IP、临时域名，或把 Next.js 和 Supabase 放在同一个可解析的反向代理域名后面。

构建镜像：

```bash
docker build -t changzhouai-club-web:local .
```

如果 Docker Hub 在当前网络下拉取不稳定，可以通过 `NODE_IMAGE` 使用 Debian 兼容的镜像代理或私有仓库：

```bash
docker build \
  --build-arg NODE_IMAGE=<your-mirror>/library/node:22-bookworm-slim \
  -t changzhouai-club-web:local .
```

启动应用：

```bash
docker compose -f docker-compose.app.yml up --build
```

打开：

```text
http://localhost:3000
```

如果只想用 `docker run`：

```bash
docker run --rm \
  --env-file .env.selfhost.local \
  -p 3000:3000 \
  changzhouai-club-web:local
```

## 6. Auth 和回调地址

每套环境都要单独配置 Supabase Auth：

- Site URL：当前环境的 `NEXT_PUBLIC_SITE_URL`
- Redirect URLs：
  - `http://localhost:3000/auth/callback`
  - 预生产域名 `/auth/callback`
  - 正式域名 `/auth/callback`

如果继续使用 Google OAuth，也要在 Google Cloud Console 中加入对应回调地址。

自托管 Supabase 的邮件确认、重置密码等邮件能力依赖 SMTP。国内生产环境建议改为国内可达的邮件服务，或先关闭必须邮件确认的流程并补人工审核。

## 7. 国内云预生产

Mac 演练通过后，在国内云服务器重复同样流程：

1. 安装 Docker 和 Docker Compose。
2. 部署自托管 Supabase。
3. 恢复生产数据备份。
4. 迁移 Storage。
5. 部署本站 Docker 镜像。
6. 用预生产域名或 hosts 文件验证完整流程。
7. 配置日志、数据库快照、对象存储备份和监控告警。

建议先用一台 `4 核 / 8GB / 100-200GB SSD` 跑预生产。正式长期运行时，如果预算允许，把 Next.js 和 Supabase/Postgres 拆到两台机器。

## 8. 正式切换窗口

切换前一天：

- 降低 DNS TTL。
- 确认 ICP 备案状态和国内 CDN/HTTPS 配置。
- 确认 Supabase Auth、SMTP、Google OAuth、企业微信/飞书通知都指向新域名。
- 完成一次从备份恢复的演练。

切换时：

1. 冻结旧站写入：报名、注册、后台上传、合作表单。
2. 从 Supabase Cloud 做最终 dump。
3. 同步最终 Storage 增量。
4. 在国内库恢复数据并执行必要的 URL 替换。
5. 启动国内 Next.js 应用。
6. 跑冒烟测试。
7. DNS 切到国内 CDN/LB。
8. 保留 Vercel/Supabase Cloud 只读回滚窗口 2-4 周。

切换后：

- 页脚展示 ICP 备案号。
- 按要求继续做公安联网备案。
- 每天检查备份任务和错误日志。
- 至少做一次从备份恢复到临时库的演练。

## 9. 冒烟测试清单

- `/` 首页首屏、轮播、社区动态。
- `/events` 和 `/events/[slug]`，含报名按钮。
- `/join` 加入申请。
- `/cooperate` 合作线索。
- `/projects` 项目列表和申请。
- `/members` 成员目录和头像。
- `/updates` 社区动态和图片。
- `/login` 邮箱登录、Google 登录。
- `/account` 资料编辑、头像上传、社区动态发布。
- `/admin` 活动、成员、赞助商、合作线索、动态管理。
- 邮件/企业微信/飞书通知。
- Sitemap、robots、站点图标、Open Graph。
