"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, Space, Statistic, Table, type TableColumnsType } from "antd";

import { AdminStatusTag } from "@/components/admin-antd";
import { AdminEventEditorModal } from "@/components/admin-antd/admin-event-editor-modal";
import { AdminToastSignals } from "@/components/admin-antd";
import { NativeSelect } from "@/components/admin-antd";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminEvent, AdminEventsData } from "@/lib/admin/events";
import {
  formatAdminEventDate,
  formatAdminEventStatus,
  formatAdminEventType,
  getAdminErrorMessage,
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

function getVenueText(event: AdminEvent) {
  if (event.venue) {
    return `${event.city ?? "常州"} · ${event.venue}`;
  }

  return event.city ?? "常州";
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

  const totalEventPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const currentEventPage = Math.min(requestedEventPage, totalEventPages);
  const eventPageStartIndex = (currentEventPage - 1) * EVENTS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(
    eventPageStartIndex,
    eventPageStartIndex + EVENTS_PER_PAGE,
  );
  const columns: TableColumnsType<AdminEvent> = [
    {
      title: "活动",
      dataIndex: "title",
      render: (_, event) => (
        <div>
          <Link className="font-semibold text-foreground hover:text-primary" href={`/admin/events/${event.id}`}>
            {event.title}
          </Link>
          <div className="mt-1 text-xs text-muted-foreground">{event.slug}</div>
          <div className="mt-2">
            <AdminStatusTag status="neutral" label={formatAdminEventType(event.event_type)} />
          </div>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (status) => <AdminStatusTag status={status} label={formatAdminEventStatus(status)} />,
    },
    {
      title: "时间",
      dataIndex: "event_at",
      width: 150,
      render: (value) => formatAdminEventDate(value),
    },
    {
      title: "地点",
      width: 180,
      render: (_, event) => getVenueText(event),
    },
    {
      title: "报名",
      width: 90,
      render: (_, event) => `${event.registrations.length} 人`,
    },
    {
      title: "操作",
      width: 150,
      align: "right",
      render: (_, event) => (
        <Space>
          <AdminEventEditorModal eventId={event.id} triggerLabel="编辑" onChanged={reload} />
          <Button size="small">
            <Link href={`/admin/events/${event.id}`}>详情</Link>
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

      <Card variant="outlined">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-sm text-muted-foreground">Events</span>
            <h1 className="m-0 text-3xl font-semibold">活动管理</h1>
          </div>
          <Space wrap>
            <Statistic title="活动总数" value={data?.events.length ?? 0} />
            <AdminEventEditorModal triggerLabel="新建活动" onChanged={reload} />
          </Space>
        </div>
      </Card>

      {error ? <Alert title={`后台数据读取出现问题：${error}`} type="warning" showIcon /> : null}
      {data && data.queryErrors.length > 0 ? (
        <Alert title={`后台数据读取出现问题：${data.queryErrors.join(" | ")}`} type="warning" showIcon />
      ) : null}

      <Card title="活动筛选" variant="outlined">
        <form
          action="/admin/events"
          className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
        >
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">活动搜索</span>
            <Input
              type="search"
              name="event_query"
              defaultValue={eventQueryInput}
              placeholder="搜索标题、链接、城市、地点"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">状态</span>
            <NativeSelect name="status" defaultValue={statusFilter}>
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="scheduled">已发布</option>
              <option value="completed">已结束</option>
              <option value="cancelled">已取消</option>
            </NativeSelect>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">时间</span>
            <NativeSelect name="timing" defaultValue={timingFilter}>
              <option value="all">全部时间</option>
              <option value="upcoming">未来活动</option>
              <option value="past">过去活动</option>
              <option value="unscheduled">未排期</option>
            </NativeSelect>
          </label>

          <div className="flex flex-wrap items-end gap-2">
            <Button htmlType="submit" type="primary" icon={<CalendarOutlined />}>
              筛选
            </Button>
            {eventQueryInput || statusFilter !== "all" || timingFilter !== "all" ? (
              <Button>
                <Link href="/admin/events">重置</Link>
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {showDebug && data ? (
        <Card title="数据诊断信息" variant="outlined">
          <pre className="overflow-x-auto rounded border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
            {JSON.stringify(data.debugSnapshot, null, 2)}
          </pre>
        </Card>
      ) : null}

      <Card
        title="活动结果"
        extra={`共 ${filteredEvents.length} 场 · 第 ${currentEventPage} / ${totalEventPages} 页`}
        variant="outlined"
      >
        <Table
          columns={columns}
          dataSource={paginatedEvents}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          locale={{
            emptyText:
              data && data.events.length > 0
                ? "当前筛选条件下没有活动数据。"
                : "创建活动后，即可继续补充详情、相册和报名信息。",
          }}
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            第 {currentEventPage} / {totalEventPages} 页
          </span>
          <Space wrap>
            <Button>
              <Link href={buildEventsFilterHref(statusFilter, timingFilter, eventQueryInput, 1)}>首页</Link>
            </Button>
            <Button>
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
            <Button>
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
            <Button>
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
            {data && data.events.length === 0 ? (
              <AdminEventEditorModal triggerLabel="去创建活动" onChanged={reload} />
            ) : null}
          </Space>
        </div>
      </Card>
    </div>
  );
}
