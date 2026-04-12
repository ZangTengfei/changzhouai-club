import Link from "next/link";

export function DocsNavbar() {
  return (
    <div className="docs-navbar-shell">
      <Link href="/" className="docs-navbar-brand">
        <span className="docs-navbar-badge">Docs</span>
        <span className="docs-navbar-copy">
          <strong>常州 AI 社区知识库</strong>
          <small>共建资料、方法与沉淀</small>
        </span>
      </Link>

      <nav className="docs-navbar-links" aria-label="知识库导航">
        <Link href="/docs">首页</Link>
        <Link href="/docs/getting-started">开始使用</Link>
        <Link href="/docs/guides/co-build-workflow">共建流程</Link>
        <Link href="/docs/contributing">参与贡献</Link>
        <Link href="/">返回主站</Link>
      </nav>
    </div>
  );
}
