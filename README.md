# Changzhou AI Club

常州 AI 社区官网项目。

这是一个基于 `Next.js 16`、`React 19` 和 `Supabase` 的社区网站，用来承载常州 AI 社区的公开信息、活动报名、成员资料、合作需求收集，以及后台管理能力。

## 项目包含什么

- 社区首页与公开内容页
- 活动列表、活动详情与报名
- 社区成员目录与成员详情
- Google 登录与社区账号体系
- 账号资料完善与成员资料沉淀
- 企业 / 机构合作需求收集
- 管理后台：活动、成员、合作线索
- 基于 Supabase 的数据存储、鉴权和对象存储

## 技术栈

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Supabase Auth + Postgres + Storage`
- `Vercel` 部署

## 主要页面

- `/`：社区首页
- `/events`：活动列表与报名入口
- `/events/[slug]`：活动详情页
- `/join`：加入社区
- `/members`：成员目录
- `/members/[memberId]`：成员详情
- `/cooperate`：提交合作需求
- `/account`：个人账号与资料
- `/login`：登录页
- `/admin`：后台入口，会跳转到活动管理

仓库里还包含 `about`、`faq`、`projects`、`archive`、`brand-lab` 等内容页。

## 本地启动

先安装依赖：

```bash
npm install
```

再手动创建 `.env.local`。

至少需要这两个变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

启动开发环境：

```bash
npm run dev
```

默认开发地址：

```text
http://localhost:3000
```

生产构建与启动：

```bash
npm run build
npm run start
```

## 环境变量

### 必填

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 按需启用

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ADMIN_NOTIFICATION_EMAIL`
- `ADMIN_NOTIFICATION_EMAILS`
- `ADMIN_NOTIFICATION_FROM_EMAIL`
- `RESEND_FROM_EMAIL`
- `ADMIN_NOTIFICATION_WECOM_WEBHOOK`
- `WECOM_BOT_WEBHOOK_URL`
- `ADMIN_NOTIFICATION_FEISHU_WEBHOOK`
- `FEISHU_BOT_WEBHOOK_URL`
- `ADMIN_NOTIFICATION_FEISHU_SECRET`
- `FEISHU_BOT_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `SITE_URL`

其中：

- 前两个用于站点登录、会话和公开数据读取
- `SUPABASE_SERVICE_ROLE_KEY` 用于后台上传活动图片、脚本迁移等服务端能力
- 邮件相关变量用于管理员通知邮件
- 企业微信 / 飞书 webhook 变量用于把加入申请、成员资料完成、合作线索等动态同步到群机器人

目前已接入的管理员通知场景包括：

- 新成员完成加入资料
- 新的加入申请提交
- 新的合作线索提交

## Supabase 初始化

项目的数据结构和账号体系依赖 Supabase。首次接入时，优先阅读：

- [docs/supabase-auth-data-setup.md](docs/supabase-auth-data-setup.md)

核心流程包括：

1. 配置 Supabase 环境变量
2. 执行 `supabase/migrations` 下的迁移
3. 按需执行种子数据，初始化历史活动
4. 在 Supabase Auth 中启用 Google 登录
5. 如需后台上传或迁移图片，补充 `SUPABASE_SERVICE_ROLE_KEY`

当前仓库里已经包含：

- 社区基础表结构
- 成员目录与公开资料相关迁移
- 活动、报名、图片资源、合作线索相关迁移
- 历史活动种子数据

## 常用命令

```bash
npm run dev
npm run build
npm run start
```

历史活动图片迁移到 Supabase Storage：

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/migrate-event-images-to-storage.mjs
```

## 目录说明

```text
src/app                Next.js App Router 页面与路由
src/components         页面组件与后台表单组件
src/lib                数据读取、Supabase、邮件与业务逻辑
supabase/migrations    数据库迁移
supabase/seed          初始化种子数据
scripts                辅助脚本
docs                   补充文档
```

## 部署说明

项目面向 Vercel 部署，仓库内已有 `vercel.json`，当前区域配置为 `hnd1`。

部署前建议确认：

- 生产环境 Supabase 变量已配置
- 已执行数据库迁移和必要的种子数据
- Google OAuth 回调地址与生产域名一致
- 如启用活动图片后台上传，已配置服务端密钥

## 补充说明

- 登录、成员资料和活动报名都围绕同一套社区账号体系展开
- 后台权限依赖 `members.status` 中的 `admin` / `organizer`
- 如果只是查看公开页面，没有 Supabase 环境变量时，部分依赖账号体系的能力会不可用

如果你准备继续扩展功能，建议先从账号资料流、活动报名流和后台活动管理这三块开始熟悉代码结构。
