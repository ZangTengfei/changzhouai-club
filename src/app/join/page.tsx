import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { joinSteps, memberTags } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "加入我们",
  description: "了解如何加入常州 AI 社区，参与线下活动、项目共建和长期协作。",
};

export default function JoinPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Join"
        title="加入常州 AI 社区"
        description="欢迎加入线下交流、项目共建与长期协作。你可以是学习者、参与者、分享者，也可以成为项目合作者。"
      >
        <div className="note-strip">
          当前版本先把表单结构预留出来，下一步建议接飞书、腾讯文档或站内 API。
        </div>
      </PageHero>

      <section className="three-up">
        {joinSteps.map((step, index) => (
          <article className="step-card" key={step}>
            <span>0{index + 1}</span>
            <h3>{step}</h3>
          </article>
        ))}
      </section>

      <section className="field-grid">
        <article className="field-panel">
          <h3>建议收集的基础信息</h3>
          <ul className="field-list">
            <li>昵称或姓名</li>
            <li>微信号</li>
            <li>所在城市</li>
            <li>当前身份 / 公司 / 学校</li>
            <li>每月可投入时间</li>
          </ul>
        </article>
        <article className="field-panel">
          <h3>建议收集的能力与兴趣</h3>
          <ul className="field-list">
            <li>技能方向</li>
            <li>感兴趣的 AI 主题</li>
            <li>是否愿意参加线下活动</li>
            <li>是否愿意分享</li>
            <li>是否愿意参与项目</li>
          </ul>
        </article>
      </section>

      <section className="card">
        <h3>社区常见关注方向</h3>
        <div className="tag-cloud">
          {memberTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
