import { cn } from "@/lib/utils";

const siteCards = Array.from({ length: 3 });
const adminRows = Array.from({ length: 6 });

function SkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return <div className={cn("route-skeleton-shimmer rounded-2xl", className)} />;
}

export function GlobalRouteLoading() {
  return (
    <div aria-live="polite" aria-busy="true" className="min-h-screen">
      <div className="route-progress-shell">
        <div className="route-progress-bar" />
      </div>
      <div className="route-progress-pill">
        <span className="route-progress-pill-dot" />
        <span className="route-progress-pill-copy">
          <small>Loading</small>
          <strong>页面切换中</strong>
        </span>
      </div>
      <span className="sr-only">页面切换中</span>
    </div>
  );
}

export function SiteRouteLoading() {
  return (
    <div className="page-stack" aria-live="polite" aria-busy="true">
      <div className="route-progress-shell">
        <div className="route-progress-bar" />
      </div>
      <div className="route-progress-pill">
        <span className="route-progress-pill-dot" />
        <span className="route-progress-pill-copy">
          <small>Loading</small>
          <strong>页面切换中</strong>
        </span>
      </div>

      <section className="surface flex flex-col gap-4 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-full border border-[rgba(var(--accent-rgb),0.12)] bg-[rgba(var(--surface-rgb),0.84)] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[var(--muted)]">
            正在切换页面
          </span>
        </div>
        <div className="grid gap-3">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-4 w-full max-w-xl" />
          <SkeletonBlock className="h-4 w-52" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-hidden="true">
        {siteCards.map((_, index) => (
          <article key={index} className="card flex flex-col gap-4 p-5">
            <SkeletonBlock className="aspect-[16/10] w-full" />
            <SkeletonBlock className="h-5 w-2/3" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
          </article>
        ))}
      </section>
    </div>
  );
}

export function AdminRouteLoading() {
  return (
    <div className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
      <div className="route-progress-shell">
        <div className="route-progress-bar route-progress-bar-admin" />
      </div>
      <div className="route-progress-pill route-progress-pill-admin">
        <span className="route-progress-pill-dot route-progress-pill-dot-admin" />
        <span className="route-progress-pill-copy">
          <small>Admin</small>
          <strong>正在切换后台内容</strong>
        </span>
      </div>

      <section className="rounded-[var(--radius)] border border-border/70 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="h-6 w-28" />
          </div>
          <div className="flex flex-wrap gap-2">
            <SkeletonBlock className="h-12 w-24 rounded-xl" />
            <SkeletonBlock className="h-12 w-24 rounded-xl" />
            <SkeletonBlock className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border/70 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="border-b border-border/70 px-4 py-4">
          <SkeletonBlock className="h-5 w-24" />
        </div>
        <div className="grid gap-3 px-4 py-4">
          <SkeletonBlock className="h-9 w-full rounded-xl" />
          <div className="flex flex-wrap gap-2">
            <SkeletonBlock className="h-8 w-20 rounded-full" />
            <SkeletonBlock className="h-8 w-24 rounded-full" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius)] border border-border/70 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_96px] gap-3 border-b border-border/70 px-4 py-3">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-12" />
        </div>
        <div className="divide-y divide-border/60">
          {adminRows.map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_96px] gap-3 px-4 py-4"
            >
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="h-3.5 w-56" />
              </div>
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3.5 w-20" />
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <div className="space-y-2">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-3.5 w-20" />
              </div>
              <SkeletonBlock className="h-8 w-14 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
