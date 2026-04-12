import Link from "next/link";

export function DocsFooter() {
  return (
    <footer className="docs-footer">
      <div className="docs-footer-grid">
        <div>
          <strong>常州 AI 社区知识库</strong>
          <p>
            面向社区成员持续沉淀活动方法、工具实践、项目记录与协作规范。
          </p>
        </div>

        <div>
          <strong>常用入口</strong>
          <div className="docs-footer-links">
            <Link href="/docs/getting-started">开始使用</Link>
            <Link href="/docs/guides/co-build-workflow">共建流程</Link>
            <Link href="/docs/contributing">贡献规范</Link>
            <Link href="/join">加入社区</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
