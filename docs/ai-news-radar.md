# AI News Radar

本地调试脚本用于验证 AI 新闻抓取、去重、评分和候选输出逻辑。它默认只做 `dry-run`，不会写入飞书，也不会自动发布。

## 快速运行

```bash
npm run news:radar
```

输出 Markdown，便于人工查看：

```bash
npm run news:radar:md
```

保存调试产物到本地：

```bash
npm run news:radar -- --format markdown --limit 12 --out output/ai-news-radar/latest.md
npm run news:radar -- --format json --limit 20 --out output/ai-news-radar/latest.json
```

只看某类来源：

```bash
npm run news:radar -- --type official --format markdown
npm run news:radar -- --source openai-news,anthropic-news --format markdown
```

## 参数

- `--format json|markdown`：输出格式，默认 `json`
- `--limit 12`：候选新闻数量
- `--min-score 45`：最低候选分数，默认过滤低价值噪声
- `--since-hours 72`：只保留最近多少小时内的新闻
- `--raw-limit 300`：原始条目上限
- `--type official,media,research,media-cn`：按来源类型过滤
- `--source openai-news,anthropic-news`：按来源 ID 过滤
- `--include-all`：跳过 AI 关键词过滤，用于调试来源质量
- `--include-disabled`：包含配置中暂时禁用的来源
- `--out output/ai-news-radar/latest.md`：保存输出文件

## 流程边界

第一阶段建议保持这个脚本只负责：

1. 抓公开 RSS/Atom 来源
2. 标准化标题、链接、摘要、发布时间
3. AI 关键词过滤
4. 去重
5. 用启发式规则评分
6. 输出候选列表

等连续跑几天后，再接入：

1. 写入飞书 `AI资讯原始抓取池`
2. Agent 二筛生成 `AI资讯候选池`
3. 人工确认后进入 `素材池`
4. 生成小红书、微信群、公众号草稿

不要让这个脚本直接发布到社媒；发布前应保留人工审核。
