const WEDAILY_BASE_URL = "https://wedaily.occcc.cc";
const WEDAILY_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const WEDAILY_REQUEST_TIMEOUT_MS = 8_000;

export type WeDailyReportStats = {
  message_count?: number;
  speaker_count?: number;
  top_speakers?: Array<[string, number]>;
  keywords?: Array<[string, number]>;
  type_counts?: Array<[string, number]>;
};

export type WeDailyHighlight = {
  index: number;
  title: string;
  timeRange: string | null;
  participants: string[];
  summary: string;
};

export type WeDailyDiscussion = {
  index: number;
  title: string;
  timeRange: string | null;
  conclusion: string;
  people: string[];
  quote: string | null;
};

export type WeDailyResource = {
  index: number;
  title: string;
  body: string;
  url: string | null;
};

export type ParsedWeDailyMarkdown = {
  title: string;
  quote: string | null;
  overview: string | null;
  highlights: WeDailyHighlight[];
  discussions: WeDailyDiscussion[];
  resources: WeDailyResource[];
  vibe: string | null;
  tags: string[];
};

export type WeDailyReport = {
  id: number;
  chat: string;
  date: string;
  stats: WeDailyReportStats | null;
  generated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  markdown: string | null;
  parsed: ParsedWeDailyMarkdown;
};

type WeDailyReportsResponse = {
  reports?: unknown;
};

type FetchResult<T> = {
  data: T | null;
  error: string | null;
};

export async function getWeDailyReports({
  date,
  limit = 20,
}: {
  date?: string;
  limit?: number;
} = {}): Promise<{
  error: string | null;
  reports: WeDailyReport[];
}> {
  const params = new URLSearchParams({
    include_markdown: "1",
    limit: String(Math.min(200, Math.max(1, limit))),
  });

  if (date) {
    params.set("date", date);
  }

  const result = await fetchWeDailyJson<WeDailyReportsResponse>(`/api/public/reports?${params.toString()}`);
  const reports = Array.isArray(result.data?.reports) ? result.data.reports.map(normalizeWeDailyReport) : [];

  return {
    error: result.error,
    reports: reports.filter((report): report is WeDailyReport => report !== null),
  };
}

export function parseWeDailyMarkdown(markdown: string | null | undefined, fallbackTitle: string): ParsedWeDailyMarkdown {
  const source = markdown?.trim() ?? "";
  const lines = source.split(/\r?\n/).map((line) => line.trimEnd());
  const title = cleanInline(lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, "") || fallbackTitle);
  const quote = lines
    .filter((line) => line.startsWith(">"))
    .map((line) => cleanInline(line.replace(/^>\s?/, "")))
    .filter(Boolean)
    .join("\n") || null;
  const sections = splitSecondLevelSections(lines);

  return {
    title,
    quote,
    overview: normalizeParagraph(sections.get("一句话概览")),
    highlights: parseHighlights(sections.get("今日要点") ?? ""),
    discussions: parseDiscussions(sections.get("重点讨论") ?? ""),
    resources: parseResources(sections.get("干货 / 行动 / 机会") ?? ""),
    vibe: normalizeParagraph(sections.get("高光时刻 / 群氛围")),
    tags: parseTags(sections.get("标签") ?? ""),
  };
}

function normalizeWeDailyReport(value: unknown): WeDailyReport | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toInteger(value.id);
  const chat = toStringValue(value.chat);
  const date = toStringValue(value.date);

  if (!id || !chat || !date) {
    return null;
  }

  const markdown = toStringValue(value.markdown);
  const fallbackTitle = `${date}「${chat}」群聊手记`;

  return {
    id,
    chat,
    date,
    stats: normalizeStats(value.stats),
    generated_by: toStringValue(value.generated_by),
    created_at: toStringValue(value.created_at),
    updated_at: toStringValue(value.updated_at),
    markdown,
    parsed: parseWeDailyMarkdown(markdown, fallbackTitle),
  };
}

function normalizeStats(value: unknown): WeDailyReportStats | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    message_count: toInteger(value.message_count) ?? undefined,
    speaker_count: toInteger(value.speaker_count) ?? undefined,
    top_speakers: normalizePairList(value.top_speakers),
    keywords: normalizePairList(value.keywords),
    type_counts: normalizePairList(value.type_counts),
  };
}

function normalizePairList(value: unknown): Array<[string, number]> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const pairs = value
    .map((item): [string, number] | null => {
      if (!Array.isArray(item)) {
        return null;
      }

      const label = toStringValue(item[0]);
      const count = toInteger(item[1]);

      return label && count !== null ? [label, count] : null;
    })
    .filter((item): item is [string, number] => item !== null);

  return pairs.length > 0 ? pairs : undefined;
}

function splitSecondLevelSections(lines: string[]) {
  const sections = new Map<string, string>();
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentTitle) {
        sections.set(currentTitle, currentLines.join("\n").trim());
      }

      currentTitle = cleanInline(line.replace(/^##\s+/, ""));
      currentLines = [];
      continue;
    }

    if (currentTitle) {
      currentLines.push(line);
    }
  }

  if (currentTitle) {
    sections.set(currentTitle, currentLines.join("\n").trim());
  }

  return sections;
}

