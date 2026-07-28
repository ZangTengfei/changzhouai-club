import type { Metadata } from "next";

import { saveAdminCommunityMemberCount } from "@/app/admin/actions";
import {
  AdminField,
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/components/admin-ui";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { Button } from "@/components/admin-antd/button";
import { Input } from "@/components/admin-antd/input";
import {
  COMMUNITY_MEMBER_COUNT_KEY,
  DEFAULT_COMMUNITY_MEMBER_COUNT,
} from "@/lib/community-metrics";
import { requireAdminPermission } from "@/lib/supabase/guards";

export const metadata: Metadata = {
  title: "站点设置",
  description: "管理前台展示的社区指标。",
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdminPermission("system.manage_settings");
  const { data, error } = await supabase
    .from("community_metrics")
    .select("numeric_value, updated_at")
    .eq("metric_key", COMMUNITY_MEMBER_COUNT_KEY)
    .maybeSingle();
  const memberCount =
    typeof data?.numeric_value === "number"
      ? data.numeric_value
      : DEFAULT_COMMUNITY_MEMBER_COUNT;

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={params.saved === "member_count" ? "成员数量已更新。" : null}
        error={
          params.error === "invalid_member_count"
            ? "成员数量必须是 0 到 1000000 之间的整数。"
            : params.error
              ? "保存失败，请稍后再试。"
              : null
        }
      />

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Site Settings"
          title="站点设置"
          actions={<AdminMetric label="前台显示" value={`${memberCount}+`} />}
        />
        <AdminPanelBody className="space-y-4">
          {error ? (
            <AdminNotice>社区指标读取失败，当前显示默认值 500。</AdminNotice>
          ) : null}

          <form action={saveAdminCommunityMemberCount} className="max-w-md space-y-4">
            <AdminField label="社区成员数量">
              <Input
                name="member_count"
                type="number"
                min="0"
                max="1000000"
                step="1"
                defaultValue={memberCount}
                required
              />
            </AdminField>
            <p className="text-sm leading-6 text-muted-foreground">
              首页和合作页会统一显示为“{memberCount}+”。成员增长后，只需在这里更新一次。
            </p>
            <Button type="submit">保存成员数量</Button>
          </form>
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
