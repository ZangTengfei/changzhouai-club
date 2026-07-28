"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Empty, Table, type TableColumnsType } from "antd";

import {
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { AdminSponsorEditorModal } from "@/components/admin-sponsor-editor-modal";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { Button } from "@/components/admin-antd/button";
import { useAdminResource } from "@/components/use-admin-resource";
import {
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import type { AdminSponsor, AdminSponsorsData } from "@/lib/admin/sponsors";

const sponsorTierLabelMap: Record<string, string> = {
  core: "核心赞助者",
  partner: "共建伙伴",
  supporter: "支持伙伴",
};

export function AdminSponsorsPageClient() {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } =
    useAdminResource<AdminSponsorsData>("/api/admin/sponsors");

  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const showDebug = searchParams.get("debug") === "1";
  const sponsors = data?.sponsors ?? [];
  const columns: TableColumnsType<AdminSponsor> = [
    {
      title: "赞助者",
      key: "sponsor",
      width: 300,
      render: (_, sponsor) => (
        <div className="flex items-center gap-3">
          {sponsor.logo_url ? (
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/70 bg-muted/30 p-2">
              <img
                src={sponsor.logo_url}
                alt={`${sponsor.name} Logo`}
                className="max-h-full max-w-full object-contain"
              />
            </span>
          ) : null}
          <div className="grid min-w-0 gap-1">
            <Link
              href={`/admin/sponsors/${sponsor.id}`}
              className="font-semibold leading-6 text-foreground transition-colors hover:text-primary"
            >
              {sponsor.name}
            </Link>
            <span className="truncate text-xs text-muted-foreground">
              {sponsor.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "展示信息",
      key: "display",
      width: 420,
      render: (_, sponsor) => (
        <div className="grid gap-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {sponsor.sponsor_label ?? "未设置赞助标签"}
          </span>
          <span>{sponsorTierLabelMap[sponsor.tier] ?? sponsor.tier}</span>
          <span className="line-clamp-2 leading-6">
            {sponsor.summary ?? "暂未填写一句话介绍。"}
          </span>
          <span>排序 {sponsor.display_order}</span>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "is_active",
      key: "status",
      width: 120,
      render: (isActive: boolean) => (
        <AdminStatusBadge tone={isActive ? "completed" : "neutral"}>
          {isActive ? "公开展示" : "已隐藏"}
        </AdminStatusBadge>
      ),
    },
    {
      title: "图片",
      key: "images",
      width: 90,
      align: "center",
      render: (_, sponsor) => (
        <span className="text-sm text-muted-foreground">
          {sponsor.images.length} 张
        </span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 160,
      align: "right",
      fixed: "right",
      render: (_, sponsor) => (
        <div className="flex justify-end gap-2">
          <AdminSponsorEditorModal
            sponsorId={sponsor.id}
            triggerLabel="编辑"
            onChanged={reload}
          />
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/sponsors/${sponsor.id}`}>查看</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Sponsors"
          title="赞助者管理"
          actions={
            <>
              <AdminMetric
                label="赞助者"
                value={data?.sponsors.length ?? "..."}
              />
              <AdminSponsorEditorModal
                triggerLabel="新增赞助者"
                onChanged={reload}
              />
            </>
          }
        />
      </AdminPanel>

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>
          后台数据读取出现问题：{data.queryErrors.join(" | ")}
        </AdminNotice>
      ) : null}

      {showDebug && data ? (
        <AdminPanel>
          <AdminPanelHeader eyebrow="Diagnostics" title="数据诊断信息" />
          <AdminPanelBody>
            <pre className="overflow-x-auto rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
              {JSON.stringify(data.debugSnapshot, null, 2)}
            </pre>
          </AdminPanelBody>
        </AdminPanel>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="List" title="赞助者结果" />
        <AdminPanelBody className="p-0">
          <Table<AdminSponsor>
            rowKey="id"
            columns={columns}
            dataSource={sponsors}
            loading={{
              spinning: isLoading,
              description: "正在加载赞助者列表",
            }}
            size="middle"
            tableLayout="fixed"
            scroll={{ x: 1090 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="还没有赞助者"
                >
                  <AdminSponsorEditorModal
                    triggerLabel="去创建赞助者"
                    onChanged={reload}
                  />
                </Empty>
              ),
            }}
            pagination={
              sponsors.length > 10
                ? {
                    pageSize: 10,
                    showSizeChanger: false,
                    showTotal: (total, range) =>
                      `第 ${range[0]}–${range[1]} 个，共 ${total} 个赞助者`,
                  }
                : false
            }
          />
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
