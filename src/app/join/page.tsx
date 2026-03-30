import type { Metadata } from "next";

import { submitJoinRequest } from "@/app/join/actions";
import { PageHero } from "@/components/page-hero";
import { joinSteps, memberTags } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "加入我们",
  description: "了解如何加入常州 AI 社区，参与线下活动、项目共建和长期协作。",
};

type SearchParams = {
  submitted?: string;
  error?: string;
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Join"
        title="加入常州 AI 社区"
        description="欢迎加入线下交流、项目共建与长期协作。你可以是学习者、参与者、分享者，也可以成为项目合作者。"
      >
        <div className="note-strip">
          现在已经可以直接在站内提交加入申请。你提交后，后台成员管理页会收到这条申请。
        </div>
      </PageHero>

      {params.submitted ? (
        <div className="note-strip">
          提交成功，我们已经收到你的加入申请。后面可以在群里或线下活动里继续碰面，也欢迎你先去完善社区账号资料。
        </div>
      ) : null}

      {params.error ? (
        <div className="note-strip">
          {params.error === "missing_required_fields"
            ? "请至少填写昵称和微信号。"
            : "提交失败，请稍后再试。"}
        </div>
      ) : null}

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

      <section className="surface join-form-shell">
        <div className="section-heading">
          <p className="eyebrow">Join Form</p>
          <h2>提交加入申请</h2>
          <p>先把你的基础信息、技能方向和参与意愿告诉我们，后面做活动邀约、成员匹配和项目共建会更顺。</p>
        </div>

        <form action={submitJoinRequest} className="join-form">
          <div className="form-grid">
            <label className="form-field">
              <span>昵称或姓名</span>
              <input className="input" name="display_name" placeholder="怎么称呼你" required />
            </label>

            <label className="form-field">
              <span>微信号</span>
              <input className="input" name="wechat" placeholder="方便后续联系" required />
            </label>

            <label className="form-field">
              <span>所在城市</span>
              <input className="input" name="city" defaultValue="常州" />
            </label>

            <label className="form-field">
              <span>当前身份</span>
              <input className="input" name="role_label" placeholder="开发 / 产品 / 学生 / 创业者" />
            </label>

            <label className="form-field">
              <span>公司 / 学校 / 团队</span>
              <input className="input" name="organization" placeholder="可选" />
            </label>

            <label className="form-field">
              <span>每月可投入时间</span>
              <input className="input" name="monthly_time" placeholder="例如：每月 1-2 次线下 / 每周 2 小时" />
            </label>

            <label className="form-field form-field-wide">
              <span>技能方向</span>
              <input
                className="input"
                name="skills"
                placeholder="多个请用逗号分隔，例如：前端工程，Agent，RAG"
              />
            </label>

            <label className="form-field form-field-wide">
              <span>感兴趣的主题</span>
              <input
                className="input"
                name="interests"
                placeholder="多个请用逗号分隔，例如：LLM 应用，自动化工作流，项目交付"
              />
            </label>

            <label className="form-field form-field-wide">
              <span>补充说明</span>
              <textarea
                className="input textarea"
                name="note"
                rows={4}
                placeholder="可以写你想参与的方向、最近在做的事，或者希望在社区里认识什么样的人。"
              />
            </label>
          </div>

          <div className="checkbox-list">
            <label className="checkbox-row">
              <input type="checkbox" name="willing_to_attend" defaultChecked />
              <span>愿意参加线下活动</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" name="willing_to_share" />
              <span>愿意做主题分享或经验交流</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" name="willing_to_join_projects" />
              <span>愿意参与后续项目共建</span>
            </label>
          </div>

          <div className="cta-row">
            <button type="submit" className="button">
              提交加入申请
            </button>
          </div>
        </form>
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
