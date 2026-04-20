import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "关于我们",
  description: "了解常州 AI Club 的定位、初心和长期运营方向。",
};

export default function AboutPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="About"
        title="关于我们"
        description="这是一个立足常州、面向实践与共建的 AI 社区，希望把本地分散的人、项目和需求重新连接起来。"
      />

      <section className="two-up">
        <article className="card">
          <h3>为什么做这件事</h3>
          <p>
            常州本地已经有不少对 AI 感兴趣的人和真实需求，但大家往往散落在不同微信群、公司和行业里。我们想做的是把这些连接重新组织起来。
          </p>
        </article>
        <article className="card">
          <h3>我们希望长期形成什么</h3>
          <p>
            一个能持续办活动、持续沉淀分享、持续孵化项目，也能承接对外合作的本地 AI 组织网络。
          </p>
        </article>
      </section>
    </div>
  );
}
