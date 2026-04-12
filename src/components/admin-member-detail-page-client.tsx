"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  AdminCheckboxRow,
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
import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminResource } from "@/components/use-admin-resource";
import {
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import type { AdminMember } from "@/lib/admin/members";

type AdminMemberDetailData = {
  member: AdminMember;
  queryErrors: string[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

function getBackHref(from?: string | null) {
  if (from?.startsWith("/admin/members")) {
    return from;
  }

  return "/admin/members";
}

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; saved?: string }
    | null;

  if (!response.ok) {
    throw new Error(getAdminErrorMessage(payload?.error) ?? "提交失败，请检查表单内容后重试。");
  }

  return payload;
}

export function AdminMemberDetailPageClient({ memberId }: { memberId: string }) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminMemberDetailData>(
    `/api/admin/members/${memberId}`,
  );
  const [isPending, startTransition] = useTransition();
  const member = data?.member;
  const querySaved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const backHref = getBackHref(searchParams.get("from"));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/members/${memberId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            display_name: String(formData.get("display_name") ?? ""),
            wechat: String(formData.get("wechat") ?? ""),
            city: String(formData.get("city") ?? ""),
            role_label: String(formData.get("role_label") ?? ""),
            organization: String(formData.get("organization") ?? ""),
            monthly_time: String(formData.get("monthly_time") ?? ""),
            skills: String(formData.get("skills") ?? ""),
            interests: String(formData.get("interests") ?? ""),
            bio: String(formData.get("bio") ?? ""),
            status: String(formData.get("status") ?? "pending"),
            willing_to_attend: formData.get("willing_to_attend") === "on",
            willing_to_share: formData.get("willing_to_share") === "on",
            willing_to_join_projects: formData.get("willing_to_join_projects") === "on",
            is_publicly_visible: formData.get("is_publicly_visible") === "on",
          }),
        });
        const result = await readApiResult(response);
        toast.success(getAdminSavedMessage(result?.saved ?? "member_profile") ?? "后台内容已更新。");
        reload();
      } catch (requestError) {
        toast.error(requestError instanceof Error ? requestError.message : "保存失败，请稍后再试。");
      }
    });
  }

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(querySaved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      {member ? (
        <AdminPanel>
          <AdminPanelHeader
            eyebrow="Member Detail"
            title={member.displayName}
            actions={
              <>
                <div className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/40 px-3 py-2 text-sm">
                  活动报名 {member.registrationCount} 次
                </div>
                <Button asChild variant="secondary">
                  <Link href={backHref}>返回成员列表</Link>
                </Button>
              </>
            }
          />
          <AdminPanelBody className="flex flex-wrap gap-2">
            <AdminStatusBadge tone={getAdminMemberStatusTone(member.status) as AdminTone}>
              {formatAdminMemberStatus(member.status)}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">{member.city}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {member.isPubliclyVisible ? "公开展示中" : "未公开展示"}
            </AdminStatusBadge>
          </AdminPanelBody>
        </AdminPanel>
      ) : null}

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}
      {isLoading ? <AdminNotice>正在加载成员详情...</AdminNotice> : null}

      {member ? (
        <>
          <AdminPanel>
            <AdminPanelHeader eyebrow="Profile" title="成员概览" />
            <AdminPanelBody className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <MemberAvatar name={member.displayName} avatarUrl={member.avatarUrl} size="sm" />
                    <div className="grid gap-1">
                      <h3 className="text-base font-semibold text-foreground">{member.displayName}</h3>
                      <p className="text-sm text-muted-foreground">{member.email ?? "未提供邮箱"}</p>
                      <p className="text-sm text-muted-foreground">{member.wechat ?? "未填写微信号"}</p>
                      <p className="text-sm text-muted-foreground">{member.roleLabel ?? "未填写身份"}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.organization ?? "未填写公司 / 学校 / 团队"}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.city}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      参与概况
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                      <p>加入时间：{formatDate(member.joinedAt)}</p>
                      <p>最近活跃：{formatDate(member.lastActiveAt)}</p>
                      <p>活动报名：{member.registrationCount} 次</p>
                      <p>每月可投入时间：{member.monthlyTime ?? "未填写"}</p>
                    </div>
                  </div>

                  <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      参与意愿
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AdminStatusBadge tone="neutral">
                        {member.willingToAttend ? "愿意参加线下活动" : "暂不参加线下活动"}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone="neutral">
                        {member.willingToShare ? "愿意分享" : "暂不分享"}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone="scheduled">
                        {member.willingToJoinProjects ? "愿意共建" : "暂不共建"}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone="neutral">
                        {member.isPubliclyVisible ? "公开展示中" : "未公开展示"}
                      </AdminStatusBadge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  个人介绍
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {member.bio ?? "这位成员还没有补充个人介绍。"}
                </p>
              </div>

              {member.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill) => (
                    <ToneBadge key={`${member.id}-${skill}`} label={skill} />
                  ))}
                </div>
              ) : (
                <AdminNotice>这位成员尚未补充技能标签。</AdminNotice>
              )}

              {member.interests.length > 0 ? (
                <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    感兴趣的主题
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.interests.map((interest) => (
                      <ToneBadge key={`${member.id}-${interest}`} label={interest} />
                    ))}
                  </div>
                </div>
              ) : null}
            </AdminPanelBody>
          </AdminPanel>

          <AdminPanel>
            <AdminPanelHeader eyebrow="Edit Profile" title="成员基础资料" />
            <AdminPanelBody>
              <form
                className="grid gap-4"
                onSubmit={(formEvent) => {
                  formEvent.preventDefault();
                  handleSubmit(new FormData(formEvent.currentTarget));
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="显示名">
                    <Input
                      name="display_name"
                      defaultValue={member.displayName === "未填写显示名" ? "" : member.displayName}
                      placeholder="比如：张三"
                    />
                  </AdminField>

                  <AdminField label="微信号">
                    <Input
                      name="wechat"
                      defaultValue={member.wechat ?? ""}
                      placeholder="用于联系"
                    />
                  </AdminField>

                  <AdminField label="城市">
                    <Input name="city" defaultValue={member.city} placeholder="常州" />
                  </AdminField>

                  <AdminField label="身份 / 角色">
                    <Input
                      name="role_label"
                      defaultValue={member.roleLabel ?? ""}
                      placeholder="例如：开发者 / 产品经理 / 创业者 / 学生"
                    />
                  </AdminField>

                  <AdminField label="公司 / 学校 / 团队">
                    <Input
                      name="organization"
                      defaultValue={member.organization ?? ""}
                      placeholder="例如：SenseLeap.ai / 常州大学 / 独立开发"
                    />
                  </AdminField>

                  <AdminField label="每月可投入时间">
                    <Input
                      name="monthly_time"
                      defaultValue={member.monthlyTime ?? ""}
                      placeholder="例如：每周 2 小时 / 每月参加 1 次活动"
                    />
                  </AdminField>

                  <AdminField label="成员状态">
                    <NativeSelect name="status" defaultValue={member.status}>
                      <option value="pending">pending</option>
                      <option value="active">active</option>
                      <option value="organizer">organizer</option>
                      <option value="admin">admin</option>
                      <option value="paused">paused</option>
                    </NativeSelect>
                  </AdminField>

                  <AdminCheckboxRow className="self-end">
                    <input
                      type="checkbox"
                      name="is_publicly_visible"
                      defaultChecked={member.isPubliclyVisible}
                      className="size-4 accent-[var(--primary)]"
                    />
                    <span>公开展示到成员页</span>
                  </AdminCheckboxRow>

                  <AdminField label="技能标签" className="md:col-span-2">
                    <Input
                      name="skills"
                      defaultValue={member.skills.join("，")}
                      placeholder="例如：Agent，RAG，前端工程，自动化工作流"
                    />
                  </AdminField>

                  <AdminField label="感兴趣的主题" className="md:col-span-2">
                    <Input
                      name="interests"
                      defaultValue={member.interests.join("，")}
                      placeholder="例如：LLM 应用，自动化工作流，项目交付"
                    />
                  </AdminField>

                  <AdminField label="个人简介" className="md:col-span-2">
                    <Textarea
                      name="bio"
                      defaultValue={member.bio ?? ""}
                      rows={5}
                      placeholder="简单介绍一下这位成员的方向、经验，或者你们在线下交流中形成的了解。"
                    />
                  </AdminField>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <AdminCheckboxRow>
                    <input
                      type="checkbox"
                      name="willing_to_attend"
                      defaultChecked={member.willingToAttend}
                      className="size-4 accent-[var(--primary)]"
                    />
                    <span>愿意参加线下活动</span>
                  </AdminCheckboxRow>

                  <AdminCheckboxRow>
                    <input
                      type="checkbox"
                      name="willing_to_share"
                      defaultChecked={member.willingToShare}
                      className="size-4 accent-[var(--primary)]"
                    />
                    <span>愿意在社区活动里做主题分享</span>
                  </AdminCheckboxRow>

                  <AdminCheckboxRow>
                    <input
                      type="checkbox"
                      name="willing_to_join_projects"
                      defaultChecked={member.willingToJoinProjects}
                      className="size-4 accent-[var(--primary)]"
                    />
                    <span>如有合适项目，愿意参与协作</span>
                  </AdminCheckboxRow>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "保存中..." : "保存成员资料"}
                  </Button>
                </div>
              </form>
            </AdminPanelBody>
          </AdminPanel>
        </>
      ) : null}
    </AdminPageStack>
  );
}
