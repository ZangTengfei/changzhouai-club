#!/usr/bin/env node

import { XMLParser } from "fast-xml-parser";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const AI_KEYWORDS = [
  "ai",
  "a.i.",
  "artificial intelligence",
  "generative ai",
  "llm",
  "large language model",
  "language model",
  "foundation model",
  "openai",
  "anthropic",
  "claude",
  "gpt",
  "gemini",
  "deepmind",
  "nvidia",
  "hugging face",
  "mistral",
  "llama",
  "agent",
  "agents",
  "rag",
  "mcp",
  "multimodal",
  "diffusion",
  "robotics",
  "copilot",
  "chatbot",
  "人工智能",
  "大模型",
  "生成式",
  "智能体",
  "多模态",
  "机器人",
  "知识库",
  "自动化"
];

const IMPORTANCE_TERMS = [
  "launch",
  "release",
  "announces",
  "unveils",
  "open source",
  "benchmark",
  "api",
  "pricing",
  "enterprise",
  "funding",
  "acquires",
  "partnership",
  "regulation",
  "policy",
  "safety",
  "lawsuit",
  "发布",
  "开源",
  "融资",
  "监管",
  "政策",
  "企业",
  "安全",
  "合作"
];

const BUSINESS_TERMS = [
  "enterprise",
  "business",
  "workflow",
  "automation",
  "customer service",
  "sales",
  "marketing",
  "knowledge base",
  "agent",
  "api",
  "manufacturing",
  "企业",
  "工作流",
  "自动化",
  "客服",
  "销售",
  "营销",
  "知识库",
  "制造"
];

const TECH_TERMS = [
  "rag",
  "agent",
  "mcp",
  "open source",
  "model",
  "benchmark",
  "inference",
  "multimodal",
  "embedding",
  "fine-tuning",
  "智能体",
  "知识库",
  "多模态",
  "推理",
  "开源",
  "模型",
  "微调"
];

