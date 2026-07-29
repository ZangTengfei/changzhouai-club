import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SiteLogoMark } from "@/components/site-logo-mark";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import {
  communitySocialLinks,
  officialCommunityChannels,
  siteRepositoryUrl,
} from "@/lib/site-data";

const footerSocialLinks = [
  ...communitySocialLinks.map((item) => ({
    ...item,
    footerDescription:
      item.platform === "小红书"
        ? "社区图文动态"
        : item.platform === "抖音"
          ? "社区短视频"
          : "社区视频空间",
  })),
  {
    platform: "GitHub",
    label: "GitHub",
    description: "开源项目与资料沉淀",
    footerDescription: "开源项目与资料",
    href: siteRepositoryUrl,
    tone: "github" as const,
  },
];

const footerNavigation = [
  {
    label: "了解社区",
    items: [
      { href: "/about", label: "关于我们" },
      { href: "/members", label: "社区成员" },
      { href: "/events", label: "活动回顾" },
    ],
  },
  {
    label: "参与共建",
    items: [
      { href: "/join", label: "申请加入" },
      { href: "/projects", label: "项目协作" },
      { href: "/cooperate", label: "合作联系" },
    ],
  },
] as const;

export function SiteFooter() {
  const officialChannel = officialCommunityChannels[0];

  return (
    <footer className="border-t border-[rgba(var(--ink-rgb),0.06)] bg-white">
      <section className="bg-[#f3f7f5]" aria-labelledby="footer-community-title">
        <div className="container grid min-h-[230px] grid-cols-[minmax(250px,0.82fr)_minmax(250px,0.72fr)_minmax(390px,1.1fr)] items-center gap-9 py-8 max-lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] max-lg:gap-x-8 max-lg:gap-y-[26px] max-sm:min-h-0 max-sm:grid-cols-1 max-sm:gap-5 max-sm:py-6">
          <div className="grid content-center gap-2.5 max-lg:col-span-full max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:items-end max-sm:col-auto max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:items-center max-sm:gap-x-3.5 max-sm:gap-y-[7px]">
            <h2 id="footer-community-title" className="m-0 text-[clamp(1.28rem,2vw,1.62rem)] leading-[1.28] font-[780] tracking-[-0.025em] text-[var(--accent-strong)] max-sm:text-[1.18rem]">加入社区，把问题带到现场</h2>
            <p className="m-0 max-w-[29rem] text-[0.92rem] leading-[1.65] text-[rgba(var(--ink-rgb),0.58)] max-lg:col-start-1 max-sm:col-span-full max-sm:text-[0.84rem]">连接常州 AI 实践者，一起参加活动、认识伙伴、推进项目。</p>
            <Link href="/join" prefetch={false} className="group inline-flex w-fit items-center gap-2 text-[0.98rem] font-black text-[var(--accent-strong)] max-lg:col-start-2 max-lg:row-span-2 max-lg:row-start-1 max-lg:self-center max-sm:col-start-2 max-sm:row-span-1 max-sm:row-start-1 max-sm:text-[0.88rem]">
              申请加入
              <ArrowRight className="size-[18px] transition-transform duration-180 group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px]" aria-hidden="true" strokeWidth={1.9} />
            </Link>
          </div>

          <div className="grid min-w-0 grid-cols-[132px_minmax(0,1fr)] items-center gap-[18px] border-l border-[rgba(var(--ink-rgb),0.1)] pl-[34px] max-lg:border-l-0 max-lg:pl-0 max-sm:grid-cols-[104px_minmax(0,1fr)] max-sm:gap-4 max-sm:border-t max-sm:border-[rgba(var(--ink-rgb),0.1)] max-sm:pt-[18px]">
            <Image
              src={officialChannel.qrImageUrl}
              alt="常州 AI Club 共创社区公众号二维码"
              width={132}
              height={132}
              unoptimized
              loading="lazy"
              className="block size-[132px] rounded-[var(--radius-sm)] border border-[rgba(var(--ink-rgb),0.08)] bg-white object-contain p-[7px] max-sm:size-[104px] max-sm:p-[5px]"
            />
            <div className="grid min-w-0 gap-1">
              <span className="block text-[0.88rem] font-black text-[var(--accent-strong)]">关注公众号</span>
              <strong className="block text-base leading-[1.35] text-[var(--ink)]">常州 AI Club</strong>
              <small className="block text-[0.86rem] text-[rgba(var(--ink-rgb),0.58)]">共创社区</small>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-4 border-l border-[rgba(var(--ink-rgb),0.1)] pl-[34px] max-lg:pl-7 max-sm:border-t max-sm:border-l-0 max-sm:border-[rgba(var(--ink-rgb),0.1)] max-sm:px-0 max-sm:pt-[18px]" aria-label="社区外部平台入口">
            {footerSocialLinks.map((item) => (
              <Link
                key={item.platform}
                href={item.href}
                className="group grid min-w-0 justify-items-center gap-2 px-0.5 py-1.5 text-center text-[var(--ink)] transition-[color,transform] duration-180 hover:-translate-y-0.5 hover:text-[var(--accent-strong)] focus-visible:-translate-y-0.5 focus-visible:text-[var(--accent-strong)] max-sm:gap-1.5 max-sm:px-[3px]"
                target="_blank"
                rel="noreferrer"
              >
                <span className="grid size-[42px] place-items-center max-sm:size-[34px]" aria-hidden="true">
                  <SocialPlatformIcon
                    tone={item.tone}
                    src={"iconSrc" in item ? item.iconSrc : undefined}
                    alt=""
                    className="size-full object-contain"
                  />
                </span>
                <span>
                  <strong className="block overflow-hidden text-[0.92rem] leading-[1.2] text-ellipsis whitespace-nowrap max-sm:text-[0.8rem]">{item.label}</strong>
                  <small className="mt-[3px] block overflow-hidden text-[0.72rem] leading-[1.35] text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.52)] max-sm:hidden">{item.footerDescription}</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container grid grid-cols-[minmax(0,1fr)_auto] gap-x-[70px] gap-y-[30px] pt-[34px] pb-[26px] max-sm:grid-cols-1 max-sm:gap-6 max-sm:pt-[26px] max-sm:pb-5">
        <div className="grid content-start gap-3 max-sm:gap-[9px]">
          <div className="flex items-center gap-3">
            <SiteLogoMark className="block h-9 w-12 object-contain" />
            <strong className="font-[var(--font-display)] text-[1.18rem] font-[780] text-[#111b1f]">常州 AI Club</strong>
          </div>
          <p className="m-0 max-w-[31rem] text-[0.9rem] leading-[1.65] text-[rgba(var(--ink-rgb),0.58)]">连接常州 AI 实践者，让真实问题长成 AI 项目。</p>
        </div>

        <div className="grid grid-cols-2 gap-12 max-sm:gap-6">
          {footerNavigation.map((group) => (
            <nav key={group.label} aria-label={group.label} className="grid content-start gap-[9px]">
              <strong className="mb-0.5 text-[0.92rem] text-[var(--ink)]">{group.label}</strong>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} prefetch={false} className="text-[0.86rem] text-[rgba(var(--ink-rgb),0.58)] hover:text-[var(--accent-strong)] focus-visible:text-[var(--accent-strong)]">
                  {item.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="col-span-full flex flex-wrap gap-x-[18px] gap-y-2 border-t border-[rgba(var(--ink-rgb),0.08)] pt-[18px] text-[0.82rem] text-[rgba(var(--ink-rgb),0.52)] max-sm:col-auto max-sm:gap-x-3 max-sm:gap-y-1.5 max-sm:pt-3.5 max-sm:text-[0.76rem]">
          <span>© 2026 常州 AI Club. All rights reserved.</span>
          <span>连接点（常州）科技服务有限公司</span>
          <Link className="hover:text-[var(--accent-strong)] focus-visible:text-[var(--accent-strong)]" href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
            苏ICP备2026038990号-3
          </Link>
        </div>
      </div>
    </footer>
  );
}
