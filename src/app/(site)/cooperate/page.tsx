import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

import { submitCooperationLead } from "@/app/(site)/cooperate/actions";
import { ToneBadge } from "@/components/tone-badge";
import { getCurrentWechatQrCode } from "@/lib/community-social";
import { cooperationAreas } from "@/lib/site-data";

import styles from "./cooperate-page.module.css";

export const metadata: Metadata = {
  title: "合作联系",
  description: "欢迎企业、机构、园区与高校与常州 AI Club 进行分享、培训、PoC 和项目合作。",
};

type SearchParams = {
  submitted?: string;
  error?: string;
};

const followUpNotes = [
  {
    title: "确认场景",
    summary: "先看业务背景、目标结果和当前进度，判断需求是否已经适合推进。",
  },
  {
    title: "匹配资源",
    summary: "再根据需求类型匹配分享嘉宾、培训讲师、FDE 工程师或项目协作团队。",
  },
  {
    title: "约定下一步",
    summary: "适合继续沟通的需求，会进入电话沟通、线下拜访、PoC 或项目方案阶段。",
  },
] as const;

const CO_BUILDER_RULES_PATH = "/docs/guides/co-builder-rules";

function getStatusMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing_required_fields") {
    return "请至少填写公司 / 机构名称和需求简介。";
  }

  if (error === "missing_contact_channel") {
    return "请至少留下微信号或手机号中的一种联系方式。";
  }

  return "提交失败，请稍后再试。";
}

export default async function CooperatePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [params, wechatQrCode] = await Promise.all([
    searchParams,
    getCurrentWechatQrCode(),
  ]);
  const errorMessage = getStatusMessage(params.error);

  return (
    <div className={styles.cooperatePageStack}>
      <section className={styles.leadFormSection} id="lead-form" aria-labelledby="lead-form-title">
        <div className={styles.leadFormIntro}>
          <p className="home-kicker">Cooperate · 合作联系</p>
          <h1 id="lead-form-title">
            提交你的
            <span>AI 合作需求</span>
          </h1>
          <p>
            如果你正在寻找 AI 主题分享、企业内训、PoC 验证、项目协作或本地人才连接，
            可以先把需求提交给社区。我们会根据场景判断适合的沟通方式和可对接资源。
          </p>

          <div className={styles.cooperateAreaCloud} aria-label="适合提交的合作方向">
            {cooperationAreas.map((item) => (
              <ToneBadge key={item} label={item} />
            ))}
          </div>
        </div>

        <div className={styles.leadFormPanel}>
          <div className={styles.leadFormPanelHeader}>
            <p className="home-kicker">Lead Form</p>
            <h2>需求提交表单</h2>
          </div>

          {params.submitted ? (
            <div className={styles.statusNote}>
              <CheckCircle2 aria-hidden="true" strokeWidth={1.9} />
              <span>提交成功，我们已收到你的合作需求，并会根据你填写的联系方式尽快联系。</span>
            </div>
          ) : null}

          {errorMessage ? (
            <div className={`${styles.statusNote} ${styles.statusNoteError}`}>
              <Lightbulb aria-hidden="true" strokeWidth={1.9} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <form action={submitCooperationLead} className={styles.leadForm}>
            <div className={styles.formGrid}>
              <label className={styles.formField}>
                <span>公司 / 机构名称</span>
                <input
                  className="input"
                  name="company_name"
                  placeholder="例如：某制造企业 / 园区 / 高校"
                  required
                />
              </label>

              <label className={styles.formField}>
                <span>联系人</span>
                <input className="input" name="contact_name" placeholder="怎么称呼你" />
              </label>

              <label className={styles.formField}>
                <span>微信号</span>
                <input className="input" name="contact_wechat" placeholder="微信或手机号至少填一项" />
              </label>

              <label className={styles.formField}>
                <span>手机号</span>
                <input className="input" name="contact_phone" placeholder="微信或手机号至少填一项" />
              </label>

              <label className={styles.formField}>
                <span>需求类型</span>
                <input className="input" name="requirement_type" placeholder="分享 / 内训 / PoC / 项目开发" />
              </label>

              <label className={styles.formField}>
                <span>预算范围</span>
                <input className="input" name="budget_range" placeholder="例如：5k-20k / 需进一步沟通" />
              </label>

              <label className={`${styles.formField} ${styles.formFieldWide}`}>
                <span>期望时间</span>
                <input
                  className="input"
                  name="desired_timeline"
                  placeholder="例如：近期先沟通，5 月启动试点"
                />
              </label>

              <label className={`${styles.formField} ${styles.formFieldWide}`}>
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

            <div className={styles.formActions}>
              <button type="submit" className="button home-primary-button">
                提交合作需求
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className={styles.followUpSection} aria-labelledby="follow-up-title">
        <div className={styles.followUpHeading}>
          <p className="home-kicker">Next</p>
          <h2 id="follow-up-title">提交后会怎么处理</h2>
        </div>

        <div className={styles.followUpGrid}>
          {followUpNotes.map((item) => (
            <article className={styles.followUpCard} key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.joinBanner} aria-labelledby="cooperate-join-banner-title">
        <div className={styles.joinBannerIllustration} aria-hidden="true">
          <img
            src="/join-card.png?v=20260424-join-crop"
            alt=""
            className={styles.joinBannerIllustrationImage}
          />
        </div>

        <div className={styles.joinBannerCopy}>
          <h2 id="cooperate-join-banner-title">加入我们，成为常州 AI 生态的一部分</h2>
          <p>
            扫描二维码添加社区官方微信，备注来意后由运营同学邀请你进入交流群。
          </p>
          <Link href={CO_BUILDER_RULES_PATH} className={styles.joinBannerRuleLink}>
            想参与社区共建？查看协作规则
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
        </div>

        <div className={styles.joinBannerSide}>
          <div className={styles.joinBannerQr}>
            {wechatQrCode ? (
              <img
                src={wechatQrCode.imageUrl}
                alt={wechatQrCode.title}
                width={180}
                height={180}
              />
            ) : (
              <div className={styles.wechatPlaceholder}>微信</div>
            )}
          </div>

          <div className={styles.joinBannerInfo}>
            <span>社区官方微信</span>
            <strong>{wechatQrCode?.title ?? "常州 AI Club 官方微信"}</strong>
            <small>200+ 位成员</small>
            <p>添加好友・备注来意・邀请进群</p>
          </div>
        </div>

        <Link href="/join" className={`button home-primary-button ${styles.joinBannerButton}`}>
          申请加入
        </Link>
      </section>
    </div>
  );
}
