"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EyeOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Image,
  Space,
  Statistic,
  Table,
  Typography,
  type TableColumnsType,
} from "antd";

import { AdminStatusTag } from "@/components/admin-antd";
import { AdminSponsorEditorModal } from "@/components/admin-sponsor-editor-modal";
import { AdminToastSignals } from "@/components/admin-antd";
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
  const { data, error, isLoading, reload } = useAdminResource<AdminSponsorsData>(
    "/api/admin/sponsors",
  );

  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const showDebug = searchParams.get("debug") === "1";
  const activeCount = data?.sponsors.filter((sponsor) => sponsor.is_active).length ?? 0;
  const imageCount = data?.sponsors.reduce((total, sponsor) => total + sponsor.images.length, 0) ?? 0;

  const columns: TableColumnsType<AdminSponsor> = [
    {
      title: "赞助者",
      dataIndex: "name",
      render: (_, sponsor) => (
        <Space>
          {sponsor.logo_url ? (
            <span className="grid size-14 place-items-center overflow-hidden rounded-lg border border-border/70 bg-muted/30 p-2">
              <Image
                src={sponsor.logo_url}
                alt={`${sponsor.name} Logo`}
                preview={false}
                className="max-h-full max-w-full object-contain"
              />
            </span>
          ) : null}
          <Space orientation="vertical" size={2}>
            <Link
              href={`/admin/sponsors/${sponsor.id}`}
              className="font-semibold text-foreground hover:text-primary"
            >
              {sponsor.name}
            </Link>
            <Typography.Text type="secondary">{sponsor.slug}</Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "展示信息",
      render: (_, sponsor) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{sponsor.sponsor_label ?? "未设置赞助标签"}</Typography.Text>
          <Typography.Text type="secondary">{sponsorTierLabelMap[sponsor.tier] ?? sponsor.tier}</Typography.Text>
          <Typography.Text type="secondary">{sponsor.summary ?? "暂未填写一句话介绍。"}</Typography.Text>
          <Typography.Text type="secondary">排序 {sponsor.display_order}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "状态",
      width: 110,
      render: (_, sponsor) => (
        <AdminStatusTag
          status={sponsor.is_active ? "published" : "archived"}
          label={sponsor.is_active ? "公开展示" : "已隐藏"}
        />
      ),
    },
    {
      title: "图片",
      width: 90,
      render: (_, sponsor) => <Typography.Text type="secondary">{sponsor.images.length}</Typography.Text>,
    },
    {
      title: "操作",
      width: 150,
      align: "right",
      render: (_, sponsor) => (
        <Space>
          <AdminSponsorEditorModal
            sponsorId={sponsor.id}
            triggerLabel="编辑"
            onChanged={reload}
          />
          <Button icon={<EyeOutlined />} href={`/admin/sponsors/${sponsor.id}`}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      <Card className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Typography.Text type="secondary">Sponsors</Typography.Text>
            <Typography.Title level={2} style={{ margin: "4px 0 0" }}>
              赞助者管理
            </Typography.Title>
          </div>
          <Space wrap size="large">
            <Statistic title="赞助者" value={data?.sponsors.length ?? 0} />
            <Statistic title="公开展示" value={activeCount} />
            <Statistic title="图片" value={imageCount} />
            <AdminSponsorEditorModal triggerLabel="新增赞助者" onChanged={reload} />
          </Space>
        </div>
      </Card>

      {error ? <Alert title={`后台数据读取出现问题：${error}`} type="warning" showIcon /> : null}
      {data && data.queryErrors.length > 0 ? (
        <Alert title={`后台数据读取出现问题：${data.queryErrors.join(" | ")}`} type="warning" showIcon />
      ) : null}

      {showDebug && data ? (
        <Card className="min-w-0" title="数据诊断信息">
          <pre className="overflow-x-auto rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
            {JSON.stringify(data.debugSnapshot, null, 2)}
          </pre>
        </Card>
      ) : null}

      <Card className="min-w-0" title="赞助者结果">
        <Table
          columns={columns}
          dataSource={data?.sponsors ?? []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          scroll={{ x: 920 }}
          locale={{
            emptyText: (
              <Space orientation="vertical">
                <Typography.Text type="secondary">创建赞助者后，即可在首页和赞助者详情页展示。</Typography.Text>
                <AdminSponsorEditorModal triggerLabel="去创建赞助者" onChanged={reload} />
              </Space>
            ),
          }}
        />
      </Card>
    </div>
  );
}
