#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const AIHOT_BASE_URL = "https://aihot.virxact.com";
const AIHOT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 ChangzhouAIClub-DailySocial/0.1";

const CATEGORY_LABEL_BY_ID = {
  "ai-models": "模型发布/更新",
  "ai-products": "产品发布/更新",
  industry: "行业动态",
  paper: "论文研究",
  tip: "技巧与观点",
};

const CATEGORY_PRIORITY = [
  "模型发布/更新",
  "产品发布/更新",
  "行业动态",
  "论文研究",
  "技巧与观点",
];

const DEFAULT_HASHTAGS = [
  "AI新闻",
  "AI资讯",
  "人工智能",
  "大模型",
  "AI工具",
  "AI创业",
  "常州AI社区",
];

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const options = {
    date: normalizeDate(args.date),
    outDir: path.resolve(projectRoot, args["out-dir"] || "output/ai-daily-social"),
    send: Boolean(args.send),
    stdout: normalizeStdout(args.stdout),
    take: clampInteger(args.take, 50, 5, 100),
    sinceHours: clampInteger(args["since-hours"], 36, 6, 168),
    write: args.write !== "false" && args["no-write"] !== true,
    poster: args.poster !== "false" && args["no-poster"] !== true,
  };

  const since = new Date(Date.now() - options.sinceHours * 60 * 60 * 1000).toISOString();
  const [dailyResult, itemsResult] = await Promise.all([
    fetchDailyReport(options.date),
    fetchItems({ since, take: options.take }),
  ]);

  if (!dailyResult.data && !itemsResult.data?.items?.length) {
    throw new Error(
      `AI HOT 没有返回可用素材。daily=${dailyResult.error || "empty"} items=${itemsResult.error || "empty"}`,
    );
  }

  const material = buildMaterial({
    dailyReport: dailyResult.data,
    dailyError: dailyResult.error,
    items: itemsResult.data?.items ?? [],
    itemsError: itemsResult.error,
    since,
  });
  const markdown = toMarkdown(material);
  const json = `${JSON.stringify(material, null, 2)}\n`;
  let posterResult = null;

  if (options.write) {
    await writeOutputs(options.outDir, material.date, markdown, json);
    if (options.poster) {
      posterResult = await renderWechatPoster(options.outDir);
    }
  }

  if (options.send) {
    await sendToCurrentChat(markdown);
  }

  if (options.stdout === "json") {
    process.stdout.write(json);
  } else if (options.stdout === "markdown") {
    process.stdout.write(markdown);
  } else if (options.stdout === "summary") {
    process.stdout.write(
      [
        `已生成 ${material.date} AI 每日素材`,
        `Markdown: ${path.relative(projectRoot, path.join(options.outDir, `${material.date}.md`))}`,
        `JSON: ${path.relative(projectRoot, path.join(options.outDir, `${material.date}.json`))}`,
        ...(posterResult
          ? [
              `Poster: ${path.relative(projectRoot, posterResult.latestPngPath)}`,
              `Poster HTML: ${path.relative(projectRoot, posterResult.latestHtmlPath)}`,
            ]
          : []),
        `小红书标题: ${material.xiaohongshu.titles[0]}`,
        "",
      ].join("\n"),
    );
  }
}

async function fetchDailyReport(date) {
  const endpoint = date ? `/api/public/daily/${date}` : "/api/public/daily";
  return fetchAiHotJson(endpoint);
}

async function fetchItems({ since, take }) {
  const params = new URLSearchParams({
    mode: "selected",
    since,
    take: String(take),
  });

  return fetchAiHotJson(`/api/public/items?${params.toString()}`);
}

