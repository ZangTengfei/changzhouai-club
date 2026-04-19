"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminResource } from "@/components/use-admin-resource";
import {
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import type { AdminSponsorsData } from "@/lib/admin/sponsors";

export function AdminSponsorsPageClient() {
  const searchParams = useSearchParams();
  const { data, error, isLoading } = useAdminResource<AdminSponsorsData>("/api/admin/sponsors");

  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const showDebug = searchParams.get("debug") === "1";

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
              <AdminMetric label="赞助者" value={data?.sponsors.length ?? "..."} />
              <Button asChild>
                <Link href="/admin/sponsors/new">新增赞助者</Link>
              </Button>
            </>
          }
        />
      </AdminPanel>

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
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
          {isLoading ? (
            <div className="p-4">
              <AdminNotice>正在加载赞助者列表...</AdminNotice>
            </div>
          ) : data && data.sponsors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>赞助者</TableHead>
                  <TableHead>展示信息</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>图片</TableHead>
                  <TableHead className="w-[96px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sponsors.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {sponsor.logo_url ? (
                          <span className="grid size-14 place-items-center overflow-hidden rounded-lg border border-border/70 bg-muted/30 p-2">
                            <img
                              src={sponsor.logo_url}
                              alt={`${sponsor.name} Logo`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </span>
                        ) : null}
                        <div className="grid gap-1">
                          <Link
                            href={`/admin/sponsors/${sponsor.id}`}
                            className="font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {sponsor.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{sponsor.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {sponsor.sponsor_label ?? "未设置赞助标签"}
                        </span>
                        <span className="line-clamp-2">
                          {sponsor.summary ?? "暂未填写一句话介绍。"}
                        </span>
                        <span>排序 {sponsor.display_order}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge tone={sponsor.is_active ? "completed" : "neutral"}>
                        {sponsor.is_active ? "公开展示" : "已隐藏"}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      图片 {sponsor.images.length}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/sponsors/${sponsor.id}`}>查看</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-3 p-4">
              <AdminNotice>创建赞助者后，即可在首页和赞助者详情页展示。</AdminNotice>
              <Button asChild>
                <Link href="/admin/sponsors/new">去创建赞助者</Link>
              </Button>
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
