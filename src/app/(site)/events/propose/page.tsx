import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Lightbulb,
  Megaphone,
  MessageCircle,
  Mic,
  UsersRound,
} from "lucide-react";

import { submitEventProposal } from "./actions";
import styles from "./event-proposal-page.module.css";

export const metadata: Metadata = {
  title: "发起活动申请",
  description: "提交常州 AI Club 成员活动发起申请，成为活动主要分享者。",
};

type SearchParams = {
  submitted?: string;
  error?: string;
};

const proposalPrinciples = [
  {
    title: "发起人主讲",
    summary: "申请人需要是本场活动的主要分享者，先把自己的实践、案例或方法讲清楚。",
    icon: Mic,
  },
  {
    title: "社区协助成局",
    summary: "主题通过后，社区再一起确认时间、场地、报名、传播和现场协作。",
    icon: UsersRound,
  },
  {
    title: "适合沉淀复盘",
    summary: "优先鼓励能留下资料、照片、案例或行动清单的活动，让更多成员受益。",
    icon: Megaphone,
  },
] as const;

function getStatusMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing_required_fields") {
    return "请填写发起人、分享主题和主题简介。";
  }

  if (error === "missing_contact_channel") {
    return "请至少留下微信号或手机号中的一种联系方式。";
  }

  return "提交失败，请稍后再试。";
}

export default async function EventProposalPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const errorMessage = getStatusMessage(params.error);

  return (
    <div className={styles.proposalPageStack}>
      <Link href="/events" className={styles.backLink}>
        <ArrowLeft aria-hidden="true" strokeWidth={2} />
        返回活动页
      </Link>

      <section className={styles.proposalHero} aria-labelledby="event-proposal-title">
        <div className={styles.proposalIntro}>
          <p className="home-kicker">Host · 群友发起</p>
          <h1 id="event-proposal-title">
            申请发起一场
            <span>由你主讲的活动</span>
          </h1>
          <p>
            如果你有正在实践的 AI 工具、项目经验、行业场景或学习方法，可以先提交活动想法。
            通过后由社区一起确认排期和现场支持。
          </p>

          <div className={styles.principleList} aria-label="活动发起原则">
            {proposalPrinciples.map((item) => {
              const Icon = item.icon;

              return (
                <article className={styles.principleCard} key={item.title}>
                  <Icon aria-hidden="true" strokeWidth={1.8} />
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formPanelHeader}>
            <p className="home-kicker">Application</p>
            <h2>活动发起申请</h2>
          </div>

          {params.submitted ? (
            <div className={styles.statusNote}>
              <CheckCircle2 aria-hidden="true" strokeWidth={1.9} />
              <span>提交成功，社区运营会根据你的联系方式沟通主题和排期。</span>
            </div>
          ) : null}

          {errorMessage ? (
            <div className={`${styles.statusNote} ${styles.statusNoteError}`}>
              <Lightbulb aria-hidden="true" strokeWidth={1.9} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <form action={submitEventProposal} className={styles.proposalForm}>
            <div className={styles.formGrid}>
              <label className={styles.formField}>
                <span>发起人</span>
                <input
                  className="input"
                  name="initiator_name"
                  placeholder="怎么称呼你"
                  required
                />
              </label>

              <label className={styles.formField}>
                <span>身份 / 单位</span>
                <input
                  className="input"
                  name="organization"
                  placeholder="公司、学校、团队或自由职业"
                />
              </label>

              <label className={styles.formField}>
                <span>微信号</span>
                <input
                  className="input"
                  name="contact_wechat"
                  placeholder="用于沟通活动排期（与手机号至少填一项）"
                />
              </label>

              <label className={styles.formField}>
                <span>手机号</span>
                <input
                  className="input"
                  name="contact_phone"
                  placeholder="用于紧急联系（与微信号至少填一项）"
                />
              </label>

              <label className={styles.formField}>
                <span>活动形式</span>
                <select className="input" name="preferred_format" defaultValue="">
                  <option value="">待沟通</option>
                  <option value="主题分享">主题分享</option>
                  <option value="实操工作坊">实操工作坊</option>
                  <option value="圆桌讨论">圆桌讨论</option>
                  <option value="项目复盘">项目复盘</option>
                </select>
              </label>

              <label className={styles.formField}>
                <span>期望时间</span>
                <input
                  className="input"
                  name="desired_timeline"
                  placeholder="例如：6 月下旬周末 / 工作日晚上"
                />
              </label>

              <label className={`${styles.formField} ${styles.formFieldWide}`}>
                <span>分享主题</span>
                <input
                  className="input"
                  name="topic_title"
                  placeholder="例如：我如何用 AI 做一个自动化工作流"
                  required
                />
              </label>

              <label className={`${styles.formField} ${styles.formFieldWide}`}>
                <span>发起人背景</span>
                <textarea
                  className="input textarea"
                  name="initiator_role"
                  rows={3}
                  placeholder="简单说说你为什么适合主讲这个主题，例如实践经历、项目阶段、行业背景。"
                />
              </label>

              <label className={`${styles.formField} ${styles.formFieldWide}`}>
                <span>主题简介</span>
                <textarea
                  className="input textarea"
                  name="proposal_summary"
                  rows={5}
                  placeholder="请写清楚你想分享的内容、适合哪些成员、现场希望大家带走什么。"
                  required
                />
              </label>

              <label className={`${styles.formField} ${styles.formFieldWide}`}>
                <span>希望社区支持</span>
                <textarea
                  className="input textarea"
                  name="expected_support"
                  rows={4}
                  placeholder="例如：场地、报名、海报、共同邀请嘉宾、现场协助或复盘整理。"
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className="button home-primary-button">
                提交申请
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className={styles.processStrip} aria-label="申请处理方式">
        <article>
          <MessageCircle aria-hidden="true" strokeWidth={1.8} />
          <strong>运营确认</strong>
          <span>先沟通主题边界、主讲内容和目标听众。</span>
        </article>
        <article>
          <CalendarClock aria-hidden="true" strokeWidth={1.8} />
          <strong>共同排期</strong>
          <span>主题合适后，再确认时间、地点和报名节奏。</span>
        </article>
        <article>
          <CheckCircle2 aria-hidden="true" strokeWidth={1.8} />
          <strong>发布活动</strong>
          <span>信息确认后发布到官网和社区通知。</span>
        </article>
      </section>
    </div>
  );
}
