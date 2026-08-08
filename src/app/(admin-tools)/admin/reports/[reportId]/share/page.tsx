import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAdminWeDailyReport } from "@/lib/admin/wedaily-admin";
import { requireAdminPermission } from "@/lib/supabase/guards";
import { parseWeDailyMarkdown } from "@/lib/wedaily";
import { buildWeDailyShareTopics } from "@/lib/wedaily-share-data";

import { AdminWeDailyShareCardsClient } from "./admin-wedaily-share-cards-client";

export const metadata: Metadata = {
  title: "制作群聊日报精华贴图",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminWeDailyShareCardsPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireAdminPermission("updates.publish");
  const { reportId } = await params;
  const normalizedReportId = Number(reportId);

  if (!Number.isSafeInteger(normalizedReportId) || normalizedReportId <= 0) notFound();

  const report = await getAdminWeDailyReport(normalizedReportId);

  if (!report) notFound();

  const parsed = parseWeDailyMarkdown(
    report.markdown,
    `${report.date}「${report.chat}」群聊手记`,
  );
  const shareData = {
    date: report.date,
    messageCount: report.stats?.message_count ?? 0,
    overview: parsed.overview,
    speakerCount: report.stats?.speaker_count ?? 0,
    topics: buildWeDailyShareTopics(parsed),
  };

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-900 sm:px-5 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1600px] gap-4">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Daily Share Cards
              </p>
              <h1 className="text-lg font-semibold text-slate-900">
                制作群聊日报精华贴图
              </h1>
            </div>
            <Link
              href={`/admin/reports?reportId=${report.id}`}
              prefetch={false}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-50"
            >
              <ArrowLeft className="size-4" />
              返回日报编辑
            </Link>
          </header>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-slate-600">
            第一版使用固定 HTML 模板生成多张 1080 × 1440 PNG。只选择适合公开的内容，
            不会自动带入成员姓名、参与者列表或群聊原话。
            </div>
            <AdminWeDailyShareCardsClient data={shareData} />
          </div>
        </section>
      </div>
    </main>
  );
}