async function fetchAiHotJson(endpoint) {
  try {
    const response = await fetch(`${AIHOT_BASE_URL}${endpoint}`, {
      headers: {
        accept: "application/json",
        "user-agent": AIHOT_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return { data: await response.json(), error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "request_failed",
    };
  }
}

function buildMaterial({ dailyReport, dailyError, items, itemsError, since }) {
  const now = new Date();
  const date = dailyReport?.date || getShanghaiDate(now);
  const allSignals = pickSignals({ dailyReport, items }, 6);
  const primarySignals = allSignals.slice(0, 5);
  const themeWords = inferThemeWords(primarySignals);
  const coverTitle = `${formatShortDate(date)} AI 圈 5 个信号`;
  const sourceNotice = "来源限定：AI HOT 公开 API / Daily / Selected items；发布前请回原文核对。";

  return {
    version: "0.1",
    date,
    generatedAt: now.toISOString(),
    source: {
      name: "AI HOT",
      agentPage: `${AIHOT_BASE_URL}/agent`,
      apiBase: AIHOT_BASE_URL,
      endpoints: [
        dailyReport ? `/api/public/daily${dailyReport.date ? ` (${dailyReport.date})` : ""}` : "/api/public/daily",
        `/api/public/items?mode=selected&since=${since}`,
      ],
      errors: {
        daily: dailyError,
        items: itemsError,
      },
      notice: sourceNotice,
    },
    editorial: {
      positioning: "常州 AI 社区每日新闻素材包",
      audience: "本地创业者、企业数字化负责人、AI 工具实践者、内容运营同学",
      leadTitle: dailyReport?.lead?.title || `今天的 AI 关键词：${themeWords.join("、")}`,
      leadParagraph:
        dailyReport?.lead?.leadParagraph ||
        `今天先抓 ${primarySignals.length} 个值得讨论的 AI 信号：${themeWords.join("、")}。适合做成小红书轮播、微信群讨论引子，也可以沉淀到社区网站。`,
      publishRisk: "摘要来自 AI HOT 与公开原文链接，正式发布前建议人工核对标题、时间、公司名与产品名。",
    },
    xiaohongshu: buildXiaohongshu({ date, coverTitle, primarySignals, themeWords }),
    website: buildWebsiteDraft({ date, primarySignals, themeWords, dailyReport }),
    wechat: buildWechatPrompt({ primarySignals, themeWords }),
    video: buildVideoBrief({ date, coverTitle, primarySignals, themeWords }),
    signals: primarySignals,
    extraSignals: allSignals.slice(5),
    sourceLinks: buildSourceLinks(primarySignals),
  };
}

function pickSignals({ dailyReport, items }, limit) {
  const dailySignals = [];

  for (const section of dailyReport?.sections ?? []) {
    for (const item of section.items ?? []) {
      dailySignals.push(normalizeSignal(item, section.label));
    }
  }

  const feedSignals = (items ?? []).map((item) =>
    normalizeSignal(
      {
        title: item.title,
        summary: item.summary,
        sourceName: item.source,
        sourceUrl: item.url,
        publishedAt: item.publishedAt,
      },
      CATEGORY_LABEL_BY_ID[item.category] || "AI HOT 精选",
    ),
  );

  const byCategory = [];
  for (const label of CATEGORY_PRIORITY) {
    const hit = dailySignals.find((item) => item.category === label) || feedSignals.find((item) => item.category === label);
    if (hit) byCategory.push(hit);
  }

  return uniqueSignals([...byCategory, ...dailySignals, ...feedSignals])
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      localAngle: suggestLocalAngle(item),
      xhsHook: suggestXhsHook(item),
      discussionQuestion: suggestDiscussionQuestion(item),
    }))
    .slice(0, limit);
}

function normalizeSignal(item, category) {
  return {
    category,
    title: cleanText(item.title),
    summary: cleanText(item.summary),
    sourceName: cleanText(item.sourceName || item.source || "AI HOT"),
    sourceUrl: item.sourceUrl || item.url || "",
    publishedAt: item.publishedAt || null,
  };
}

function buildXiaohongshu({ date, coverTitle, primarySignals, themeWords }) {
  const titles = [
    `${formatShortDate(date)} AI 圈发生了什么？5 个信号先看`,
    `今天 AI 新闻速览：${themeWords.slice(0, 3).join("、")}`,
    `常州 AI 社区日报：这些变化值得创业者留意`,
  ];
  const bodyLines = [
    `今天的 AI 信息密度不低，我先替大家挑出 ${primarySignals.length} 个适合讨论和转化成行动的信号。`,
    "",
    ...primarySignals.flatMap((item) => [
      `${item.rank}. ${item.title}`,
      `${truncate(item.summary, 118)}`,
      `社区视角：${item.localAngle}`,
      "",
    ]),
    "适合怎么用：",
    "1. 做小红书轮播：一页一个信号，最后一页放讨论问题。",
    "2. 发到微信群：先抛一个问题，再贴原文链接，方便成员补充案例。",
    "3. 沉淀到网站：保留来源链接，后续可和群聊里的观点合并成社区日报。",
    "",
    "你今天最想深入哪一条？可以留言，我们把它拆成工具实测或本地企业应用案例。",
  ];

  return {
    titles,
    cover: {
      title: coverTitle,
      subtitle: "给本地创业者和 AI 实践者的每日速览",
    },
    body: bodyLines.join("\n"),
    carouselCards: [
      {
        type: "cover",
        title: coverTitle,
        subtitle: "模型 / 产品 / 行业 / 论文 / 观点",
      },
      ...primarySignals.map((item) => ({
        type: "signal",
        title: item.title,
        category: item.category,
        bullets: [truncate(item.summary, 54), item.localAngle],
      })),
      {
        type: "cta",
        title: "今天群里聊什么？",
        bullets: primarySignals.slice(0, 3).map((item) => item.discussionQuestion),
      },
    ],
    hashtags: DEFAULT_HASHTAGS,
  };
}

