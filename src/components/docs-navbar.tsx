import Link from "next/link";

import { SiteLogoMark } from "@/components/site-logo-mark";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { siteRepositoryUrl } from "@/lib/site-data";

export function DocsNavbar() {
  return (
    <div className="docs-navbar-shell">
      <div className="docs-navbar-identity">
        <Link href="/" className="docs-navbar-home-brand" aria-label="返回常州 AI Club 首页">
          <span className="docs-navbar-mark">
            <SiteLogoMark className="docs-navbar-mark-icon" />
          </span>
          <span className="docs-navbar-main-copy" aria-hidden="true">
            常州 AI Club
          </span>
        </Link>
        <Link href="/docs" className="docs-navbar-docs-title">
          <span className="docs-navbar-copy">
            <strong>文档</strong>
            <small>共建资料、方法与沉淀</small>
          </span>
        </Link>
      </div>

      <nav className="docs-navbar-links" aria-label="文档导航">
        <Link href="/docs">首页</Link>
        <Link href="/docs/getting-started">开始使用</Link>
        <Link href="/docs/guides/co-build-workflow">共建流程</Link>
        <Link href="/docs/contributing">参与贡献</Link>
        <Link
          href={siteRepositoryUrl}
          className="docs-navbar-icon-link"
          target="_blank"
          rel="noreferrer"
          aria-label="打开 GitHub 仓库"
          title="GitHub 仓库"
        >
          <SocialPlatformIcon tone="github" className="docs-navbar-icon" />
          <span className="sr-only">GitHub 仓库</span>
        </Link>
        <Link href="/">返回主站</Link>
      </nav>
    </div>
  );
}
