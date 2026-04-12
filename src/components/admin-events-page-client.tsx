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
  type AdminTone,
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
import type { AdminEventsData } from "@/lib/admin/events";
import {
  formatAdminEventDate,
  formatAdminEventStatus,
  getAdminErrorMessage,
  getAdminEventStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

export function AdminEventsPageClient() {
  const searchParams = useSearchParams();
  const { data, error, isLoading } = useAdminResource<AdminEventsData>("/api/admin/events");

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
          eyebrow="Events"
          title="活动列表"
          actions={
            <>
              <AdminMetric label="活动总数" value={data?.events.length ?? "..."} />
              <Button asChild>
                <Link href="/admin/events/new">新建活动</Link>
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
        <AdminPanelHeader eyebrow="List" title="活动结果" />
        <AdminPanelBody className="p-0">
          {isLoading ? (
            <div className="p-4">
              <AdminNotice>正在加载活动列表...</AdminNotice>
            </div>
          ) : data && data.events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活动</TableHead>
                  <TableHead>时间与地点</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>数据概况</TableHead>
                  <TableHead className="w-[96px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="grid gap-1">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {event.title}
                        </Link>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {event.summary ?? "暂未填写活动简介。"}
                        </p>
                        <p className="text-xs text-muted-foreground">{event.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="grid gap-1">
                        <span className="font-medium text-foreground">
                          {formatAdminEventDate(event.event_at)}
                        </span>
                        <span>
                          {event.venue
                            ? `${event.city ?? "常州"} · ${event.venue}`
                            : (event.city ?? "常州")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge
                        tone={getAdminEventStatusTone(event.status) as AdminTone}
                      >
                        {formatAdminEventStatus(event.status)}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="grid gap-1">
                        <span>报名 {event.registrations.length}</span>
                        <span>照片 {event.photos.length}</span>
                        <span>封面 {event.cover_image_url ? "已设置" : "未设置"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/events/${event.id}`}>查看</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-3 p-4">
              <AdminNotice>创建活动后，即可继续补充详情、相册和报名信息。</AdminNotice>
              <Button asChild>
                <Link href="/admin/events/new">去创建活动</Link>
              </Button>
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
