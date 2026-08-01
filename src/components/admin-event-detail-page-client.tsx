"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Tabs } from "antd";
import { toast } from "sonner";

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
import { AdminEventEditorFormClient } from "@/components/admin-event-editor-form-client";
import { AdminEventCheckinPanelClient } from "@/components/admin-event-checkin-panel-client";
import { AdminEventPhotosManagerClient } from "@/components/admin-event-photos-manager-client";
import { Button } from "@/components/admin-antd/button";
import { NativeSelect } from "@/components/admin-antd/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin-antd/table";
import { useAdminResource } from "@/components/use-admin-resource";
import {
  formatAdminEventDate,
  formatAdminEventStatus,
  formatAdminEventType,
  formatAdminRegistrationStatus,
  getAdminErrorMessage,
  getAdminEventStatusTone,
  getAdminRegistrationStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import type { AdminEvent } from "@/lib/admin/events";
import { formatEventVisibility } from "@/lib/event-visibility";

type AdminEventDetailData = {
  event: AdminEvent;
  queryErrors: string[];
  permissions?: {
    canExportRegistrations: boolean;
    canManageRegistrations: boolean;
    canManageCheckin: boolean;
  };
};

export function AdminEventDetailPageClient({ eventId }: { eventId: string }) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } =
    useAdminResource<AdminEventDetailData>(`/api/admin/events/${eventId}`);
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const eventDetail = data?.event;
  const [isAttendancePending, startAttendanceTransition] = useTransition();
  const [isRegistrationPending, startRegistrationTransition] = useTransition();
  const averageFeedbackRating = eventDetail?.feedback.length
    ? (
        eventDetail.feedback.reduce(
          (sum, feedback) => sum + feedback.rating,
          0,
        ) / eventDetail.feedback.length
      ).toFixed(1)
    : null;
  const confirmedRegistrationCount =
    eventDetail?.registrations.filter(
      (registration) => registration.status === "registered",
    ).length ?? 0;
  const pendingRegistrationCount =
    eventDetail?.registrations.filter(
      (registration) => registration.status === "pending",
    ).length ?? 0;

  function updateAttendance(userId: string, status: string) {
    if (!eventDetail) return;
    startAttendanceTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/events/${eventDetail.id}/attendance`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, status }),
          },
        );
        if (!response.ok) throw new Error("attendance_update_failed");
        toast.success("签到状态已更新。");
        reload();
      } catch {
        toast.error("签到状态更新失败，请稍后重试。");
      }
    });
  }

  function updateRegistrationStatus(registrationId: string, status: string) {
    if (!eventDetail) return;
    startRegistrationTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/events/${eventDetail.id}/registrations/${registrationId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          },
        );
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (!response.ok) {
          throw new Error(payload?.error ?? "registration_update_failed");
        }
        toast.success("报名状态已更新。");
        reload();
      } catch (updateError) {
        toast.error(
          updateError instanceof Error &&
            updateError.message === "event_capacity_reached"
            ? "确认人数已经达到上限，可将该报名设为候补。"
            : "报名状态更新失败，请稍后重试。",
        );
      }
    });
  }

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      {eventDetail ? (
        <AdminPanel>
          <AdminPanelHeader
            eyebrow="Event Detail"
            title={eventDetail.title}
            actions={
              <>
                <AdminMetric
                  label="已确认"
                  value={`${confirmedRegistrationCount}${
                    eventDetail.registration_capacity
                      ? ` / ${eventDetail.registration_capacity}`
                      : ""
                  }`}
                />
                {pendingRegistrationCount > 0 ? (
                  <AdminMetric label="待审核" value={pendingRegistrationCount} />
                ) : null}
                <Button asChild>
                  <Link
                    href={`/events/${eventDetail.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    查看公开页
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/admin/events">返回活动列表</Link>
                </Button>
              </>
            }
          />
          <AdminPanelBody className="flex flex-wrap gap-2">
            <AdminStatusBadge
              tone={getAdminEventStatusTone(eventDetail.status) as AdminTone}
            >
              {formatAdminEventStatus(eventDetail.status)}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {formatAdminEventType(eventDetail.event_type)}
            </AdminStatusBadge>
            <AdminStatusBadge
              tone={eventDetail.visibility === "admin_only" ? "admin" : "neutral"}
            >
              {formatEventVisibility(eventDetail.visibility)}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {formatAdminEventDate(eventDetail.event_at)}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              照片 {eventDetail.photos.length}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {eventDetail.registration_mode === "review"
                ? "报名后审核"
                : "报名即确认"}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {eventDetail.registration_capacity
                ? `限 ${eventDetail.registration_capacity} 人`
                : "不限人数"}
            </AdminStatusBadge>
          </AdminPanelBody>
        </AdminPanel>
      ) : null}

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>
          后台数据读取出现问题：{data.queryErrors.join(" | ")}
        </AdminNotice>
      ) : null}
      {isLoading ? <AdminNotice>正在加载活动详情...</AdminNotice> : null}

      {eventDetail ? (
        <Tabs
          defaultActiveKey="settings"
          items={[
            {
              key: "settings",
              label: "活动设置",
              children: (
                <AdminEventEditorFormClient
                  event={eventDetail}
                  onSaved={reload}
                />
              ),
            },
            {
              key: "photos",
              label: `照片（${eventDetail.photos.length}）`,
              children: (
                <AdminEventPhotosManagerClient
                  eventId={eventDetail.id}
                  eventSlug={eventDetail.slug}
                  eventTitle={eventDetail.title}
                  coverImageUrl={eventDetail.cover_image_url}
                  photos={eventDetail.photos}
                  onChanged={reload}
                />
              ),
            },
            {
              key: "registrations",
              label: `报名与签到（${eventDetail.registrations.length}）`,
              children: (
                <AdminPageStack>
                  {data?.permissions?.canManageCheckin ? (
                    <AdminEventCheckinPanelClient
                      eventId={eventDetail.id}
                      eventTitle={eventDetail.title}
                    />
                  ) : null}
                  <AdminPanel>
                    <AdminPanelHeader
                      eyebrow="Registrations"
                      title={`${eventDetail.title} 的报名名单`}
                      actions={
                        data?.permissions?.canExportRegistrations ? (
                          <Button
                            asChild
                            type="button"
                            variant="outline"
                            size="sm"
                          >
                            <a
                              href={`/api/admin/events/registrations/export?event_id=${encodeURIComponent(eventDetail.id)}`}
                              download
                              aria-label={`导出 ${eventDetail.title} 的报名记录 CSV`}
                            >
                              导出报名
                            </a>
                          </Button>
                        ) : null
                      }
                    />
                    <AdminPanelBody className="overflow-x-auto p-0">
                      {eventDetail.registrations.length > 0 ? (
                        <Table className="min-w-[1180px] table-fixed [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_th]:px-4 [&_th]:py-3 [&_th]:whitespace-nowrap">
                          <colgroup>
                            <col className="w-[22%]" />
                            <col className="w-[18%]" />
                            <col className="w-[11%]" />
                            <col className="w-[13%]" />
                            <col className="w-[11%]" />
                            <col className="w-[13%]" />
                            <col className="w-[12%]" />
                          </colgroup>
                          <TableHeader>
                            <TableRow>
                              <TableHead>成员</TableHead>
                              <TableHead>联系信息</TableHead>
                              <TableHead>状态</TableHead>
                              <TableHead>肖像授权</TableHead>
                              <TableHead>签到</TableHead>
                              <TableHead>报名时间</TableHead>
                              <TableHead>备注</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {eventDetail.registrations.map((registration) => (
                              <TableRow key={registration.id}>
                                <TableCell>
                                  <div className="grid gap-1">
                                    <Link
                                      href={`/admin/members/${registration.user_id}`}
                                      className="w-fit font-semibold text-foreground transition-colors hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                      {registration.profile?.display_name ??
                                        "未填写显示名"}
                                    </Link>
                                    <span
                                      className="block truncate whitespace-nowrap font-mono text-xs leading-5 text-muted-foreground"
                                      title={`用户 ID: ${registration.user_id}`}
                                    >
                                      用户 ID: {registration.user_id}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="ant-table-cell text-sm text-muted-foreground">
                                  <div className="grid gap-1">
                                    <span className="break-all">
                                      {registration.profile?.phone_number ??
                                        registration.profile?.email ??
                                        "未提供联系方式"}
                                    </span>
                                    {registration.profile?.phone_number &&
                                    registration.profile.email ? (
                                      <span className="break-all text-xs">
                                        邮箱：{registration.profile.email}
                                      </span>
                                    ) : null}
                                    <span className="text-xs">
                                      城市：{registration.profile?.city ?? "未填写"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {data?.permissions
                                    ?.canManageRegistrations ? (
                                    <NativeSelect
                                      className="w-full"
                                      value={registration.status}
                                      disabled={isRegistrationPending}
                                      aria-label={`更新${registration.profile?.display_name ?? "成员"}的报名状态`}
                                      onChange={(event) =>
                                        updateRegistrationStatus(
                                          registration.id,
                                          event.target.value,
                                        )
                                      }
                                    >
                                      <option value="pending">待审核</option>
                                      <option value="registered">已确认</option>
                                      <option value="waitlisted">候补</option>
                                      <option value="cancelled">已取消</option>
                                    </NativeSelect>
                                  ) : (
                                    <AdminStatusBadge
                                      tone={
                                        getAdminRegistrationStatusTone(
                                          registration.status,
                                        ) as AdminTone
                                      }
                                    >
                                      {formatAdminRegistrationStatus(
                                        registration.status,
                                      )}
                                    </AdminStatusBadge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <AdminStatusBadge
                                    tone={
                                      registration.portraitConsentAccepted
                                        ? "active"
                                        : "neutral"
                                    }
                                  >
                                    {registration.portraitConsentAccepted
                                      ? "已授权"
                                      : "未授权"}
                                  </AdminStatusBadge>
                                  {registration.portraitConsentAcceptedAt ? (
                                    <time
                                      dateTime={
                                        registration.portraitConsentAcceptedAt
                                      }
                                      className="mt-2 grid text-xs leading-5 text-muted-foreground"
                                    >
                                      <span>
                                        {new Date(
                                          registration.portraitConsentAcceptedAt,
                                        ).toLocaleDateString("zh-CN")}
                                      </span>
                                      <span>
                                        {new Date(
                                          registration.portraitConsentAcceptedAt,
                                        ).toLocaleTimeString("zh-CN", {
                                          hour12: false,
                                        })}
                                      </span>
                                    </time>
                                  ) : null}
                                </TableCell>
                                <TableCell>
                                  <NativeSelect
                                    className="w-full"
                                    value={
                                      registration.attendance?.status ?? "none"
                                    }
                                    disabled={
                                      isAttendancePending ||
                                      !data?.permissions?.canManageCheckin
                                    }
                                    aria-label={`更新${registration.profile?.display_name ?? "成员"}的签到状态`}
                                    onChange={(event) =>
                                      updateAttendance(
                                        registration.user_id,
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value="none">未签到</option>
                                    <option value="attended">已到场</option>
                                    <option value="late">迟到</option>
                                    <option value="speaker">分享嘉宾</option>
                                    <option value="absent">缺席</option>
                                  </NativeSelect>
                                </TableCell>
                                <TableCell className="ant-table-cell text-sm text-muted-foreground">
                                  <time
                                    dateTime={registration.created_at}
                                    className="grid whitespace-nowrap leading-5"
                                  >
                                    <span>
                                      {new Date(
                                        registration.created_at,
                                      ).toLocaleDateString("zh-CN")}
                                    </span>
                                    <span>
                                      {new Date(
                                        registration.created_at,
                                      ).toLocaleTimeString("zh-CN", {
                                        hour12: false,
                                      })}
                                    </span>
                                  </time>
                                </TableCell>
                                <TableCell className="ant-table-cell break-words text-sm leading-5 text-muted-foreground">
                                  {registration.note ?? "无备注"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-4">
                          <AdminNotice>
                            这场活动暂时还没有报名记录。
                          </AdminNotice>
                        </div>
                      )}
                    </AdminPanelBody>
                  </AdminPanel>
                </AdminPageStack>
              ),
            },
            {
              key: "feedback",
              label: `活动反馈（${eventDetail.feedback.length}）`,
              children: (
                <AdminPanel>
                  <AdminPanelHeader
                    eyebrow="Event Feedback"
                    title="活动反馈"
                    actions={
                      averageFeedbackRating ? (
                        <AdminMetric
                          label="平均评分"
                          value={averageFeedbackRating}
                        />
                      ) : null
                    }
                  />
                  <AdminPanelBody className="p-0">
                    {eventDetail.feedback.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>成员</TableHead>
                            <TableHead>评分</TableHead>
                            <TableHead>反馈</TableHead>
                            <TableHead>提交时间</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eventDetail.feedback.map((feedback) => (
                            <TableRow key={feedback.id}>
                              <TableCell className="font-medium text-foreground">
                                {feedback.profile?.display_name ??
                                  "未填写显示名"}
                              </TableCell>
                              <TableCell>{feedback.rating} / 5</TableCell>
                              <TableCell className="max-w-xl text-sm text-muted-foreground">
                                {feedback.comment ?? "未填写文字反馈"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(feedback.submitted_at).toLocaleString(
                                  "zh-CN",
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4">
                        <AdminNotice>这场活动暂时还没有成员反馈。</AdminNotice>
                      </div>
                    )}
                  </AdminPanelBody>
                </AdminPanel>
              ),
            },
          ]}
        />
      ) : null}
    </AdminPageStack>
  );
}
