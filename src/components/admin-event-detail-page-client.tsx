"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "antd";

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
import { AdminEventPhotosManagerClient } from "@/components/admin-event-photos-manager-client";
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
                <Link href={`/events/${eventDetail.slug}`} target="_blank" rel="noreferrer">
                  <Button>
                    查看公开页
                  </Button>
                </Link>
                <Link href="/admin/events">
                  <Button>返回活动列表</Button>
                </Link>
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
                  <a
                    href={`/api/admin/events/registrations/export?event_id=${encodeURIComponent(eventDetail.id)}`}
                    download
                    aria-label={`导出 ${eventDetail.title} 的报名记录 CSV`}
                  >
                    <Button htmlType="button" size="small">
                      导出报名
                    </Button>
                  </a>
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
        </>
      ) : null}
    </AdminPageStack>
  );
}
