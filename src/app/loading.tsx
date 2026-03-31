const loadingCards = Array.from({ length: 3 });

export default function Loading() {
  return (
    <div className="page-stack route-loading" aria-live="polite" aria-busy="true">
      <section className="surface route-loading-hero">
        <div className="route-loading-copy">
          <p className="eyebrow">Loading</p>
          <h1>页面加载中</h1>
          <p>正在获取最新内容，请稍候片刻。</p>
        </div>
        <div className="route-loading-badge">
          <span className="route-loading-dot" />
          <strong>正在切换内容</strong>
        </div>
      </section>

      <section className="route-loading-grid" aria-hidden="true">
        {loadingCards.map((_, index) => (
          <article className="card route-loading-card" key={index}>
            <div className="route-loading-line route-loading-line-title" />
            <div className="route-loading-line" />
            <div className="route-loading-line" />
            <div className="route-loading-line route-loading-line-short" />
          </article>
        ))}
      </section>
    </div>
  );
}
