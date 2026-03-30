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
        description="集中查看关于社区定位、活动形式、加入方式与合作方向的常见问题。"
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
