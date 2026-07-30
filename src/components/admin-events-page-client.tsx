"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Empty, Table, type TableColumnsType } from "antd";

import {
  AdminField,
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
import { Button } from "@/components/admin-antd/button";
import { Input } from "@/components/admin-antd/input";
import { NativeSelect } from "@/components/admin-antd/native-select";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminEvent, AdminEventsData } from "@/lib/admin/events";
import { formatEventVisibility } from "@/lib/event-visibility";
import {
  formatAdminEventDate,
  formatAdminEventStatus,
  formatAdminEventType,
  getAdminErrorMessage,
  getAdminEventStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

const EVENTS_PER_PAGE = 10;

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesKeyword(
  fields: Array<string | null | undefined>,
  keyword: string,
) {
  if (!keyword) {
    return true;
  }

  return fields.some((field) =>
    normalizeSearchText(field ?? "").includes(keyword),
  );
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } =
    useAdminResource<AdminEventsData>("/api/admin/events");

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

      const eventTime = event.event_at
        ? new Date(event.event_at).getTime()
        : null;

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
        [
          event.title,
          event.slug,
          event.summary,
          event.city,
          event.venue,
          formatAdminEventType(event.event_type),
        ],
        eventKeyword,
      );
    }) ?? [];

  const totalEventPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / EVENTS_PER_PAGE),
  );
  const currentEventPage = Math.min(requestedEventPage, totalEventPages);
  const columns: TableColumnsType<AdminEvent> = [
    {
      title: "活动标题",
      dataIndex: "title",
      key: "title",
      width: 360,
      render: (title: string, event) => (
        <Link
          href={`/admin/events/${event.id}`}
          className="font-semibold leading-6 text-foreground transition-colors hover:text-primary"
        >
          {title}
        </Link>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: string) => (
        <AdminStatusBadge tone={getAdminEventStatusTone(status) as AdminTone}>
          {formatAdminEventStatus(status)}
        </AdminStatusBadge>
      ),
    },
    {
      title: "可见范围",
      dataIndex: "visibility",
      key: "visibility",
      width: 130,
      render: (visibility: string) => (
        <AdminStatusBadge tone={visibility === "admin_only" ? "admin" : "neutral"}>
          {formatEventVisibility(visibility)}
        </AdminStatusBadge>
      ),
    },
    {
      title: "时间",
      dataIndex: "event_at",
      key: "event_at",
      width: 190,
      render: (eventAt: string | null) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatAdminEventDate(eventAt)}
        </span>
      ),
    },
    {
      title: "地点",
      key: "venue",
      width: 300,
      render: (_, event) => (
        <span className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {event.venue
            ? `${event.city ?? "常州"} · ${event.venue}`
            : (event.city ?? "常州")}
        </span>
      ),
    },
    {
      title: "报名",
      key: "registrations",
      width: 90,
      align: "center",
      render: (_, event) => (
        <span className="text-sm text-muted-foreground">
          {event.registrations.length} 人
        </span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      align: "right",
      fixed: "right",
      render: (_, event) => (
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
      ),
    },
  ];

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

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
        <AdminPanelBody className="border-b border-border/70">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                活动管理
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                共 {filteredEvents.length} 场活动
              </p>
            </div>
            <AdminEventEditorModal triggerLabel="新建活动" onChanged={reload} />
          </div>

          <form
            action="/admin/events"
            className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_minmax(140px,0.7fr)_minmax(140px,0.7fr)_auto]"
          >
            <AdminField label="活动搜索">
              <Input
                type="search"
                name="event_query"
                defaultValue={eventQueryInput}
                placeholder="搜索标题、城市或地点"
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
              {eventQueryInput ||
              statusFilter !== "all" ||
              timingFilter !== "all" ? (
                <Button asChild variant="outline">
                  <Link href="/admin/events">重置</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </AdminPanelBody>
        <AdminPanelBody className="p-0">
          <Table<AdminEvent>
            rowKey="id"
            columns={columns}
            dataSource={filteredEvents}
            loading={{
              spinning: isLoading,
              description: "正在加载活动数据",
            }}
            size="middle"
            tableLayout="fixed"
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    data && data.events.length > 0
                      ? "当前筛选条件下没有活动"
                      : "暂时还没有活动"
                  }
                />
              ),
            }}
            pagination={{
              current: currentEventPage,
              pageSize: EVENTS_PER_PAGE,
              total: filteredEvents.length,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `第 ${range[0]}–${range[1]} 条，共 ${total} 场活动`,
              onChange: (page) =>
                router.push(
                  buildEventsFilterHref(
                    statusFilter,
                    timingFilter,
                    eventQueryInput,
                    page,
                  ),
                ),
            }}
          />
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
