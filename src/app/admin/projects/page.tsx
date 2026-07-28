import type { Metadata } from "next";

import {
  deleteAdminProjectApplication,
  deleteAdminProjectOpportunity,
  saveAdminProjectOpportunity,
  updateAdminProjectApplication,
} from "@/app/admin/actions";
import { AdminModal } from "@/components/admin-modal";
import { AdminProjectsTable } from "@/components/admin-projects-table";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { StorageImageUrlField } from "@/components/storage-image-url-field";
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
  type AdminTone,
} from "@/components/admin-ui";
import { Button } from "@/components/admin-antd/button";
import { Input } from "@/components/admin-antd/input";
import { NativeSelect } from "@/components/admin-antd/native-select";
import { Textarea } from "@/components/admin-antd/textarea";
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

function getApplicationStatusTone(status: string): AdminTone {
  switch (status) {
    case "new":
      return "waitlist";
    case "reviewing":
      return "pending";
    case "contacted":
      return "registered";
    case "shortlisted":
    case "introduced":
      return "scheduled";
    case "active":
      return "completed";
    case "not_fit":
    case "withdrawn":
      return "cancelled";
    default:
      return "neutral";
  }
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
          <Input
            name="title"
            defaultValue={opportunity?.title ?? ""}
            required
          />
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
            {Object.entries(projectOpportunityTypeLabels).map(
              ([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ),
            )}
          </NativeSelect>
        </AdminField>

        <AdminField label="状态">
          <NativeSelect
            name="status"
            defaultValue={opportunity?.status ?? "draft"}
          >
            {Object.entries(projectOpportunityStatusLabels).map(
              ([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ),
            )}
          </NativeSelect>
        </AdminField>

        <AdminField label="可见性">
          <NativeSelect
            name="visibility"
            defaultValue={opportunity?.visibility ?? "public"}
          >
            {Object.entries(projectOpportunityVisibilityLabels).map(
              ([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ),
            )}
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
          <Textarea
            name="summary"
            rows={2}
            defaultValue={opportunity?.summary ?? ""}
            required
          />
        </AdminField>

        <AdminField label="封面图" className="md:col-span-2">
          <StorageImageUrlField
            name="cover_image_url"
            defaultValue={opportunity?.cover_image_url ?? ""}
            eventSlug={opportunity?.slug ?? "project-opportunity"}
            uploadScope="project"
            placeholder="https://... 或上传项目封面图"
            uploadLabel="上传封面"
          />
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
            {application.applicantEmail
              ? ` · ${application.applicantEmail}`
              : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            微信 {application.contact_wechat ?? "未填"} · 电话{" "}
            {application.contact_phone ?? "未填"} · 邮箱{" "}
            {application.contact_email ?? "未填"}
          </p>
        </div>

        <AdminStatusBadge tone={getApplicationStatusTone(application.status)}>
          {projectApplicationStatusLabels[application.status]}
        </AdminStatusBadge>
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
        <p className="mt-2 text-sm text-muted-foreground">
          备注：{application.note}
        </p>
      ) : null}

      <form
        action={updateAdminProjectApplication}
        className="mt-4 grid gap-4 md:grid-cols-2"
      >
        <input type="hidden" name="application_id" value={application.id} />
        <input type="hidden" name="project_id" value={opportunity.id} />
        <input type="hidden" name="project_slug" value={opportunity.slug} />

        <AdminField label="申请状态">
          <NativeSelect name="status" defaultValue={application.status}>
            {Object.entries(projectApplicationStatusLabels).map(
              ([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ),
            )}
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
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(params.saved)}
        error={params.error ? getAdminErrorMessage(params.error) : null}
      />

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Projects"
          title="共建项目管理"
          actions={
            <>
              <AdminMetric label="机会" value={stats.total} />
              <AdminMetric label="招募中" value={stats.recruiting} />
              <AdminMetric label="可见" value={stats.visible} />
              <AdminMetric label="申请" value={stats.applications} />
              <AdminModal title="新增共建机会" triggerLabel="新增机会">
                <ProjectOpportunityForm />
              </AdminModal>
            </>
          }
        />
      </AdminPanel>

      {queryErrors.length > 0 ? (
        <AdminNotice>
          后台数据读取出现问题：{queryErrors.join(" | ")}
        </AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelBody className="p-0">
          <AdminProjectsTable opportunities={opportunities} />
          {opportunities.length > 0 ? (
            <div className="border-t border-border/70 p-4">
              <p className="mb-3 text-sm font-medium text-foreground">
                项目编辑与申请管理
              </p>
              <div className="grid gap-2">
                {opportunities.map((opportunity) => (
                  <details
                    id={`manage-project-${opportunity.id}`}
                    key={opportunity.id}
                    className="rounded-lg border border-border/70 bg-background target:ring-2 target:ring-primary/20"
                  >
                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
                      {opportunity.title} · {opportunity.applicationCount}{" "}
                      条申请
                    </summary>
                    <div className="grid gap-5 border-t border-border/70 p-4">
                      <ProjectOpportunityForm opportunity={opportunity} />

                      <div className="grid gap-3">
                        <h3 className="text-sm font-semibold text-foreground">
                          申请记录（{opportunity.applicationCount}）
                        </h3>
                        {opportunity.applications.length > 0 ? (
                          opportunity.applications.map((application) => (
                            <ProjectApplicationCard
                              key={application.id}
                              application={application}
                              opportunity={opportunity}
                            />
                          ))
                        ) : (
                          <AdminNotice>这个机会还没有收到申请。</AdminNotice>
                        )}
                      </div>

                      <form action={deleteAdminProjectOpportunity}>
                        <input
                          type="hidden"
                          name="opportunity_id"
                          value={opportunity.id}
                        />
                        <input
                          type="hidden"
                          name="slug"
                          value={opportunity.slug}
                        />
                        <Button type="submit" variant="destructive" size="sm">
                          删除这个项目
                        </Button>
                      </form>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
