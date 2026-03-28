import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="eyebrow">Changzhou AI Club</p>
          <h3>把本地的 AI 人连接起来，把交流变成共建。</h3>
          <p>
            第一版网站围绕活动、项目和合作入口搭建，后续会继续补充回顾内容、成员地图和表单接入。
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
              <Link href="/join">加入我们</Link>
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
          </ul>
        </div>

        <div>
          <h4>域名建议</h4>
          <ul className="footer-list">
            <li>`changzhouai.club` 作为主站</li>
            <li>`aiincz.com` 用作短链或活动跳转</li>
            <li>`join.changzhouai.club` 可做表单入口</li>
            <li>`events.changzhouai.club` 可做活动页</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
