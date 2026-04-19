import type { Metadata } from "next";

import { AdminNewSponsorPageClient } from "@/components/admin-new-sponsor-page-client";

export const metadata: Metadata = {
  title: "新增赞助者",
  description: "创建新的社区赞助者。",
};

export default function AdminNewSponsorPage() {
  return <AdminNewSponsorPageClient />;
}