function buildWebsiteDraft({ date, primarySignals, themeWords, dailyReport }) {
  return {
    title: `AI 每日新闻素材：${formatLongDate(date)}`,
    slug: `ai-daily-${date}`,
    summary:
      dailyReport?.lead?.leadParagraph ||
      `本期关注 ${themeWords.join("、")}，整理 ${primarySignals.length} 条来自 AI HOT 的精选资讯。`,
    sections: primarySignals.map((item) => ({
      heading: item.title,
      category: item.category,
      summary: item.summary,
      localAngle: item.localAngle,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
    })),
  };
}

function buildWechatPrompt({ primarySignals, themeWords }) {
  return {
    intro: `今天 AI HOT 里我先挑了 ${primarySignals.length} 条：${themeWords.join("、")}。`,
    questions: primarySignals.slice(0, 4).map((item) => item.discussionQuestion),
    callForInput: "群里如果有人实测过相关工具/模型，可以补两句体验；明天素材包会优先吸收社区观点。",
  };
}

function buildVideoBrief({ date, coverTitle, primarySignals, themeWords }) {
  return {
    title: `${formatShortDate(date)} AI 新闻 60 秒`,
    format: "60-90 秒竖屏短视频",
    hook: `今天 AI 圈的关键词是：${themeWords.slice(0, 4).join("、")}。`,
    storyboard: [
      {
        scene: "开场",
        duration: "0-5s",
        caption: coverTitle,
        voiceover: `今天 AI 圈有 ${primarySignals.length} 个信号值得看。`,
      },
      ...primarySignals.map((item, index) => ({
        scene: `信号 ${index + 1}`,
        duration: `${5 + index * 10}-${15 + index * 10}s`,
        caption: item.title,
        voiceover: `${item.category}：${truncate(item.summary, 72)}`,
      })),
      {
        scene: "收束",
        duration: "最后 8s",
        caption: "加入常州 AI 社区，一起把新闻变成实践",
        voiceover: "想看哪条深挖成工具实测或企业案例，留言告诉我们。",
      },
    ],
    assetNotes: "后续视频工作流可读取 JSON 的 signals/sourceLinks 字段生成字幕、分镜、配图检索词和口播稿。",
  };
}

function toMarkdown(material) {
  const lines = [];
  lines.push(`# 常州 AI 社区每日新闻素材 - ${material.date}`);
  lines.push("");
  lines.push(`> ${material.source.notice}`);
  lines.push(`> 生成时间：${formatDateTime(material.generatedAt)}`);
  lines.push("");
  lines.push("## 小红书素材");
  lines.push("");
  lines.push("### 标题备选");
  material.xiaohongshu.titles.forEach((title, index) => {
    lines.push(`${index + 1}. ${title}`);
  });
  lines.push("");
  lines.push("### 封面");
  lines.push(`- 主标题：${material.xiaohongshu.cover.title}`);
  lines.push(`- 副标题：${material.xiaohongshu.cover.subtitle}`);
  lines.push("");
  lines.push("### 正文");
  lines.push("");
  lines.push(material.xiaohongshu.body);
  lines.push("");
  lines.push("### 轮播卡片");
  material.xiaohongshu.carouselCards.forEach((card, index) => {
    lines.push(`${index + 1}. ${card.title}`);
    for (const bullet of card.bullets ?? []) {
      lines.push(`   - ${bullet}`);
    }
  });
  lines.push("");
  lines.push(`### 标签`);
  lines.push(material.xiaohongshu.hashtags.map((tag) => `#${tag}`).join(" "));
  lines.push("");
  lines.push("## 网站沉淀");
  lines.push("");
  lines.push(`- 标题：${material.website.title}`);
  lines.push(`- Slug：${material.website.slug}`);
  lines.push(`- 摘要：${material.website.summary}`);
  lines.push("");
  material.website.sections.forEach((section, index) => {
    lines.push(`${index + 1}. **${section.heading}**（${section.category}）`);
    lines.push(`   - 摘要：${truncate(section.summary, 120)}`);
    lines.push(`   - 社区视角：${section.localAngle}`);
  });
  lines.push("");
  lines.push("## 微信群引导");
  lines.push("");
  lines.push(material.wechat.intro);
  material.wechat.questions.forEach((question, index) => {
    lines.push(`${index + 1}. ${question}`);
  });
  lines.push(material.wechat.callForInput);
  lines.push("");
  lines.push("## 视频版预留");
  lines.push("");
  lines.push(`- 标题：${material.video.title}`);
  lines.push(`- 形式：${material.video.format}`);
  lines.push(`- 开场：${material.video.hook}`);
  material.video.storyboard.forEach((scene) => {
    lines.push(`- ${scene.scene}（${scene.duration}）：${scene.caption}`);
  });
  lines.push("");
  lines.push("## 来源链接");
  lines.push("");
  material.sourceLinks.forEach((source, index) => {
    lines.push(`${index + 1}. [${source.title}](${source.url}) - ${source.sourceName}`);
  });
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function writeOutputs(outDir, date, markdown, json) {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outDir, `${date}.md`), markdown, "utf8"),
    writeFile(path.join(outDir, `${date}.json`), json, "utf8"),
    writeFile(path.join(outDir, "latest.md"), markdown, "utf8"),
    writeFile(path.join(outDir, "latest.json"), json, "utf8"),
  ]);
}

