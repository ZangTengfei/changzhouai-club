import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

import { ExternalCaseCard, MemberWorkCard } from "@/components/member-work-card";
import { ToneBadge } from "@/components/tone-badge";
import {
  externalCaseCardTypeLabels,
  getPublicWorksDirectory,
  remoteCaseLibraryUrl,
  workTypeLabels,
} from "@/lib/community-works";
import { cn } from "@/lib/utils";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "案例库",
  description: "查看常州 AI Club 成员公开展示的 AI 产品、工具、OPC 揭榜挂帅项目和场景实践案例。",
  path: "/works",
});

type WorksPageSearchParams = {
  type?: string;
  tag?: string;
};

type WorksPageProps = {
  searchParams: Promise<WorksPageSearchParams>;
};

const allWorkTypeLabels = {
  ...workTypeLabels,
  ...externalCaseCardTypeLabels,
};
type WorksFilterType = keyof typeof allWorkTypeLabels;

const filterLinkClassName =
  "inline-flex min-h-7 flex-[0_0_auto] items-center rounded-full border border-site-border-subtle bg-[rgba(255,252,247,0.8)] px-2.5 text-[0.8rem] font-[850] text-[rgba(var(--ink-rgb),0.72)] no-underline hover:border-[rgba(var(--accent-rgb),0.28)] hover:bg-[rgba(var(--accent-rgb),0.1)] hover:text-primary-strong focus-visible:border-[rgba(var(--accent-rgb),0.28)] focus-visible:bg-[rgba(var(--accent-rgb),0.1)] focus-visible:text-primary-strong";

const activeFilterLinkClassName =
  "border-[rgba(var(--accent-rgb),0.28)] bg-[rgba(var(--accent-rgb),0.1)] text-primary-strong";

function isWorksFilterType(value: string | undefined): value is WorksFilterType {
  return Boolean(value && value in allWorkTypeLabels);
}

function getWorksFilterHref(filter: WorksPageSearchParams) {
  const params = new URLSearchParams();

  if (filter.type) {
    params.set("type", filter.type);
  }

  if (filter.tag) {
    params.set("tag", filter.tag);
  }

  const query = params.toString();

  return query ? `/works?${query}#works-directory` : "/works#works-directory";
}

function getKnownTypes(
  directory: Awaited<ReturnType<typeof getPublicWorksDirectory>>,
) {
  const typeKeys = new Set<string>();

  directory.externalCards.forEach((card) => typeKeys.add(card.type));
  directory.works.forEach((work) => typeKeys.add(work.type));

  return Object.entries(allWorkTypeLabels).filter(([type]) => typeKeys.has(type));
}

