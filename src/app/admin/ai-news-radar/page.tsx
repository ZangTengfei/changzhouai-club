import type { Metadata } from "next";

import { AdminAiNewsRadarPageClient } from "@/components/admin-ai-news-radar-page-client";

export const metadata: Metadata = {
  title: "AI 信息雷达",
  description: "手动触发 AI 新闻抓取并查看候选结果。",
};

export default function AdminAiNewsRadarPage() {
  return <AdminAiNewsRadarPageClient />;
}
