import type { ParsedWeDailyMarkdown } from "@/lib/wedaily";

export type WeDailyShareTopic = {
  id: string;
  label: string;
  title: string;
  summary: string;
};

export type WeDailyShareData = {
  date: string;
  messageCount: number;
  overview: string | null;
  speakerCount: number;
  topics: WeDailyShareTopic[];
};

export function buildWeDailyShareTopics(parsed: ParsedWeDailyMarkdown): WeDailyShareTopic[] {
  return [
    ...parsed.highlights.map((item) => ({
      id: `highlight-${item.index}`,
      label: "今日要点",
      title: item.title,
      summary: item.summary,
    })),
    ...parsed.discussions.map((item) => ({
      id: `discussion-${item.index}`,
      label: "重点讨论",
      title: item.title,
      summary: item.conclusion,
    })),
    ...parsed.resources.map((item) => ({
      id: `resource-${item.index}`,
      label: "干货资源",
      title: item.title,
      summary: item.body.replace(/https?:\/\/\S+/g, "").trim(),
    })),
  ].filter((item) => item.title && item.summary);
}
