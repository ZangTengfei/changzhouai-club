import type { Metadata } from "next";

import { submitCooperationLead } from "@/app/cooperate/actions";
import { PageHero } from "@/components/page-hero";
import { cooperationAreas } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "合作联系",
  description: "欢迎企业、机构、园区与高校与常州 AI 社区进行分享、培训、PoC 和项目合作。",
};

type SearchParams = {
  submitted?: string;
  error?: string;
};

export default async function CooperatePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Cooperate"
        title="提交合作需求"
        description="欢迎企业、机构、园区和高校与我们交流合作。现在已经可以直接在站内提交需求，后台合作线索页会收到这条线索。"
      >
        <div className="note-strip">
          如果你希望组织主题分享、企业内训、PoC、项目交付或人才连接，都可以从这里统一提交。
        </div>
      </PageHero>

      {params.submitted ? (
        <div className="note-strip">
          提交成功，我们已经收到这条合作需求。后续会根据你填写的联系方式与你继续沟通。
        </div>
      ) : null}

      {params.error ? (
        <div className="note-strip">
          {params.error === "missing_required_fields"
            ? "请至少填写公司 / 机构名称和需求简介。"
            : params.error === "missing_contact_channel"
              ? "请至少留下微信号或手机号中的一种联系方式。"
              : "提交失败，请稍后再试。"}
        </div>
      ) : null}

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

      <section className="surface join-form-shell">
        <div className="section-heading">
          <p className="eyebrow">Lead Form</p>
          <h2>提交合作需求</h2>
          <p>先把场景、需求和联系方式写清楚，后面做线索跟进、成员匹配和项目推进会更顺。</p>
        </div>

        <form action={submitCooperationLead} className="join-form">
          <div className="form-grid">
            <label className="form-field">
              <span>公司 / 机构名称</span>
              <input className="input" name="company_name" placeholder="例如：某制造企业 / 园区 / 高校" required />
            </label>

            <label className="form-field">
              <span>联系人</span>
              <input className="input" name="contact_name" placeholder="怎么称呼你" />
            </label>

            <label className="form-field">
              <span>微信号</span>
              <input className="input" name="contact_wechat" placeholder="建议至少填写微信或手机号之一" />
            </label>

            <label className="form-field">
              <span>手机号</span>
              <input className="input" name="contact_phone" placeholder="建议至少填写微信或手机号之一" />
            </label>

            <label className="form-field">
              <span>需求类型</span>
              <input className="input" name="requirement_type" placeholder="分享 / 内训 / PoC / 项目开发 / 顾问支持" />
            </label>

            <label className="form-field">
              <span>预算范围</span>
              <input className="input" name="budget_range" placeholder="例如：5k-20k / 待评估 / 先沟通" />
            </label>

            <label className="form-field form-field-wide">
              <span>期望时间</span>
              <input
                className="input"
                name="desired_timeline"
                placeholder="例如：4 月中旬安排沟通，5 月启动试点"
              />
            </label>

            <label className="form-field form-field-wide">
              <span>需求简介</span>
              <textarea
                className="input textarea"
                name="requirement_summary"
                rows={5}
                placeholder="请尽量写清楚业务场景、希望解决的问题、预期结果，以及是否需要线下沟通。"
                required
              />
            </label>
          </div>

          <div className="cta-row">
            <button type="submit" className="button">
              提交合作需求
            </button>
          </div>
        </form>
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
