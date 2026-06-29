import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  ListFilter,
  Lock,
  PencilLine,
  RadioTower,
  Sparkles,
} from "lucide-react";

import {
  aiHotCategories,
  aiNewsSourceRoadmap,
  formatAiNewsDate,
  formatAiNewsDateTime,
  getAiHotCategoryLabel,
  getAiHotCategoryShortLabel,
  getAiHotDailyReport,
  getAiHotFeed,
  isAiHotCategory,
  type AiHotCategory,
  type AiHotDailyItem,
  type AiHotDailyReport,
  type AiHotFeedCategory,
  type AiHotMode,
  type AiNewsItem,
} from "@/lib/aihot";
import { hasSupabaseEnv } from "@/lib/env";
import { getAdminContextResult } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import {
  getWeDailyReports,
  type WeDailyDiscussion,
  type WeDailyHighlight,
  type WeDailyReport,
  type WeDailyResource,
} from "@/lib/wedaily";

import { DailyReportExportButton } from "./daily-report-export-button";
import { GroupDailyReportExportButton } from "./group-daily-report-export-button";
import styles from "./ai-news-page.module.css";

export const metadata: Metadata = {
  title: "AI 资讯",
  description: "浏览常州 AI Club 汇总的 AI 资讯流、AI 日报与本地 AI 实践线索。",
};

export const revalidate = 300;

const dailyReportUrl = "https://changzhouai.club/news?view=daily";

type AiNewsSearchParams = {
  category?: string;
  date?: string;
  mode?: string;
  view?: string;
};

type AiNewsView = "feed" | "daily" | "local";

const categoryToneClassNames: Record<AiHotCategory, string> = {
  "ai-models": styles.categoryToneGreen,
  "ai-products": styles.categoryToneOrange,
  industry: styles.categoryToneBlue,
  paper: styles.categoryToneViolet,
  tip: styles.categoryToneGold,
};

const dailySectionEnglishLabels: Record<string, string> = {
  "模型发布/更新": "Model Releases",
  "产品发布/更新": "Product",
  行业动态: "Industry",
  论文研究: "Research",
  技巧与观点: "Tips & Takes",
};

function normalizeMode(value?: string): AiHotMode {
  return value === "all" ? "all" : "selected";
}

function normalizeView(value?: string): AiNewsView {
  if (value === "daily" || value === "local") {
    return value;
  }

  return "feed";
}

function normalizeCategory(value?: string): AiHotFeedCategory {
  return isAiHotCategory(value) ? value : "all";
}

function buildFeedHref(
  current: {
    category: AiHotFeedCategory;
    mode: AiHotMode;
    view: AiNewsView;
  },
  updates: Partial<{
    category: AiHotFeedCategory;
    mode: AiHotMode;
    view: AiNewsView;
  }>,
) {
  const next = {
    ...current,
    ...updates,
  };
  const params = new URLSearchParams();

  if (next.view !== "feed") {
    params.set("view", next.view);
    return `/news?${params.toString()}`;
  }

  if (next.mode !== "selected") {
    params.set("mode", next.mode);
  }

  if (next.category !== "all") {
    params.set("category", next.category);
  }

  const query = params.toString();

  return query ? `/news?${query}` : "/news";
}

function countDailyItems(sections: Array<{ items: unknown[] }>) {
  return sections.reduce((count, section) => count + section.items.length, 0);
}

function countDailySources(report: AiHotDailyReport) {
  const sources = new Set<string>();

  for (const section of report.sections) {
    for (const item of section.items) {
      sources.add(item.sourceName);
    }
  }

  return sources.size;
}

function formatDailyVolume(value?: string | null) {
  return value?.replaceAll("-", ".") ?? "LATEST";
}

