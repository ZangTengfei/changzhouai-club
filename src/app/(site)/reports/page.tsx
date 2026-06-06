import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CircleDollarSign,
  Code2,
  GraduationCap,
  Network,
  Presentation,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { PageHero } from "@/components/page-hero";

import styles from "./reports-page.module.css";

export const metadata: Metadata = {
  title: "研究与报告",
  description: "常州 AI Club 面向活动、课程和企业合作场景沉淀的公开研究与分析报告。",
};

const reports = [
  {
    title: "常州科教城 OPC 共创社区运营经费申请汇报",
    description:
      "网页形式的 16:9 汇报材料，说明社区在做什么、科教城能获得什么价值、为什么需要固定场地，以及 50 万启动 + 达标追加至 100 万年度运营包的使用计划。",
    href: "/reports/opc-community-funding",
    date: "2026-06-06",
    stats: [
      { label: "网页演示", value: "15页", icon: Presentation },
      { label: "启动经费", value: "50万", icon: WalletCards },
      { label: "场地需求", value: "固定", icon: Building2 },
    ],
  },
  {
    title: "常州 AI Club 培训需求调研",
    description:
      "基于 23 份回收问卷，梳理成员职业背景、AI 使用程度、学习痛点、内容偏好、培训形式与价格接受度。",
    href: "/reports/training-demand-survey",
    date: "2026-05-25",
    stats: [
      { label: "回收问卷", value: "23", icon: UsersRound },
      { label: "经常/深度使用 AI", value: "87%", icon: BarChart3 },
      { label: "关注 AI 变现", value: "65%", icon: CircleDollarSign },
    ],
  },
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
  {
    title: "2026 AI 编程现状及电信 OPC 套餐需求调研",
    description:
      "基于 16 份有效问卷，梳理开发者模型使用、Agent 工作流、Token 消耗痛点与电信 OPC / Coding Plan 套餐偏好。",
    href: "/reports/opc-package-survey",
    date: "2026-04-09",
    stats: [
      { label: "有效问卷", value: "16", icon: Code2 },
      { label: "需要统一结算", value: "94%", icon: WalletCards },
      { label: "上下文瓶颈", value: "63%", icon: Network },
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
