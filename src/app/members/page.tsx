import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { memberTags } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "成员地图",
  description: "展示常州 AI 社区的成员技能分布和参与方向。",
};

export default function MembersPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Members"
        title="成员地图"
        description="第一版更关注成员能力分布和参与方向，而不是做公开通讯录，让每个人先被看见、再被匹配。"
      >
        <div className="note-strip">
          这页后续很适合接成员提交表单，再自动汇总技能标签、角色分布和参与意愿。
        </div>
      </PageHero>

      <section className="card-grid">
        <article className="card">
          <h3>角色分布</h3>
          <p>开发者、产品、设计、运营、高校同学、创业团队和企业数字化岗位都可以在这里找到位置。</p>
        </article>
        <article className="card">
          <h3>公开策略</h3>
          <p>第一版建议只公开标签和方向，不公开个人联系方式，兼顾展示效果和成员隐私。</p>
        </article>
        <article className="card">
          <h3>后续可扩展</h3>
          <p>等成员数量和内容都稳定后，再考虑增加分享者名单、项目参与记录和专题小组页面。</p>
        </article>
      </section>

      <section className="tag-cloud">
        {memberTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </section>
    </div>
  );
}
