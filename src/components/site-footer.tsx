import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="eyebrow">Changzhou AI Club</p>
          <h3>把本地的 AI 人连接起来，把交流变成共建。</h3>
          <p>
            社区围绕活动、成员连接与合作交流持续生长，欢迎更多本地实践者与伙伴加入。
          </p>
        </div>

        <div>
          <h4>站点导航</h4>
          <ul className="footer-list">
            <li>
              <Link href="/events">活动</Link>
            </li>
            <li>
              <Link href="/projects">项目共建</Link>
            </li>
            <li>
              <Link href="/members">成员地图</Link>
            </li>
            <li>
              <Link href="/docs">文档</Link>
            </li>
            <li>
              <Link href="/join">加入社区</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>辅助页面</h4>
          <ul className="footer-list">
            <li>
              <Link href="/about">关于我们</Link>
            </li>
            <li>
              <Link href="/archive">往期回顾</Link>
            </li>
            <li>
              <Link href="/faq">常见问题</Link>
            </li>
            <li>
              <Link href="/docs/getting-started">文档开始使用</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>联系方式</h4>
          <ul className="footer-list">
            <li>
              <Link href="/join">加入社区</Link>
            </li>
            <li>
              <Link href="/cooperate">提交合作需求</Link>
            </li>
            <li>
              <Link href="/events">查看近期活动</Link>
            </li>
            <li>
              <Link href="/docs/contributing">参与文档共建</Link>
            </li>
            <li>
              <Link href="/members">浏览成员地图</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
