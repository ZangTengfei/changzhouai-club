"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EyeOutlined,
  LinkOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Empty, Table, type TableColumnsType } from "antd";

import {
  AdminModal,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
  AdminToastSignals,
  type AdminTone,
} from "@/components/admin-antd";
import { AdminEventEditorModal } from "@/components/admin-antd/admin-event-editor-modal";
import { AdminEventPhotosManagerClient } from "@/components/admin-antd/admin-event-photos-manager-client";
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
type AdminRegistration = AdminEvent["registrations"][number];

function getVenueText(event: AdminEvent) {
  if (event.venue) {
    return `${event.city ?? "常州"} · ${event.venue}`;
  }

  return event.city ?? "常州";
}

function splitText(value: string | null | undefined) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getLinkTarget(href: string) {
  return href.startsWith("http") ? "_blank" : undefined;
}

function DetailTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border/70 bg-background/70 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function EventCoverPreview({ event }: { event: AdminEvent }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-border/70 bg-muted/20">
      {event.cover_image_url ? (
        <img
          src={event.cover_image_url}
          alt={`${event.title} 封面`}
          loading="lazy"
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div className="grid aspect-[16/10] place-items-center p-6">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂未设置活动封面" />
        </div>
      )}
      <div className="border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
        {event.cover_image_url ? "当前活动封面" : "可在“管理图片”中上传封面或把照片设为封面"}
      </div>
    </div>
  );
}

