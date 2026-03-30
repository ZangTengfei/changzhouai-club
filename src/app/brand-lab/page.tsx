import type { Metadata } from "next";

import {
  LogoDraftBuildEngine,
  LogoDraftCityAgent,
  LogoDraftCityNodes,
} from "@/components/logo-drafts";

export const metadata: Metadata = {
  title: "Logo 草案",
  description: "查看常州 AI 社区的 3 个 logo 草案方向。",
};

const logoDrafts = [
  {
    id: "city-nodes",
    eyebrow: "Direction 01",
    title: "城市节点",
    summary:
      "把常州 AI 社区看作一个正在形成的本地节点网络，核心是连接人、活动、项目和需求。",
    note: "推荐优先深化。它最贴合你现在“活动驱动 + 资源连接 + 需求承接”的阶段。",
    Mark: LogoDraftCityNodes,
  },
  {
    id: "build-engine",
    eyebrow: "Direction 02",
    title: "共建引擎",
    summary:
      "更强调执行和推进感，适合表达“不是聊天群，而是能推动分享、项目和合作落地的社区引擎”。",
    note: "如果你想更偏开发者社区、工程文化和行动导向，这个方向会更强。",
    Mark: LogoDraftBuildEngine,
  },
  {
    id: "city-agent",
    eyebrow: "Direction 03",
    title: "城市智能体",
    summary:
      "把城市、对话和智能感揉在一起，更像一个具有品牌辨识度的 AI 社区标识。",
    note: "更品牌化，也更抽象，适合第二阶段做完整视觉升级时继续深化。",
    Mark: LogoDraftCityAgent,
  },
];

export default function BrandLabPage() {
  return (
    <div className="page-stack">
      <section className="surface page-hero">
        <div className="section-heading">
          <p className="eyebrow">Brand Lab</p>
          <h1>Logo 三个方向草案</h1>
          <p>
            这页先不替换现有站点标识，而是把三个方向并排放出来，方便你直接判断哪条路径最值得继续精修。
          </p>
        </div>
      </section>

      <section className="logo-lab-grid">
        {logoDrafts.map(({ id, eyebrow, title, summary, note, Mark }) => (
          <article key={id} className="surface logo-draft-card">
            <div className="section-heading">
              <p className="eyebrow">{eyebrow}</p>
              <h2>{title}</h2>
              <p>{summary}</p>
            </div>

            <div className="logo-draft-preview">
              <div className="logo-draft-mark-shell">
                <Mark className="logo-draft-mark" />
              </div>

              <div className="logo-draft-meta">
                <div className="logo-draft-favicon">
                  <Mark className="logo-draft-favicon-mark" />
                </div>

                <div className="logo-draft-header-demo">
                  <div className="logo-draft-header-badge">
                    <Mark className="logo-draft-header-mark" />
                  </div>
                  <div className="logo-draft-header-copy">
                    <strong>常州 AI 开发者社区</strong>
                    <small>Changzhou AI Club</small>
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
