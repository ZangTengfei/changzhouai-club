"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  AdminField,
  AdminFilterLink,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminMembersData } from "@/lib/admin/members";
import {
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

const MEMBERS_PER_PAGE = 20;
const MEMBER_STATUS_OPTIONS = ["pending", "active", "organizer", "admin", "paused"] as const;

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesKeyword(fields: Array<string | null | undefined | string[]>, keyword: string) {
  if (!keyword) {
    return true;
  }

  return fields.some((field) => {
    if (Array.isArray(field)) {
      return field.some((item) => normalizeSearchText(item).includes(keyword));
    }

    return normalizeSearchText(field ?? "").includes(keyword);
  });
}

function buildMembersFilterHref(
  status: string,
  visibility: string,
  intent: string,
  memberQuery: string,
  memberPage = 1,
) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (visibility !== "all") {
    params.set("visibility", visibility);
  }

  if (intent !== "all") {
    params.set("intent", intent);
  }

  if (memberQuery.trim()) {
    params.set("member_query", memberQuery.trim());
  }

  if (memberPage > 1) {
    params.set("member_page", String(memberPage));
  }

  const query = params.toString();
  return query ? `/admin/members?${query}` : "/admin/members";
}

function parsePage(value: string | null) {
  const page = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(page) || page < 1) {
    return 1;
  }

  return page;
}

function buildDetailHref(basePath: string, currentPath: string) {
  const params = new URLSearchParams();
  params.set("from", currentPath);
  return `${basePath}?${params.toString()}`;
}

