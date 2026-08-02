"use client";

import Link from "next/link";
import { Award, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Tabs } from "antd";
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
import { Button } from "@/components/admin-antd/button";
import { Input } from "@/components/admin-antd/input";
import { NativeSelect } from "@/components/admin-antd/native-select";
import { Textarea } from "@/components/admin-antd/textarea";
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
  badgeAwards: Array<{
    id: string;
    badge_code: string;
    label: string;
    description: string | null;
    source: string;
    awarded_at: string;
  }>;
  queryErrors: string[];
};

const MEMBERSHIP_LEVELS = [
  {
    label: "社区成员",
    description: "完成社区注册",
  },
  {
    label: "共建伙伴",
    description: "参与社区共建并获得认证",
  },
  {
    label: "核心共建",
    description: "持续承担社区核心工作",
  },
  {
    label: "荣誉共建",
    description: "长期贡献并获得社区授予",
  },
] as const;

const MEMBERSHIP_BADGE_CODES = new Set([
  "co_builder",
  "core_builder",
  "honor_builder",
]);

function getMembershipLevel(
  member: AdminMember,
  badgeAwards: AdminMemberDetailData["badgeAwards"],
) {
  const badgeCodes = new Set(badgeAwards.map((award) => award.badge_code));
  if (badgeCodes.has("honor_builder")) return 3;
  if (badgeCodes.has("core_builder")) return 2;
  if (member.isCoBuilder || badgeCodes.has("co_builder")) return 1;
  return 0;
}

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
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    saved?: string;
  } | null;

  if (!response.ok) {
    throw new Error(
      getAdminErrorMessage(payload?.error) ??
        "提交失败，请检查表单内容后重试。",
    );
  }

  return payload;
}

