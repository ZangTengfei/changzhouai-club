import type { Metadata } from "next";
import Link from "next/link";

import {
  deleteAdminProjectApplication,
  deleteAdminProjectOpportunity,
  saveAdminProjectOpportunity,
  updateAdminProjectApplication,
} from "@/app/admin/actions";
import {
  AdminAntdAlert,
  AdminAntdCard,
  AdminAntdPageHeader,
  AdminStatusTag,
} from "@/components/admin-antd";
import { AdminModal } from "@/components/admin-modal";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import {
  AdminCheckboxRow,
  AdminField,
} from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import {
  type AdminProjectApplication,
  type AdminProjectOpportunity,
  loadAdminProjectsData,
} from "@/lib/admin/projects";
import {
  projectApplicationStatusLabels,
  projectOpportunityStatusLabels,
  projectOpportunityTypeLabels,
  projectOpportunityVisibilityLabels,
} from "@/lib/community-projects";

export const metadata: Metadata = {
  title: "共建项目管理",
  description: "维护公开或半公开的项目共建机会，并查看申请记录。",
};

type AdminProjectsPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "待定";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}

function ProjectOpportunityForm({
  opportunity,
}: {
  opportunity?: AdminProjectOpportunity;
}) {
  return (
    <form action={saveAdminProjectOpportunity} className="grid gap-4">
      {opportunity ? (
        <input type="hidden" name="opportunity_id" value={opportunity.id} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <AdminField label="项目标题">
          <Input name="title" defaultValue={opportunity?.title ?? ""} required />
        </AdminField>

        <AdminField label="链接 slug">
          <Input
            name="slug"
            defaultValue={opportunity?.slug ?? ""}
            placeholder="changzhou-dialect-annotation"
          />
        </AdminField>

        <AdminField label="机会类型">
          <NativeSelect
            name="opportunity_type"
            defaultValue={opportunity?.opportunity_type ?? "project"}
          >
            {Object.entries(projectOpportunityTypeLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="状态">
          <NativeSelect name="status" defaultValue={opportunity?.status ?? "draft"}>
            {Object.entries(projectOpportunityStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="可见性">
          <NativeSelect name="visibility" defaultValue={opportunity?.visibility ?? "public"}>
            {Object.entries(projectOpportunityVisibilityLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="排序">
          <Input
            type="number"
            name="sort_order"
            defaultValue={opportunity?.sort_order ?? 0}
          />
        </AdminField>

        <AdminField label="一句话摘要" className="md:col-span-2">
          <Textarea name="summary" rows={2} defaultValue={opportunity?.summary ?? ""} required />
        </AdminField>

        <AdminField label="项目说明" className="md:col-span-2">
          <Textarea
            name="description"
            rows={6}
            defaultValue={opportunity?.description ?? ""}
            placeholder="写清楚背景、参与条件、角色要求、保密边界、报名备注等。特定筛选问题也写在这里或申请说明里。"
          />
        </AdminField>

        <AdminField label="角色标签">
          <Input
            name="role_tags"
            defaultValue={opportunity?.role_tags.join("、") ?? ""}
            placeholder="项目经理、后端开发、标注参与者"
          />
        </AdminField>

        <AdminField label="主题标签">
          <Input
            name="topic_tags"
            defaultValue={opportunity?.topic_tags.join("、") ?? ""}
            placeholder="政企项目、AI 应用、众包协作"
          />
        </AdminField>

        <AdminField label="招募人数">
          <Input
            name="headcount_label"
            defaultValue={opportunity?.headcount_label ?? ""}
            placeholder="例如：30-40 人 / 1 位项目经理 + 2 位开发"
          />
        </AdminField>

        <AdminField label="时间投入">
          <Input
            name="time_commitment"
            defaultValue={opportunity?.time_commitment ?? ""}
            placeholder="例如：每周 5 小时 / 预计 2 个月"
          />
        </AdminField>

        <AdminField label="报酬 / 回报">
          <Input
            name="compensation"
            defaultValue={opportunity?.compensation ?? ""}
            placeholder="例如：有偿 / 项目制 / 面议 / 公益"
          />
        </AdminField>

        <AdminField label="截止时间">
          <Input
            type="datetime-local"
            name="deadline_at"
            defaultValue={toDatetimeLocal(opportunity?.deadline_at ?? null)}
          />
        </AdminField>

        <AdminField label="地点 / 形式">
          <Input
            name="location"
            defaultValue={opportunity?.location ?? ""}
            placeholder="例如：常州线下 + 远程协作"
          />
        </AdminField>

        <AdminField label="申请按钮文案">
          <Input
            name="application_cta"
            defaultValue={opportunity?.application_cta ?? ""}
            placeholder="申请参与 / 申请对接 / 报名众包"
          />
        </AdminField>

        <AdminField label="外部申请链接">
          <Input
            name="external_application_url"
            defaultValue={opportunity?.external_application_url ?? ""}
            placeholder="https://..."
          />
        </AdminField>

        <AdminField label="申请说明" className="md:col-span-2">
          <Textarea
            name="application_note"
            rows={3}
            defaultValue={opportunity?.application_note ?? ""}
            placeholder="告诉申请人需要在备注中补充什么，例如特定方言能力、过往项目经验、可投入档期等。"
          />
        </AdminField>

        <AdminCheckboxRow>
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={opportunity?.is_featured ?? false}
            className="size-4"
          />
          <span>设为精选机会</span>
        </AdminCheckboxRow>

        <AdminCheckboxRow>
          <input
            type="checkbox"
            name="application_requires_login"
            defaultChecked={opportunity?.application_requires_login ?? false}
            className="size-4"
          />
          <span>申请前需要登录</span>
        </AdminCheckboxRow>
      </div>

      <Button type="submit">保存共建机会</Button>
    </form>
  );
}

function ProjectApplicationCard({
  application,
  opportunity,
}: {
  application: AdminProjectApplication;
  opportunity: AdminProjectOpportunity;
}) {
  return (
    <article className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <h3 className="text-base font-semibold text-foreground">
            {application.applicant_name}
          </h3>
          <p className="text-sm text-muted-foreground">
            账号：{application.applicantDisplayName}
            {application.applicantEmail ? ` · ${application.applicantEmail}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            微信 {application.contact_wechat ?? "未填"} · 电话{" "}
            {application.contact_phone ?? "未填"} · 邮箱 {application.contact_email ?? "未填"}
          </p>
        </div>

        <AdminStatusTag status={application.status} label={projectApplicationStatusLabels[application.status]} />
      </div>

      <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
        <p>职业/身份：{application.applicant_occupation ?? "未填写"}</p>
        <p>申请角色：{application.role_interest ?? "未填写"}</p>
        <p>可投入时间：{application.available_time ?? "未填写"}</p>
        <p>作品链接：{application.portfolio_url ?? "未填写"}</p>
        <p>提交时间：{formatDateTime(application.created_at)}</p>
      </div>

      {application.experience_summary ? (
        <p className="mt-3 text-sm text-muted-foreground">
          经验：{application.experience_summary}
        </p>
      ) : null}

      {application.note ? (
        <p className="mt-2 text-sm text-muted-foreground">备注：{application.note}</p>
      ) : null}

      <form action={updateAdminProjectApplication} className="mt-4 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="application_id" value={application.id} />
        <input type="hidden" name="project_id" value={opportunity.id} />
        <input type="hidden" name="project_slug" value={opportunity.slug} />

        <AdminField label="申请状态">
          <NativeSelect name="status" defaultValue={application.status}>
            {Object.entries(projectApplicationStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </AdminField>

        <AdminField label="管理员备注" className="md:col-span-2">
          <Textarea
            name="admin_note"
            rows={3}
            defaultValue={application.admin_note ?? ""}
            placeholder="例如：已联系、建议进入面试、适合做 PM、暂不匹配"
          />
        </AdminField>

        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" variant="secondary" size="sm">
            更新申请
          </Button>
        </div>
      </form>
      <form action={deleteAdminProjectApplication} className="mt-3">
        <input type="hidden" name="application_id" value={application.id} />
        <input type="hidden" name="project_slug" value={opportunity.slug} />
        <Button type="submit" variant="destructive" size="sm">
          删除这条提交
        </Button>
      </form>
    </article>
  );
}

export default async function AdminProjectsPage({
  searchParams,
}: AdminProjectsPageProps) {
  const params = await searchParams;
  const { opportunities, stats, queryErrors } = await loadAdminProjectsData();

  return (
    <div className="grid gap-4">
      <AdminToastSignals
        success={getAdminSavedMessage(params.saved)}
        error={params.error ? getAdminErrorMessage(params.error) : null}
      />

      <AdminAntdPageHeader
        eyebrow="Projects"
        title="共建项目管理"
        stats={[
          { label: "机会", value: stats.total },
          { label: "招募中", value: stats.recruiting },
          { label: "可见", value: stats.visible },
          { label: "申请", value: stats.applications },
        ]}
        actions={
          <AdminModal title="新增共建机会" triggerLabel="新增机会">
            <ProjectOpportunityForm />
          </AdminModal>
        }
      />

      {queryErrors.length > 0 ? (
        <AdminAntdAlert message={`后台数据读取出现问题：${queryErrors.join(" | ")}`} />
      ) : null}

      <AdminAntdCard eyebrow="List" title="机会列表">
        <div className="space-y-3">
          {opportunities.length > 0 ? (
            opportunities.map((opportunity) => (
              <article
                key={opportunity.id}
                className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background"
              >
                <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">
                        {opportunity.title}
                      </h2>
                      <AdminStatusTag
                        status={opportunity.status}
                        label={projectOpportunityStatusLabels[opportunity.status]}
                      />
                      <AdminStatusTag
                        status={opportunity.opportunity_type}
                        label={projectOpportunityTypeLabels[opportunity.opportunity_type]}
                      />
                      <AdminStatusTag
                        status={opportunity.visibility}
                        label={projectOpportunityVisibilityLabels[opportunity.visibility]}
                      />
                      {opportunity.is_featured ? (
                        <AdminStatusTag status="registered" label="精选" />
                      ) : null}
                      <AdminStatusTag
                        status={opportunity.application_requires_login ? "pending" : "draft"}
                        label={opportunity.external_application_url
                          ? "外部表单"
                          : opportunity.application_requires_login
                            ? "需登录申请"
                            : "匿名可申请"}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{opportunity.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      /projects/{opportunity.slug} · 申请 {opportunity.applicationCount} 条 · 更新于{" "}
                      {formatDateTime(opportunity.updated_at)}
                    </p>
                    {[...opportunity.role_tags, ...opportunity.topic_tags].length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {[...opportunity.role_tags, ...opportunity.topic_tags].map((tag) => (
                          <span
                            className="rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-xs text-muted-foreground"
                            key={`${opportunity.id}-${tag}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button asChild type="button" variant="outline" size="sm">
                      <a
                        href={`/api/admin/projects/applications/export?project_id=${encodeURIComponent(opportunity.id)}`}
                        download
                        aria-label={`导出 ${opportunity.title} 的申请记录 CSV`}
                      >
                        导出申请
                      </a>
                    </Button>
                    {opportunity.visibility !== "private" && opportunity.status !== "draft" ? (
                      <Button asChild type="button" variant="outline" size="sm">
                        <Link href={`/projects/${opportunity.slug}`}>前台查看</Link>
                      </Button>
                    ) : null}
                    <form action={deleteAdminProjectOpportunity}>
                      <input type="hidden" name="opportunity_id" value={opportunity.id} />
                      <input type="hidden" name="slug" value={opportunity.slug} />
                      <Button type="submit" variant="outline" size="sm">
                        删除
                      </Button>
                    </form>
                  </div>
                </div>

                <details className="border-t border-border/70">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground">
                    展开编辑表单
                  </summary>
                  <div className="p-4 pt-1">
                    <ProjectOpportunityForm opportunity={opportunity} />
                  </div>
                </details>

                <details className="border-t border-border/70">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground">
                    查看申请记录（{opportunity.applicationCount}）
                  </summary>
                  <div className="grid gap-3 p-4 pt-1">
                    {opportunity.applications.length > 0 ? (
                      opportunity.applications.map((application) => (
                        <ProjectApplicationCard
                          key={application.id}
                          application={application}
                          opportunity={opportunity}
                        />
                      ))
                    ) : (
                      <AdminAntdAlert message="这个机会还没有收到申请。" type="info" />
                    )}
                  </div>
                </details>
              </article>
            ))
          ) : (
            <AdminAntdAlert message="还没有共建机会。新增后可选择公开、成员可见或仅后台保存。" type="info" />
          )}
        </div>
      </AdminAntdCard>
    </div>
  );
}