function AdminMemberQuickActions({
  member,
  detailHref,
  onChanged,
}: {
  member: AdminMembersData["members"][number];
  detailHref: string;
  onChanged?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const visibilityActionLabel = member.isPubliclyVisible ? "从成员页隐藏" : "公开到成员页";
  const homeFeatureActionLabel = member.isFeaturedOnHome ? "从首页移除" : "展示到首页";

  async function submitPayload(payload: Record<string, unknown>) {
    const response = await fetch(`/api/admin/members/${member.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as
      | { error?: string; saved?: string }
      | null;

    if (!response.ok) {
      throw new Error(getAdminErrorMessage(result?.error) ?? "提交失败，请稍后再试。");
    }

    toast.success(getAdminSavedMessage(result?.saved ?? "member_profile") ?? "后台内容已更新。");
    onChanged?.();
  }

  function buildMemberPayload(
    nextStatus: string,
    nextVisibility: boolean,
    nextHomeFeature = member.isFeaturedOnHome,
  ) {
    return {
      display_name: member.displayName === "未填写显示名" ? "" : member.displayName,
      wechat: member.wechat ?? "",
      city: member.city,
      role_label: member.roleLabel ?? "",
      organization: member.organization ?? "",
      monthly_time: member.monthlyTime ?? "",
      skills: member.skills.join("，"),
      interests: member.interests.join("，"),
      bio: member.bio ?? "",
      status: nextStatus,
      willing_to_attend: member.willingToAttend,
      willing_to_share: member.willingToShare,
      willing_to_join_projects: member.willingToJoinProjects,
      is_publicly_visible: nextVisibility,
      is_featured_on_home: nextVisibility && nextHomeFeature,
    };
  }

  return (
    <div className="grid gap-2">
      <form
        className="grid gap-2"
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          const formData = new FormData(formEvent.currentTarget);

          startTransition(async () => {
            try {
              await submitPayload(
                buildMemberPayload(String(formData.get("status") ?? member.status), member.isPubliclyVisible),
              );
            } catch (submitError) {
              toast.error(
                submitError instanceof Error ? submitError.message : "提交失败，请稍后再试。",
              );
            }
          });
        }}
      >
        <NativeSelect name="status" defaultValue={member.status} className="h-8 text-xs">
          {MEMBER_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {formatAdminMemberStatus(status)}
            </option>
          ))}
        </NativeSelect>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
            {isPending ? "保存中..." : "保存状态"}
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={detailHref}>查看详情</Link>
          </Button>
        </div>
      </form>

      <form
        onSubmit={(formEvent) => {
          formEvent.preventDefault();

          startTransition(async () => {
            try {
              await submitPayload(buildMemberPayload(member.status, !member.isPubliclyVisible));
            } catch (submitError) {
              toast.error(
                submitError instanceof Error ? submitError.message : "提交失败，请稍后再试。",
              );
            }
          });
        }}
      >
        <Button
          type="submit"
          size="sm"
          variant={member.isPubliclyVisible ? "secondary" : "default"}
          disabled={isPending}
        >
          {isPending ? "提交中..." : visibilityActionLabel}
        </Button>
      </form>

      <form
        onSubmit={(formEvent) => {
          formEvent.preventDefault();

          startTransition(async () => {
            try {
              await submitPayload(
                buildMemberPayload(
                  member.status,
                  member.isPubliclyVisible,
                  !member.isFeaturedOnHome,
                ),
              );
            } catch (submitError) {
              toast.error(
                submitError instanceof Error ? submitError.message : "提交失败，请稍后再试。",
              );
            }
          });
        }}
      >
        <Button
          type="submit"
          size="sm"
          variant={member.isFeaturedOnHome ? "secondary" : "outline"}
          disabled={isPending || !member.isPubliclyVisible}
        >
          {isPending ? "提交中..." : homeFeatureActionLabel}
        </Button>
      </form>
    </div>
  );
}

export function AdminMembersPageClient() {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminMembersData>("/api/admin/members");

  const statusFilter = searchParams.get("status") ?? "all";
  const visibilityFilter = searchParams.get("visibility") ?? "all";
  const intentFilter = searchParams.get("intent") ?? "all";
  const memberQueryInput = (searchParams.get("member_query") ?? "").trim();
  const requestedMemberPage = parsePage(searchParams.get("member_page"));
  const memberKeyword = normalizeSearchText(memberQueryInput);
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;

  const filteredMembers =
    data?.members.filter((member) => {
      if (statusFilter !== "all" && member.status !== statusFilter) {
        return false;
      }

      if (visibilityFilter === "public" && !member.isPubliclyVisible) {
        return false;
      }

      if (visibilityFilter === "private" && member.isPubliclyVisible) {
        return false;
      }

      if (intentFilter === "share" && !member.willingToShare) {
        return false;
      }

      if (intentFilter === "build" && !member.willingToJoinProjects) {
        return false;
      }

      return matchesKeyword(
        [
          member.displayName,
          member.email,
          member.wechat,
          member.city,
          member.monthlyTime,
          member.bio,
          member.skills,
          member.interests,
        ],
        memberKeyword,
      );
    }) ?? [];

  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE));
  const currentMemberPage = Math.min(requestedMemberPage, totalMemberPages);
  const memberPageStartIndex = (currentMemberPage - 1) * MEMBERS_PER_PAGE;
  const paginatedMembers = filteredMembers.slice(
    memberPageStartIndex,
    memberPageStartIndex + MEMBERS_PER_PAGE,
  );
  const currentMembersPath = buildMembersFilterHref(
    statusFilter,
    visibilityFilter,
    intentFilter,
    memberQueryInput,
    currentMemberPage,
  );

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Members"
          title="成员列表"
          actions={
            <>
              <AdminMetric label="成员总数" value={data?.stats.totalMembers ?? "..."} />
              <AdminMetric label="愿意分享" value={data?.stats.willingToShare ?? "..."} />
              <AdminMetric
                label="愿意共建"
                value={data?.stats.willingToJoinProjects ?? "..."}
              />
            </>
          }
        />
      </AdminPanel>

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="Filters" title="成员筛选" />
        <AdminPanelBody className="space-y-4">
          <div className="grid gap-3">
            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                状态
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "全部"],
                  ["pending", "待完善"],
                  ["active", "活跃成员"],
                  ["organizer", "组织者"],
                  ["admin", "管理员"],
                  ["paused", "暂停中"],
                ].map(([value, label]) => (
                  <AdminFilterLink
                    key={value}
                    href={buildMembersFilterHref(
                      value,
                      visibilityFilter,
                      intentFilter,
                      memberQueryInput,
                      1,
                    )}
                    active={statusFilter === value}
                  >
                    {label}
                  </AdminFilterLink>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                公开展示
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "全部"],
                  ["public", "公开展示中"],
                  ["private", "未公开"],
                ].map(([value, label]) => (
                  <AdminFilterLink
                    key={value}
                    href={buildMembersFilterHref(
                      statusFilter,
                      value,
                      intentFilter,
                      memberQueryInput,
                      1,
                    )}
                    active={visibilityFilter === value}
                  >
                    {label}
                  </AdminFilterLink>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                参与意愿
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["all", "全部"],
                  ["share", "愿意分享"],
                  ["build", "愿意共建"],
                ].map(([value, label]) => (
                  <AdminFilterLink
                    key={value}
                    href={buildMembersFilterHref(
                      statusFilter,
                      visibilityFilter,
                      value,
                      memberQueryInput,
                      1,
                    )}
                    active={intentFilter === value}
                  >
                    {label}
                  </AdminFilterLink>
                ))}
              </div>
            </div>
          </div>

          <form action="/admin/members" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <input type="hidden" name="status" value={statusFilter} />
            <input type="hidden" name="visibility" value={visibilityFilter} />
            <input type="hidden" name="intent" value={intentFilter} />

            <AdminField label="成员搜索">
              <Input
                type="search"
                name="member_query"
                defaultValue={memberQueryInput}
                placeholder="搜索姓名、邮箱、城市、技能"
              />
            </AdminField>

            <div className="flex flex-wrap items-end gap-2">
              <Button type="submit" variant="secondary">
                搜索成员
              </Button>
              {memberQueryInput ? (
                <Button asChild variant="outline">
                  <Link
                    href={buildMembersFilterHref(
                      statusFilter,
                      visibilityFilter,
                      intentFilter,
                      "",
                      1,
                    )}
                  >
                    清空搜索
                  </Link>
                </Button>
              ) : null}
            </div>
          </form>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Results"
          title="成员结果"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                第 {currentMemberPage} / {totalMemberPages} 页
              </span>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={buildMembersFilterHref(
                    statusFilter,
                    visibilityFilter,
                    intentFilter,
                    memberQueryInput,
                    1,
                  )}
                >
                  首页
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={buildMembersFilterHref(
                    statusFilter,
                    visibilityFilter,
                    intentFilter,
                    memberQueryInput,
                    Math.max(1, currentMemberPage - 1),
                  )}
                >
                  上一页
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={buildMembersFilterHref(
                    statusFilter,
                    visibilityFilter,
                    intentFilter,
                    memberQueryInput,
                    Math.min(totalMemberPages, currentMemberPage + 1),
                  )}
                >
                  下一页
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={buildMembersFilterHref(
                    statusFilter,
                    visibilityFilter,
                    intentFilter,
                    memberQueryInput,
                    totalMemberPages,
                  )}
                >
                  末页
                </Link>
              </Button>
            </div>
          }
        />
        <AdminPanelBody className="space-y-3 p-0">
          {isLoading ? (
            <div className="p-4">
              <AdminNotice>正在加载成员列表...</AdminNotice>
            </div>
          ) : paginatedMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>成员</TableHead>
                  <TableHead>城市与时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>参与概况</TableHead>
                  <TableHead>意愿与技能</TableHead>
                  <TableHead className="min-w-[220px]">快捷操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="grid gap-1">
                        <Link
                          href={buildDetailHref(`/admin/members/${member.id}`, currentMembersPath)}
                          className="font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {member.displayName}
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          {member.email ?? "未提供邮箱"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="grid gap-1">
                        <span>{member.city}</span>
                        <span>加入于 {formatDate(member.joinedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-2">
                        <AdminStatusBadge
                          tone={getAdminMemberStatusTone(member.status) as AdminTone}
                        >
                          {formatAdminMemberStatus(member.status)}
                        </AdminStatusBadge>
                        <span className="text-xs text-muted-foreground">
                          {member.isPubliclyVisible ? "公开展示中" : "未公开展示"}
                          {member.isPubliclyVisible
                            ? member.isFeaturedOnHome
                              ? " · 首页展示中"
                              : " · 未在首页展示"
                            : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="grid gap-1">
                        <span>活动报名 {member.registrationCount} 次</span>
                        <span>最近活跃 {formatDate(member.lastActiveAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="grid gap-1">
                        <span>
                          {member.willingToShare ? "愿意分享" : "暂不分享"} /{" "}
                          {member.willingToJoinProjects ? "愿意共建" : "暂不共建"}
                        </span>
                        <span>{member.skills.slice(0, 3).join(" · ") || "未填写技能标签"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminMemberQuickActions
                        member={member}
                        detailHref={buildDetailHref(
                          `/admin/members/${member.id}`,
                          currentMembersPath,
                        )}
                        onChanged={reload}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4">
              <AdminNotice>当前筛选条件下没有成员数据。</AdminNotice>
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