const POLICY_TERMS = ["policy", "regulation", "law", "safety", "copyright", "监管", "政策", "法规", "版权", "安全"];

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = path.resolve(projectRoot, args.sources || "scripts/ai-news-sources.json");
  const sourceConfig = JSON.parse(await readFile(sourcePath, "utf8"));
  const options = {
    debug: Boolean(args.debug),
    format: args.format || "json",
    includeAll: Boolean(args["include-all"]),
    includeDisabled: Boolean(args["include-disabled"]),
    limit: toPositiveInteger(args.limit, 12),
    minScore: toPositiveInteger(args["min-score"], 45),
    rawLimit: toPositiveInteger(args["raw-limit"], 300),
    sinceHours: toPositiveInteger(args["since-hours"], 72),
    timeoutMs: toPositiveInteger(args.timeout, 12000),
    sourceTypes: toList(args.type),
    sourceIds: toList(args.source),
    outputPath: args.out ? path.resolve(projectRoot, args.out) : null
  };

  const selectedSources = sourceConfig.sources.filter((source) => {
    if (source.enabled === false && !options.includeDisabled) return false;
    if (options.sourceTypes.length > 0 && !options.sourceTypes.includes(source.type)) return false;
    if (options.sourceIds.length > 0 && !options.sourceIds.includes(source.id)) return false;
    return true;
  });

  const fetched = await Promise.all(selectedSources.map((source) => fetchFeed(source, options)));
  const rawItems = fetched.flatMap((result) => result.items).slice(0, options.rawLimit);
  const sinceTime = Date.now() - options.sinceHours * 60 * 60 * 1000;
  const relevantItems = rawItems
    .filter((item) => options.includeAll || isRelevant(item))
    .filter((item) => !item.publishedAt || new Date(item.publishedAt).getTime() >= sinceTime);
  const ranked = dedupeItems(relevantItems)
    .map((item) => enrichCandidate(item))
    .filter((item) => item.score >= options.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit);

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      sinceHours: options.sinceHours,
      minScore: options.minScore,
      selectedSourceCount: selectedSources.length,
      fetchedItemCount: rawItems.length,
      relevantItemCount: relevantItems.length,
      candidateCount: ranked.length,
      sourceTypes: options.sourceTypes,
      sourceIds: options.sourceIds
    },
    candidates: ranked,
    sourceResults: fetched.map((result) => ({
      sourceId: result.source.id,
      sourceName: result.source.name,
      itemCount: result.items.length,
      error: result.error || null
    }))
  };

  const output = options.format === "markdown" ? toMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`;
  if (options.outputPath) {
    await mkdir(path.dirname(options.outputPath), { recursive: true });
    await writeFile(options.outputPath, output, "utf8");
  }
  process.stdout.write(output);
}

async function fetchFeed(source, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "user-agent": "ChangzhouAIClub-NewsRadar/0.1 (+https://changzhouai.club)"
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const parser = new XMLParser({
      attributeNamePrefix: "@_",
      cdataPropName: "#cdata",
      ignoreAttributes: false,
      parseTagValue: false,
      removeNSPrefix: true,
      textNodeName: "#text"
    });
    const parsed = parser.parse(xml);
    return {
      source,
      items: extractFeedItems(parsed).map((item) => normalizeFeedItem(item, source)).filter(Boolean)
    };
  } catch (error) {
    return { source, items: [], error: error.name === "AbortError" ? "Timeout" : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function extractFeedItems(parsed) {
  const rssItems = parsed?.rss?.channel?.item || parsed?.rdf?.RDF?.item;
  const atomItems = parsed?.feed?.entry;
  if (rssItems) return asArray(rssItems);
  if (atomItems) return asArray(atomItems);
  return [];
}

function normalizeFeedItem(item, source) {
  const title = cleanText(textValue(item.title));
  const url = extractUrl(item);
  if (!title || !url) return null;
  const summary = cleanText(
    textValue(item.description) ||
      textValue(item.summary) ||
      textValue(item.encoded) ||
      textValue(item.content)
  );
  const publishedAt = parseDateValue(
    textValue(item.pubDate) ||
      textValue(item.published) ||
      textValue(item.updated) ||
      textValue(item.date)
  );

  return {
    id: stableId(`${source.id}:${url || title}`),
    title,
    url,
    summary: truncate(summary, 700),
    publishedAt,
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.type,
    sourceTags: source.tags || [],
    sourceWeight: Number(source.weight || 1)
  };
}

function extractUrl(item) {
  const link = item.link;
  if (typeof link === "string") return normalizeUrl(link);
  if (Array.isArray(link)) {
    const alternate = link.find((entry) => entry?.["@_rel"] === "alternate") || link[0];
    return normalizeUrl(alternate?.["@_href"] || alternate?.href || textValue(alternate));
  }
  if (typeof link === "object" && link) {
    return normalizeUrl(link["@_href"] || link.href || textValue(link));
  }
  const guid = textValue(item.guid || item.id);
  return guid?.startsWith("http") ? normalizeUrl(guid) : "";
}

function isRelevant(item) {
  const haystack = `${item.title} ${item.summary} ${item.sourceTags.join(" ")}`.toLowerCase();
  return AI_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function enrichCandidate(item) {
  const text = `${item.title} ${item.summary}`.toLowerCase();
  const title = item.title.toLowerCase();
  const keywordHits = unique(
    AI_KEYWORDS.filter((keyword) => text.includes(keyword.toLowerCase())).slice(0, 8)
  );
  const importanceHits = IMPORTANCE_TERMS.filter((term) => text.includes(term.toLowerCase()));
  const businessHits = BUSINESS_TERMS.filter((term) => text.includes(term.toLowerCase()));
  const techHits = TECH_TERMS.filter((term) => text.includes(term.toLowerCase()));
  const policyHits = POLICY_TERMS.filter((term) => text.includes(term.toLowerCase()));

  const hoursOld = item.publishedAt ? (Date.now() - new Date(item.publishedAt).getTime()) / 36e5 : null;
  const recencyScore = hoursOld == null ? 2 : hoursOld <= 24 ? 18 : hoursOld <= 48 ? 10 : hoursOld <= 72 ? 5 : 0;
  const titleBonus = AI_KEYWORDS.filter((keyword) => title.includes(keyword.toLowerCase())).length * 4;
  const score = Math.round(
    item.sourceWeight * 18 +
      recencyScore +
      keywordHits.length * 3 +
      titleBonus +
      importanceHits.length * 4 +
      businessHits.length * 3 +
      techHits.length * 2 +
      policyHits.length * 2
  );

  const suggestedColumns = suggestColumns({ businessHits, techHits, policyHits, sourceType: item.sourceType });
  const recommendedAction = score >= 70 ? "建议进入候选池并人工审核" : score >= 45 ? "可进入原始抓取池，等待二筛" : "仅保留在原始抓取池";

  return {
    ...item,
    score,
    keywordHits,
    suggestedColumns,
    recommendedAction,
    materialValue: score >= 70 ? "高" : score >= 45 ? "中" : "低",
    reasons: buildReasons({ item, hoursOld, keywordHits, importanceHits, businessHits, techHits, policyHits }),
    localAngle: suggestLocalAngle({ businessHits, techHits, policyHits, suggestedColumns })
  };
}

function suggestColumns({ businessHits, techHits, policyHits, sourceType }) {
  const columns = new Set(["AI今日信号"]);
  if (businessHits.length > 0) columns.add("AI商机拆解");
  if (techHits.length > 0 || sourceType === "research") columns.add("技术方案剖析");
  if (policyHits.length > 0) columns.add("AI今日信号");
  return Array.from(columns).slice(0, 3);
}

function suggestLocalAngle({ businessHits, techHits, policyHits }) {
  if (businessHits.length > 0) {
    return "关注它是否能降低本地企业在客服、销售、知识库或运营自动化上的试错成本。";
  }
  if (techHits.length > 0) {
    return "适合让技术成员判断是否能转成可复用的 Agent、RAG 或自动化方案。";
  }
  if (policyHits.length > 0) {
    return "适合补充对企业合规、内容版权和 AI 应用边界的提醒。";
  }
  return "适合作为今日 AI 信号，先判断是否值得扩展成商机或技术选题。";
}

function buildReasons({ item, hoursOld, keywordHits, importanceHits, businessHits, techHits, policyHits }) {
  const reasons = [];
  if (item.sourceType === "official") reasons.push("官方源");
  if (hoursOld != null && hoursOld <= 24) reasons.push("24小时内");
  if (hoursOld != null && hoursOld > 24 && hoursOld <= 72) reasons.push("近3天");
  if (keywordHits.length > 0) reasons.push(`AI关键词：${keywordHits.slice(0, 4).join(" / ")}`);
  if (importanceHits.length > 0) reasons.push(`重要性信号：${unique(importanceHits).slice(0, 3).join(" / ")}`);
  if (businessHits.length > 0) reasons.push("有商业/企业应用线索");
  if (techHits.length > 0) reasons.push("有技术方案线索");
  if (policyHits.length > 0) reasons.push("有政策/安全/版权线索");
  return reasons;
}

function dedupeItems(items) {
  const byKey = new Map();
  for (const item of items) {
    const key = item.url || titleSignature(item.title);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...item, duplicateCount: 0, duplicateSources: [] });
      continue;
    }
    existing.duplicateCount += 1;
    existing.duplicateSources.push(item.sourceName);
    if ((item.sourceWeight || 1) > (existing.sourceWeight || 1)) {
      byKey.set(key, { ...item, duplicateCount: existing.duplicateCount, duplicateSources: existing.duplicateSources });
    }
  }

  const byTitle = new Map();
  for (const item of byKey.values()) {
    const signature = titleSignature(item.title);
    const existing = byTitle.get(signature);
    if (!existing || item.sourceWeight > existing.sourceWeight) byTitle.set(signature, item);
  }
  return Array.from(byTitle.values());
}

function toMarkdown(report) {
  const lines = [];
  lines.push("# AI News Radar Dry Run");
  lines.push("");
  lines.push(`Generated: ${report.meta.generatedAt}`);
  lines.push(`Window: last ${report.meta.sinceHours} hours`);
  lines.push(`Min score: ${report.meta.minScore}`);
  lines.push(`Sources: ${report.meta.selectedSourceCount}`);
  lines.push(`Fetched: ${report.meta.fetchedItemCount}`);
  lines.push(`Relevant: ${report.meta.relevantItemCount}`);
  lines.push(`Candidates: ${report.meta.candidateCount}`);
  lines.push("");
  lines.push("## Top Candidates");
  lines.push("");

  report.candidates.forEach((candidate, index) => {
    lines.push(`### ${index + 1}. ${candidate.title}`);
    lines.push("");
    lines.push(`- Source: ${candidate.sourceName} (${candidate.sourceType})`);
    lines.push(`- Published: ${candidate.publishedAt || "unknown"}`);
    lines.push(`- Score: ${candidate.score} / Value: ${candidate.materialValue}`);
    lines.push(`- Suggested columns: ${candidate.suggestedColumns.join(" / ")}`);
    lines.push(`- Recommendation: ${candidate.recommendedAction}`);
    lines.push(`- Why: ${candidate.reasons.join("; ") || "No strong signal"}`);
    lines.push(`- Local angle: ${candidate.localAngle}`);
    if (candidate.summary) lines.push(`- Summary: ${candidate.summary}`);
    lines.push(`- URL: ${candidate.url}`);
    lines.push("");
  });

  const failedSources = report.sourceResults.filter((source) => source.error);
  if (failedSources.length > 0) {
    lines.push("## Source Warnings");
    lines.push("");
    failedSources.forEach((source) => {
      lines.push(`- ${source.sourceName}: ${source.error}`);
    });
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
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

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textValue(value) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(" ");
  if (typeof value === "object") {
    return value["#cdata"] || value["#text"] || value.value || "";
  }
  return "";
}

function parseDateValue(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function normalizeUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(cleanText(url));
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
      parsed.searchParams.delete(key);
    });
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return cleanText(url);
  }
}

function stableId(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function titleSignature(title) {
  return cleanText(title)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ")
    .split(/\s+/)
    .filter((token) => token && !["the", "a", "an", "and", "or", "to", "of", "for", "with", "in", "on"].includes(token))
    .slice(0, 12)
    .join(" ");
}

function truncate(value, maxLength) {
  if (!value || value.length <= maxLength) return value || "";
  return `${value.slice(0, maxLength - 1)}...`;
}

function unique(values) {
  return Array.from(new Set(values));
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toList(value) {
  if (!value || value === true) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
