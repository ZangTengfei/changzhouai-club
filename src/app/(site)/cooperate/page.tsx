import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

import { submitCooperationLead } from "@/app/(site)/cooperate/actions";
import { ToneBadge } from "@/components/tone-badge";
import { cooperationAreas } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "合作联系",
  description: "欢迎企业、机构、园区与高校与常州 AI Club 进行分享、培训、PoC 和项目合作。",
  path: "/cooperate",
});

type SearchParams = {
  submitted?: string;
  error?: string;
};

const followUpNotes = [
  {
    title: "场景澄清",
    summary: "先看业务背景、目标结果、当前流程和真实约束，判断问题是否具体。",
  },
  {
    title: "验证路径",
    summary: "再判断适合主题分享、企业内训、PoC 验证、MVP 原型还是项目协作。",
  },
  {
    title: "共创试点",
    summary: "适合继续推进的需求，会进入电话沟通、线下拜访、成员匹配或试点方案阶段。",
  },
] as const;

const formFieldClassName =
  "grid min-w-0 gap-2 [&>span]:font-extrabold [&>span]:text-ink";

const followUpCardClassName = [
  "bg-highlight-blue",
  "bg-highlight-orange",
  "bg-[#f3efff]",
] as const;

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
  const params = await searchParams;
  const errorMessage = getStatusMessage(params.error);

  return (
    <div className="grid gap-6 pt-6 pb-11 max-sm:gap-5.5 max-sm:pt-3.5">
      <section className="grid grid-cols-[minmax(280px,0.42fr)_minmax(0,0.58fr)] items-start gap-6 max-[1024px]:grid-cols-1" id="lead-form" aria-labelledby="lead-form-title">
        <div className="grid content-start gap-4 pt-3">
          <p className="home-kicker">Cooperate · 合作联系</p>
          <h1 className="m-0 text-[clamp(2.35rem,4.2vw,3.45rem)] leading-[1.08] font-black text-heading max-sm:text-[clamp(2rem,11vw,2.8rem)]" id="lead-form-title">
            把真实场景
            <span className="block text-primary">带进 AI 共创</span>
          </h1>
          <p className="m-0 max-w-xl text-[1.02rem] leading-[1.78] font-[650] text-[rgba(var(--ink-rgb),0.7)]">
            如果你正在寻找 AI 主题分享、企业内训、场景澄清、PoC 验证、MVP 原型或本地人才连接，
            可以先把需求提交给社区。我们会根据真实场景判断适合的沟通方式和可对接资源。
          </p>

          <div className="flex max-w-xl flex-wrap gap-2.25" aria-label="适合提交的合作方向">
            {cooperationAreas.map((item) => (
              <ToneBadge key={item} label={item} />
            ))}
          </div>
        </div>

        <div className="grid min-w-0 gap-4 rounded-lg border-0 bg-highlight-green p-5.5 shadow-none max-sm:p-4.5">
          <div className="grid gap-2 [&>*]:m-0">
            <p className="home-kicker">Lead Form</p>
            <h2 className="text-[clamp(1.65rem,2.6vw,2.08rem)] leading-[1.12] font-black text-[#111a1d]">需求提交表单</h2>
          </div>

          {params.submitted ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-md border border-dashed border-[rgba(var(--accent-rgb),0.28)] bg-primary-soft px-4 py-3.5 font-extrabold text-primary-strong [&_svg]:size-5">
              <CheckCircle2 aria-hidden="true" strokeWidth={1.9} />
              <span>提交成功，我们已收到你的合作需求，并会根据你填写的联系方式尽快联系。</span>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-md border border-dashed border-[rgba(197,91,79,0.28)] bg-[rgba(197,91,79,0.08)] px-4 py-3.5 font-extrabold text-destructive [&_svg]:size-5">
              <Lightbulb aria-hidden="true" strokeWidth={1.9} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <form action={submitCooperationLead} className="grid min-w-0 gap-4.5 rounded-md border-0 bg-white p-5 shadow-site-card max-sm:p-4.5">
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <label className={formFieldClassName}>
                <span>公司 / 机构名称</span>
                <input
                  className="input"
                  name="company_name"
                  placeholder="例如：某制造企业 / 园区 / 高校"
                  required
                />
              </label>

              <label className={formFieldClassName}>
                <span>联系人</span>
                <input className="input" name="contact_name" placeholder="怎么称呼你" />
              </label>

              <label className={formFieldClassName}>
                <span>微信号</span>
                <input className="input" name="contact_wechat" placeholder="用于后续沟通（与手机号至少填一项）" />
              </label>

              <label className={formFieldClassName}>
                <span>手机号</span>
                <input className="input" name="contact_phone" placeholder="用于电话联系（与微信号至少填一项）" />
              </label>

              <label className={formFieldClassName}>
                <span>需求类型</span>
                <input className="input" name="requirement_type" placeholder="分享 / 内训 / 场景澄清 / PoC / 项目开发" />
              </label>

              <label className={formFieldClassName}>
                <span>预算范围</span>
                <input className="input" name="budget_range" placeholder="例如：5k-20k / 需进一步沟通" />
              </label>

              <label className={cn(formFieldClassName, "col-span-full")}>
                <span>期望时间</span>
                <input
                  className="input"
                  name="desired_timeline"
                  placeholder="例如：近期先沟通，5 月启动试点"
                />
              </label>

              <label className={cn(formFieldClassName, "col-span-full")}>
                <span>需求简介</span>
                <textarea
                  className="input textarea"
                  name="requirement_summary"
                  rows={5}
                  placeholder="请尽量写清楚业务场景、当前流程、希望解决的问题、预期结果，以及是否需要线下沟通。"
                  required
                />
              </label>
            </div>

            <div className="flex justify-start">
              <button type="submit" className="button home-primary-button gap-2 border-0 [&_svg]:size-4.5">
                提交合作需求
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </button>
            </div>
            <p className="section-note">
              提交即表示同意我们使用以上信息与你沟通合作事宜，我们不会向第三方公开你的联系方式。
            </p>
          </form>
        </div>
      </section>

      <section className="grid gap-3.5 pt-1.5" aria-labelledby="follow-up-title">
        <div className="grid gap-2 [&>*]:m-0">
          <p className="home-kicker">Next</p>
          <h2 className="text-[clamp(1.45rem,2.2vw,1.9rem)] leading-[1.12] font-black text-[#111a1d]" id="follow-up-title">提交后会怎么处理</h2>
        </div>

        <div className="grid grid-cols-3 gap-3.5 max-sm:grid-cols-1">
          {followUpNotes.map((item, index) => (
            <article
              className={cn(
                "grid min-h-31 gap-2 rounded-md border-0 p-4.5 shadow-none [&>*]:m-0",
                followUpCardClassName[index],
              )}
              key={item.title}
            >
              <h3 className="text-[1.08rem] leading-[1.22] font-black text-[#111a1d]">{item.title}</h3>
              <p className="text-[0.92rem] leading-[1.62] font-[650] text-[rgba(var(--ink-rgb),0.64)]">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