function formatDailyFullDate(value?: string | null) {
  if (!value) {
    return "日期待确认";
  }

  const date = new Date(`${value}T00:00:00+08:00`);

  if (Number.isNaN(date.getTime())) {
    return "日期待确认";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function getDailySectionEnglishLabel(label: string) {
  return dailySectionEnglishLabels[label] ?? "Daily Brief";
}

function formatWeDailyGeneratedAt(value?: string | null) {
  if (!value) {
    return "生成时间待确认";
  }

  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}+08:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildLocalReportHref(date: string) {
  const params = new URLSearchParams({
    date,
    view: "local",
  });

  return `/news?${params.toString()}`;
}

function buildLocalViewNextPath(date?: string) {
  const params = new URLSearchParams({
    view: "local",
  });

  if (date) {
    params.set("date", date);
  }

  return `/news?${params.toString()}`;
}

function formatCompactNumber(value?: number) {
  return typeof value === "number" ? value.toLocaleString("zh-CN") : "0";
}

async function getLocalViewerUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function getLocalViewerCanEditReports() {
  if (!hasSupabaseEnv()) {
    return false;
  }

  const context = await getAdminContextResult("updates.publish");

  return context.isAuthorized;
}

function FeedItem({ item, index }: { item: AiNewsItem; index: number }) {
  return (
    <article className={styles.feedItem}>
      <div className={styles.feedItemRail}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <i aria-hidden="true" />
      </div>

      <div className={styles.feedItemBody}>
        <div className={styles.feedItemMeta}>
          <time dateTime={item.publishedAt ?? undefined}>{formatAiNewsDateTime(item.publishedAt)}</time>
          <span>{item.sourceName}</span>
          <span className={`${styles.categoryPill} ${item.category ? categoryToneClassNames[item.category] : ""}`}>
            {getAiHotCategoryShortLabel(item.category)}
          </span>
        </div>

        <h2>
          <Link href={item.href} target="_blank" rel="noreferrer" aria-label={`打开原文：${item.title}`}>
            {item.title}
          </Link>
        </h2>
        {item.summary ? <p className={styles.feedSummary}>{item.summary}</p> : null}

        {item.recommendationReason ? (
          <div className={styles.recommendReason}>
            <strong>推荐理由</strong>
            <p>{item.recommendationReason}</p>
          </div>
        ) : null}

        <div className={styles.feedItemFooter}>
          <span>AI HOT</span>
          <Link href={item.href} target="_blank" rel="noreferrer" aria-label={`打开原文：${item.title}`}>
            原文
            <ExternalLink aria-hidden="true" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function SmallNewsLink({ item, index }: { item: AiNewsItem; index: number }) {
  return (
    <Link
      className={styles.smallNewsLink}
      href={item.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`打开今日必看：${item.title}`}
    >
      <span>{String(index + 1).padStart(2, "0")}</span>
      <strong>{item.title}</strong>
      <small>{formatAiNewsDateTime(item.publishedAt)}</small>
    </Link>
  );
}

function SourceRoadmapList() {
  return (
    <div className={styles.sourceList}>
      {aiNewsSourceRoadmap.map((source) => (
        <article key={source.id}>
          <strong>{source.label}</strong>
          <p>{source.description}</p>
        </article>
      ))}
    </div>
  );
}

function DailyDigestItem({ item }: { item: AiHotDailyItem }) {
  return (
    <article className={styles.dailyDigestItem}>
      <Link href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`打开日报原文：${item.title}`}>
        {item.title}
        <ExternalLink aria-hidden="true" strokeWidth={1.8} />
      </Link>
      <span>{item.sourceName}</span>
      {item.summary ? <p>{item.summary}</p> : null}
    </article>
  );
}

function DailyReportView({
  dailyItemCount,
  report,
}: {
  dailyItemCount: number;
  report: AiHotDailyReport | null;
}) {
  if (!report) {
    return (
      <section className={styles.dailyEmpty}>
        <span>AI HOT DAILY</span>
        <h2>AI 日报暂时不可用</h2>
        <p>可以先查看精选或全部动态，稍后再回来刷新日报内容。</p>
        <Link href="/news" prefetch={false}>查看精选资讯</Link>
      </section>
    );
  }

  const sourceCount = countDailySources(report);

  return (
    <section className={styles.dailyReportView} aria-labelledby="daily-report-title">
      <header className={styles.dailyHero}>
        <div className={styles.dailyHeroTop}>
          <span>VOL.{formatDailyVolume(report.date)} · {dailyItemCount} STORIES · AI HOT DAILY</span>
          <DailyReportExportButton
            dailyItemCount={dailyItemCount}
            fullDate={formatDailyFullDate(report.date)}
            pageUrl={dailyReportUrl}
            report={report}
            sourceCount={sourceCount}
            volume={formatDailyVolume(report.date)}
          />
        </div>
        <h2 id="daily-report-title">AI 日报</h2>
        <p>{formatDailyFullDate(report.date)} DAILY · 每早八时</p>
        {report.lead?.leadParagraph ? <strong>{report.lead.leadParagraph}</strong> : null}
        <div className={styles.dailyHeroStats} aria-label="日报统计">
          <span>
            <strong>{dailyItemCount}</strong>
            今日事件
          </span>
          <span>
            <strong>{report.flashes?.length ?? 0}</strong>
            一手报道
          </span>
          <span>
            <strong>{sourceCount}</strong>
            信源
          </span>
        </div>
      </header>

      <div className={styles.dailyDigestLayout}>
        <aside className={styles.dailyToc} aria-label="日报目录">
          <span>本期目录</span>
          <div className={styles.dailyTocLinks}>
            {report.sections.map((section, index) => (
              <Link href={`#daily-section-${index + 1}`} prefetch={false} key={section.label}>
                <strong>{String(index + 1).padStart(2, "0")} {section.label}</strong>
                <small>{section.items.length} 篇</small>
              </Link>
            ))}
          </div>
        </aside>

        <div className={styles.dailyDigestSections}>
          {report.sections.map((section, index) => (
            <section className={styles.dailyDigestSection} id={`daily-section-${index + 1}`} key={section.label}>
              <header className={styles.dailyDigestSectionHeader}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{section.label}</h3>
                  <p>{getDailySectionEnglishLabel(section.label)}</p>
                </div>
                <strong>{section.items.length} 篇</strong>
              </header>

              <div className={styles.dailyDigestItems}>
                {section.items.map((item) => (
                  <DailyDigestItem item={item} key={`${item.sourceUrl}-${item.title}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function GroupHighlightCard({ highlight }: { highlight: WeDailyHighlight }) {
  return (
    <article className={styles.groupHighlightCard}>
      <div className={styles.groupCardMeta}>
        <span>{String(highlight.index).padStart(2, "0")}</span>
        {highlight.timeRange ? <time>{highlight.timeRange}</time> : null}
      </div>
      <h3>{highlight.title}</h3>
      {highlight.summary ? <p>{highlight.summary}</p> : null}
      {highlight.participants.length > 0 ? (
        <div className={styles.groupPeopleList}>
          {highlight.participants.slice(0, 4).map((person) => (
            <span key={person}>{person}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function GroupDiscussionCard({ discussion }: { discussion: WeDailyDiscussion }) {
  return (
    <article className={styles.groupDiscussionCard}>
      <span>TOPIC {String(discussion.index).padStart(2, "0")}</span>
      <h3>
        {discussion.title}
        {discussion.timeRange ? <small>{discussion.timeRange}</small> : null}
      </h3>
      <p>{discussion.conclusion}</p>
      {discussion.people.length > 0 ? (
        <div className={styles.groupPeopleList}>
          {discussion.people.slice(0, 5).map((person) => (
            <span key={person}>{person}</span>
          ))}
        </div>
      ) : null}
      {discussion.quote ? <blockquote>{discussion.quote}</blockquote> : null}
    </article>
  );
}

function GroupResourceCard({ resource }: { resource: WeDailyResource }) {
  return (
    <article className={styles.groupResourceCard}>
      <span>{String(resource.index).padStart(2, "0")}</span>
      <div>
        <h3>{resource.title}</h3>
        <p>{resource.body}</p>
        {resource.url ? (
          <Link href={resource.url} target="_blank" rel="noreferrer">
            打开链接
            <ArrowUpRight aria-hidden="true" strokeWidth={1.8} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function GroupReportLockedSection({
  activeDate,
  highlightCount,
}: {
  activeDate?: string;
  highlightCount: number;
}) {
  const loginHref = `/login?next=${encodeURIComponent(buildLocalViewNextPath(activeDate))}`;

  return (
    <section className={`${styles.groupPosterSection} ${styles.groupLockedSection}`}>
      <span>TODAY HIGHLIGHTS</span>
      <h3>今日要点 · {highlightCount} 个话题</h3>
      <div className={styles.groupLockedPanel}>
        <div className={styles.groupLockedIcon} aria-hidden="true">
          <Lock strokeWidth={1.9} />
        </div>
        <div>
          <strong>为保护隐私，登录后可查看完整群聊日报</strong>
        </div>
        <Link href={loginHref} prefetch={false}>登录查看</Link>
      </div>
    </section>
  );
}

function LocalGroupDailyView({
  activeDate,
  canEditReport,
  canViewFullReport,
  error,
  report,
  reports,
}: {
  activeDate?: string;
  canEditReport: boolean;
  canViewFullReport: boolean;
  error: string | null;
  report: WeDailyReport | null;
  reports: WeDailyReport[];
}) {
  if (!report) {
    return (
      <section className={styles.dailyEmpty}>
        <span>LOCAL DIGEST</span>
        <h2>群聊日报暂时不可用</h2>
        <p>{error ? "接口暂时无法加载，可以稍后刷新重试。" : "还没有可展示的群聊日报。"}</p>
        <Link href="/news" prefetch={false}>查看 AI 资讯</Link>
      </section>
    );
  }

  const stats = report.stats;

  return (
    <section className={styles.groupDailyView} aria-labelledby="group-daily-title">
      <aside className={styles.groupReportNav} aria-label="最近群聊日报">
        <div className={styles.sideCardTitle}>
          <span>Archive</span>
          <h2>最近日报</h2>
        </div>
        <div className={styles.groupReportLinks}>
          {reports.map((item) => (
            <Link
              className={item.date === (activeDate ?? report.date) ? styles.groupReportLinkActive : ""}
              href={buildLocalReportHref(item.date)}
              prefetch={false}
              key={item.id}
              aria-current={item.date === (activeDate ?? report.date) ? "page" : undefined}
            >
              <strong>{formatAiNewsDate(item.date)}</strong>
              <small>{formatCompactNumber(item.stats?.message_count)} 条消息</small>
            </Link>
          ))}
        </div>
      </aside>

      <article className={styles.groupReportPoster}>
        <header className={styles.groupPosterHeader}>
          <div className={styles.groupPosterHeaderTop}>
            <div className={styles.groupPosterEyebrow}>
              <span>群聊手记 · {report.date}</span>
              <strong>AI</strong>
            </div>
            {canViewFullReport ? (
              <div className={styles.groupPosterHeaderActions}>
                {canEditReport ? (
                  <Link
                    className={styles.dailyExportButton}
                    href={`/admin/reports?reportId=${encodeURIComponent(String(report.id))}`}
                    prefetch={false}
                  >
                    <PencilLine aria-hidden="true" strokeWidth={1.9} />
                    <span>编辑日报</span>
                  </Link>
                ) : null}
                <GroupDailyReportExportButton report={report} />
              </div>
            ) : null}
          </div>
          <h2 id="group-daily-title">{report.parsed.title}</h2>
          <p>
            {report.chat} · {formatWeDailyGeneratedAt(report.created_at)} · {report.generated_by ?? "WeDaily"} · 工具原作者：小淳
          </p>
        </header>

        <div className={styles.groupStatGrid} aria-label="群聊日报统计">
          <span>
            <strong>{formatCompactNumber(stats?.message_count)}</strong>
            今日消息
          </span>
          <span>
            <strong>{formatCompactNumber(stats?.speaker_count)}</strong>
            参与成员
          </span>
          <span>
            <strong>{report.parsed.highlights.length}</strong>
            话题要点
          </span>
          <span>
            <strong>{report.parsed.resources.length}</strong>
            干货机会
          </span>
        </div>

        {canViewFullReport ? (
          <>
            {report.parsed.quote ? <blockquote className={styles.groupPosterQuote}>{report.parsed.quote}</blockquote> : null}

            {report.parsed.overview ? (
              <section className={styles.groupPosterSection}>
                <span>ONE-LINE BRIEF</span>
                <h3>一句话概览</h3>
                <p className={styles.groupOverview}>{report.parsed.overview}</p>
              </section>
            ) : null}

            {report.parsed.highlights.length > 0 ? (
              <section className={styles.groupPosterSection}>
                <span>TODAY HIGHLIGHTS</span>
                <h3>今日要点 · {report.parsed.highlights.length} 个话题</h3>
                <div className={styles.groupHighlightGrid}>
                  {report.parsed.highlights.map((highlight) => (
                    <GroupHighlightCard highlight={highlight} key={highlight.index} />
                  ))}
                </div>
              </section>
            ) : null}

            {report.parsed.discussions.length > 0 ? (
              <section className={styles.groupPosterSection}>
                <span>KEY DISCUSSIONS</span>
                <h3>重点讨论</h3>
                <div className={styles.groupDiscussionList}>
                  {report.parsed.discussions.map((discussion) => (
                    <GroupDiscussionCard discussion={discussion} key={discussion.index} />
                  ))}
                </div>
              </section>
            ) : null}

            {report.parsed.resources.length > 0 ? (
              <section className={styles.groupPosterSection}>
                <span>RESOURCES & ACTIONS</span>
                <h3>干货 / 行动 / 机会</h3>
                <div className={styles.groupResourceList}>
                  {report.parsed.resources.map((resource) => (
                    <GroupResourceCard resource={resource} key={resource.index} />
                  ))}
                </div>
              </section>
            ) : null}

            {report.parsed.vibe ? (
              <section className={styles.groupPosterSection}>
                <span>TODAY'S VIBE</span>
                <h3>高光时刻 / 群氛围</h3>
                <p className={styles.groupVibe}>{report.parsed.vibe}</p>
              </section>
            ) : null}

            {report.parsed.tags.length > 0 ? (
              <section className={styles.groupPosterSection}>
                <span>DAILY NOTES</span>
                <h3>标签</h3>
                <div className={styles.groupTagList}>
                  {report.parsed.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <GroupReportLockedSection
            activeDate={activeDate}
            highlightCount={report.parsed.highlights.length}
          />
        )}
      </article>
    </section>
  );
}

export default async function AiNewsPage({
  searchParams,
}: {
  searchParams: Promise<AiNewsSearchParams>;
}) {
  const params = await searchParams;
  const view = normalizeView(params.view);
  const mode = normalizeMode(params.mode);
  const category = normalizeCategory(params.category);
  const isDailyView = view === "daily";
  const isLocalView = view === "local";
  const localViewerUser = isLocalView ? await getLocalViewerUser() : null;
  const localViewerCanEditReports = isLocalView ? await getLocalViewerCanEditReports() : false;

  const currentQuery = { category, mode, view };
  const [feed, daily, groupDaily] = await Promise.all([
    isDailyView || isLocalView
      ? Promise.resolve(null)
      : getAiHotFeed({
          category,
          mode,
          take: mode === "all" ? 60 : 42,
        }),
    getAiHotDailyReport(),
    isLocalView ? getWeDailyReports({ limit: 20 }) : Promise.resolve({ error: null, reports: [] }),
  ]);
  const visibleItems = feed?.items ?? [];
  const leadItems = visibleItems.slice(0, 5);
  const dailyReport = daily.dailyReport;
  const dailyItemCount = dailyReport ? countDailyItems(dailyReport.sections) : 0;
  const groupReports = groupDaily.reports;
  const activeGroupReport = groupReports.find((report) => report.date === params.date) ?? groupReports[0] ?? null;
  const groupHighlightCount = activeGroupReport?.parsed.highlights.length ?? 0;
  const headerItemLabel = isLocalView ? "群聊要点" : isDailyView ? "日报条目" : "资讯条目";
  const headerItemCount = isLocalView ? groupHighlightCount : isDailyView ? dailyItemCount : visibleItems.length;
  const hasLoadError = Boolean(feed?.error || daily.error || (isLocalView && groupDaily.error));
  const activeModeLabel = isLocalView ? "群聊日报" : isDailyView ? "AI 日报" : mode === "all" ? "全部动态" : "精选";
  const activeCategoryLabel = category === "all" ? "全部分类" : getAiHotCategoryLabel(category);
  const subtitle = isLocalView
    ? activeGroupReport
      ? `${formatAiNewsDate(activeGroupReport.date)} · ${groupHighlightCount} 个要点`
      : "群聊日报"
    : isDailyView
    ? `${formatDailyVolume(dailyReport?.date)} · ${dailyItemCount} 条`
    : `${activeModeLabel} · ${activeCategoryLabel}`;

  return (
    <div className={styles.aiNewsShell}>
      <section className={styles.feedHeader} aria-labelledby="ai-news-title">
        <div>
          <p className="home-kicker">AI News · 资讯流</p>
          <h1 id="ai-news-title">AI 资讯</h1>
          <p>聚合值得关注的 AI 动态、产品发布、行业变化和社区相关机会。</p>
        </div>

        <aside className={styles.headerStatus} aria-label="当前资讯状态">
          <div>
            <RadioTower aria-hidden="true" strokeWidth={1.8} />
            <span>当前来源</span>
            <strong>{isLocalView ? "WeDaily" : "AI HOT"}</strong>
          </div>
          <div>
            <Sparkles aria-hidden="true" strokeWidth={1.8} />
            <span>{headerItemLabel}</span>
            <strong>{headerItemCount} 条</strong>
          </div>
          <div>
            <CalendarDays aria-hidden="true" strokeWidth={1.8} />
            <span>{isLocalView ? "群聊日报" : "AI 日报"}</span>
            <strong>
              {isLocalView
                ? activeGroupReport
                  ? formatAiNewsDate(activeGroupReport.date)
                  : "整理中"
                : dailyReport
                ? formatAiNewsDate(dailyReport.date)
                : "整理中"}
            </strong>
          </div>
        </aside>
      </section>

      <section className={styles.controlPanel} aria-label="AI 资讯筛选">
        <nav className={styles.modeTabs} aria-label="资讯类型">
          <Link
            className={!isDailyView && !isLocalView && mode === "selected" ? styles.modeTabActive : ""}
            href={buildFeedHref(currentQuery, { category: "all", mode: "selected", view: "feed" })}
            prefetch={false}
            aria-current={!isDailyView && !isLocalView && mode === "selected" ? "page" : undefined}
          >
            精选
          </Link>
          <Link
            className={!isDailyView && !isLocalView && mode === "all" ? styles.modeTabActive : ""}
            href={buildFeedHref(currentQuery, { category: "all", mode: "all", view: "feed" })}
            prefetch={false}
            aria-current={!isDailyView && !isLocalView && mode === "all" ? "page" : undefined}
          >
            全部动态
          </Link>
          <Link
            className={isDailyView ? styles.modeTabActive : ""}
            href={buildFeedHref(currentQuery, { view: "daily" })}
            prefetch={false}
            aria-current={isDailyView ? "page" : undefined}
          >
            AI 日报
          </Link>
          <Link
            className={isLocalView ? styles.modeTabActive : ""}
            href={buildFeedHref(currentQuery, { view: "local" })}
            prefetch={false}
            aria-current={isLocalView ? "page" : undefined}
          >
            群聊日报
          </Link>
        </nav>

        {!isDailyView && !isLocalView ? (
          <div className={styles.filterGroups}>
            <div className={styles.filterGroup}>
              <span>
                <ListFilter aria-hidden="true" strokeWidth={1.8} />
                分类
              </span>
              <div>
                <Link
                  className={category === "all" ? styles.filterChipActive : ""}
                  href={buildFeedHref(currentQuery, { category: "all" })}
                  prefetch={false}
                  aria-current={category === "all" ? "page" : undefined}
                >
                  全部
                </Link>
                {aiHotCategories.map((item) => (
                  <Link
                    className={category === item.id ? styles.filterChipActive : ""}
                    href={buildFeedHref(currentQuery, { category: item.id })}
                    prefetch={false}
                    aria-current={category === item.id ? "page" : undefined}
                    key={item.id}
                  >
                    {item.shortLabel}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {hasLoadError ? (
        <div className={styles.loadNotice}>部分内容暂时无法加载。已返回的资讯会继续展示，稍后可刷新重试。</div>
      ) : null}

      {isLocalView ? (
        <LocalGroupDailyView
          activeDate={params.date}
          canEditReport={localViewerCanEditReports}
          canViewFullReport={Boolean(localViewerUser)}
          error={groupDaily.error}
          report={activeGroupReport}
          reports={groupReports}
        />
      ) : isDailyView ? (
        <>
          <DailyReportView dailyItemCount={dailyItemCount} report={dailyReport} />

          <section className={styles.futureSourcesBand} id="future-sources">
            <div className={styles.sideCardTitle}>
              <span>Sources</span>
              <h2>更多线索</h2>
            </div>
            <SourceRoadmapList />
          </section>
        </>
      ) : (
        <>
          <div className={styles.contentLayout}>
            <main className={styles.feedColumn}>
              <div className={styles.feedSummaryBar}>
                <div>
                  <span>{activeModeLabel}</span>
                  <h2>{subtitle}</h2>
                </div>
              </div>

              {visibleItems.length > 0 ? (
                <div className={styles.feedList}>
                  {visibleItems.map((item, index) => (
                    <FeedItem item={item} index={index} key={item.id} />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <strong>当前筛选下没有资讯</strong>
                  <p>可以切回精选或调整分类重新查看。</p>
                  <Link href="/news" prefetch={false}>回到默认资讯流</Link>
                </div>
              )}
            </main>

            <aside className={styles.sideRail}>
              <section className={styles.sideCard}>
                <div className={styles.sideCardTitle}>
                  <span>Today</span>
                  <h2>今日必看</h2>
                </div>
                <div className={styles.smallNewsList}>
                  {leadItems.length > 0 ? (
                    leadItems.map((item, index) => <SmallNewsLink item={item} index={index} key={item.id} />)
                  ) : (
                    <p className={styles.sideMuted}>正在整理今日内容。</p>
                  )}
                </div>
              </section>

              <section className={styles.sideCard} id="daily-report">
                <div className={styles.sideCardTitle}>
                  <span>Daily</span>
                  <h2>{dailyReport ? `日报 · ${formatAiNewsDate(dailyReport.date)}` : "AI 日报"}</h2>
                </div>
                {dailyReport ? (
                  <>
                    <div className={styles.dailyMeta}>
                      <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                      <span>生成于 {formatAiNewsDateTime(dailyReport.generatedAt)}</span>
                    </div>
                    <p className={styles.sideMuted}>
                      {dailyReport.lead?.leadParagraph ?? `共 ${dailyItemCount} 条，按主题整理成日报。`}
                    </p>
                    <div className={styles.dailySectionList}>
                      {dailyReport.sections.map((section, index) => (
                        <span key={section.label}>
                          {String(index + 1).padStart(2, "0")} {section.label} · {section.items.length}
                        </span>
                      ))}
                    </div>
                    <Link
                      className={styles.sideActionLink}
                      href={buildFeedHref(currentQuery, { view: "daily" })}
                      prefetch={false}
                    >
                      阅读完整日报
                      <ArrowUpRight aria-hidden="true" strokeWidth={1.8} />
                    </Link>
                  </>
                ) : (
                  <p className={styles.sideMuted}>日报暂时不可用，先查看实时资讯流。</p>
                )}
              </section>

              <section className={styles.sideCard} id="future-sources">
                <div className={styles.sideCardTitle}>
                  <span>Sources</span>
                  <h2>更多线索</h2>
                </div>
                <SourceRoadmapList />
              </section>

              <section className={styles.sideCard}>
                <div className={styles.sideCardTitle}>
                  <span>Source</span>
                  <h2>数据来源</h2>
                </div>
                <p className={styles.sideMuted}>内容来自公开资讯源与社区整理，原文链接会保留在每条资讯中。</p>
                <Link className={styles.sourceLink} href="https://aihot.virxact.com" target="_blank" rel="noreferrer">
                  访问 AI HOT
                  <ArrowUpRight aria-hidden="true" strokeWidth={1.8} />
                </Link>
              </section>
            </aside>
          </div>

          <section className={styles.dailyMobilePanel} aria-label="日报摘要">
            <div className={styles.sideCardTitle}>
              <span>Daily</span>
              <h2>{dailyReport ? `AI 日报 · ${formatAiNewsDate(dailyReport.date)}` : "AI 日报"}</h2>
            </div>
            {dailyReport ? (
              <>
                <div className={styles.mobileDailyGrid}>
                  {dailyReport.sections.slice(0, 5).map((section, index) => (
                    <article key={section.label}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{section.label}</strong>
                      <small>{section.items.length} 条</small>
                    </article>
                  ))}
                </div>
                <Link
                  className={styles.sideActionLink}
                  href={buildFeedHref(currentQuery, { view: "daily" })}
                  prefetch={false}
                >
                  阅读完整日报
                  <ArrowUpRight aria-hidden="true" strokeWidth={1.8} />
                </Link>
              </>
            ) : (
              <p className={styles.sideMuted}>日报暂时不可用，先查看实时资讯流。</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
