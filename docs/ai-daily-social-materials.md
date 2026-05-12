# AI 每日社媒素材流

第一版目标：只使用 [AI HOT Agent 接入页](https://aihot.virxact.com/agent)提供的公开来源能力，自动生成常州 AI 社区每日新闻素材。输出先服务小红书、微信群和社区网站，后续再接视频工作流。

## 第一版范围

- 来源只用 AI HOT：`/api/public/daily` 和 `/api/public/items?mode=selected`。
- 每次运行生成 Markdown 和 JSON 两份产物。
- Markdown 给人工运营直接复制、改写、发布。
- JSON 给后续网站入库、视频脚本、配图检索、自动排版工具复用。
- 不自动发布到社媒，发布前保留人工核对。

## 快速运行

```bash
npm run news:social
```

默认会写入：

```text
output/ai-daily-social/YYYY-MM-DD.md
output/ai-daily-social/YYYY-MM-DD.json
output/ai-daily-social/latest.md
output/ai-daily-social/latest.json
```

只看摘要：

```bash
npm run news:social -- --stdout summary
```

发送到当前 cc-connect 聊天：

```bash
npm run news:social -- --send --stdout none
```

指定日报日期：

```bash
npm run news:social -- --date 2026-05-12
```

## 产物结构

Markdown 中包含：

- 小红书标题备选、封面文案、正文、轮播卡片、标签。
- 网站沉淀稿：标题、slug、摘要、按条目拆分的栏目。
- 微信群引导：当天可抛给群成员的问题。
- 视频版预留：60-90 秒竖屏视频标题、开场、逐条分镜。
- 来源链接：每条素材保留 AI HOT 提供的原始链接。

JSON 中包含同样信息，字段包括：

- `xiaohongshu`
- `website`
- `wechat`
- `video`
- `signals`
- `sourceLinks`

## 定时任务

AI HOT 日报页面标注为每日 8 点生成。社区第一版建议每天北京时间 8:30 跑一次，给上游留 30 分钟缓冲：

```bash
cc-connect cron add --cron "30 8 * * *" --prompt "进入 /Users/nobugai/develop/changzhouai-club，运行 npm run news:social -- --send --stdout none。确认生成 output/ai-daily-social/latest.md 和 latest.json；如果失败，把错误摘要发送到当前聊天。" --desc "每日AI新闻素材"
```

## 后续接入微信群聊

微信群聊记录不要直接替代新闻源，而是作为社区视角层：

1. 先由群聊服务每天导出最近 24 小时讨论摘要，建议落到 `output/group-digest/YYYY-MM-DD.json`。
2. 摘要结构保留：高频话题、成员问题、工具实测、可公开引用的观点、不可公开内容标记。
3. `news:social` 后续增加 `--group-digest output/group-digest/YYYY-MM-DD.json` 参数。
4. 融合逻辑只做三件事：给每条 AI 新闻匹配群聊观点、补充本地应用角度、生成“今天群里继续聊什么”。
5. 所有涉及个人昵称、公司项目、未公开商业信息的内容默认不进入可发布稿。

## 后续接入视频工作流

当前 JSON 已预留 `video.storyboard`，下一步可以拆成三层：

1. 文案层：读取 `video.storyboard` 生成口播稿、字幕 SRT、标题和简介。
2. 视觉层：读取 `signals[].title/summary/sourceName` 生成配图检索词或封面图提示词。
3. 编排层：把字幕、配图、BGM、片尾 CTA 交给剪辑脚本或视频平台模板。

建议先做半自动：每天输出分镜和口播，人工确认后再进入视频生成。等连续稳定一两周，再考虑自动生成初剪版本。

## 风险边界

- AI HOT 摘要和社区二次摘要都需要回原文核对。
- 不在脚本里自动发布小红书、抖音或公众号。
- 群聊内容默认按私域素材处理，公开前需要人工确认可公开性。
- `output/` 是本地生成目录，不提交到 Git。
