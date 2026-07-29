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
import { cssModuleCx } from "@/lib/utils";
import styles from "./site-footer.module.css";

const cx = cssModuleCx.bind(null, styles);

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
    <footer className={cx("site-footer")}>
      <section className={cx("footer-community")} aria-labelledby="footer-community-title">
        <div className={cx("container footer-community-inner")}>
          <div className={cx("footer-join")}>
            <h2 id="footer-community-title">加入社区，把问题带到现场</h2>
            <p>连接常州 AI 实践者，一起参加活动、认识伙伴、推进项目。</p>
            <Link href="/join" prefetch={false} className={cx("footer-join-link")}>
              申请加入
              <ArrowRight aria-hidden="true" strokeWidth={1.9} />
            </Link>
          </div>

          <div className={cx("footer-wechat")}>
            <Image
              src={officialChannel.qrImageUrl}
              alt="常州 AI Club 共创社区公众号二维码"
              width={132}
              height={132}
              unoptimized
              loading="lazy"
            />
            <div className={cx("footer-wechat-copy")}>
              <span>关注公众号</span>
              <strong>常州 AI Club</strong>
              <small>共创社区</small>
            </div>
          </div>

          <div className={cx("footer-socials")} aria-label="社区外部平台入口">
            {footerSocialLinks.map((item) => (
              <Link
                key={item.platform}
                href={item.href}
                className={cx("footer-social-link")}
                target="_blank"
                rel="noreferrer"
              >
                <span className={cx("footer-social-icon")} aria-hidden="true">
                  <SocialPlatformIcon
                    tone={item.tone}
                    src={"iconSrc" in item ? item.iconSrc : undefined}
                    alt=""
                    className={cx("footer-social-svg")}
                  />
                </span>
                <span className={cx("footer-social-copy")}>
                  <strong>{item.label}</strong>
                  <small>{item.footerDescription}</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className={cx("container footer-main")}>
        <div className={cx("footer-brand")}>
          <div className={cx("footer-brand-lockup")}>
            <SiteLogoMark className={cx("footer-brand-mark")} />
            <strong>常州 AI Club</strong>
          </div>
          <p>连接常州 AI 实践者，让真实问题长成 AI 项目。</p>
        </div>

        <div className={cx("footer-nav-groups")}>
          {footerNavigation.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <strong>{group.label}</strong>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} prefetch={false}>
                  {item.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className={cx("footer-bottom")}>
          <span>© 2026 常州 AI Club. All rights reserved.</span>
          <span>连接点（常州）科技服务有限公司</span>
          <Link href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
            苏ICP备2026038990号-3
          </Link>
        </div>
      </div>
    </footer>
  );
}