export default async function WorksPage({ searchParams }: WorksPageProps) {
  const params = await searchParams;
  const directory = await getPublicWorksDirectory();
  const selectedType = isWorksFilterType(params.type) ? params.type : "";
  const selectedTag = (params.tag ?? "").trim();
  const filteredExternalCards = directory.externalCards.filter((card) => {
    const matchesType = !selectedType || card.type === selectedType;
    const matchesTag = !selectedTag || card.tags.includes(selectedTag);

    return matchesType && matchesTag;
  });
  const filteredWorks = directory.works.filter((work) => {
    const matchesType = !selectedType || work.type === selectedType;
    const matchesTag = !selectedTag || work.tags.includes(selectedTag);

    return matchesType && matchesTag;
  });
  const hasActiveFilters = Boolean(selectedType || selectedTag);
  const knownTypes = getKnownTypes(directory);
  const filteredCount = filteredExternalCards.length + filteredWorks.length;

  return (
    <div className="grid gap-4 max-sm:gap-3.5">
      <section className="grid pt-2 max-sm:gap-3 max-sm:pt-0" aria-labelledby="works-hero-title">
        <div className="grid min-w-0 max-w-205 content-start gap-3">
          <p className="home-kicker">Cases · 案例库</p>
          <h1 className="m-0 max-w-195 text-[clamp(2.05rem,3.5vw,2.72rem)] leading-[1.08] font-black tracking-normal text-heading max-sm:text-[2.05rem]" id="works-hero-title">
            看见真实问题长出的
            <span className="block text-primary">AI 产品、工具和项目</span>
          </h1>
          <p className="m-0 max-w-184 text-[0.98rem] leading-[1.62] text-[rgba(var(--ink-rgb),0.72)]">
            收录社区成员和合作场景公开展示的 AI 实践：产品、开源库、Demo、服务案例和验证中的小工具。
          </p>

          <div className="flex flex-wrap items-center gap-2.5 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-0.5 max-sm:[overscroll-behavior-x:contain] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden max-sm:[&_.button]:min-h-9.5! max-sm:[&_.button]:w-auto! max-sm:[&_.button]:flex-[0_0_auto] max-sm:[&_.button]:whitespace-nowrap max-sm:[&_.button]:px-3.5! [&_svg]:size-4.5">
            <Link
              href="#works-directory"
              prefetch={false}
              className="button home-primary-button hidden! max-sm:inline-flex!"
            >
              浏览案例
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/account/works/new" prefetch={false} className="button home-ghost-button">
              <Plus aria-hidden="true" strokeWidth={2} />
              提交作品/案例
            </Link>
            <Link href="/members" prefetch={false} className="button home-ghost-button">
              找到创作者
            </Link>
            <a
              href={remoteCaseLibraryUrl}
              className="button home-ghost-button"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink aria-hidden="true" strokeWidth={2} />
              外部案例库
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-3" id="works-directory">
        <div
          className="grid min-w-0 gap-2.5 rounded-sm border-0 bg-white px-4 py-3.5 shadow-site-card max-sm:gap-2 max-sm:px-2.5 max-sm:py-2.25"
          aria-labelledby="works-directory-title"
        >
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1.75">
              <SlidersHorizontal aria-hidden="true" strokeWidth={1.8} />
              <h2 className="m-0 whitespace-nowrap text-[1.35rem] leading-[1.12] font-black tracking-normal text-heading max-sm:text-[1.16rem]" id="works-directory-title">公开案例</h2>
            </div>
            <p className="m-0 flex min-h-7.5 flex-[0_0_auto] items-center gap-1 whitespace-nowrap rounded-full border border-site-border-subtle bg-[rgba(255,252,247,0.78)] px-2.5 text-[0.8rem] font-[850] text-[rgba(var(--ink-rgb),0.58)] max-sm:min-h-7 max-sm:px-2.25">
              <strong className="text-[0.92rem] font-black text-heading">{filteredCount}</strong>
              <span>{hasActiveFilters ? "个匹配" : "个案例"}</span>
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-2.5 max-sm:grid">
            <div className="grid min-w-0 flex-[1_1_auto] gap-1.75">
              <div className="grid min-w-0 grid-cols-[38px_minmax(0,1fr)] items-center gap-2 max-sm:grid-cols-[32px_minmax(0,1fr)]">
                <span className="text-[0.76rem] font-black text-[rgba(var(--ink-rgb),0.5)]">类型</span>
                <div className="flex min-w-0 gap-1.75 overflow-x-auto pb-px [overscroll-behavior-x:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <Link
                    aria-current={!selectedType ? "true" : undefined}
                    className={cn(
                      filterLinkClassName,
                      !selectedType && activeFilterLinkClassName,
                    )}
                    href={getWorksFilterHref({
                      tag: selectedTag || undefined,
                    })}
                    prefetch={false}
                  >
                    全部
                  </Link>

                  {knownTypes.map(([type, label]) => (
                    <Link
                      aria-current={selectedType === type ? "true" : undefined}
                      className={cn(
                        filterLinkClassName,
                        selectedType === type && activeFilterLinkClassName,
                      )}
                      href={getWorksFilterHref({
                        type: selectedType === type ? undefined : type,
                        tag: selectedTag || undefined,
                      })}
                      prefetch={false}
                      key={type}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {directory.tags.length > 0 ? (
                <div className="grid min-w-0 grid-cols-[38px_minmax(0,1fr)] items-center gap-2 max-sm:grid-cols-[32px_minmax(0,1fr)]">
                  <span className="text-[0.76rem] font-black text-[rgba(var(--ink-rgb),0.5)]">标签</span>
                  <div className="flex min-w-0 gap-1.75 overflow-x-auto pb-px [overscroll-behavior-x:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <Link
                      aria-current={!selectedTag ? "true" : undefined}
                      className={cn(
                        filterLinkClassName,
                        !selectedTag && activeFilterLinkClassName,
                      )}
                      href={getWorksFilterHref({
                        type: selectedType || undefined,
                      })}
                      prefetch={false}
                    >
                      全部
                    </Link>

                    {directory.tags.map((tag) => (
                      <Link
                        aria-current={selectedTag === tag ? "true" : undefined}
                        className="inline-flex min-h-7 flex-[0_0_auto] items-center border-0 bg-transparent p-0 hover:bg-transparent focus-visible:bg-transparent [&[aria-current=true]>span]:saturate-[1.18] [&[aria-current=true]>span]:shadow-[0_0_0_2px_rgba(var(--accent-rgb),0.11)] hover:[&>span]:saturate-[1.18] hover:[&>span]:shadow-[0_0_0_2px_rgba(var(--accent-rgb),0.11)] focus-visible:[&>span]:saturate-[1.18] focus-visible:[&>span]:shadow-[0_0_0_2px_rgba(var(--accent-rgb),0.11)]"
                        href={getWorksFilterHref({
                          type: selectedType || undefined,
                          tag: selectedTag === tag ? undefined : tag,
                        })}
                        prefetch={false}
                        key={tag}
                      >
                        <ToneBadge className="min-h-7 px-2.5 py-0 text-[0.8rem] font-[850]" label={tag} />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 max-[1024px]:grid-cols-1 [&>div]:min-w-0">
          {filteredExternalCards.map((card) => (
            <ExternalCaseCard card={card} key={card.id} />
          ))}

          {filteredWorks.map((work) => (
            <div id={`work-${work.id}`} key={work.id}>
              <MemberWorkCard work={work} />
            </div>
          ))}
        </div>

        {filteredWorks.length === 0 && filteredExternalCards.length === 0 ? (
          <div className="grid justify-items-start gap-2.5 rounded-md border-0 bg-highlight-green p-6 leading-[1.62] text-copy-subtle shadow-none max-sm:p-4">
            {hasActiveFilters
              ? "没有匹配当前筛选条件的公开案例。"
              : "成员提交作品或案例并通过审核后，会继续补充到这里。"}
          </div>
        ) : null}
      </section>
    </div>
  );
}
