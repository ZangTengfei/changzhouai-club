import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILE = ".env.local";
const DEFAULT_YEAR = "2026";
const PRIVATE_SOURCE_SUFFIX = "-AI 沙龙.md";
const UNIDENTIFIED_NAME_PATTERN =
  /Speaker|从业者|创业者|负责人|参会者|老师|团队|其他|某行业|相关人员|专业人士|爱好者群体/iu;

const ROLE_RULES = [
  ["创始人", /创始人|发起人/u],
  ["程序员", /程序员|软件开发|开发从业|前端|后端|全栈/u],
  ["产品经理", /产品经理/u],
  ["教师", /老师|教师|院校|教学/u],
  ["工程师", /工程师|技术架构|嵌入式/u],
  ["运营", /运营|社媒|自媒体/u],
  ["摄影师", /摄影师|拍摄|摄影/u],
  ["设计师", /设计师|工业设计|室内设计/u],
  ["律师", /律师|律所/u],
  ["销售", /销售|售前/u],
  ["学生", /学生|在读|未成年/u],
];

const INDUSTRY_RULES = [
  ["AI应用开发", /AI应用|智能体|Agent|大模型|知识库|RAG/iu],
  ["工业制造", /工业|制造|工厂|机械|汽车|生产/u],
  ["电商", /电商|淘宝|抖音|小红书|亚马逊|eBay|TikTok/iu],
  ["跨境出海", /跨境|外贸|出海|海外/u],
  ["AIGC内容", /AIGC|AI视频|AI短剧|生图|动画/iu],
  ["教育培训", /教育|院校|学校|培训|教培|学生/u],
  ["企业服务", /企业管理|企业服务|数字化|信息化/u],
  ["文旅", /文旅|景区|旅游/u],
  ["法律", /法律|律师|合同|法条/u],
  ["医疗养老", /医疗|养老|护工/u],
  ["硬件与机器人", /硬件|机器人|机械臂|灵巧手|PCB|芯片/iu],
  ["设计与摄影", /设计|摄影|拍摄/u],
  ["政务与产业", /政务|政府|招商|产业链/u],
  ["本地生活", /餐饮|门店|轻食|本地生活/u],
];

const CAPABILITY_RULES = [
  ["AI编程", /Codex|Claude|代码|编程|开发|live coding/iu],
  ["智能体开发", /智能体|Agent|工作流/iu],
  ["企业AI落地", /企业.*AI|AI.*企业|数字员工|FDE/iu],
  ["AIGC视频制作", /AI视频|AI短剧|AIGC|分镜|运镜/iu],
  ["内容运营", /内容运营|自媒体|社媒|流量|账号运营/u],
  ["跨境运营", /跨境|外贸|亚马逊|eBay|TikTok/iu],
  ["产品与项目管理", /产品经理|项目经理|需求拆解|项目落地/u],
  ["工业数字化", /工业|制造|ERP|QMS|CAD|数字孪生/iu],
  ["软硬件结合", /硬件|嵌入式|机器人|机械臂|PCB/iu],
  ["教育培训", /教学|培训|课程|教师/u],
  ["商业摄影", /摄影|拍摄|模特|场地/u],
  ["销售与商务拓展", /销售|商机|客户对接|获客|商务/u],
];

function printHelp() {
  console.log(`Import private member profiles from paired salon summaries/transcripts.

Usage:
  npm run members:profiles:import -- --source <directory> --dry-run
  npm run members:profiles:import -- --source <directory> --aliases <json> --apply

Options:
  --source <directory>  Root containing per-event summary and transcript files.
  --aliases <json>      Optional private alias map: { "observed name": "canonical name" }.
  --env-file <path>     Environment file for Supabase credentials. Default: .env.local.
  --year <yyyy>         Fallback year for MM-DD directory names. Default: 2026.
  --dry-run             Parse and report counts without database writes.
  --apply               Upsert profiles and evidence into Supabase.
  --help                Show this help.

The importer never writes source text to tracked files. Event matching uses the
Asia/Shanghai calendar date only; AI-generated titles are never used as keys.
`);
}

