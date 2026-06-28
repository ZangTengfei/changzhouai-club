import type { Metadata } from "next";
import Link from "next/link";

import {
  deleteAdminCommunityUpdate,
  saveAdminCommunityUpdate,
} from "@/app/admin/actions";
import {
  AdminCheckboxRow,
  AdminField,
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { AdminModal } from "@/components/admin-modal";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  type AdminCommunityUpdate,
  type AdminCommunityUpdateAuthorOption,
  loadAdminCommunityUpdatesData,
} from "@/lib/admin/community-updates";
import {
  communityUpdateRelatedTypeLabels,
  communityUpdateStatusLabels,
  communityUpdateTypeLabels,
} from "@/lib/community-updates";
import {
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

export const metadata: Metadata = {
  title: "社区动态管理",
  description: "审核和维护社区成员发布的动态内容。",
};

type AdminUpdatesPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "未发布";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusTone(status: string) {
  if (status === "published") {
    return "completed" as const;
  }

  if (status === "changes_requested") {
    return "scheduled" as const;
  }

  if (status === "rejected" || status === "archived") {
    return "cancelled" as const;
  }

  return "pending" as const;
}

function UpdateForm({
  update,
  authorOptions,
}: {
  update?: AdminCommunityUpdate;
  authorOptions: AdminCommunityUpdateAuthorOption[];
}) {
  const imageUrls = update?.images.map((image) => image.image_url).join("\n") ?? "";

  return (
    <form action={saveAdminCommunityUpdate} className="grid gap-4">
      {update ? <input type="hidden" name="update_id" value={update.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <AdminField label="关联成员">
          <NativeSelect
            name="author_id"
            defaultValue={update?.author_id ?? authorOptions[0]?.id ?? ""}
            required
          >
            {authorOptions.length > 0 ? (
              authorOptions.map((author) => (
                <option value={author.id} key={author.id}>
                  {author.displayName}
                  {author.email ? ` · ${author.email}` : ""}
                </option>
              ))
            ) : (
              <option value="">暂无可选成员</option>
            )}
          </NativeSelect>
        </AdminField>

        <AdminField label="动态类型">
          <NativeSelect name="update_type" defaultValue={update?.update_type ?? "share"}>
            {Object.entries(communityUpdateTypeLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="标题">
          <Input name="title" defaultValue={update?.title ?? ""} />
        </AdminField>

        <AdminField label="审核状态">
          <NativeSelect name="status" defaultValue={update?.status ?? "pending"}>
            {Object.entries(communityUpdateStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="正文（支持 Markdown）" className="md:col-span-2">
          <Textarea
            name="content"
            defaultValue={update?.content ?? ""}
            rows={6}
            required
            placeholder="支持标题、列表、引用、代码块和表格。HTML 会被忽略。"
          />
        </AdminField>

        <AdminField label="图片链接" className="md:col-span-2">
          <Textarea
            name="image_urls"
            defaultValue={imageUrls}
            rows={3}
            placeholder="每行一个公开图片链接"
          />
        </AdminField>

        <AdminField label="关联类型">
          <NativeSelect name="related_type" defaultValue={update?.related_type ?? ""}>
            <option value="">不关联</option>
            {Object.entries(communityUpdateRelatedTypeLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="关联链接">
          <Input
            name="related_url"
            defaultValue={update?.related_url ?? ""}
            placeholder="例如：https://changzhouai.club/events/2026-06-27-codex-ppt-real-projects"
          />
        </AdminField>

        <AdminField label="标签">
          <Input
            name="tags"
            defaultValue={update?.tags.join("、") ?? ""}
            placeholder="Agent、RAG、活动照片"
          />
        </AdminField>

        <AdminField label="排序">
          <Input
            type="number"
            name="sort_order"
            defaultValue={update?.sort_order ?? 0}
          />
        </AdminField>

        <AdminField label="审核备注" className="md:col-span-2">
          <Textarea
            name="moderation_note"
            defaultValue={update?.moderation_note ?? ""}
            rows={2}
            placeholder="需要修改时，可写给成员看的原因"
          />
        </AdminField>

        <AdminCheckboxRow>
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={update?.is_featured ?? false}
            className="size-4"
          />
          <span>设为精选</span>
        </AdminCheckboxRow>

        <AdminCheckboxRow>
          <input
            type="checkbox"
            name="is_pinned"
            defaultChecked={update?.is_pinned ?? false}
            className="size-4"
          />
          <span>置顶展示</span>
        </AdminCheckboxRow>
      </div>

      <Button type="submit" disabled={authorOptions.length === 0}>
        保存社区动态
      </Button>
    </form>
  );
}

export default async function AdminUpdatesPage({
  searchParams,
}: AdminUpdatesPageProps) {
  const params = await searchParams;
  const { updates, authorOptions, queryErrors } = await loadAdminCommunityUpdatesData();
  const pendingCount = updates.filter((update) => update.status === "pending").length;

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(params.saved)}
        error={params.error ? getAdminErrorMessage(params.error) : null}
      />

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Updates"
          title="社区动态管理"
          actions={
            <>
              <AdminMetric label="动态" value={updates.length} />
              <AdminMetric label="待审核" value={pendingCount} />
              <AdminModal title="新增社区动态" triggerLabel="新增动态">
                <UpdateForm authorOptions={authorOptions} />
              </AdminModal>
            </>
          }
        />
      </AdminPanel>

      {queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="List" title="动态列表" />
        <AdminPanelBody className="space-y-2">
          {updates.length > 0 ? (
            updates.map((update) => (
              <article
                key={update.id}
                className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background"
              >
                <div className="grid gap-3 p-3 lg:grid-cols-[96px_minmax(0,1fr)_auto] lg:items-center">
                  <div className="relative size-24 overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                    {update.images[0]?.image_url ? (
                      <img
                        src={update.images[0].image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : update.authorAvatarUrl ? (
                      <img
                        src={update.authorAvatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg font-semibold text-muted-foreground">
                        {update.authorDisplayName.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">
                        {update.title || communityUpdateTypeLabels[update.update_type]}
                      </h2>
                      <AdminStatusBadge tone={getStatusTone(update.status)}>
                        {communityUpdateStatusLabels[update.status]}
                      </AdminStatusBadge>
                      {update.is_pinned ? (
                        <AdminStatusBadge tone="registered">置顶</AdminStatusBadge>
                      ) : null}
                      {update.is_featured ? (
                        <AdminStatusBadge tone="scheduled">精选</AdminStatusBadge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {update.authorDisplayName} · {communityUpdateTypeLabels[update.update_type]} ·{" "}
                      发布于 {formatDateTime(update.published_at)}
                    </p>
                    <p className="line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {update.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      赞 {update.like_count} · 评论 {update.comment_count} · 浏览{" "}
                      {update.view_count} · 更新于 {formatDateTime(update.updated_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {update.status === "published" ? (
                      <Button asChild type="button" variant="outline" size="sm">
                        <Link href={`/updates/${update.id}`}>前台</Link>
                      </Button>
                    ) : null}
                    <form action={deleteAdminCommunityUpdate}>
                      <input type="hidden" name="update_id" value={update.id} />
                      <Button type="submit" variant="outline" size="sm">
                        删除
                      </Button>
                    </form>
                  </div>
                </div>

                <details className="border-t border-border/70">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground">
                    展开编辑表单
                  </summary>
                  <div className="p-3 pt-1">
                    <UpdateForm update={update} authorOptions={authorOptions} />
                  </div>
                </details>
              </article>
            ))
          ) : (
            <AdminNotice>还没有社区动态。成员提交后会在这里审核。</AdminNotice>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
