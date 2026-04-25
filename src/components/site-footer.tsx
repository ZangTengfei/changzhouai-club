import Link from "next/link";

import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { communitySocialLinks, siteRepositoryUrl } from "@/lib/site-data";
import { cssModuleCx } from "@/lib/utils";
import styles from "./site-footer.module.css";

const cx = cssModuleCx.bind(null, styles);

export function SiteFooter() {
  return (
    <footer className={cx("site-footer")}>
      <div className={cx("container home-footer-shell")}>
        <div className={cx("home-footer-brand")}>
          <h3>关注我们</h3>
          <p>在各个平台获取常州 AI Club 动态与优质内容</p>
        </div>

        <div className={cx("home-footer-socials")} aria-label="社区外部平台入口">
          {communitySocialLinks.map((item) => (
            <Link
              key={item.platform}
              href={item.href}
              className={cx("home-footer-social")}
              target="_blank"
              rel="noreferrer"
            >
              <span className={cx("home-footer-social-icon")} aria-hidden="true">
                <SocialPlatformIcon
                  tone={item.tone}
                  src={item.iconSrc}
                  alt=""
                  className={cx("home-footer-social-svg")}
                />
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </Link>
          ))}
          <Link
            href={siteRepositoryUrl}
            className={cx("home-footer-social")}
            target="_blank"
            rel="noreferrer"
          >
            <span className={cx("home-footer-social-icon")} aria-hidden="true">
              <SocialPlatformIcon tone="github" className={cx("home-footer-social-svg")} />
            </span>
            <span>
              <strong>GitHub</strong>
              <small>开源项目与资料沉淀</small>
            </span>
          </Link>
        </div>

        <div className={cx("home-footer-bottom")}>
          <span>© 2026 常州 AI Club. All rights reserved.</span>
          <nav aria-label="页脚导航">
            <Link href="/about">关于我们</Link>
            <Link href="/join">加入我们</Link>
            <Link href="/cooperate">联系我们</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
