import Link from "next/link";

import { RevealImage } from "@/components/reveal-image";
import { getPublicSponsors } from "@/lib/sponsors";

export async function SiteSponsors() {
  const sponsors = await getPublicSponsors();
  const featuredSponsors = sponsors.filter((sponsor) => sponsor.tier === "core");
  const compactSponsors = sponsors.filter((sponsor) => sponsor.tier !== "core");

  return (
    <section className="pb-4 max-sm:pb-0" aria-labelledby="site-sponsors-title">
      <div className="grid gap-5 border-0 bg-transparent pt-4.5 shadow-none max-sm:gap-3 max-sm:rounded-md max-sm:p-3.5 max-sm:pt-4">
        <div className="flex items-center justify-between gap-4 max-sm:gap-2.5">
          <div>
            <h2
              className="m-0 text-[clamp(1.75rem,3.2vw,2.2rem)] leading-[1.16] tracking-[-0.04em] text-[#172020] max-sm:text-[1.42rem] max-sm:tracking-normal"
              id="site-sponsors-title"
            >
              赞助者
            </h2>
            <p className="mt-1.5 mb-0 text-copy-subtle max-sm:text-[0.88rem] max-sm:leading-[1.5]">
              感谢支持常州本地 AI 社区持续连接、组织活动与推动共建。
            </p>
          </div>
        </div>

        {featuredSponsors.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 max-[1024px]:grid-cols-2 max-[820px]:grid-cols-1 max-sm:gap-2.5">
            {featuredSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/sponsors/${sponsor.slug}`}
                prefetch={false}
                className="relative grid min-h-33 rounded-md border-0 bg-white p-4 text-inherit shadow-[0_10px_28px_rgba(var(--ink-rgb),0.06)] transition-[transform,box-shadow] duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(var(--ink-rgb),0.05)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_14px_28px_rgba(var(--ink-rgb),0.05)] max-sm:min-h-auto max-sm:p-3"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(120px,168px)] items-center gap-3.5 max-sm:grid-cols-[minmax(0,1fr)_108px] max-sm:gap-2.5">
                  <div>
                    <p className="mt-0 mb-2 text-[0.8rem] font-extrabold tracking-[0.08em] text-[#1f9a6f] uppercase max-sm:mb-1.25 max-sm:text-[0.72rem] max-sm:tracking-normal">
                      {sponsor.tierLabel}
                    </p>
                    <h3 className="m-0 text-[1.12rem] leading-[1.32] text-[#152022] max-sm:text-[0.98rem] max-sm:leading-[1.24]">
                      {sponsor.name}
                    </h3>
                  </div>
                  {sponsor.logoUrl ? (
                    <div
                      className="grid min-h-21.5 place-items-center rounded-md border-0 bg-[rgba(245,243,237,0.82)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] max-sm:min-h-15.5 max-sm:rounded-sm max-sm:p-2 [&_img]:block [&_img]:max-h-13.5 [&_img]:w-full [&_img]:object-contain max-sm:[&_img]:max-h-10"
                      aria-label={`${sponsor.name} Logo`}
                    >
                      <RevealImage src={sponsor.logoUrl} alt={`${sponsor.name} Logo`} />
                    </div>
                  ) : (
                    <span className="grid min-h-21.5 place-items-center rounded-md border-0 bg-[rgba(245,243,237,0.82)] p-4 text-center text-[0.95rem] font-extrabold text-[#152022] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] max-sm:min-h-15.5 max-sm:rounded-sm max-sm:p-2">
                      {sponsor.name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {compactSponsors.length > 0 ? (
          <div className="grid grid-cols-4 gap-3 max-[1024px]:grid-cols-2 max-[820px]:grid-cols-1 max-sm:gap-2.5" aria-label="更多赞助者">
            {compactSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/sponsors/${sponsor.slug}`}
                prefetch={false}
                className="relative grid min-h-30 gap-2.5 rounded-md border-0 bg-white p-3 text-inherit shadow-[0_10px_28px_rgba(var(--ink-rgb),0.055)] transition-[transform,box-shadow] duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(var(--ink-rgb),0.05)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_14px_28px_rgba(var(--ink-rgb),0.05)] max-sm:min-h-auto max-sm:grid-cols-[48px_minmax(0,1fr)] max-sm:items-center max-sm:p-2.5"
                aria-label={`${sponsor.name}，${sponsor.tierLabel}`}
                title={`${sponsor.name} · ${sponsor.tierLabel}`}
              >
                <div className="grid min-h-15.5 place-items-center rounded-md border-0 bg-[rgba(245,243,237,0.82)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] max-sm:min-h-12 max-sm:rounded-sm max-sm:p-1.75 [&_img]:block [&_img]:max-h-9.5 [&_img]:w-[min(100%,120px)] [&_img]:object-contain">
                  {sponsor.logoUrl ? (
                    <RevealImage src={sponsor.logoUrl} alt={`${sponsor.name} Logo`} />
                  ) : (
                    <span className="block text-center text-[0.9rem] font-extrabold text-[#152022]">
                      {sponsor.name}
                    </span>
                  )}
                </div>
                <div>
                  <strong className="block text-[0.94rem] leading-[1.35] text-[#152022] max-sm:text-[0.9rem] max-sm:leading-[1.24]">
                    {sponsor.name}
                  </strong>
                  <small className="mt-1 block text-[0.8rem] text-copy-subtle max-sm:mt-0.5 max-sm:text-[0.76rem]">
                    {sponsor.tierLabel}
                  </small>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
