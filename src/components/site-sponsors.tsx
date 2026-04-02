import { readFile } from "node:fs/promises";
import path from "node:path";

async function getChinaTelecomLogo() {
  return readFile(path.join(process.cwd(), "china-telecom-logo.svg"), "utf8");
}

export async function SiteSponsors() {
  const chinaTelecomLogo = await getChinaTelecomLogo();

  return (
    <section className="site-sponsors" aria-labelledby="site-sponsors-title">
      <div className="footer-sponsors">
        <div className="footer-sponsors-header">
          <p className="eyebrow">Sponsors</p>
          <h4 id="site-sponsors-title">赞助者</h4>
          <p>感谢支持常州本地 AI 社区持续连接、组织活动与推动共建。</p>
        </div>

        <div className="footer-sponsor-list">
          <article className="footer-sponsor-card">
            <div className="footer-sponsor-brand">
              <div
                className="footer-sponsor-logo-mark"
                aria-label="中国电信 Logo"
                role="img"
                dangerouslySetInnerHTML={{ __html: chinaTelecomLogo }}
              />
              <div>
                <p className="footer-sponsor-label">首位赞助者</p>
                <h5>常州电信</h5>
              </div>
            </div>
            <p>
              为社区交流与活动连接提供支持，和我们一起把更多本地实践者聚在一起。
            </p>
          </article>

          <article className="footer-sponsor-card footer-sponsor-card--placeholder">
            <div>
              <p className="footer-sponsor-label">预留席位</p>
              <h5>期待下一位赞助者</h5>
            </div>
            <p>欢迎更多认同社区愿景的伙伴加入，一起支持常州 AI 社区持续成长。</p>
          </article>
        </div>
      </div>
    </section>
  );
}
