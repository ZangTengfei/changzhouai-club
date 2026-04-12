"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  AdminField,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
  type AdminTone,
} from "@/components/admin-ui";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminResource } from "@/components/use-admin-resource";
import {
  formatAdminLeadMatchStatus,
  formatAdminLeadStatus,
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminLeadMatchStatusTone,
  getAdminLeadStatusTone,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import type { AdminLead, AdminLeadMemberOption, AdminLeadStaffOption } from "@/lib/admin/leads";

type AdminLeadDetailData = {
  lead: AdminLead;
  staffOptions: AdminLeadStaffOption[];
  memberOptions: AdminLeadMemberOption[];
  queryErrors: string[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
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

function getBackHref(from?: string | null) {
  if (from?.startsWith("/admin/leads")) {
    return from;
  }

  return "/admin/leads";
}

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; saved?: string }
    | null;

  if (!response.ok) {
    throw new Error(getAdminErrorMessage(payload?.error) ?? "提交失败，请稍后再试。");
  }

  return payload;
}

export function AdminLeadDetailPageClient({ leadId }: { leadId: string }) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminLeadDetailData>(
    `/api/admin/leads/${leadId}`,
  );
  const [isPending, startTransition] = useTransition();
  const lead = data?.lead;
  const staffOptions = data?.staffOptions ?? [];
  const memberOptions = data?.memberOptions ?? [];
  const backHref = getBackHref(searchParams.get("from"));
  const querySaved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;

  function handleLeadSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/leads/${leadId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: String(formData.get("status") ?? ""),
            owner_id: String(formData.get("owner_id") ?? ""),
            next_action: String(formData.get("next_action") ?? ""),
            next_action_at: String(formData.get("next_action_at") ?? ""),
            last_contacted_at: String(formData.get("last_contacted_at") ?? ""),
            admin_note: String(formData.get("admin_note") ?? ""),
          }),
        });
        const result = await readApiResult(response);
        toast.success(getAdminSavedMessage(result?.saved ?? "lead_detail") ?? "后台内容已更新。");
        reload();
      } catch (requestError) {
        toast.error(requestError instanceof Error ? requestError.message : "保存失败，请稍后再试。");
      }
    });
  }

  function handleCreateMatch(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/leads/${leadId}/matches`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            member_id: String(formData.get("member_id") ?? ""),
            status: String(formData.get("status") ?? "suggested"),
            note: String(formData.get("note") ?? ""),
          }),
        });
        const result = await readApiResult(response);
        toast.success(getAdminSavedMessage(result?.saved ?? "lead_match") ?? "后台内容已更新。");
        reload();
      } catch (requestError) {
        toast.error(requestError instanceof Error ? requestError.message : "保存失败，请稍后再试。");
      }
    });
  }

  function handleUpdateMatch(matchId: string, memberId: string, formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/leads/${leadId}/matches/${matchId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            member_id: memberId,
            status: String(formData.get("status") ?? ""),
            note: String(formData.get("note") ?? ""),
          }),
        });
        const result = await readApiResult(response);
        toast.success(getAdminSavedMessage(result?.saved ?? "lead_match") ?? "后台内容已更新。");
        reload();
      } catch (requestError) {
        toast.error(requestError instanceof Error ? requestError.message : "保存失败，请稍后再试。");
      }
    });
  }

  function handleDeleteMatch(matchId: string) {
    if (!window.confirm("确认删除这条成员匹配记录吗？")) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/leads/${leadId}/matches/${matchId}`, {
          method: "DELETE",
        });
        const result = await readApiResult(response);
        toast.success(
          getAdminSavedMessage(result?.saved ?? "lead_match_deleted") ?? "后台内容已更新。",
        );
        reload();
      } catch (requestError) {
        toast.error(requestError instanceof Error ? requestError.message : "删除失败，请稍后再试。");
      }
    });
  }

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(querySaved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      {lead ? (
        <AdminPanel>
          <AdminPanelHeader
            eyebrow="Lead Detail"
            title={lead.companyName}
            actions={
              <>
                <div className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/40 px-3 py-2 text-sm">
                  当前状态：{formatAdminLeadStatus(lead.status)}
                </div>
                <Button asChild variant="secondary">
                  <Link href={backHref}>返回线索列表</Link>
                </Button>
              </>
            }
          />
          <AdminPanelBody className="flex flex-wrap gap-2">
            <AdminStatusBadge tone={getAdminLeadStatusTone(lead.status) as AdminTone}>
              {formatAdminLeadStatus(lead.status)}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {lead.requirementType ?? "未填写需求类型"}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">{lead.budgetRange ?? "预算待沟通"}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">候选成员 {lead.matchCount}</AdminStatusBadge>
          </AdminPanelBody>
        </AdminPanel>
      ) : null}

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}
      {isLoading ? <AdminNotice>正在加载线索详情...</AdminNotice> : null}

      {lead ? (
        <>
          <AdminPanel>
            <AdminPanelHeader eyebrow="Overview" title="线索概览" />
            <AdminPanelBody className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    基础信息
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>公司 / 机构：{lead.companyName}</p>
                    <p>联系人：{lead.contactName ?? "未填写"}</p>
                    <p>需求类型：{lead.requirementType ?? "未填写"}</p>
                  </div>
                </div>

                <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    联系与时间
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>微信号：{lead.contactWechat ?? "未填写"}</p>
                    <p>手机号：{lead.contactPhone ?? "未填写"}</p>
                    <p>期望时间：{lead.desiredTimeline ?? "待沟通"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  需求简介
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{lead.requirementSummary}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    预算与时间
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>预算范围：{lead.budgetRange ?? "待沟通"}</p>
                    <p>提交时间：{formatDate(lead.createdAt)}</p>
                    <p>最近更新：{formatDate(lead.updatedAt)}</p>
                  </div>
                </div>

                <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    负责人与推进
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>
                      负责人：{lead.ownerDisplayName ?? "暂未分配"}
                      {lead.ownerEmail ? ` · ${lead.ownerEmail}` : ""}
                    </p>
                    <p>最近联系：{formatDate(lead.lastContactedAt)}</p>
                    <p>
                      下一步：{lead.nextAction ?? "暂未填写"}
                      {lead.nextActionAt ? ` · ${formatDate(lead.nextActionAt)}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </AdminPanelBody>
          </AdminPanel>

          <AdminPanel>
            <AdminPanelHeader eyebrow="Follow Up" title="线索跟进" />
            <AdminPanelBody>
              <form
                className="grid gap-4"
                onSubmit={(formEvent) => {
                  formEvent.preventDefault();
                  handleLeadSubmit(new FormData(formEvent.currentTarget));
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="线索状态">
                    <NativeSelect name="status" defaultValue={lead.status}>
                      <option value="new">新线索</option>
                      <option value="contacted">已联系</option>
                      <option value="qualified">已判断可跟进</option>
                      <option value="won">已成交</option>
                      <option value="lost">已关闭</option>
                    </NativeSelect>
                  </AdminField>

                  <AdminField label="负责人">
                    <NativeSelect name="owner_id" defaultValue={lead.ownerId ?? ""}>
                      <option value="">暂不分配</option>
                      {staffOptions.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.displayName}
                          {staff.email ? ` · ${staff.email}` : ""}
                        </option>
                      ))}
                    </NativeSelect>
                  </AdminField>

                  <AdminField label="下一步动作" className="md:col-span-2">
                    <Input
                      name="next_action"
                      defaultValue={lead.nextAction ?? ""}
                      placeholder="例如：约一次需求澄清电话、邀请参加下一场活动、匹配 2 位候选成员"
                    />
                  </AdminField>

                  <AdminField label="下一步时间">
                    <Input
                      type="datetime-local"
                      name="next_action_at"
                      defaultValue={toDatetimeLocal(lead.nextActionAt)}
                    />
                  </AdminField>

                  <AdminField label="最近联系时间">
                    <Input
                      type="datetime-local"
                      name="last_contacted_at"
                      defaultValue={toDatetimeLocal(lead.lastContactedAt)}
                    />
                  </AdminField>

                  <AdminField label="管理员备注" className="md:col-span-2">
                    <Textarea
                      name="admin_note"
                      rows={5}
                      defaultValue={lead.adminNote ?? ""}
                      placeholder="例如：已电话沟通、适合安排专题分享、预算仍待确认、适合匹配哪类社区成员"
                    />
                  </AdminField>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "保存中..." : "保存线索详情"}
                  </Button>
                </div>
              </form>
            </AdminPanelBody>
          </AdminPanel>

          <AdminPanel>
            <AdminPanelHeader eyebrow="Matches" title="候选成员匹配" />
            <AdminPanelBody className="space-y-4">
              {lead.matches.length > 0 ? (
                <div className="grid gap-4">
                  {lead.matches.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="grid gap-1">
                          <h3 className="text-base font-semibold text-foreground">
                            {match.memberDisplayName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {match.memberCity}
                            {match.memberEmail ? ` · ${match.memberEmail}` : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <AdminStatusBadge
                            tone={getAdminMemberStatusTone(match.memberStatus) as AdminTone}
                          >
                            {formatAdminMemberStatus(match.memberStatus)}
                          </AdminStatusBadge>
                          <AdminStatusBadge
                            tone={getAdminLeadMatchStatusTone(match.status) as AdminTone}
                          >
                            {formatAdminLeadMatchStatus(match.status)}
                          </AdminStatusBadge>
                        </div>
                      </div>

                      {match.memberSkills.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {match.memberSkills.map((skill) => (
                            <ToneBadge key={`${match.id}-${skill}`} label={skill} />
                          ))}
                        </div>
                      ) : null}

                      <form
                        className="mt-4 grid gap-4"
                        onSubmit={(formEvent) => {
                          formEvent.preventDefault();
                          handleUpdateMatch(
                            match.id,
                            match.memberId,
                            new FormData(formEvent.currentTarget),
                          );
                        }}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <AdminField label="匹配状态">
                            <NativeSelect name="status" defaultValue={match.status}>
                              <option value="suggested">候选建议</option>
                              <option value="contacted">已联系成员</option>
                              <option value="introduced">已引荐对接</option>
                              <option value="active">进入推进</option>
                              <option value="not_fit">暂不匹配</option>
                            </NativeSelect>
                          </AdminField>

                          <AdminField label="匹配备注" className="md:col-span-2">
                            <Textarea
                              name="note"
                              rows={4}
                              defaultValue={match.note ?? ""}
                              placeholder="例如：成员对这个方向有经验、已经私聊过、建议先参加下一场活动再正式引荐"
                            />
                          </AdminField>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" variant="secondary" disabled={isPending}>
                            {isPending ? "保存中..." : "保存匹配"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDeleteMatch(match.id)}
                            disabled={isPending}
                          >
                            删除匹配
                          </Button>
                        </div>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <AdminNotice>这条线索暂未匹配候选成员，可先补充最合适的成员人选。</AdminNotice>
              )}

              <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/20 p-4">
                <div className="mb-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    New Match
                  </p>
                  <h3 className="text-base font-semibold text-foreground">新增候选成员</h3>
                </div>

                <form
                  className="grid gap-4"
                  onSubmit={(formEvent) => {
                    formEvent.preventDefault();
                    handleCreateMatch(new FormData(formEvent.currentTarget));
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <AdminField label="候选成员">
                      <NativeSelect name="member_id" defaultValue="">
                        <option value="">请选择成员</option>
                        {memberOptions.map((memberOption) => (
                          <option key={memberOption.id} value={memberOption.id}>
                            {memberOption.displayName}
                            {memberOption.city ? ` · ${memberOption.city}` : ""}
                            {memberOption.skills.length > 0
                              ? ` · ${memberOption.skills.slice(0, 2).join(" / ")}`
                              : ""}
                          </option>
                        ))}
                      </NativeSelect>
                    </AdminField>

                    <AdminField label="初始状态">
                      <NativeSelect name="status" defaultValue="suggested">
                        <option value="suggested">候选建议</option>
                        <option value="contacted">已联系成员</option>
                        <option value="introduced">已引荐对接</option>
                        <option value="active">进入推进</option>
                        <option value="not_fit">暂不匹配</option>
                      </NativeSelect>
                    </AdminField>

                    <AdminField label="匹配备注" className="md:col-span-2">
                      <Textarea
                        name="note"
                        rows={4}
                        placeholder="例如：擅长做企业场景 AI 应用、适合参与需求澄清、已经在线下活动里交流过"
                      />
                    </AdminField>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "保存中..." : "添加候选成员"}
                    </Button>
                  </div>
                </form>
              </div>
            </AdminPanelBody>
          </AdminPanel>
        </>
      ) : null}
    </AdminPageStack>
  );
}
