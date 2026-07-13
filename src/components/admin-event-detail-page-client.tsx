"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
import { Button } from "@/components/ui/button";
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

type AdminEventDetailData = {
  event: AdminEvent;
  queryErrors: string[];
  permissions?: {
    canExportRegistrations: boolean;
    canManageCheckin: boolean;
  };
};

export function AdminEventDetailPageClient({ eventId }: { eventId: string }) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminEventDetailData>(
    `/api/admin/events/${eventId}`,
  );
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const eventDetail = data?.event;
  const [isAttendancePending, startAttendanceTransition] = useTransition();
  const averageFeedbackRating = eventDetail?.feedback.length
    ? (
        eventDetail.feedback.reduce((sum, feedback) => sum + feedback.rating, 0) /
        eventDetail.feedback.length
      ).toFixed(1)
    : null;

  function updateAttendance(userId: string, status: string) {
    if (!eventDetail) return;
    startAttendanceTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventDetail.id}/attendance`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, status }),
        });
        if (!response.ok) throw new Error("attendance_update_failed");
        toast.success("签到状态已更新。");
        reload();
      } catch {
        toast.error("签到状态更新失败，请稍后重试。");
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
                <AdminMetric label="当前报名" value={eventDetail.registrations.length} />
                <Button asChild>
                  <Link href={`/events/${eventDetail.slug}`} target="_blank" rel="noreferrer">
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
            <AdminStatusBadge tone={getAdminEventStatusTone(eventDetail.status) as AdminTone}>
              {formatAdminEventStatus(eventDetail.status)}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {formatAdminEventType(eventDetail.event_type)}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {formatAdminEventDate(eventDetail.event_at)}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">照片 {eventDetail.photos.length}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              报名 {eventDetail.registrations.length}
            </AdminStatusBadge>
          </AdminPanelBody>
        </AdminPanel>
      ) : null}

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}
      {isLoading ? <AdminNotice>正在加载活动详情...</AdminNotice> : null}

      {eventDetail ? (
        <>
          {data?.permissions?.canManageCheckin ? (
            <AdminEventCheckinPanelClient
              eventId={eventDetail.id}
              eventTitle={eventDetail.title}
            />
          ) : null}

          <AdminEventEditorFormClient event={eventDetail} onSaved={reload} />

          <AdminEventPhotosManagerClient
            eventId={eventDetail.id}
            eventSlug={eventDetail.slug}
            eventTitle={eventDetail.title}
            coverImageUrl={eventDetail.cover_image_url}
            photos={eventDetail.photos}
            onChanged={reload}
          />

          <AdminPanel>
            <AdminPanelHeader
              eyebrow="Registrations"
              title={`${eventDetail.title} 的报名名单`}
              actions={
                data?.permissions?.canExportRegistrations ? (
                  <Button asChild type="button" variant="outline" size="sm">
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
            <AdminPanelBody className="p-0">
              {eventDetail.registrations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>成员</TableHead>
                      <TableHead>联系信息</TableHead>
                      <TableHead>状态</TableHead>
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
                            <span className="font-semibold text-foreground">
                              {registration.profile?.display_name ?? "未填写显示名"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              用户 ID: {registration.user_id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="grid gap-1">
                            <span>{registration.profile?.email ?? "未提供邮箱"}</span>
                            <span>{registration.profile?.city ?? "未填写城市"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <AdminStatusBadge
                            tone={
                              getAdminRegistrationStatusTone(registration.status) as AdminTone
                            }
                          >
                            {formatAdminRegistrationStatus(registration.status)}
                          </AdminStatusBadge>
                        </TableCell>
                        <TableCell>
                          <NativeSelect
                            value={registration.attendance?.status ?? "none"}
                            disabled={
                              isAttendancePending || !data?.permissions?.canManageCheckin
                            }
                            aria-label={`更新${registration.profile?.display_name ?? "成员"}的签到状态`}
                            onChange={(event) =>
                              updateAttendance(registration.user_id, event.target.value)
                            }
                          >
                            <option value="none">未签到</option>
                            <option value="attended">已到场</option>
                            <option value="late">迟到</option>
                            <option value="speaker">分享嘉宾</option>
                            <option value="absent">缺席</option>
                          </NativeSelect>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(registration.created_at).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {registration.note ?? "无备注"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-4">
                  <AdminNotice>这场活动暂时还没有报名记录。</AdminNotice>
                </div>
              )}
            </AdminPanelBody>
          </AdminPanel>

          <AdminPanel>
            <AdminPanelHeader
              eyebrow="Event Feedback"
              title="活动反馈"
              actions={
                averageFeedbackRating ? (
                  <AdminMetric label="平均评分" value={averageFeedbackRating} />
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
                          {feedback.profile?.display_name ?? "未填写显示名"}
                        </TableCell>
                        <TableCell>{feedback.rating} / 5</TableCell>
                        <TableCell className="max-w-xl text-sm text-muted-foreground">
                          {feedback.comment ?? "未填写文字反馈"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(feedback.submitted_at).toLocaleString("zh-CN")}
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
        </>
      ) : null}
    </AdminPageStack>
  );
}