function parseArgs(argv) {
  const options = {
    source: null,
    aliases: null,
    envFile: DEFAULT_ENV_FILE,
    year: DEFAULT_YEAR,
    dryRun: false,
    apply: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--source") options.source = argv[++index];
    else if (argument === "--aliases") options.aliases = argv[++index];
    else if (argument === "--env-file") options.envFile = argv[++index];
    else if (argument === "--year") options.year = argv[++index];
    else if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--apply") options.apply = true;
    else if (argument === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.source) throw new Error("Missing --source <directory>.");
  if (options.apply === options.dryRun) {
    throw new Error("Choose exactly one of --dry-run or --apply.");
  }
  if (!/^\d{4}$/.test(options.year)) throw new Error("--year must be YYYY.");
  return options;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const source = readFileSync(filePath, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function listSummaryFiles(root) {
  const files = [];
  const queue = [root];
  while (queue.length) {
    const current = queue.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) queue.push(absolutePath);
      else if (entry.isFile() && entry.name.endsWith(PRIVATE_SOURCE_SUFFIX)) {
        files.push(absolutePath);
      }
    }
  }
  return files.sort();
}

function stripMarkdown(value) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getEventDate(filePath, markdown, fallbackYear) {
  const explicit = markdown.match(/20\d{2}-\d{2}-\d{2}/)?.[0];
  if (explicit) return explicit;
  const shortDate = filePath.match(/(?:^|\/)(\d{2})-(\d{2})(?:\s|\/)/);
  if (!shortDate) throw new Error(`Cannot resolve event date: ${filePath}`);
  return `${fallbackYear}-${shortDate[1]}-${shortDate[2]}`;
}

function getTitle(markdown) {
  return stripMarkdown(markdown.match(/^#\s+(.+)$/m)?.[1] ?? "未命名活动总结");
}

function getIntroSection(markdown) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex(
    (line) =>
      /^##\s+/.test(line) &&
      /(自我介绍|参与者背景介绍|参会人员介绍|参与者自我介绍)/u.test(line),
  );
  if (start < 0) return "";
  let end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  if (end < 0) end = lines.length;
  return lines.slice(start + 1, end).join("\n");
}

function extractEntries(section) {
  const headingMatches = Array.from(section.matchAll(/^###\s+\d+\.\s+(.+)$/gm));
  if (headingMatches.length) {
    return headingMatches.map((match, index) => {
      const start = match.index + match[0].length;
      const end = headingMatches[index + 1]?.index ?? section.length;
      return { rawName: stripMarkdown(match[1]), text: stripMarkdown(section.slice(start, end)) };
    });
  }

  const lines = section.split(/\r?\n/);
  const entries = [];
  for (const line of lines) {
    const match = line.match(/^\s*\d+\.\s+(?:\*\*)?(.+?)(?:\*\*)?[：:]\s*(.+)$/u);
    if (match) entries.push({ rawName: stripMarkdown(match[1]), text: stripMarkdown(match[2]) });
  }
  return entries;
}

function extractNamedSpeakerEntries(markdown) {
  const headings = Array.from(markdown.matchAll(/^###\s+(.+)$/gm));
  const entries = [];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = stripMarkdown(headings[index][1]);
    const speaker = heading.match(/分享人[：:]\s*([^，,）)]+)/u)?.[1]?.trim();
    if (!speaker) continue;
    const start = headings[index].index + headings[index][0].length;
    const end = headings[index + 1]?.index ?? markdown.length;
    entries.push({
      rawName: speaker,
      text: stripMarkdown(markdown.slice(start, end)),
    });
  }
  return entries;
}

function getParentheticalAliases(rawName) {
  return Array.from(rawName.matchAll(/[（(]([^）)]+)[）)]/g))
    .flatMap((match) => match[1].split(/[、,/]/))
    .map((value) => value.replace(/Speaker\s*\d+|群名|网名|分享人|沙龙.*$/giu, "").trim())
    .filter((value) => value && value.length <= 20 && !UNIDENTIFIED_NAME_PATTERN.test(value));
}

function getBaseName(rawName) {
  return rawName.replace(/[（(].*$/u, "").trim();
}

function splitNamedPeople(rawName) {
  const baseName = getBaseName(rawName);
  if (!baseName.includes("、")) return [rawName];
  return baseName.split("、").map((name) => name.trim()).filter(Boolean);
}

function isIdentifiableName(rawName) {
  const name = getBaseName(rawName);
  return Boolean(name) && !UNIDENTIFIED_NAME_PATTERN.test(name) && name.length <= 30;
}

function getIdentityStatus(name) {
  if (/某|先生|女士|总$/u.test(name)) return "partial";
  if (/^[A-Za-z][A-Za-z\s.-]+$/u.test(name)) return "partial";
  if (/^[\p{Script=Han}]{2,5}$/u.test(name)) return "named";
  return "partial";
}

function unique(values) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function matchRules(text, rules) {
  return rules.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function extractOrganizations(text) {
  const matches = text.match(
    /[A-Za-z0-9\p{Script=Han}·+]{2,24}(?:有限公司|事务所|设计院|职业院校|高职校|大学|学院|学校|银行|电信AI中心|电信|科技|公司|中心|社区)/gu,
  );
  return unique(
    (matches ?? [])
      .map((value) => value.replace(/^(?:来自|任职于|就职于|所在|所属|公司为)/u, ""))
      .filter((value) => value.length <= 30),
  ).slice(0, 6);
}

function splitSentences(text) {
  return text
    .split(/[。；]/u)
    .map((sentence) => sentence.trim().replace(/^[-：:]+/u, ""))
    .filter((sentence) => sentence.length >= 8);
}

function extractNeeds(text) {
  return splitSentences(text)
    .filter((sentence) => /希望|寻找|寻求|需要|期待|诉求|计划|关注|想要|想学习/u.test(sentence))
    .slice(0, 5);
}

function extractOffers(text) {
  return splitSentences(text)
    .filter((sentence) => /擅长|负责|可提供|主营|能力|经验|开发|运营|服务/u.test(sentence))
    .slice(0, 5);
}

function summarizeEvidence(text) {
  const sentences = splitSentences(text);
  return (sentences.slice(0, 3).join("；") || text).slice(0, 900);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseSources(files, root, aliases, fallbackYear) {
  const observations = [];
  let anonymousEntryCount = 0;
  let minorEntryCount = 0;

  for (const summaryPath of files) {
    const markdown = readFileSync(summaryPath, "utf8");
    const eventDate = getEventDate(summaryPath, markdown, fallbackYear);
    const sourceTitle = getTitle(markdown);
    const introSection = getIntroSection(markdown);
    const transcriptPath = summaryPath.replace(/-AI 沙龙\.md$/u, "-transcript.txt");
    const transcriptFilename = existsSync(transcriptPath) ? path.basename(transcriptPath) : null;
    const relativeSummaryPath = path.relative(root, summaryPath);

    const entries = [
      ...extractEntries(introSection),
      ...extractNamedSpeakerEntries(markdown),
    ];

    for (const entry of entries) {
      const people = splitNamedPeople(entry.rawName);
      for (const personLabel of people) {
        if (!isIdentifiableName(personLabel)) {
          anonymousEntryCount += 1;
          continue;
        }

        if (/未成年|小学生|初[一二三123]|中学生|不满十[四五六]周岁/u.test(entry.text)) {
          minorEntryCount += 1;
          continue;
        }

        const observedName = getBaseName(personLabel);
        const canonicalName =
          aliases[`${eventDate}|${observedName}`] ??
          aliases[observedName] ??
          observedName;
        const profileKey = `activity-profile:${sha256(canonicalName).slice(0, 24)}`;
        const parentheticalAliases = getParentheticalAliases(entry.rawName);
        observations.push({
          profileKey,
          canonicalName,
          observedName,
          aliases: unique([
            observedName !== canonicalName ? observedName : "",
            ...parentheticalAliases.filter((alias) => alias !== canonicalName),
          ]),
          identityStatus: getIdentityStatus(canonicalName),
          eventDate,
          sourceTitle,
          summaryFilename: path.basename(summaryPath),
          transcriptFilename,
          sourceLocator: relativeSummaryPath,
          text: entry.text,
        });
      }
    }
  }

  return { observations, anonymousEntryCount, minorEntryCount };
}

function aggregateProfiles(observations) {
  const grouped = new Map();
  for (const observation of observations) {
    const items = grouped.get(observation.profileKey) ?? [];
    items.push(observation);
    grouped.set(observation.profileKey, items);
  }

  return Array.from(grouped.entries()).map(([profileKey, items]) => {
    const combinedText = items.map((item) => item.text).join("。 ");
    const summaries = unique(items.map((item) => summarizeEvidence(item.text)));
    const eventCount = new Set(items.map((item) => item.eventDate)).size;
    return {
      profile_key: profileKey,
      display_name: items[0].canonicalName,
      aliases: unique(items.flatMap((item) => item.aliases)),
      identity_status: items.some((item) => item.identityStatus === "partial")
        ? "partial"
        : "named",
      profile_summary: `${eventCount} 场活动资料中出现。${summaries.join("；")}`.slice(0, 1800),
      roles: unique(matchRules(combinedText, ROLE_RULES)),
      organizations: extractOrganizations(combinedText),
      industry_tags: unique(matchRules(combinedText, INDUSTRY_RULES)),
      capability_tags: unique(matchRules(combinedText, CAPABILITY_RULES)),
      interest_tags: unique([
        ...matchRules(
          extractNeeds(combinedText).join("。"),
          [...INDUSTRY_RULES, ...CAPABILITY_RULES],
        ),
      ]),
      needs: unique(items.flatMap((item) => extractNeeds(item.text))).slice(0, 10),
      offers: unique(items.flatMap((item) => extractOffers(item.text))).slice(0, 10),
    };
  });
}

function formatChangzhouDate(value) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

async function loadEventsByDate(supabase, dates) {
  const sortedDates = [...dates].sort();
  const from = `${sortedDates[0]}T00:00:00+08:00`;
  const through = new Date(`${sortedDates.at(-1)}T00:00:00+08:00`);
  through.setUTCDate(through.getUTCDate() + 1);
  const { data, error } = await supabase
    .from("events")
    .select("id, title, event_at")
    .gte("event_at", from)
    .lt("event_at", through.toISOString());
  if (error) throw new Error(`events: ${error.message}`);

  const byDate = new Map();
  for (const event of data ?? []) {
    if (!event.event_at) continue;
    const eventDate = formatChangzhouDate(event.event_at);
    const items = byDate.get(eventDate) ?? [];
    items.push(event);
    byDate.set(eventDate, items);
  }
  return byDate;
}

async function applyImport(supabase, profiles, observations) {
  const eventDates = new Set(observations.map((item) => item.eventDate));
  const eventsByDate = await loadEventsByDate(supabase, eventDates);
  const { data: savedProfiles, error: profileError } = await supabase
    .from("member_private_profiles")
    .upsert(profiles, { onConflict: "profile_key" })
    .select("id, profile_key");
  if (profileError) throw new Error(`member_private_profiles: ${profileError.message}`);

  const profileIds = new Map((savedProfiles ?? []).map((row) => [row.profile_key, row.id]));
  const evidence = observations.map((item) => {
    const matchedEvents = eventsByDate.get(item.eventDate) ?? [];
    const event = matchedEvents.length === 1 ? matchedEvents[0] : null;
    return {
      profile_id: profileIds.get(item.profileKey),
      event_id: event?.id ?? null,
      event_date: item.eventDate,
      event_match_status:
        matchedEvents.length === 1
          ? "matched_by_date"
          : matchedEvents.length > 1
            ? "ambiguous_date"
            : "unmatched",
      source_title: item.sourceTitle,
      summary_filename: item.summaryFilename,
      transcript_filename: item.transcriptFilename,
      source_locator: item.sourceLocator,
      observation_kind: "event_profile",
      observation: item.text.slice(0, 8000),
      confidence: item.identityStatus === "named" ? 0.82 : 0.62,
      source_fingerprint: sha256(
        `${item.profileKey}|${item.eventDate}|${item.sourceLocator}|${item.observedName}|${sha256(item.text)}`,
      ),
    };
  });
  const evidenceFingerprints = new Set(
    evidence.map((item) => item.source_fingerprint),
  );
  if (evidenceFingerprints.size !== evidence.length) {
    throw new Error("Evidence fingerprint collision detected before import.");
  }

  const { error: evidenceError } = await supabase
    .from("member_private_profile_evidence")
    .upsert(evidence, { onConflict: "source_fingerprint" });
  if (evidenceError) {
    throw new Error(`member_private_profile_evidence: ${evidenceError.message}`);
  }

  return {
    matchedByDate: evidence.filter((item) => item.event_match_status === "matched_by_date").length,
    ambiguousDate: evidence.filter((item) => item.event_match_status === "ambiguous_date").length,
    unmatched: evidence.filter((item) => item.event_match_status === "unmatched").length,
  };
}

const options = parseArgs(process.argv.slice(2));
const sourceRoot = path.resolve(options.source);
if (!existsSync(sourceRoot)) throw new Error(`Source directory not found: ${sourceRoot}`);
const aliases = options.aliases
  ? JSON.parse(readFileSync(path.resolve(options.aliases), "utf8"))
  : {};
const summaryFiles = listSummaryFiles(sourceRoot);
const pairedTranscriptFiles = summaryFiles.filter((summaryPath) =>
  existsSync(summaryPath.replace(/-AI 沙龙\.md$/u, "-transcript.txt")),
).length;
const { observations, anonymousEntryCount, minorEntryCount } = parseSources(
  summaryFiles,
  sourceRoot,
  aliases,
  options.year,
);
const profiles = aggregateProfiles(observations);
const baseReport = {
  mode: options.dryRun ? "dry-run" : "apply",
  summaryFiles: summaryFiles.length,
  pairedTranscriptFiles,
  identifiableObservations: observations.length,
  privateProfiles: profiles.length,
  partialIdentityProfiles: profiles.filter((profile) => profile.identity_status === "partial").length,
  skippedAnonymousEntries: anonymousEntryCount,
  skippedMinorEntries: minorEntryCount,
  eventDates: new Set(observations.map((item) => item.eventDate)).size,
};

if (options.dryRun) {
  console.log(JSON.stringify(baseReport, null, 2));
  process.exit(0);
}

loadEnvFile(path.resolve(options.envFile));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase server configuration.");
}
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const matchReport = await applyImport(supabase, profiles, observations);
console.log(JSON.stringify({ ...baseReport, ...matchReport }, null, 2));
