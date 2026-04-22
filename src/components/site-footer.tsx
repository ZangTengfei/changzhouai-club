import Link from "next/link";

import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { communitySocialLinks, siteRepositoryUrl } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container home-footer-shell">
        <div className="home-footer-brand">
          <h3>关注我们</h3>
          <p>在各个平台获取常州 AI Club 动态与优质内容</p>
        </div>

        <div className="home-footer-socials" aria-label="社区外部平台入口">
          {communitySocialLinks.map((item) => (
            <Link
              key={item.platform}
              href={item.href}
              className="home-footer-social"
              target="_blank"
              rel="noreferrer"
            >
              <span className="home-footer-social-icon" aria-hidden="true">
                <SocialPlatformIcon
                  tone={item.tone}
                  src={item.iconSrc}
                  alt=""
                  className="home-footer-social-svg"
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
            className="home-footer-social"
            target="_blank"
            rel="noreferrer"
          >
            <span className="home-footer-social-icon" aria-hidden="true">
              <SocialPlatformIcon tone="github" className="home-footer-social-svg" />
            </span>
            <span>
              <strong>GitHub</strong>
              <small>开源项目与资料沉淀</small>
            </span>
          </Link>
        </div>

        <div className="home-footer-bottom">
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