async function renderWechatPoster(outDir) {
  const scriptPath = path.join(projectRoot, "scripts/render-ai-daily-wechat-poster.mjs");
  const output = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, "--out-dir", outDir], {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`render-ai-daily-wechat-poster failed with ${code}: ${stderr.trim()}`));
      }
    });
  });

  return JSON.parse(output);
}

async function sendToCurrentChat(message) {
  await new Promise((resolve, reject) => {
    const child = spawn("cc-connect", ["send", "--stdin"], {
      cwd: projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`cc-connect send failed with ${code}: ${stderr.trim()}`));
      }
    });
    child.stdin.end(message);
  });
}

function buildSourceLinks(items) {
  return uniqueSignals(items)
    .filter((item) => item.sourceUrl)
    .map((item) => ({
      title: item.title,
      sourceName: item.sourceName,
      url: item.sourceUrl,
    }));
}

function inferThemeWords(items) {
  const text = items.map((item) => `${item.title} ${item.summary}`).join(" ");
  const candidates = [
    ["智能体", /智能体|Agent|agents?/i],
    ["模型更新", /模型|大模型|LLM|GPT|Claude|Gemini|Llama/i],
    ["产品落地", /产品|工具|平台|上线|发布|workflow|ComfyUI/i],
    ["企业应用", /企业|客户|金融|营销|客服|销售|部署|workflow/i],
    ["开源生态", /开源|GitHub|Hugging Face|open source/i],
    ["论文研究", /论文|研究|benchmark|基准|arxiv|推理/i],
  ];
  const hits = candidates.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  return hits.length > 0 ? hits.slice(0, 4) : ["模型", "产品", "行业", "实践"];
}

function suggestLocalAngle(item) {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  if (/agent|智能体|workflow|工作流|自动化/.test(text)) {
    return "适合拆成社区共建案例：让成员判断能否落到销售、客服、知识库或内容生产流程。";
  }
  if (/企业|金融|部署|客户|business|enterprise/.test(text)) {
    return "适合本地企业负责人关注：它可能影响 AI 项目从试点走向实际交付的方式。";
  }
  if (/模型|gpt|claude|gemini|llm|多模态|comfyui/.test(text)) {
    return "适合技术成员快速评估：模型能力变化是否会降低原型开发和内容生成成本。";
  }
  if (/论文|研究|benchmark|基准/.test(text)) {
    return "适合沉淀为学习材料：先看结论，再找能否转成社区分享或实测选题。";
  }
  return "适合作为今日 AI 信号，先在群里收集真实使用场景，再决定是否深挖。";
}

function suggestXhsHook(item) {
  if (item.category === "模型发布/更新") return "模型能力更新，可能直接影响工具链选择。";
  if (item.category === "产品发布/更新") return "新产品/新功能出现，适合马上找应用场景。";
  if (item.category === "行业动态") return "行业方向变化，值得创业者和企业负责人留意。";
  if (item.category === "论文研究") return "研究结论背后可能藏着下一波产品形态。";
  return "观点和技巧类内容，适合转成方法论或操作清单。";
}

function suggestDiscussionQuestion(item) {
  const title = item.title.replace(/[？?。.!！]+$/g, "");
  if (item.category === "论文研究") {
    return `这条研究「${truncate(title, 28)}」能不能变成一次社区技术分享？`;
  }
  if (item.category === "行业动态") {
    return `「${truncate(title, 28)}」对本地企业做 AI 落地有什么启发？`;
  }
  return `有没有人愿意实测「${truncate(title, 28)}」，看看能否变成社区案例？`;
}

function uniqueSignals(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = item.sourceUrl || item.title;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function normalizeStdout(value) {
  const stdout = String(value || "markdown").trim();
  return ["markdown", "json", "summary", "none"].includes(stdout) ? stdout : "markdown";
}

function normalizeDate(value) {
  if (!value) return null;
  const date = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("--date must use YYYY-MM-DD");
  }
  return date;
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getShanghaiDate(date) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatShortDate(value) {
  const [, month, day] = value.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function formatLongDate(value) {
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