function parseHighlights(section: string): WeDailyHighlight[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line, arrayIndex): WeDailyHighlight => {
      const index = toInteger(line.match(/^(\d+)\./)?.[1]) ?? arrayIndex + 1;
      const withoutNumber = line.replace(/^\d+\.\s+/, "");
      const match = withoutNumber.match(/^\*\*(.*?)\*\*(?:（(.*?)）)?[：:]\s*(.*)$/);
      const meta = match?.[2] ?? null;

      return {
        index,
        title: cleanInline(match?.[1] ?? withoutNumber),
        timeRange: parseTimeRange(meta),
        participants: parsePeople(meta),
        summary: cleanInline(match?.[3] ?? ""),
      };
    });
}

function parseDiscussions(section: string): WeDailyDiscussion[] {
  const blocks: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of section.split("\n")) {
    if (line.startsWith("### ")) {
      if (current) {
        blocks.push(current);
      }

      current = {
        title: cleanInline(line.replace(/^###\s+/, "")),
        lines: [],
      };
      continue;
    }

    if (current) {
      current.lines.push(line.trim());
    }
  }

  if (current) {
    blocks.push(current);
  }

  return blocks.map((block, arrayIndex): WeDailyDiscussion => {
    const index = toInteger(block.title.match(/^(\d+)\./)?.[1]) ?? arrayIndex + 1;
    const titleWithoutIndex = block.title.replace(/^\d+\.\s*/, "");
    const timeMatch = titleWithoutIndex.match(/^(.*?)（(.*?)）$/);
    const conclusion = parseLabeledLine(block.lines, "核心结论") ?? normalizeParagraph(block.lines.join("\n")) ?? "";
    const quote = parseLabeledLine(block.lines, "代表性原话");

    return {
      index,
      title: timeMatch ? cleanInline(timeMatch[1]) : titleWithoutIndex,
      timeRange: timeMatch ? timeMatch[2] : null,
      conclusion,
      people: splitPeople(parseLabeledLine(block.lines, "相关人物") ?? ""),
      quote,
    };
  });
}

function parseResources(section: string): WeDailyResource[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(?:\d+\.|-)\s+/.test(line))
    .map((line, arrayIndex): WeDailyResource => {
      const index = toInteger(line.match(/^(\d+)\./)?.[1]) ?? arrayIndex + 1;
      const withoutMarker = line.replace(/^(?:\d+\.|-)\s+/, "");
      const match = withoutMarker.match(/^\*\*(.*?)\*\*[：:]\s*(.*)$/);
      const body = cleanInline(match?.[2] ?? withoutMarker);

      return {
        index,
        title: cleanInline(match?.[1] ?? withoutMarker),
        body,
        url: body.match(/https?:\/\/[^\s（）)，,。]+/)?.[0] ?? null,
      };
    });
}

function parseLabeledLine(lines: string[], label: string) {
  const prefix = `- ${label}：`;
  const line = lines.find((item) => item.startsWith(prefix));

  return line ? cleanInline(line.slice(prefix.length)) : null;
}

function parseTags(section: string) {
  return section
    .split(/\s+/)
    .map((tag) => tag.trim().replace(/[，,。；;]+$/g, ""))
    .filter((tag) => tag.startsWith("#"))
    .map((tag) => tag.slice(1))
    .filter(Boolean);
}

function parseTimeRange(meta: string | null) {
  if (!meta) {
    return null;
  }

  const [timeRange] = meta.split(/[｜|]/);

  return timeRange?.trim() || null;
}

function parsePeople(meta: string | null) {
  if (!meta) {
    return [];
  }

  const peoplePart = meta.split(/[｜|]/).find((part) => part.includes("参与"));

  if (!peoplePart) {
    return [];
  }

  return splitPeople(peoplePart.replace(/^参与[：:]\s*/, ""));
}

function splitPeople(value: string) {
  return value
    .split("、")
    .map((person) => cleanInline(person))
    .filter(Boolean);
}

function normalizeParagraph(value: string | undefined) {
  const paragraph = value
    ?.split("\n")
    .map((line) => cleanInline(line.trim()))
    .filter(Boolean)
    .join("\n");

  return paragraph || null;
}

function cleanInline(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

async function fetchWeDailyJson<T>(path: string): Promise<FetchResult<T>> {
  try {
    const response = await fetch(`${WEDAILY_BASE_URL}${path}`, {
      headers: {
        accept: "application/json",
        "user-agent": WEDAILY_USER_AGENT,
      },
      signal: AbortSignal.timeout(WEDAILY_REQUEST_TIMEOUT_MS),
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      throw new Error(`WeDaily request failed with ${response.status}`);
    }

    return {
      data: (await response.json()) as T,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "WeDaily request failed",
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toInteger(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function toStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
