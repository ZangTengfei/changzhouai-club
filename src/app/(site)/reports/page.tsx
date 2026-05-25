import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, GraduationCap, UsersRound } from "lucide-react";

import { PageHero } from "@/components/page-hero";

import styles from "./reports-page.module.css";

export const metadata: Metadata = {
  title: "研究与报告",
  description: "常州 AI Club 面向活动、课程和企业合作场景沉淀的公开研究与分析报告。",
};

const reports = [
  {
    title: "AI 办公通识课 · 课前调研分析",
    description:
      "基于 30 份有效问卷，梳理学员岗位分布、AI 使用深度、办公痛点、课程偏好与课程设计建议。",
    href: "/reports/ai-office-course-survey",
    date: "2026-05-25",
    stats: [
      { label: "有效问卷", value: "30", icon: UsersRound },
      { label: "岗位类型", value: "7", icon: BarChart3 },
      { label: "偏好 45-60 分钟", value: "67%", icon: GraduationCap },
    ],
  },
] as const;

export default function ReportsPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Reports"
        title="研究与报告"
        description="这里沉淀社区面向真实活动、企业培训和本地 AI 应用场景形成的公开分析，方便合作方、讲师和共建成员复用。"
      />

      <section className={styles.reportList} aria-label="公开报告列表">
        {reports.map((report) => (
          <article className={styles.reportCard} key={report.href}>
            <div className={styles.reportCardCopy}>
              <span>{report.date}</span>
              <h2>
                <Link href={report.href}>{report.title}</Link>
              </h2>
              <p>{report.description}</p>
            </div>

            <div className={styles.reportStats} aria-label={`${report.title} 数据摘要`}>
              {report.stats.map((item) => {
                const Icon = item.icon;

                return (
                  <div className={styles.reportStat} key={item.label}>
                    <Icon aria-hidden="true" strokeWidth={1.8} />
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            <Link href={report.href} className="button home-primary-button">
              查看报告
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
