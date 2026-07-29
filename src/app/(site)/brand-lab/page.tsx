import type { Metadata } from "next";

import {
  LogoDraftCAICMonogram,
  LogoDraftBuildEngine,
  LogoDraftCityAgent,
  LogoDraftCityNodes,
} from "@/components/logo-drafts";

export const metadata: Metadata = {
  title: "品牌视觉",
  description: "查看常州 AI Club 当前标识的设计方向与应用展示。",
};

const logoDrafts = [
  {
    id: "city-nodes",
    eyebrow: "Direction 01",
    title: "城市节点",
    summary:
      "把常州 AI Club 看作一个正在形成的本地节点网络，核心是连接人、活动、项目和需求。",
    note: "这一方向更强调社区连接和城市节点的关系，适合延展成图形化主标识。",
    Mark: LogoDraftCityNodes,
  },
  {
    id: "build-engine",
    eyebrow: "Direction 02",
    title: "共建引擎",
    summary:
      "更强调执行和推进感，适合表达“不是聊天群，而是能推动分享、项目和合作落地的社区引擎”。",
    note: "这一方向更适合强调开发者氛围、行动导向与持续推进的社区气质。",
    Mark: LogoDraftBuildEngine,
  },
  {
    id: "city-agent",
    eyebrow: "Direction 03",
    title: "城市智能体",
    summary:
      "把城市、对话和智能感揉在一起，更像一个具有品牌辨识度的 AI 社区标识。",
    note: "这一方向更偏品牌表达，适合在活动视觉、内容传播与延展设计中形成独特识别。",
    Mark: LogoDraftCityAgent,
  },
  {
    id: "caic-monogram",
    eyebrow: "Direction 04",
    title: "CAIC 字母组合",
    summary:
      "用更纯粹的 CAIC 字母组合表达 Changzhou AI Club，让缩写本身成为主要识别。",
    note: "当前站点标识已切换到这一方向，用更干净的字母结构测试缩写识别度和真实使用效果。",
    Mark: LogoDraftCAICMonogram,
  },
];

export default function BrandLabPage() {
  return (
    <div className="grid gap-6 max-sm:gap-5">
      <section className="surface page-hero">
        <div className="section-heading">
          <p className="eyebrow">Brand Lab</p>
          <h1>品牌视觉方向</h1>
          <p>
            这里展示社区标识的四个视觉方向，以及它们在站点图标、页眉和小尺寸场景中的呈现效果。
          </p>
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
        {logoDrafts.map(({ id, eyebrow, title, summary, note, Mark }) => (
          <article key={id} className="grid gap-5 rounded-lg bg-white p-6 shadow-site-card">
            <div className="section-heading">
              <p className="eyebrow">{eyebrow}</p>
              <h2>{title}</h2>
              <p>{summary}</p>
            </div>

            <div className="grid gap-4.5">
              <div className="grid min-h-60 place-items-center rounded-lg bg-[radial-gradient(circle_at_20%_20%,rgba(var(--accent-warm-rgb),0.16),transparent_30%),linear-gradient(180deg,rgba(var(--accent-rgb),0.96),rgba(var(--accent-strong-rgb),0.98))]">
                <Mark className="h-auto w-[min(72%,220px)]" />
              </div>

              <div className="grid gap-3.5">
                <div className="grid size-18 place-items-center rounded-md bg-primary">
                  <Mark className="size-11.5" />
                </div>

                <div className="flex min-w-0 items-center gap-3 rounded-full border border-border bg-muted/80 px-4 py-3.5">
                  <div className="grid size-11.5 flex-none place-items-center rounded-md bg-primary">
                    <Mark className="size-7.5" />
                  </div>
                  <div className="grid min-w-0 gap-0.5">
                    <strong className="text-[0.95rem]">常州 AI Club</strong>
                    <small className="text-[0.78rem] text-muted-foreground">
                      Changzhou AI Club
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="note-strip">{note}</div>
          </article>
        ))}
      </section>
    </div>
  );
}