function TextPreview({
  title,
  content,
  emptyText,
}: {
  title: string;
  content: string | null;
  emptyText: string;
}) {
  const lines = splitText(content);

  return (
    <div className="rounded-md border border-border/70 bg-background/70 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {lines.length > 0 ? (
        <div className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
          {lines.slice(0, 4).map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
          {lines.length > 4 ? <p>还有 {lines.length - 4} 段内容，可在编辑弹窗中查看。</p> : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function ResourceItem({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string | null;
}) {
  const hasValue = Boolean(value);

  return (
    <div className="rounded-md border border-border/70 bg-background/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <AdminStatusBadge tone={hasValue ? "completed" : "pending"}>
          {hasValue ? "已设置" : "待补充"}
        </AdminStatusBadge>
      </div>
      <p className="mt-2 break-all text-sm text-muted-foreground">
        {value || "暂未配置"}
      </p>
      {href ? (
        <Button
          className="mt-3"
          href={href}
          icon={<LinkOutlined />}
          size="small"
          target={getLinkTarget(href)}
          type="link"
        >
          打开链接
        </Button>
      ) : null}
    </div>
  );
}

function AdminEventPhotosManagerModal({
  event,
  onChanged,
}: {
  event: AdminEvent;
  onChanged?: () => void;
}) {
  return (
    <AdminModal
      title="管理封面与活动照片"
      width={980}
      trigger={
        <Button htmlType="button" icon={<PictureOutlined />}>
          管理图片
        </Button>
      }
    >
      <AdminEventPhotosManagerClient
        eventId={event.id}
        eventSlug={event.slug}
        eventTitle={event.title}
        coverImageUrl={event.cover_image_url}
        photos={event.photos}
        onChanged={onChanged}
      />
    </AdminModal>
  );
}

function EventPhotosPreview({
  event,
  onChanged,
}: {
  event: AdminEvent;
  onChanged?: () => void;
}) {
  const previewPhotos = event.photos.slice(0, 6);

  return (
    <AdminPanel>
      <AdminPanelHeader
        eyebrow="Assets"
        title="活动图片与资料"
        actions={<AdminEventPhotosManagerModal event={event} onChanged={onChanged} />}
      />
      <AdminPanelBody className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <EventCoverPreview event={event} />
          <div className="grid gap-3 md:grid-cols-2">
            <ResourceItem label="官网公开页" value={`/events/${event.slug}`} href={`/events/${event.slug}`} />
            <ResourceItem
              label="报名链接"
              value={event.registration_url}
              href={event.registration_url}
            />
            <ResourceItem label="活动文档" value={event.docs_url} href={event.docs_url} />
            <ResourceItem
              label="视频素材"
              value={event.video_url || event.video_file_id || event.video_provider}
              href={event.video_url}
            />
          </div>
        </div>

        <div className="rounded-md border border-border/70 bg-background/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">相册预览</h3>
            <AdminStatusBadge tone="neutral">共 {event.photos.length} 张</AdminStatusBadge>
          </div>
          {previewPhotos.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              {previewPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="min-w-0 overflow-hidden rounded-md border border-border/70 bg-muted/20"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? event.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <p className="truncate px-2 py-1 text-xs text-muted-foreground">
                    {photo.caption || `排序 ${photo.sort_order}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-dashed border-border/80 p-6">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂未添加活动照片" />
            </div>
          )}
        </div>
      </AdminPanelBody>
    </AdminPanel>
  );
}

export function AdminEventDetailPageClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminEventDetailData>(
    `/api/admin/events/${eventId}`,
  );
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const eventDetail = data?.event;
  const registrationColumns: TableColumnsType<AdminRegistration> = [
    {
      title: "成员",
      render: (_, registration) => (
        <div className="grid gap-1">
          <span className="font-semibold text-foreground">
            {registration.profile?.display_name ?? "未填写显示名"}
          </span>
          <span className="text-sm text-muted-foreground">
            用户 ID: {registration.user_id}
          </span>
        </div>
      ),
    },
    {
      title: "联系信息",
      render: (_, registration) => (
        <div className="grid gap-1 text-sm text-muted-foreground">
          <span>{registration.profile?.email ?? "未提供邮箱"}</span>
          <span>{registration.profile?.city ?? "未填写城市"}</span>
        </div>
      ),
    },
    {
      title: "状态",
      width: 120,
      render: (_, registration) => (
        <AdminStatusBadge
          tone={getAdminRegistrationStatusTone(registration.status) as AdminTone}
        >
          {formatAdminRegistrationStatus(registration.status)}
        </AdminStatusBadge>
      ),
    },
    {
      title: "报名时间",
      width: 180,
      render: (_, registration) => (
        <span className="text-sm text-muted-foreground">
          {new Date(registration.created_at).toLocaleString("zh-CN")}
        </span>
      ),
    },
    {
      title: "备注",
      render: (_, registration) => (
        <span className="text-sm text-muted-foreground">
          {registration.note ?? "无备注"}
        </span>
      ),
    },
  ];

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
                <AdminEventEditorModal
                  eventId={eventDetail.id}
                  triggerLabel="编辑活动"
                  onChanged={reload}
                  onDeleted={() => router.push("/admin/events?saved=deleted")}
                />
                <AdminEventPhotosManagerModal event={eventDetail} onChanged={reload} />
                <Button
                  href={`/events/${eventDetail.slug}`}
                  icon={<EyeOutlined />}
                  target="_blank"
                >
                  查看公开页
                </Button>
                <Button href="/admin/events" icon={<ArrowLeftOutlined />}>
                  返回列表
                </Button>
              </>
            }
          />
          <AdminPanelBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
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
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <EventCoverPreview event={eventDetail} />
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <DetailTile
                    label="报名人数"
                    value={`${eventDetail.registrations.length} 人`}
                    hint="当前后台报名记录"
                  />
                  <DetailTile
                    label="活动照片"
                    value={`${eventDetail.photos.length} 张`}
                    hint="含现场照片与素材图"
                  />
                  <DetailTile
                    label="活动时间"
                    value={formatAdminEventDate(eventDetail.event_at)}
                  />
                  <DetailTile label="地点" value={getVenueText(eventDetail)} />
                </div>

                <TextPreview
                  title="活动简介"
                  content={eventDetail.summary || eventDetail.description}
                  emptyText="暂未填写活动简介，可点击“编辑活动”补充面向成员的介绍。"
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <TextPreview
                    title="议程安排"
                    content={eventDetail.agenda}
                    emptyText="暂未填写议程。"
                  />
                  <TextPreview
                    title="分享人与组织者"
                    content={eventDetail.speaker_lineup}
                    emptyText="暂未填写分享人或组织者信息。"
                  />
                </div>
              </div>
            </div>
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
          <EventPhotosPreview event={eventDetail} onChanged={reload} />

          <AdminPanel>
            <AdminPanelHeader
              eyebrow="Registrations"
              title={`${eventDetail.title} 的报名名单`}
              actions={
                data?.permissions?.canExportRegistrations ? (
                  <Button
                    href={`/api/admin/events/registrations/export?event_id=${encodeURIComponent(eventDetail.id)}`}
                    download
                    icon={<DownloadOutlined />}
                    size="small"
                  >
                    导出报名
                  </Button>
                ) : null
              }
            />
            <AdminPanelBody className="p-0">
              {eventDetail.registrations.length > 0 ? (
                <Table
                  columns={registrationColumns}
                  dataSource={eventDetail.registrations}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 860 }}
                />
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
