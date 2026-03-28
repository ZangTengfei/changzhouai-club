import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { faqItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "常见问题",
  description: "查看常州 AI 社区的加入方式、活动形式和合作方向说明。",
};

export default function FaqPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="FAQ"
        title="常见问题"
        description="把常见沟通问题提前说明清楚，能减少你在微信里重复回复，也能让网站转化更顺畅。"
      />

      <section className="faq-grid">
        {faqItems.map((item) => (
          <article className="faq-item" key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
