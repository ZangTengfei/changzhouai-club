"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  AdminField,
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
  type AdminTone,
} from "@/components/admin-ui";
import { AdminEventEditorModal } from "@/components/admin-event-editor-modal";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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

const EVENTS_PER_PAGE = 10;

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesKeyword(fields: Array<string | null | undefined>, keyword: string) {
  if (!keyword) {
    return true;
  }

  return fields.some((field) => normalizeSearchText(field ?? "").includes(keyword));
}

function parsePage(value: string | null) {
  const page = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(page) || page < 1) {
    return 1;
  }

  return page;
}

function buildEventsFilterHref(
  status: string,
  timing: string,
  eventQuery: string,
  eventPage = 1,
) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (timing !== "all") {
    params.set("timing", timing);
  }

  if (eventQuery.trim()) {
    params.set("event_query", eventQuery.trim());
  }

  if (eventPage > 1) {
    params.set("event_page", String(eventPage));
  }

  const query = params.toString();
  return query ? `/admin/events?${query}` : "/admin/events";
}

export function AdminEventsPageClient() {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminEventsData>(
    "/api/admin/events",
  );

  const statusFilter = searchParams.get("status") ?? "all";
  const timingFilter = searchParams.get("timing") ?? "all";
  const eventQueryInput = (searchParams.get("event_query") ?? "").trim();
  const requestedEventPage = parsePage(searchParams.get("event_page"));
  const eventKeyword = normalizeSearchText(eventQueryInput);
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const showDebug = searchParams.get("debug") === "1";
  const now = Date.now();

  const filteredEvents =
    data?.events.filter((event) => {
      if (statusFilter !== "all" && event.status !== statusFilter) {
        return false;
      }

      const eventTime = event.event_at ? new Date(event.event_at).getTime() : null;

      if (timingFilter === "upcoming" && (!eventTime || eventTime < now)) {
        return false;
      }

      if (timingFilter === "past" && (!eventTime || eventTime >= now)) {
        return false;
      }

      if (timingFilter === "unscheduled" && eventTime) {
        return false;
      }

      return matchesKeyword(
        [event.title, event.slug, event.summary, event.city, event.venue],
        eventKeyword,
      );
    }) ?? [];

  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const currentEventPage = Math.min(requestedEventPage, totalEventPages);
  const eventPageStartIndex = (currentEventPage - 1) * EVENTS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(
    eventPageStartIndex,
    eventPageStartIndex + EVENTS_PER_PAGE,
  );

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
              <AdminEventEditorModal triggerLabel="新建活动" onChanged={reload} />
            </>
          }
        />
      </AdminPanel>

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="Filters" title="活动筛选" />
        <AdminPanelBody>
          <form
            action="/admin/events"
            className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
          >
            <AdminField label="活动搜索">
              <Input
                type="search"
                name="event_query"
                defaultValue={eventQueryInput}
                placeholder="搜索标题、链接、城市、地点"
              />
            </AdminField>

            <AdminField label="状态">
              <NativeSelect name="status" defaultValue={statusFilter}>
                <option value="all">全部状态</option>
                <option value="draft">草稿</option>
                <option value="scheduled">已发布</option>
                <option value="completed">已结束</option>
                <option value="cancelled">已取消</option>
              </NativeSelect>
            </AdminField>

            <AdminField label="时间">
              <NativeSelect name="timing" defaultValue={timingFilter}>
                <option value="all">全部时间</option>
                <option value="upcoming">未来活动</option>
                <option value="past">过去活动</option>
                <option value="unscheduled">未排期</option>
              </NativeSelect>
            </AdminField>

            <div className="flex flex-wrap items-end gap-2">
              <Button type="submit" variant="secondary">
                筛选
              </Button>
              {eventQueryInput || statusFilter !== "all" || timingFilter !== "all" ? (
                <Button asChild variant="outline">
                  <Link href="/admin/events">重置</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </AdminPanelBody>
      </AdminPanel>

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
        <AdminPanelHeader
          eyebrow="List"
          title="活动结果"
          actions={
            <span className="text-sm text-muted-foreground">
              共 {filteredEvents.length} 场 · 第 {currentEventPage} / {totalEventPages} 页
            </span>
          }
        />
        <AdminPanelBody className="p-0">
          {isLoading ? (
            <div className="p-4">
              <AdminNotice>正在加载活动列表...</AdminNotice>
            </div>
          ) : paginatedEvents.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">活动</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>地点</TableHead>
                    <TableHead>报名</TableHead>
                    <TableHead className="w-[96px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="grid gap-1">
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {event.title}
                          </Link>
                          <span className="text-xs text-muted-foreground">{event.slug}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge
                          tone={getAdminEventStatusTone(event.status) as AdminTone}
                        >
                          {formatAdminEventStatus(event.status)}
                        </AdminStatusBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatAdminEventDate(event.event_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.venue
                          ? `${event.city ?? "常州"} · ${event.venue}`
                          : (event.city ?? "常州")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.registrations.length} 人
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <AdminEventEditorModal
                            eventId={event.id}
                            triggerLabel="编辑"
                            onChanged={reload}
                          />
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/events/${event.id}`}>详情</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  第 {currentEventPage} / {totalEventPages} 页
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={buildEventsFilterHref(statusFilter, timingFilter, eventQueryInput, 1)}
                    >
                      首页
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={buildEventsFilterHref(
                        statusFilter,
                        timingFilter,
                        eventQueryInput,
                        Math.max(1, currentEventPage - 1),
                      )}
                    >
                      上一页
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={buildEventsFilterHref(
                        statusFilter,
                        timingFilter,
                        eventQueryInput,
                        Math.min(totalEventPages, currentEventPage + 1),
                      )}
                    >
                      下一页
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={buildEventsFilterHref(
                        statusFilter,
                        timingFilter,
                        eventQueryInput,
                        totalEventPages,
                      )}
                    >
                      末页
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3 p-4">
              <AdminNotice>
                {data && data.events.length > 0
                  ? "当前筛选条件下没有活动数据。"
                  : "创建活动后，即可继续补充详情、相册和报名信息。"}
              </AdminNotice>
              {data && data.events.length > 0 ? null : (
                <AdminEventEditorModal triggerLabel="去创建活动" onChanged={reload} />
              )}
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
