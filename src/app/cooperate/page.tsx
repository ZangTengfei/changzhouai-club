import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { cooperationAreas } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "合作联系",
  description: "欢迎企业、机构、园区与高校与常州 AI 社区进行分享、培训、PoC 和项目合作。",
};

export default function CooperatePage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Cooperate"
        title="合作联系"
        description="欢迎企业、机构、园区和高校与我们交流合作。这里会成为需求承接与合作沟通的统一入口。"
      >
        <div className="note-strip">
          合作页建议尽快补上真实联系人和联系渠道，这会直接影响线索转化效率。
        </div>
      </PageHero>

      <section className="two-up">
        <article className="card">
          <h3>可合作方向</h3>
          <div className="tag-cloud">
            {cooperationAreas.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
        <article className="field-panel">
          <h3>建议收集的合作信息</h3>
          <ul className="field-list">
            <li>公司 / 机构名称</li>
            <li>联系人与微信 / 手机号</li>
            <li>需求类型与场景简介</li>
            <li>预算范围与期望时间</li>
            <li>是否需要线下沟通</li>
          </ul>
        </article>
      </section>

      <section className="three-up">
        <article className="step-card">
          <span>01</span>
          <h3>需求沟通</h3>
          <p>先确认合作目标、行业背景、时间窗口和输出预期。</p>
        </article>
        <article className="step-card">
          <span>02</span>
          <h3>匹配人选</h3>
          <p>根据场景匹配社区成员、分享者或项目协作小组。</p>
        </article>
        <article className="step-card">
          <span>03</span>
          <h3>推进合作</h3>
          <p>根据合作形式进入分享、培训、PoC 或正式项目阶段。</p>
        </article>
      </section>
    </div>
  );
}
