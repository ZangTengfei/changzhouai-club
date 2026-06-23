import type { Metadata } from "next";
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

import styles from "./works-page.module.css";

export const metadata: Metadata = {
  title: "案例库",
  description: "查看常州 AI Club 成员公开展示的 AI 产品、工具、OPC 揭榜挂帅项目和场景实践案例。",
};

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
    <div className={styles.worksPageStack}>
      <section className={styles.worksHero} aria-labelledby="works-hero-title">
        <div className={styles.worksHeroCopy}>
          <p className="home-kicker">Cases · 案例库</p>
          <h1 id="works-hero-title">
            看见真实问题长出的
            <span>AI 产品、工具和项目</span>
          </h1>
          <p>
            收录社区成员和合作场景公开展示的 AI 实践：产品、开源库、Demo、服务案例和验证中的小工具。
          </p>

          <div className={styles.worksHeroActions}>
            <Link
              href="#works-directory"
              className={`${styles.worksHeroBrowseAction} button home-primary-button`}
            >
              浏览案例
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/account?submit=work#works" className="button home-ghost-button">
              <Plus aria-hidden="true" strokeWidth={2} />
              提交作品/案例
            </Link>
            <Link href="/members" className="button home-ghost-button">
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

      <section className={styles.worksDirectorySection} id="works-directory">
        <div
          className={styles.worksFilterPanel}
          aria-labelledby="works-directory-title"
        >
          <div className={styles.worksFilterHeader}>
            <div className={styles.worksFilterTitle}>
              <SlidersHorizontal aria-hidden="true" strokeWidth={1.8} />
              <h2 id="works-directory-title">公开案例</h2>
            </div>
            <p className={styles.worksFilterCount}>
              <strong>{filteredCount}</strong>
              <span>{hasActiveFilters ? "个匹配" : "个案例"}</span>
            </p>
          </div>

          <div className={styles.worksFilterBody}>
            <div className={styles.worksFilterRows}>
              <div className={styles.worksFilterRow}>
                <span className={styles.worksFilterLabel}>类型</span>
                <div className={styles.worksFilterScroller}>
                  <Link
                    aria-current={!selectedType ? "true" : undefined}
                    href={getWorksFilterHref({
                      tag: selectedTag || undefined,
                    })}
                  >
                    全部
                  </Link>

                  {knownTypes.map(([type, label]) => (
                    <Link
                      aria-current={selectedType === type ? "true" : undefined}
                      href={getWorksFilterHref({
                        type: selectedType === type ? undefined : type,
                        tag: selectedTag || undefined,
                      })}
                      key={type}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {directory.tags.length > 0 ? (
                <div className={styles.worksFilterRow}>
                  <span className={styles.worksFilterLabel}>标签</span>
                  <div className={styles.worksFilterScroller}>
                    <Link
                      aria-current={!selectedTag ? "true" : undefined}
                      className={styles.worksFilterTagAllLink}
                      href={getWorksFilterHref({
                        type: selectedType || undefined,
                      })}
                    >
                      全部
                    </Link>

                    {directory.tags.map((tag) => (
                      <Link
                        aria-current={selectedTag === tag ? "true" : undefined}
                        className={styles.worksFilterTagLink}
                        href={getWorksFilterHref({
                          type: selectedType || undefined,
                          tag: selectedTag === tag ? undefined : tag,
                        })}
                        key={tag}
                      >
                        <ToneBadge className={styles.worksFilterTagBadge} label={tag} />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.worksGrid}>
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
          <div className={styles.worksEmptyNote}>
            {hasActiveFilters
              ? "没有匹配当前筛选条件的公开案例。"
              : "成员提交作品或案例并通过审核后，会继续补充到这里。"}
          </div>
        ) : null}
      </section>
    </div>
  );
}
