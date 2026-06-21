import type { Metadata } from "next";
import Link from "next/link";
import { Button, Input } from "antd";

import {
  deleteAdminExternalCaseCard,
  deleteAdminMemberWork,
  saveAdminExternalCaseCard,
  saveAdminMemberWork,
} from "@/app/admin/actions";
import {
  AdminCheckboxRow,
  AdminField,
} from "@/components/admin-ui";
import {
  AdminAntdAlert,
  AdminAntdCard,
  AdminAntdPageHeader,
  AdminStatusTag,
} from "@/components/admin-antd";
import { AdminModal } from "@/components/admin-modal";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { StorageImageUrlField } from "@/components/storage-image-url-field";
import { NativeSelect } from "@/components/ui/native-select";
import {
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import {
  type AdminExternalCaseCardRow,
  type AdminMemberWork,
  type AdminWorkMemberOption,
  loadAdminWorksData,
} from "@/lib/admin/works";
import {
  externalCaseCardTypeLabels,
  workReviewStatusLabels,
  workStatusLabels,
  workTypeLabels,
} from "@/lib/community-works";

const { TextArea } = Input;

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
          <TextArea
            name="summary"
            defaultValue={work?.summary ?? ""}
            rows={2}
            required
          />
        </AdminField>

        <AdminField label="详细说明" className="md:col-span-2">
          <TextArea
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

      <Button htmlType="submit" type="primary" disabled={memberOptions.length === 0}>
        保存成员作品
      </Button>
    </form>
  );
}

