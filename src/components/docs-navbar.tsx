import Link from "next/link";

import { SiteLogoMark } from "@/components/site-logo-mark";
import { siteRepositoryUrl } from "@/lib/site-data";

export function DocsNavbar() {
  return (
    <div className="docs-navbar-shell">
      <div className="docs-navbar-identity">
        <Link href="/" className="docs-navbar-home-brand" aria-label="返回常州 AI 社区首页">
          <span className="docs-navbar-mark">
            <SiteLogoMark className="docs-navbar-mark-icon" />
          </span>
          <span className="docs-navbar-main-copy" aria-hidden="true">
            常州 AI 社区
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
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="docs-navbar-icon"
          >
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.59 2 12.25c0 4.52 2.87 8.35 6.84 9.7.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.32 9.32 0 0 1 12 6.98c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.16 10.16 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z"
            />
          </svg>
          <span className="sr-only">GitHub 仓库</span>
        </Link>
        <Link href="/">返回主站</Link>
      </nav>
    </div>
  );
}