export function AdminMemberDetailPageClient({
  memberId,
}: {
  memberId: string;
}) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } =
    useAdminResource<AdminMemberDetailData>(`/api/admin/members/${memberId}`);
  const [isPending, startTransition] = useTransition();
  const member = data?.member;
  const badgeAwards = data?.badgeAwards ?? [];
  const communityBadgeAwards = badgeAwards.filter(
    (award) => !MEMBERSHIP_BADGE_CODES.has(award.badge_code),
  );
  const membershipLevel = member ? getMembershipLevel(member, badgeAwards) : 0;
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
            public_slug: String(formData.get("public_slug") ?? ""),
            city: String(formData.get("city") ?? ""),
            role_label: String(formData.get("role_label") ?? ""),
            organization: String(formData.get("organization") ?? ""),
            monthly_time: String(formData.get("monthly_time") ?? ""),
            industry_tags: String(formData.get("industry_tags") ?? ""),
            skills: String(formData.get("skills") ?? ""),
            interests: String(formData.get("interests") ?? ""),
            capability_summary: String(
              formData.get("capability_summary") ?? "",
            ),
            seeking_summary: String(formData.get("seeking_summary") ?? ""),
            bio: String(formData.get("bio") ?? ""),
            willing_to_attend: formData.get("willing_to_attend") === "on",
            willing_to_share: formData.get("willing_to_share") === "on",
            willing_to_join_projects:
              formData.get("willing_to_join_projects") === "on",
            is_publicly_visible: formData.get("is_publicly_visible") === "on",
            is_featured_on_home: formData.get("is_featured_on_home") === "on",
          }),
        });
        const result = await readApiResult(response);
        toast.success(
          getAdminSavedMessage(result?.saved ?? "member_profile") ??
            "后台内容已更新。",
        );
        reload();
      } catch (requestError) {
        toast.error(
          requestError instanceof Error
            ? requestError.message
            : "保存失败，请稍后再试。",
        );
      }
    });
  }

  function handleIdentitySubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/members/${memberId}/identity`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: String(formData.get("status") ?? "pending"),
            }),
          },
        );
        await readApiResult(response);
        toast.success("成员身份已更新。");
        reload();
      } catch (requestError) {
        toast.error(
          requestError instanceof Error
            ? requestError.message
            : "成员身份保存失败，请稍后再试。",
        );
      }
    });
  }

  function handleMembershipSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/members/${memberId}/membership`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              level: Number(formData.get("membership_level")),
              note: String(formData.get("membership_note") ?? ""),
            }),
          },
        );
        await readApiResult(response);
        toast.success("成员等级认证已更新。");
        reload();
      } catch (requestError) {
        toast.error(
          requestError instanceof Error
            ? requestError.message
            : "成员等级认证失败，请稍后再试。",
        );
      }
    });
  }

  function handleRolesSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/members/${memberId}/roles`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role_ids: formData
              .getAll("role_id")
              .map((roleId) => String(roleId)),
            note: String(formData.get("note") ?? ""),
          }),
        });
        const result = await readApiResult(response);
        toast.success(
          getAdminSavedMessage(result?.saved ?? "member_roles") ??
            "后台角色已更新。",
        );
        reload();
      } catch (requestError) {
        toast.error(
          requestError instanceof Error
            ? requestError.message
            : "保存失败，请稍后再试。",
        );
      }
    });
  }

  function handleBadgeSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/members/${memberId}/badges`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: String(formData.get("badge_label") ?? ""),
            description: String(formData.get("badge_description") ?? ""),
          }),
        });
        await readApiResult(response);
        toast.success("社区标签已添加。");
        reload();
      } catch (requestError) {
        toast.error(
          requestError instanceof Error
            ? requestError.message
            : "标签添加失败。",
        );
      }
    });
  }

  function handleBadgeRemove(awardId: string, label: string) {
    if (!window.confirm(`确认移除“${label}”标签吗？`)) return;
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/members/${memberId}/badges`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ awardId }),
        });
        await readApiResult(response);
        toast.success("社区标签已移除。");
        reload();
      } catch (requestError) {
        toast.error(
          requestError instanceof Error
            ? requestError.message
            : "标签移除失败。",
        );
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
            <AdminStatusBadge
              tone={getAdminMemberStatusTone(member.status) as AdminTone}
            >
              {formatAdminMemberStatus(member.status)}
            </AdminStatusBadge>
            {membershipLevel > 0 ? (
              <AdminStatusBadge tone="completed">
                {MEMBERSHIP_LEVELS[membershipLevel].label}
              </AdminStatusBadge>
            ) : null}
            {member.adminRoles.map((role) => (
              <AdminStatusBadge key={role.roleId} tone="scheduled">
                {role.name}
              </AdminStatusBadge>
            ))}
            <AdminStatusBadge tone="neutral">{member.city}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">
              {member.isPubliclyVisible ? "公开展示中" : "未公开展示"}
            </AdminStatusBadge>
          </AdminPanelBody>
        </AdminPanel>
      ) : null}

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>
          后台数据读取出现问题：{data.queryErrors.join(" | ")}
        </AdminNotice>
      ) : null}
      {isLoading ? <AdminNotice>正在加载成员详情...</AdminNotice> : null}

      {member ? (
        <Tabs
          defaultActiveKey="overview"
          items={[
            ...(member.availableAdminRoles.length > 0
              ? [
                  {
                    key: "roles",
                    label: `后台角色（${member.adminRoles.length}）`,
                    children: (
                      <AdminPanel>
                        <AdminPanelHeader
                          eyebrow="Admin Roles"
                          title="后台角色"
                        />
                        <AdminPanelBody>
                          <form
                            className="grid gap-4"
                            onSubmit={(formEvent) => {
                              formEvent.preventDefault();
                              handleRolesSubmit(
                                new FormData(formEvent.currentTarget),
                              );
                            }}
                          >
                            <div className="grid gap-3 md:grid-cols-2">
                              {member.availableAdminRoles.map((role) => {
                                const isAssigned = member.adminRoles.some(
                                  (assignment) => assignment.roleId === role.id,
                                );

                                return (
                                  <AdminCheckboxRow key={role.id}>
                                    <input
                                      type="checkbox"
                                      name="role_id"
                                      value={role.id}
                                      defaultChecked={isAssigned}
                                      className="size-4 accent-[var(--primary)]"
                                    />
                                    <span>
                                      <strong>{role.name}</strong>
                                      {role.description ? (
                                        <small className="mt-1 block text-muted-foreground">
                                          {role.description}
                                        </small>
                                      ) : null}
                                    </span>
                                  </AdminCheckboxRow>
                                );
                              })}
                            </div>

                            <AdminField label="授权备注">
                              <Input
                                name="note"
                                placeholder="例如：负责 6 月活动发布"
                              />
                            </AdminField>

                            <div className="flex flex-wrap gap-2">
                              <Button type="submit" disabled={isPending}>
                                {isPending ? "保存中..." : "保存后台角色"}
                              </Button>
                            </div>
                          </form>
                        </AdminPanelBody>
                      </AdminPanel>
                    ),
                  },
                ]
              : []),

            {
              key: "identity",
              label: `身份与标签（${communityBadgeAwards.length}）`,
              children: (
                <div className="grid gap-4">
                  <AdminPanel>
                    <AdminPanelHeader
                      eyebrow="Member Identity"
                      title="成员状态与社区角色"
                    />
                    <AdminPanelBody className="space-y-4">
                      <AdminNotice>
                        管理员和组织者会在小程序中显示为“社区发起人”；成员成长等级在下方单独认证。
                      </AdminNotice>
                      <form
                        className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
                        onSubmit={(formEvent) => {
                          formEvent.preventDefault();
                          handleIdentitySubmit(
                            new FormData(formEvent.currentTarget),
                          );
                        }}
                      >
                        <AdminField label="成员状态">
                          <NativeSelect
                            name="status"
                            defaultValue={member.status}
                          >
                            <option value="pending">待完善</option>
                            <option value="active">活跃成员</option>
                            <option value="organizer">组织者</option>
                            <option value="admin">管理员</option>
                            <option value="paused">暂停中</option>
                          </NativeSelect>
                        </AdminField>
                        <Button type="submit" disabled={isPending}>
                          {isPending ? "保存中..." : "保存成员状态"}
                        </Button>
                      </form>
                    </AdminPanelBody>
                  </AdminPanel>

                  <AdminPanel>
                    <AdminPanelHeader
                      eyebrow="Membership Level"
                      title="成员等级认证"
                    />
                    <AdminPanelBody className="space-y-4">
                      <AdminNotice>
                        成员只能表达参与意愿，不能自行选择等级。等级由管理员根据真实共建与贡献进行认证。
                      </AdminNotice>
                      <form
                        key={`${member.id}-${membershipLevel}`}
                        className="grid gap-4"
                        onSubmit={(formEvent) => {
                          formEvent.preventDefault();
                          handleMembershipSubmit(
                            new FormData(formEvent.currentTarget),
                          );
                        }}
                      >
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          {MEMBERSHIP_LEVELS.map((level, index) => (
                            <label
                              key={level.label}
                              className={`grid cursor-pointer gap-2 rounded-[calc(var(--radius)-2px)] border p-4 transition-colors ${
                                membershipLevel === index
                                  ? "border-primary bg-primary/5"
                                  : "border-border/70 bg-background hover:border-primary/45"
                              }`}
                            >
                              <span className="flex items-center justify-between gap-3">
                                <input
                                  type="radio"
                                  name="membership_level"
                                  value={index}
                                  defaultChecked={membershipLevel === index}
                                  className="size-4 accent-[var(--primary)]"
                                />
                                <span className="text-xs text-muted-foreground">
                                  身份 {index + 1}
                                </span>
                              </span>
                              <strong className="text-sm text-foreground">
                                {level.label}
                              </strong>
                              <small className="text-xs text-muted-foreground">
                                {level.description}
                              </small>
                              {membershipLevel === index ? (
                                <span className="text-xs font-medium text-primary">
                                  当前认证等级
                                </span>
                              ) : null}
                            </label>
                          ))}
                        </div>
                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                          <AdminField label="认证说明">
                            <Input
                              name="membership_note"
                              maxLength={100}
                              placeholder="例如：持续负责活动组织与成员连接"
                            />
                          </AdminField>
                          <Button type="submit" disabled={isPending}>
                            {isPending ? "认证中..." : "保存等级认证"}
                          </Button>
                        </div>
                      </form>
                    </AdminPanelBody>
                  </AdminPanel>

                  <AdminPanel>
                    <AdminPanelHeader eyebrow="Member Tags" title="社区标签" />
                    <AdminPanelBody className="space-y-4">
                      {communityBadgeAwards.length ? (
                        <div className="divide-y divide-border/70 border-y border-border/70">
                          {communityBadgeAwards.map((badge) => (
                            <div
                              key={badge.id}
                              className="flex items-center gap-3 py-3"
                            >
                              <Award
                                className="size-4 shrink-0 text-primary"
                                aria-hidden="true"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground">
                                  {badge.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {badge.description ?? "社区授予的成员标签"} ·{" "}
                                  {formatDate(badge.awarded_at)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                title={`移除${badge.label}`}
                                aria-label={`移除${badge.label}`}
                                disabled={isPending}
                                onClick={() =>
                                  handleBadgeRemove(badge.id, badge.label)
                                }
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <AdminNotice>
                          尚未人工添加社区标签。基于签到自动生成的标签不在这里重复显示。
                        </AdminNotice>
                      )}

                      <form
                        className="grid gap-4 md:grid-cols-[minmax(0,0.5fr)_minmax(0,1fr)_auto] md:items-end"
                        onSubmit={(formEvent) => {
                          formEvent.preventDefault();
                          handleBadgeSubmit(
                            new FormData(formEvent.currentTarget),
                          );
                        }}
                      >
                        <AdminField label="标签名称">
                          <Input
                            name="badge_label"
                            minLength={2}
                            maxLength={20}
                            required
                            placeholder="例如：商业顾问"
                          />
                        </AdminField>
                        <AdminField label="授予说明">
                          <Input
                            name="badge_description"
                            maxLength={100}
                            placeholder="说明标签对应的角色或贡献"
                          />
                        </AdminField>
                        <Button type="submit" disabled={isPending}>
                          <Award className="size-4" aria-hidden="true" />
                          {isPending ? "处理中..." : "添加标签"}
                        </Button>
                      </form>
                    </AdminPanelBody>
                  </AdminPanel>
                </div>
              ),
            },

            {
              key: "overview",
              label: "成员概览",
              children: (
                <AdminPanel>
                  <AdminPanelHeader eyebrow="Profile" title="成员概览" />
                  <AdminPanelBody className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/20 p-4">
                        <div className="flex items-start gap-3">
                          <MemberAvatar
                            name={member.displayName}
                            avatarUrl={member.avatarUrl}
                            size="sm"
                          />
                          <div className="grid gap-1">
                            <h3 className="text-base font-semibold text-foreground">
                              {member.displayName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {member.email ?? "未提供邮箱"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.wechat ?? "未填写微信号"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              主页链接：
                              {member.publicSlug
                                ? `/members/${member.publicSlug}`
                                : "未设置"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.roleLabel ?? "未填写身份"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.organization ??
                                "未填写公司 / 学校 / 团队"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.city}
                            </p>
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
                            <p>
                              每月可投入时间：{member.monthlyTime ?? "未填写"}
                            </p>
                            <p>
                              能力档案：{member.profileCompletion.percent}%
                              {member.profileCompletion.completed
                                ? "（已完成）"
                                : `（待补充 ${member.profileCompletion.missingItems.join("、")}）`}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            参与意愿
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <AdminStatusBadge tone="neutral">
                              {member.willingToAttend
                                ? "愿意参加线下活动"
                                : "暂不参加线下活动"}
                            </AdminStatusBadge>
                            <AdminStatusBadge tone="neutral">
                              {member.willingToShare ? "愿意分享" : "暂不分享"}
                            </AdminStatusBadge>
                            <AdminStatusBadge tone="scheduled">
                              {member.willingToJoinProjects
                                ? "愿意共建"
                                : "暂不共建"}
                            </AdminStatusBadge>
                            <AdminStatusBadge tone="completed">
                              成长等级：
                              {MEMBERSHIP_LEVELS[membershipLevel].label}
                            </AdminStatusBadge>
                            <AdminStatusBadge tone="neutral">
                              {member.isPubliclyVisible
                                ? "公开展示中"
                                : "未公开展示"}
                            </AdminStatusBadge>
                            <AdminStatusBadge tone="scheduled">
                              {member.isFeaturedOnHome
                                ? "首页展示中"
                                : "未在首页展示"}
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
                          <ToneBadge
                            key={`${member.id}-${skill}`}
                            label={skill}
                          />
                        ))}
                      </div>
                    ) : (
                      <AdminNotice>这位成员尚未补充技能标签。</AdminNotice>
                    )}

                    {member.industryTags.length > 0 ? (
                      <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          行业方向
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {member.industryTags.map((industry) => (
                            <ToneBadge
                              key={`${member.id}-${industry}`}
                              label={industry}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {member.capabilitySummary || member.seekingSummary ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            可提供能力
                          </p>
                          <p className="mt-3 text-sm text-muted-foreground">
                            {member.capabilitySummary ?? "未填写"}
                          </p>
                        </div>
                        <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            当前需要
                          </p>
                          <p className="mt-3 text-sm text-muted-foreground">
                            {member.seekingSummary ?? "未填写"}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {member.interests.length > 0 ? (
                      <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          感兴趣的主题
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {member.interests.map((interest) => (
                            <ToneBadge
                              key={`${member.id}-${interest}`}
                              label={interest}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </AdminPanelBody>
                </AdminPanel>
              ),
            },

            {
              key: "profile",
              label: "编辑资料",
              children: (
                <AdminPanel>
                  <AdminPanelHeader
                    eyebrow="Edit Profile"
                    title="成员基础资料"
                  />
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
                            defaultValue={
                              member.displayName === "未填写显示名"
                                ? ""
                                : member.displayName
                            }
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

                        <AdminField label="个人主页链接">
                          <Input
                            name="public_slug"
                            defaultValue={member.publicSlug ?? ""}
                            placeholder="例如：zhangsan-ai"
                          />
                        </AdminField>

                        <AdminField label="城市">
                          <Input
                            name="city"
                            defaultValue={member.city}
                            placeholder="常州"
                          />
                        </AdminField>

                        <AdminField label="职业 / 个人角色">
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

                        <AdminCheckboxRow className="self-end">
                          <input
                            type="checkbox"
                            name="is_publicly_visible"
                            defaultChecked={member.isPubliclyVisible}
                            className="size-4 accent-[var(--primary)]"
                          />
                          <span>公开展示到成员页</span>
                        </AdminCheckboxRow>

                        <AdminCheckboxRow className="self-end">
                          <input
                            type="checkbox"
                            name="is_featured_on_home"
                            defaultChecked={member.isFeaturedOnHome}
                            className="size-4 accent-[var(--primary)]"
                          />
                          <span>展示到首页成员区</span>
                        </AdminCheckboxRow>

                        <AdminField label="技能标签" className="md:col-span-2">
                          <Input
                            name="skills"
                            defaultValue={member.skills.join("，")}
                            placeholder="例如：Agent，RAG，前端工程，自动化工作流"
                          />
                        </AdminField>

                        <AdminField label="行业方向" className="md:col-span-2">
                          <Input
                            name="industry_tags"
                            defaultValue={member.industryTags.join("，")}
                            placeholder="例如：制造业，软件与信息服务，企业服务"
                          />
                        </AdminField>

                        <AdminField
                          label="可提供能力"
                          className="md:col-span-2"
                        >
                          <Textarea
                            name="capability_summary"
                            defaultValue={member.capabilitySummary ?? ""}
                            rows={3}
                            placeholder="成员可以分享、咨询、开发或连接的具体能力"
                          />
                        </AdminField>

                        <AdminField label="当前需要" className="md:col-span-2">
                          <Textarea
                            name="seeking_summary"
                            defaultValue={member.seekingSummary ?? ""}
                            rows={3}
                            placeholder="成员当前希望获得的场景、资源或合作方向"
                          />
                        </AdminField>

                        <AdminField
                          label="感兴趣的主题"
                          className="md:col-span-2"
                        >
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
              ),
            },
          ].sort(
            (left, right) =>
              ["overview", "identity", "profile", "roles"].indexOf(left.key) -
              ["overview", "identity", "profile", "roles"].indexOf(right.key),
          )}
        />
      ) : null}
    </AdminPageStack>
  );
}