function ExternalCaseCardForm({ card }: { card?: AdminExternalCaseCardRow }) {
  return (
    <form action={saveAdminExternalCaseCard} className="grid gap-4">
      {card ? (
        <input type="hidden" name="external_card_id" value={card.id} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <AdminField label="卡片标题">
          <Input name="title" defaultValue={card?.title ?? ""} required />
        </AdminField>

        <AdminField label="唯一标识">
          <Input
            name="slug"
            defaultValue={card?.slug ?? ""}
            placeholder="例如：telecom-opc-display"
          />
        </AdminField>

        <AdminField label="卡片类型">
          <NativeSelect name="card_type" defaultValue={card?.card_type ?? "external"}>
            {Object.entries(externalCaseCardTypeLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="来源标签">
          <Input
            name="source_label"
            defaultValue={card?.source_label ?? ""}
            placeholder="例如：常州电信 OPC"
          />
        </AdminField>

        <AdminField label="外部链接" className="md:col-span-2">
          <Input
            name="external_url"
            defaultValue={card?.external_url ?? ""}
            placeholder="https://..."
            required
          />
        </AdminField>

        <AdminField label="一句话介绍" className="md:col-span-2">
          <TextArea
            name="summary"
            defaultValue={card?.summary ?? ""}
            rows={2}
            required
          />
        </AdminField>

        <AdminField label="详细说明" className="md:col-span-2">
          <TextArea
            name="description"
            defaultValue={card?.description ?? ""}
            rows={4}
          />
        </AdminField>

        <AdminField label="封面图" className="md:col-span-2">
          <StorageImageUrlField
            name="cover_image_url"
            defaultValue={card?.cover_image_url ?? ""}
            eventSlug="external-case-card"
            uploadScope="community"
            mode="upload-only"
            placeholder="外部卡片封面图片地址"
            uploadLabel="上传卡片封面"
            clearLabel="清空封面"
            filledStatusText="已设置封面"
            emptyStatusText="当前未设置封面"
          />
        </AdminField>

        <AdminField label="按钮文案">
          <Input
            name="cta_label"
            defaultValue={card?.cta_label ?? "查看详情"}
          />
        </AdminField>

        <AdminField label="排序">
          <Input
            type="number"
            name="sort_order"
            defaultValue={card?.sort_order ?? 0}
          />
        </AdminField>

        <AdminField label="标签" className="md:col-span-2">
          <Input
            name="tags"
            defaultValue={card?.tags.join("、") ?? ""}
            placeholder="智能体项目、常州电信、OPC 共创"
          />
        </AdminField>

        <AdminCheckboxRow>
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={card?.is_public ?? true}
            className="size-4"
          />
          <span>公开展示</span>
        </AdminCheckboxRow>

        <AdminCheckboxRow>
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={card?.is_featured ?? false}
            className="size-4"
          />
          <span>设为精选</span>
        </AdminCheckboxRow>
      </div>

      <Button htmlType="submit" type="primary">保存外部卡片</Button>
    </form>
  );
}

export default async function AdminWorksPage({
  searchParams,
}: AdminWorksPageProps) {
  const params = await searchParams;
  const { works, externalCards, memberOptions, queryErrors } =
    await loadAdminWorksData();

  return (
    <div className="grid gap-4">
      <AdminToastSignals
        success={getAdminSavedMessage(params.saved)}
        error={params.error ? getAdminErrorMessage(params.error) : null}
      />

      <AdminAntdPageHeader
        eyebrow="Works"
        title="成员作品管理"
        stats={[
          { label: "作品", value: works.length },
          { label: "外部卡片", value: externalCards.length },
          {
            label: "公开",
            value:
              works.filter((work) => work.is_public).length +
              externalCards.filter((card) => card.is_public).length,
          },
        ]}
        actions={
          <>
            <AdminModal title="新增外部展示卡片" triggerLabel="新增外部卡片">
              <ExternalCaseCardForm />
            </AdminModal>
            <AdminModal title="新增成员作品" triggerLabel="新增作品">
              <WorkForm memberOptions={memberOptions} />
            </AdminModal>
          </>
        }
      />

      {queryErrors.length > 0 ? (
        <AdminAntdAlert message={`后台数据读取出现问题：${queryErrors.join(" | ")}`} />
      ) : null}

      <AdminAntdCard eyebrow="External" title="外部展示卡片">
        <div className="space-y-2">
          {externalCards.length > 0 ? (
            externalCards.map((card) => (
              <article
                key={card.id}
                className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background"
              >
                <div className="grid gap-3 p-3 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-center">
                  <div className="relative size-[88px] overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                    {card.cover_image_url ? (
                      <img
                        src={card.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg font-semibold text-muted-foreground">
                        {card.title.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{card.title}</h2>
                      <AdminStatusTag
                        status={card.is_public ? "published" : "archived"}
                        label={card.is_public ? "公开" : "隐藏"}
                      />
                      <AdminStatusTag
                        status="waiting_review"
                        label={externalCaseCardTypeLabels[card.card_type]}
                      />
                      {card.is_featured ? (
                        <AdminStatusTag status="waiting_review" label="精选" />
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {card.source_label ?? "外部案例"} · {card.cta_label}
                    </p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{card.summary}</p>
                    <p className="truncate text-xs text-muted-foreground">{card.external_url}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <a href={card.external_url} target="_blank" rel="noreferrer">
                      <Button htmlType="button" size="small">
                        访问
                      </Button>
                    </a>
                    <form action={deleteAdminExternalCaseCard}>
                      <input type="hidden" name="external_card_id" value={card.id} />
                      <Button htmlType="submit" danger size="small">
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
                    <ExternalCaseCardForm card={card} />
                  </div>
                </details>
              </article>
            ))
          ) : (
            <AdminAntdAlert message="还没有外部展示卡片。添加后可展示到案例库。" type="info" />
          )}
        </div>
      </AdminAntdCard>

      <AdminAntdCard eyebrow="List" title="作品列表">
        <div className="space-y-2">
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
                      <AdminStatusTag
                        status={work.is_public ? "published" : "archived"}
                        label={work.is_public ? "公开" : "隐藏"}
                      />
                      <AdminStatusTag
                        status={work.review_status}
                        label={workReviewStatusLabels[work.review_status]}
                      />
                      {work.is_featured ? (
                        <AdminStatusTag status="waiting_review" label="精选" />
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
                    <Link href={`/members/${work.member_id}`}>
                      <Button htmlType="button" size="small">成员页</Button>
                    </Link>
                    <form action={deleteAdminMemberWork}>
                      <input type="hidden" name="work_id" value={work.id} />
                      <input type="hidden" name="member_id" value={work.member_id} />
                      <Button htmlType="submit" danger size="small">
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
            <AdminAntdAlert message="还没有成员作品。添加后可选择公开展示到案例库。" type="info" />
          )}
        </div>
      </AdminAntdCard>
    </div>
  );
}
