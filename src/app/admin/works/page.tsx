import type { Metadata } from "next";
import Link from "next/link";

import {
  deleteAdminMemberWork,
  saveAdminMemberWork,
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
import { StorageImageUrlField } from "@/components/storage-image-url-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import {
  type AdminMemberWork,
  type AdminWorkMemberOption,
  loadAdminWorksData,
} from "@/lib/admin/works";
import {
  workReviewStatusLabels,
  workStatusLabels,
  workTypeLabels,
} from "@/lib/community-works";

export const metadata: Metadata = {
  title: "成员作品管理",
  description: "维护成员公开展示的产品、工具、项目和案例。",
};

type AdminWorksPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function WorkForm({
  work,
  memberOptions,
}: {
  work?: AdminMemberWork;
  memberOptions: AdminWorkMemberOption[];
}) {
  return (
    <form action={saveAdminMemberWork} className="grid gap-4">
      {work ? <input type="hidden" name="work_id" value={work.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <AdminField label="关联成员">
          <NativeSelect
            name="member_id"
            defaultValue={work?.member_id ?? memberOptions[0]?.id ?? ""}
            required
          >
            {memberOptions.length > 0 ? (
              memberOptions.map((member) => (
                <option value={member.id} key={member.id}>
                  {member.displayName}
                  {member.email ? ` · ${member.email}` : ""}
                </option>
              ))
            ) : (
              <option value="">暂无可选成员</option>
            )}
          </NativeSelect>
        </AdminField>

        <AdminField label="作品类型">
          <NativeSelect name="work_type" defaultValue={work?.work_type ?? "product"}>
            {Object.entries(workTypeLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="作品名称">
          <Input name="title" defaultValue={work?.title ?? ""} required />
        </AdminField>

        <AdminField label="当前状态">
          <NativeSelect name="status" defaultValue={work?.status ?? "launched"}>
            {Object.entries(workStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="审核状态">
          <NativeSelect name="review_status" defaultValue={work?.review_status ?? "pending"}>
            {Object.entries(workReviewStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="一句话介绍" className="md:col-span-2">
          <Textarea
            name="summary"
            defaultValue={work?.summary ?? ""}
            rows={2}
            required
          />
        </AdminField>

        <AdminField label="详细说明" className="md:col-span-2">
          <Textarea
            name="description"
            defaultValue={work?.description ?? ""}
            rows={4}
          />
        </AdminField>

        <AdminField label="封面图" className="md:col-span-2">
          <StorageImageUrlField
            name="cover_image_url"
            defaultValue={work?.cover_image_url ?? ""}
            eventSlug="member-work"
            uploadScope="community"
            mode="upload-only"
            placeholder="作品封面图片地址"
            uploadLabel="上传作品封面"
            clearLabel="清空封面"
            filledStatusText="已设置封面"
            emptyStatusText="当前未设置封面"
          />
        </AdminField>

        <AdminField label="成员角色">
          <Input
            name="role_label"
            defaultValue={work?.role_label ?? ""}
            placeholder="例如：发起人 / 开发者 / 产品负责人"
          />
        </AdminField>

        <AdminField label="排序">
          <Input
            type="number"
            name="sort_order"
            defaultValue={work?.sort_order ?? 0}
          />
        </AdminField>

        <AdminField label="官网 / 产品链接">
          <Input name="website_url" defaultValue={work?.website_url ?? ""} />
        </AdminField>

        <AdminField label="Demo 链接">
          <Input name="demo_url" defaultValue={work?.demo_url ?? ""} />
        </AdminField>

        <AdminField label="代码仓库">
          <Input name="repo_url" defaultValue={work?.repo_url ?? ""} />
        </AdminField>

        <AdminField label="标签">
          <Input
            name="tags"
            defaultValue={work?.tags.join("、") ?? ""}
            placeholder="AI 工具、OPC、自动化"
          />
        </AdminField>

        <AdminCheckboxRow>
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={work?.is_public ?? true}
            className="size-4"
          />
          <span>公开展示</span>
        </AdminCheckboxRow>

        <AdminCheckboxRow>
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={work?.is_featured ?? false}
            className="size-4"
          />
          <span>设为精选</span>
        </AdminCheckboxRow>
      </div>

      <Button type="submit" disabled={memberOptions.length === 0}>
        保存成员作品
      </Button>
    </form>
  );
}

function getReviewTone(status: string, isPublic: boolean) {
  if (isPublic || status === "approved") {
    return "completed" as const;
  }

  if (status === "changes_requested") {
    return "scheduled" as const;
  }

  if (status === "rejected") {
    return "cancelled" as const;
  }

  return "pending" as const;
}

export default async function AdminWorksPage({
  searchParams,
}: AdminWorksPageProps) {
  const params = await searchParams;
  const { works, memberOptions, queryErrors } = await loadAdminWorksData();

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(params.saved)}
        error={params.error ? getAdminErrorMessage(params.error) : null}
      />

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Works"
          title="成员作品管理"
          actions={
            <>
              <AdminMetric label="作品" value={works.length} />
              <AdminMetric
                label="公开"
                value={works.filter((work) => work.is_public).length}
              />
              <AdminModal title="新增成员作品" triggerLabel="新增作品">
                <WorkForm memberOptions={memberOptions} />
              </AdminModal>
            </>
          }
        />
      </AdminPanel>

      {queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="List" title="作品列表" />
        <AdminPanelBody className="space-y-2">
          {works.length > 0 ? (
            works.map((work) => (
              <article
                key={work.id}
                className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background"
              >
                <div className="grid gap-3 p-3 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-center">
                  <div className="relative size-[88px] overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                    {work.cover_image_url ? (
                      <img
                        src={work.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg font-semibold text-muted-foreground">
                        {work.title.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{work.title}</h2>
                      <AdminStatusBadge tone={work.is_public ? "completed" : "neutral"}>
                        {work.is_public ? "公开" : "隐藏"}
                      </AdminStatusBadge>
                      <AdminStatusBadge
                        tone={getReviewTone(work.review_status, work.is_public)}
                      >
                        {workReviewStatusLabels[work.review_status]}
                      </AdminStatusBadge>
                      {work.is_featured ? (
                        <AdminStatusBadge tone="scheduled">精选</AdminStatusBadge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {work.memberDisplayName} · {workTypeLabels[work.work_type]} ·{" "}
                      {workStatusLabels[work.status]}
                    </p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{work.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      更新于 {formatDateTime(work.updated_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button asChild type="button" variant="outline" size="sm">
                      <Link href={`/members/${work.member_id}`}>成员页</Link>
                    </Button>
                    <form action={deleteAdminMemberWork}>
                      <input type="hidden" name="work_id" value={work.id} />
                      <input type="hidden" name="member_id" value={work.member_id} />
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
                    <WorkForm work={work} memberOptions={memberOptions} />
                  </div>
                </details>
              </article>
            ))
          ) : (
            <AdminNotice>还没有成员作品。添加后可选择公开展示到作品墙。</AdminNotice>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
